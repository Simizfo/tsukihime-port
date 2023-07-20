import { useEffect, useState, useRef, memo, Fragment } from "react";
import { displayMode, gameContext, settings } from "../utils/variables";
import { observe, unobserve } from "../utils/Observer";
import Timer from "../utils/timer";

type SpritePos = keyof typeof gameContext.graphics
const POSITIONS: Array<SpritePos> = Object.keys(gameContext.graphics) as Array<SpritePos>

type Transition = {
  effect: string,
  duration: number,
  pos: SpritePos | 'a',
  onFinish: VoidFunction|undefined
}
const transition: Transition = {
  effect: "",
  duration: 0,
  pos: "a",
  onFinish : undefined,
}

//##############################################################################
//#                                 FUNCTIONS                                  #
//##############################################################################

/**
 * Move background up or down
 */
export function moveBg(direction: string) {
  const positions: Array<typeof displayMode.bgAlignment>
      = ["top", "center", "bottom"]
  let index = positions.indexOf(displayMode.bgAlignment)
  if (direction == "down" && index < 2) index++
  else if(direction == "up" && index > 0) index--
  displayMode.bgAlignment = positions[index]
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
  if (image) {
    if (image.startsWith('"') && image.endsWith('"')) {
      // remove ':a;', 'image/', '"', '.jpg'
      image = image.replace(/:a;|image[\/\\]|"|\.jpg/g, '')
                   .replace('\\', '/')
    } else if (!image.startsWith('#')) { // not image nor color
      throw Error(`Ill-formed arguments for [${cmd} ${arg}]`)
    }
  }

  type = type?.replace('%', '')

  let change = setSprite(pos as SpritePos, image)

  if (cmd == 'bg') {
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
      displayMode.text = false
      // Listen for the 'duration' to be set to 0
      // The component sets it to 0 after completing the animation,
      // and calling 'next' the command also sets it to 0
      const callback = (duration: number)=> {
        if (duration == 0) {
          unobserve(transition, 'duration', callback)
          onFinish()
        }
      }
      observe(transition, 'duration', callback)
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
const commands = {
  'bg' : processImageCmd,
  'ld' : processImageCmd,
  'cl' : processImageCmd,
  'quakex'    : null, //TODO : vertical shake effect
  'quakey'    : null, //TODO : horizontal shake effect
  'monocro'   : null, //TODO : fade screen to monochrome
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

function imgUrl(img: string) {
  const folder: string = settings.imagesFolder
  const extension = folder === 'image' && !img.includes("tachi") ? 'jpg' : 'webp'
  return `${folder}/${img}.${extension}`
}

export function graphicsElement(pos: SpritePos, image: string,
                                _attrs: {[key:string]: any} = {}) {

  image = image || ((pos=="bg") ? "#000000" : "#00000000")
  let {className, ...attrs} = _attrs
  className = (className?+className+" ":"")+pos
  if (image.startsWith('#')) {
    return (
      <div
        style={{ background: image }}
        className={className}
        {...attrs}
      />
    )
  }
  else {
    return (
      <img
        src={imgUrl(image)}
        alt={`[[sprite:${image}]]`}
        className={className}
        {...attrs}
      />
    )
  }
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

export const GraphicsLayer = memo(function({...props}: {[key: string]: any}) {

  const [bgAlign, setBgAlign] = useState<'top'|'center'|'bottom'>(displayMode.bgAlignment)

  const [prevImages, setPrevImages] = useState<typeof gameContext.graphics>({...gameContext.graphics})
  const [currImages, setCurrImages] = useState<typeof gameContext.graphics>({...gameContext.graphics})
  const timer = useRef<Timer|null>(null)

//__________________________listen for sprite changes___________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  useEffect(()=> {

    const imageCallback = ()=> {
      setCurrImages({...gameContext.graphics})
    }

    const animCallback = (duration: number)=> {
      if (duration == 0) { // skipped the on-going animation, or animation has ended
        setPrevImages({...gameContext.graphics})
        timer.current?.cancel()
        timer.current == null
      }
    }

    for(const pos of POSITIONS)
      observe(gameContext.graphics, pos, imageCallback)

    observe(displayMode, 'bgAlignment', setBgAlign)
    observe(transition, 'duration', animCallback)

    return ()=> {
      for (const pos of POSITIONS)
        unobserve(gameContext.graphics, pos, imageCallback)

      unobserve(displayMode, 'bgAlignment', setBgAlign)
      unobserve(transition, 'duration', animCallback)
    }

  }, [])

//__________________________________animations__________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  const onAnimationEnd = ()=> {
    transition.duration = 0
    timer.current = null
  }

  useEffect(()=> {
    const {duration} = transition
    if (duration > 0) {
      //displayMode.text = false
      timer.current = new Timer(duration, onAnimationEnd)
      timer.current.start()
    } else {
      onAnimationEnd()
    }
  }, [currImages])

//____________________________________render____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const {pos: trans_pos, duration, effect} = transition
  return (
    <div className="box box-graphics" {...props} >
      {(duration == 0) ? // no animation => display all sprites without effect
        POSITIONS.map((pos)=> graphicsElement(pos, currImages[pos], {
          key: currImages[pos]||pos,
          ...(pos == 'bg' ? {'bg-align': bgAlign} : {})
        }))
      : (trans_pos == "bg") ? // special case for background animation :
                              // only animate fade-in of the background
                              // on top of all previous sprites unanimated
        <>
        {POSITIONS.map((pos)=> graphicsElement(pos, prevImages[pos], {
          key: prevImages[pos]||pos,
          ...(pos == 'bg' ? {'bg-align': bgAlign} : {})
        }))}
        {graphicsElement('bg', currImages.bg, {
          key: currImages.bg||'bg',
          'bg-align': bgAlign,
          'fade-in': effect,
          style: {'--transition-time': `${duration}ms`},
        })}
        </>
      : POSITIONS.map((pos)=> // animation of characters: for the animated
                              // characters, display the new sprite on top of
                              // the previous sprite. Non-animated sprites
                              // only have their current sprite displayed
        <Fragment key={pos}>
          {(pos != 'bg' && ([pos, 'a'].includes(trans_pos))) &&
            <>
            {currImages[pos] && prevImages[pos] && effect=="crossfade" &&
              // add an opaque background to the image to prevent the background
              // from being visible by transparency
              graphicsElement(pos, prevImages[pos], {
                key: `mask${prevImages[pos]}`,
                'for-mask': "",
                style: {
                  '--from-image': `url(${imgUrl(prevImages[pos])})`,
                  '--to-image': `url(${imgUrl(currImages[pos])})`
                }
              })}
            {graphicsElement(pos, prevImages[pos], {
              key: prevImages[pos]||pos,
              'fade-out': effect,
              style: {'--transition-time': `${duration}ms`},
            })}
            </>
          }
          {graphicsElement(pos, currImages[pos], {
            key: currImages[pos]||pos,
            ...((pos != 'bg' && ([pos, 'a'].includes(trans_pos))) ? {
              'fade-in': effect,
              style: {'--transition-time': `${duration}ms`},
            } : {})})}
        </Fragment>)
      }
    </div>
  )
})
export default GraphicsLayer
