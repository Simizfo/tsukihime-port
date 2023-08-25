import { memo, useCallback, useEffect, useRef, useState } from "react";
import { gameContext, settings } from "../utils/variables";
import { observe, useObserved, useObserver } from "../utils/Observer";
import { displayMode } from "../utils/display";
import { Graphics, preloadImage } from "../components/GraphicsComponent";

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
//_____________________________script command tools_____________________________
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

//_______________________________script commands________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

//________________________________Tool functions________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function endTransition() {
  transition.duration = 0
}

function useGraphicTransition(pos: SpritePos): [string, string, number, string] {
  const [img] = useObserved(gameContext.graphics, pos)
  const prev = useRef("")
  const [d, setD] = useState(0)
  const [e, setE] = useState("")

  const callback = useCallback(()=> {
    const {duration: transD, pos: transP, effect: transE} = transition
    if (transD > 0 && (transP == pos || transP == 'a' && pos != 'bg')) {
      setD(transD)
      setE(transE)
    } else {
      setD(0)
      setE("")
      prev.current = gameContext.graphics[pos]
    }
  }, [])
  useObserver(callback, transition, 'duration')
  useObserver(callback, transition, 'effect')
  useObserver(callback, gameContext.graphics, pos)
  return [img, prev.current, d, e]
}

function useImagePreload(img: string) : boolean {
  const [imgLoaded, setImageLoaded] = useState(false)
  useEffect(()=> {
    setImageLoaded(false)
    preloadImage(img).finally(setImageLoaded.bind(null, true))
  }, [img])
  return imgLoaded
}

//________________________________Sub components________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

//.......... l, c, r sprites ...........
const SpriteGraphics = memo(({pos}: {pos: Exclude<SpritePos, 'bg'>})=> {
  const [currImg, prevImg, fadeTime, effect] = useGraphicTransition(pos)
  const [bgTransition] = useObserved(transition, 'duration',
      (d)=> d > 0 && transition.pos == 'bg' && prevImg != "")
  const imgLoaded = useImagePreload(currImg)
  const img1 = prevImg
  const img2 = bgTransition ? prevImg : currImg

  if (!imgLoaded)
    return <Graphics key={img1} pos={pos} image={img1}/>

  return <>
    {fadeTime > 0 &&
      <Graphics key={img1} pos={pos} image={img1} fadeOut={effect}
                fadeTime={fadeTime} toImg={img2}
                onAnimationEnd={endTransition}/>
    }
    {(fadeTime == 0 || effect != "") &&
      <Graphics key={img2} pos={pos} image={img2} fadeIn={effect}
                fadeTime={fadeTime} onAnimationEnd={endTransition}/>
    }
  </>
})

//............. background .............
const BackgroundGraphics = memo(()=> {
  const [bgAlign] = useObserved(displayMode, 'bgAlignment',
      (a)=>({ 'bg-align': a }))
  const [currImg, prevImg, fadeTime, _effect] = useGraphicTransition('bg')
  const bgTransition = fadeTime > 0

  const img = bgTransition ? prevImg : currImg
  return (
    <Graphics key={img} pos='bg' image={img} {...bgAlign}/>
  )
})

//............. foreground .............
//(used to make background transitions over the sprites)
const ForegroundGraphics = memo(()=> {
  const [bgAlign] = useObserved(displayMode, 'bgAlignment',
      (a)=>({ 'bg-align': a }))
  const [img, _prev, fadeTime, effect] = useGraphicTransition('bg')
  const imgLoaded = useImagePreload(img)

  return (
    (imgLoaded && fadeTime > 0 && effect != "") ?
      <Graphics key={img} pos='bg' image={img} fadeTime={fadeTime}
                fadeIn={effect} onAnimationEnd={endTransition} {...bgAlign}/>
    : <></>
  )
})

//________________________________Main component________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const GraphicsLayer = memo(function({...props}: Record<string, any>) {

  const [quake] = useObserved(quakeEffect, 'duration', (d)=>d!=0)
  const [monoChrome] = useObserved(gameContext, 'monochrome')

//........ animation callbacks .........
  const onQuakeEnd = useCallback(()=> {
    quakeEffect.duration = 0
  }, [])

//......... compute properties .........
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
//............... render ...............
  return (
    <div className={classList.join(' ')} {...props}
         style={style} onAnimationEnd={onQuakeEnd}>

      <BackgroundGraphics/>
      <SpriteGraphics pos='l'/>
      <SpriteGraphics pos='c'/>
      <SpriteGraphics pos='r'/>
      <ForegroundGraphics/>
    </div>
  )
})
export default GraphicsLayer

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.transition = transition
