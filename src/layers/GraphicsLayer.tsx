import { useEffect, useState, useRef, memo, Fragment } from "react";
import { displayMode, gameContext, settings } from "../utils/variables";
import { observe, unobserve } from "../utils/Observer";
import Timer from "../utils/timer";


export type Sprite = {
  image: string,
  type: string
}

type SpritePos = keyof typeof gameContext.graphics
const POSITIONS: Array<SpritePos> = Object.keys(gameContext.graphics) as Array<SpritePos>

type Transition = {
  pos: SpritePos | 'a',
  duration: number,
  effect: string,
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
export function moveBg(direction: string) {
  const positions: Array<typeof displayMode.bgAlignment>
      = ["top", "center", "bottom"]
  let index = positions.indexOf(displayMode.bgAlignment)
  if (direction == "down" && index < 2) index++;
  else if(direction == "up" && index > 0) index--;
  displayMode.bgAlignment = positions[index]
}
//_______________________________script commands________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function processImageCmd(arg: string, cmd: string, onFinish: VoidFunction) {
  let args = arg.split(',')
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

  setSprite(pos as SpritePos, image);

  const {effect, duration} = getTransition(type);
  transition.effect = effect
  transition.duration = duration
  transition.pos = pos as SpritePos|'a'

  if (cmd == 'bg') {
    clearAllSprites()
    if ((image as string).includes('event/')) {
      settings.eventImages.push(image as string)
    }
  }

  if (duration > 0) {
    displayMode.text = false;
    // Listen for the 'duration' to be set to 0
    // The component sets it to 0 after completing the animation,
    // and calling 'next' the command also sets it to 0
    const callback = (duration: number)=> {
      if (duration == 0) {
        displayMode.text = true;
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

function clearAllSprites() {
  gameContext.graphics.l = ""
  gameContext.graphics.c = ""
  gameContext.graphics.r = ""
}

function setSprite(pos: SpritePos|'a', image: string) {
  if (pos == 'a') {
    if (image.length > 0)
      throw Error("Unexpected image parameter with 'a' position")
    clearAllSprites()
  } else if (['l', 'c', 'r', 'bg'].includes(pos)) {
    gameContext.graphics[pos as 'c'|'l'|'r'|'bg'] = image;
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
      let speed = effect.substring(index+1);
      switch(speed) {
        case 'slw': duration = 1500; break
        case 'mid': duration = 800; break
        case 'fst': duration = 400; break
        default : throw Error(`Ill-formed effect '${effect}'`);
      }
    }
    effect = effect.substring(0, index);
  }
  return {effect, duration}
}

function createImg(pos: SpritePos,
                   image = gameContext.graphics[pos],
                   attrs: {[key:string]: any} = {}) {

  image = image||"#00000000";
  if (image.startsWith('#')) {
    return (
      <div
        style={{ background: image }}
        {...attrs}
      />
    )
  }
  else {
    const folder: string = settings.imagesFolder
    const extension = folder === 'image' && !image.includes("tachi") ? 'jpg' : 'webp';
    return (
      <img
        src={`${folder}/${image}.${extension}`}
        alt={`[[sprite:${image}]]`}
        {...attrs}
      />
    )
  }
}

function createTransitionGroup(pos : SpritePos, prevImage: string, currImage: string, _attrs: {[key:string]:any}) {
  const {duration, effect} = transition
  let {className, ...attrs} = _attrs;
  className = (className?+className+" ":"")+pos
  if (duration > 0 && prevImage != currImage) {
    return <Fragment key={currImage}>
      {createImg(pos as SpritePos, currImage, {
        style: {'--transition-time': `${duration}ms`},
        'fade-in': effect,
        className: className,
        ...attrs
      })}
      {createImg(pos as SpritePos, prevImage, {
        style: {'--transition-time': `${duration}ms`},
        'fade-out': effect,
        className: className,
        ...attrs
      })}
    </Fragment>
  } else {
    return createImg(pos as SpritePos, currImage, {
      key: pos,
      className: className,
      ...attrs
    })
  }
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

export const GraphicsLayer = memo(function() {

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
      if (duration == 0)
        setPrevImages({...gameContext.graphics})
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
    transition.duration = 0;
    timer.current = null
  }

  useEffect(()=> {
    const {duration} = transition
    if (duration > 0) {
      //displayMode.text = false
      timer.current = new Timer(duration, onAnimationEnd)
      timer.current.start()
      return ()=> {
        if (timer.current) {
          timer.current?.skip()
          timer.current = null
        }
      }
    } else {
      onAnimationEnd()
    }
  }, [currImages])

//____________________________________render____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return (
    <div className="box box-graphics">
      {POSITIONS.map((pos) =>
        createTransitionGroup(pos as SpritePos,
          prevImages[pos as SpritePos],
          currImages[pos as SpritePos],
          {...(pos=='bg'?{'bg-align': bgAlign} : {})}
        )
      )}
    </div>
  )
})
export default GraphicsLayer
