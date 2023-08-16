import { useState, memo, Fragment } from "react";
import { gameContext, settings } from "../utils/variables";
import { observe, useChildrenObserver, useObserved, useObserver } from "../utils/Observer";
import { RouteDayName, RouteName } from "../types";
import { findImageObjectByName } from "../utils/gallery";
import { displayMode } from "../utils/display";
import { dayTitle, imageUrl, phaseTitle } from "../utils/lang";

type SpritePos = keyof typeof gameContext.graphics
const POSITIONS: Array<SpritePos> = Object.keys(gameContext.graphics) as Array<SpritePos>

const transition = {
  effect: "",
  duration: 0,
  pos: "a" as SpritePos|'a',
}
const quakeEffect = {
  x: 0, y: 0,
  duration: 0,
}

//##############################################################################
//#                                 FUNCTIONS                                  #
//##############################################################################

/**
 * Move background up or down
 */
export function moveBg(direction: "up"|"down") {
  const positions: Array<typeof displayMode.bgAlignment>
      = ["top", "center", "bottom"]
  let index = positions.indexOf(displayMode.bgAlignment)
  if (direction == "down" && index < 2) index++
  else if(direction == "up" && index > 0) index--
  displayMode.bgAlignment = positions[index]
}
//_______________________________script commands________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function extractImage(image: string) {
  if (image.startsWith('"') && image.endsWith('"')) {
    // remove ':a;', 'image/', '"', '.jpg'
    image = image.substring(1, image.length-2)
                 .replace(/:a;|image[\/\\]|\.\w+$/g, '')
                 .replace('\\', '/')
    switch (image) {
      case "bg/ima_10"  : image = "#000000"; break
      case "bg/ima_11"  : image = "#ffffff"; break
      case "bg/ima_11b" : image = "#9c0120"; break;
    }
  } else if (!image.startsWith('#') && !image.startsWith('$')) { // not image nor color
    throw Error(`cannot extract image from "${image}"`)
  }
  return image
}

function applyChange(pos: SpritePos, image: string, type: string, onFinish: VoidFunction) {

  let change = setSprite(pos as SpritePos, image)

  if (pos == 'bg') {
    if(clearAllSprites())
      change = true
    if (change && (image as string).includes('event/') &&
        !settings.eventImages.includes(image)) {
      settings.eventImages.push(image as string)
    }
  }

  // update transition only if sprites have been changed
  if (change) {
    const {effect, duration} = getTransition(type)
    transition.effect = effect
    transition.duration = duration
    transition.pos = pos as SpritePos|'a'

    if (duration > 0) {
      displayMode.graphics = true
      // Listen for the 'duration' to be set to 0
      // The component sets it to 0 after completing the animation,
      // and calling 'next' the command also sets it to 0
      observe(transition, 'duration', onFinish,
              { filter: (d)=> d == 0, once: true })
      return {next: ()=> {
        transition.duration = 0
      }}
    }
  }
}

function processImageCmd(arg: string, cmd: string, onFinish: VoidFunction) {
  const args = arg.split(',')
  let pos:string = 'bg',
      image:string = '',
      type:string = ''

  switch(cmd) {
    case 'bg': [image, type] = args; break
    case 'ld': [pos, image, type] = args; break
    case 'cl': [pos, type] = args; break
    default : throw Error(`unknown image command ${cmd} ${arg}`)
  }
  // get image
  if (image)
    image = extractImage(image)
  type = type?.replace('%', '')

  return applyChange(pos as SpritePos, image, type, onFinish)
}

function clearAllSprites() {
  const graphics = gameContext.graphics
  const changed = (graphics.l != "" || graphics.c != "" || graphics.r != "")
  graphics.l = ""
  graphics.c = ""
  graphics.r = ""
  return changed
}

