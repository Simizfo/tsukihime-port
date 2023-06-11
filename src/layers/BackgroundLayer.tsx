import { useContext, useEffect, useRef, useState } from "react"
import { store } from "../context/GameContext"
import { Background } from "../types"

type Props = {
  bg: Background
}

const BackgroundLayer = ({ bg }: Props) => {
  const { state, dispatch } = useContext(store);
  const [fade, setFade] = useState(false);
  const bgTmp = useRef<Background>(bg);
  const extension = state.permanent.imagesFolder === 'image' ? 'jpg' : 'webp';

  let effect = '',
      duration = 0

  useEffect(() => {
    if (duration > 0) {
      crossfade(duration)
    } else {
      bgTmp.current = bg;
    }
  }, [bg]);

  const crossfade = (duration: number) => {
    dispatch({ type: 'SET_DISP_TEXT', payload: false })
    setFade(true);
    setTimeout(() => {
      bgTmp.current = bg;
      setFade(false);
    }, duration);
  }

  useEffect(() => {
    if (!fade) {
      dispatch({ type: 'SET_DISP_TEXT', payload: true });
    }
  }, [fade, dispatch]);

  function getTransition(type: string) {
    let duration = 0
    let effect = type

    if (effect.startsWith('type_'))
      effect = effect.substring('type_'.length)

    const index = effect.lastIndexOf('_')
    if (index !== -1) {
      let speed = effect.substring(index+1);
      switch(speed) {
        case 'slw': duration = 1500; break
        case 'mid': duration = 800; break
        case 'fst': duration = 400; break
        default : throw Error(`Ill-formed effect '${effect}'`);
      }
      effect = effect.substring(0, index);
    }
    return {effect, duration}
  }

  const createImg = (bg: Background, transition: object = {})=> {
    const {image, type} = bg;
    const attrs = {
      className: "background",
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
      return (
        <img
          src={`${state.permanent.imagesFolder}/${image}.${extension}`}
          alt="background"
          {...attrs}
        />
      )
    }
  }

  ({effect, duration} = getTransition(bg.type));

  if (bgTmp.current.image != "" && bgTmp.current.image != bg.image && duration > 0) {
    const elmt1 = createImg(bg),
          elmt2 = createImg(bgTmp.current,{style:{'--transition-time': `${duration}ms`}, 'fade-effect': effect})
    return (
      <>
        {elmt1}
        {elmt2}
      </>
    )
  } else {
    return createImg(bg)
  }
};


export default BackgroundLayer
