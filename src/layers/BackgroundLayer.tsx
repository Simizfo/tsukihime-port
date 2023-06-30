import { useContext, useEffect, useRef, useState } from "react"
import { store } from "../context/GameContext"
import { Background } from "../types"
import Timer from "../utils/timer";

//##############################################################################
//#                               TOOL FUNCTIONS                               #
//##############################################################################

function createImg(imgDir: string, bg: Background, transition: object = {}) {
  const image = bg.image;
  const attrs = {
    className: "background center",
    ...transition
  }
  if (image.startsWith('#')) {
    return (
      <div
        style={{ background: image }}
        {...attrs}
      />
    )
  }
  else {
    const extension = imgDir === 'image' ? 'jpg' : 'webp';
    return (
      <img
        src={`${imgDir}/${image}.${extension}`}
        alt="background"
        {...attrs}
      />
    )
  }
}

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

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

type Props = {
  bg: Background,
  skipTransition?: boolean,
  onTransitionEnd?: (()=>void)|null,
}

const BackgroundLayer = ({ bg, skipTransition = false, onTransitionEnd = null }: Props) => {
  const bgTmp = useRef<Background>(bg)
  const timer = useRef<Timer|null>(null)
  const {state, dispatch} = useContext(store)
  const [duration, setDuration] = useState<number>(0)
  const [effect, setEffect] = useState<string>('')

  const imgFolder = state.permanent.imagesFolder

  const onAnimationEnd = ()=> {
    bgTmp.current = bg;
    timer.current = null
    dispatch({ type: 'SET_DISP_TEXT', payload: true });
    if (onTransitionEnd)
      onTransitionEnd()
  }

//_______________________________property changes_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  useEffect(() => {
    const {effect, duration} = getTransition(bg.type, skipTransition)
    setEffect(effect)
    setDuration(duration)
    if (duration > 0) {
      dispatch({ type: 'SET_DISP_TEXT', payload: false });
      timer.current = new Timer(duration, onAnimationEnd)
      timer.current.start()
    } else {
      onAnimationEnd()
    }
    return ()=> {
      timer.current?.cancel()
    }
  }, [bg]);

  useEffect(()=> {
    if (skipTransition) {
      timer.current?.skip()
    }
  }, [skipTransition])

//____________________________________render____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  if (bgTmp.current.image != "" && bgTmp.current.image != bg.image && duration > 0) {
    const elmt1 = createImg(imgFolder, bg),
          elmt2 = createImg(imgFolder, bgTmp.current,
                            {style:{'--transition-time': `${duration}ms`},
                             'fade-effect': effect})
    return (
      <>
        {elmt1}
        {elmt2}
      </>
    )
  } else {
    return createImg(imgFolder, bg)
  }
};


export default BackgroundLayer