function setSprite(pos: SpritePos|'a', image: string): boolean {
  if (pos == 'a') {
    if (image.length > 0)
      throw Error("Unexpected image parameter with 'a' position")
    return clearAllSprites()
  } else if (gameContext.graphics[pos as SpritePos] != image) {
    gameContext.graphics[pos as SpritePos] = image
    return true
  } else {
    return false
  }
}

function processQuake(arg: string, cmd: string, onFinish: VoidFunction) {
  const [ampl, duration] = arg.split(',').map(x=>parseInt(x))
  switch(cmd) {
    case 'quakex' : quakeEffect.x = ampl; break
    case 'quakey' : quakeEffect.y = ampl; break
  }
  quakeEffect.duration = duration;
  observe(quakeEffect, "duration", ()=> {
    quakeEffect.x = 0
    quakeEffect.y = 0
    onFinish()
  }, { filter: (d: number)=> d == 0, once: true })
  return { next: ()=> { quakeEffect.duration = 0 } }
}

function processMonocro(color: string) {
  if (color == "off")
    color = ""
  gameContext.monochrome = color
}

const commands = {
  'bg' : processImageCmd,
  'ld' : processImageCmd,
  'cl' : processImageCmd,
  'quakex'  : processQuake, //TODO : vertical shake effect
  'quakey'  : processQuake, //TODO : horizontal shake effect
  'monocro' : processMonocro, //TODO : fade screen to monochrome
}

export {
  commands
}

//_______________________________component tools________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


function getTransition(type: string, skipTransition = false) {
  let duration = 0
  let effect = type

  if (effect.startsWith('type_'))
    effect = effect.substring('type_'.length)

  const index = effect.lastIndexOf('_')
  if (index !== -1) {
    if (!skipTransition) {
      let speed = effect.substring(index+1)
      switch(speed) {
        case 'slw': duration = 1500; break
        case 'mid': duration = 800; break
        case 'fst': duration = 400; break
        default : throw Error(`Ill-formed effect '${effect}'`)
      }
    }
    effect = effect.substring(0, index)
  }
  return {effect, duration}
}

export function graphicElement(pos: SpritePos, image: string,
    _attrs: Record<string, any> = {}, resolution=settings.resolution) {

  image = image || ((pos=="bg") ? "#000000" : "#00000000")
  const {key, style, ...attrs} = _attrs
  const isColor = image.startsWith('#')
  const isPhaseText = image.startsWith('$')
  let _phaseTitle
  let _dayTitle
  if (isPhaseText) {
    let [route, routeDay, day] = image.substring(1).split('|')
    _phaseTitle = phaseTitle(route as RouteName, routeDay as RouteDayName)
    if (day)
      _dayTitle = dayTitle(parseInt(day))
  }
  const className = `${pos} ${isPhaseText ? 'phase' : ''}`
  return (
    <div
      key={key}
      className={className}
      {...(isColor ? {style:{ background: image, ...style }} : {})}
      {...(isPhaseText || isColor ? attrs : {})}>
      {isPhaseText ? <>
          <span className="phase-title">{_phaseTitle}</span><br/>
          {_dayTitle && <span className="phase-day">{_dayTitle}</span>}
      </> : !isColor &&
        <img src={imageUrl(image, resolution)} alt={`[[sprite:${image}]]`} draggable={false}
          className={findImageObjectByName(image)?.sensitive && settings.blurThumbnails ? "blur" : ""}
          {...attrs}
          style={style}
        />
      }
    </div>
  )
}

export function graphicElements(images: Partial<Record<SpritePos, string>>,
                          attrs?: Partial<Record<SpritePos, Record<string,any>>>|
                                  ((pos:SpritePos)=>Record<string,any>), resolution=settings.resolution) {
  return POSITIONS.map(pos => images[pos] && graphicElement(pos,
    images[pos] as string, {
      key: images[pos]||pos,
      ...(typeof attrs == 'function' ? attrs(pos) : attrs?.[pos] ?? {})
    }, resolution))
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

export const GraphicsLayer = memo(function({...props}: Record<string, any>) {

  const [bgAlign] = useObserved(displayMode, 'bgAlignment')

  const [prevImages, setPrevImages] = useState<typeof gameContext.graphics>({...gameContext.graphics})
  const [currImages, setCurrImages] = useState<typeof gameContext.graphics>({...gameContext.graphics})
  const [quake] = useObserved(quakeEffect, 'duration', (d)=>d!=0)
  const [monoChrome] = useObserved(gameContext, 'monochrome')

//__________________________listen for sprite changes___________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  useObserver(()=> {
    // animation finished or skipped
    setPrevImages({...gameContext.graphics})
  }, transition, 'duration', { filter: (d)=>d==0 })

  useChildrenObserver((_pos, _img)=> {
    setCurrImages({...gameContext.graphics})
    if (transition.duration == 0)
      setPrevImages({...gameContext.graphics})
  }, gameContext, "graphics")

//__________________________________animations__________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const onQuakeEnd = ()=> {
    quakeEffect.duration = 0
  }
  const onAnimationEnd = ()=> {
    transition.duration = 0
  }

//____________________________________render____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const {pos: trans_pos, duration, effect} = transition
  let style, className;
  ({style, className, ...props} = props);
  style = {
    ...style,
    ...(monoChrome ? {background: monoChrome} : {}),
    ...(quake ? {
      '--quake-x': `${quakeEffect.x}pt`,
      '--quake-y': `${quakeEffect.y}pt`,
      '--quake-time': `${quakeEffect.duration}ms`
    } : {})
  }
  const classList = className?.trim().split("") ?? []
  classList.push('box', 'graphics', 'box-graphics')
  if (quake) classList.push('quake')
  if (monoChrome) classList.push("monochrome")
  return (
    <div className={classList.join(' ')} {...props} style={style} onAnimationEnd={onQuakeEnd}>

      {(duration == 0) ? // no animation => display all sprites without effect
        graphicElements(currImages, {bg: {'bg-align': bgAlign}})
      : (trans_pos == "bg") ? // bg animation fade-in new bg over prev. sprites
        <>
        {graphicElements(prevImages, {bg: {'bg-align': bgAlign}})}
        {graphicElement('bg', currImages.bg, {
          key: currImages.bg||'bg',
          'bg-align': bgAlign,
          'fade-in': effect,
          onAnimationEnd: onAnimationEnd,
          style: {'--transition-time': `${duration}ms`},
        })}
        </>
      : POSITIONS.map(pos => // sprite animation: changed sprite fades-in above
                              // previous sprite. Others displayed noramlly.
        <Fragment key={pos}>
          {(pos != 'bg' && ([pos, 'a'].includes(trans_pos))) &&
            <>
            {currImages[pos]?.includes('/') && prevImages[pos]?.includes('/') && effect=="crossfade" &&
              // add an opaque background to the image to prevent the background
              // from being visible by transparency
              graphicElement(pos, prevImages[pos], {
                key: `mask${prevImages[pos]}`,
                'for-mask': "",
                style: {
                  '--from-image': `url(${imageUrl(prevImages[pos])})`,
                  '--to-image': `url(${imageUrl(currImages[pos])})`
                }
              })}
            {prevImages[pos] && graphicElement(pos, prevImages[pos], {
              key: prevImages[pos]||pos,
              'fade-out': effect,
              style: {'--transition-time': `${duration}ms`},
              onAnimationEnd: onAnimationEnd,
            })}
            </>
          }
          {graphicElement(pos, currImages[pos], {
            key: currImages[pos]||pos,
            ...(pos == 'bg' ? {
              'bg-align': bgAlign
            } : [pos, 'a'].includes(trans_pos) ? {
              'fade-in': effect,
              style: {'--transition-time': `${duration}ms`},
              onAnimationEnd: onAnimationEnd,
            } : {})
          })}
        </Fragment>)
      }
    </div>
  )
})
export default GraphicsLayer
