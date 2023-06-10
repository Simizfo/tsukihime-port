import { useContext, useEffect, useRef, useState } from "react"
import { store } from "../context/GameContext"
import { Background } from "../types"
import { BgTransition } from "../utils/constants"

type Props = {
  bg: Background
}

const BackgroundLayer = ({ bg }: Props) => {
  const { state, dispatch } = useContext(store);
  const [fade, setFade] = useState(false);
  const bgTmp = useRef<Background>(bg);
  const extension = state.permanent.imagesFolder === 'image' ? 'jpg' : 'webp';

  useEffect(() => {
    if (bg.type === BgTransition.type_crossfade_slw) {
      crossfade()
    } else {
      bgTmp.current = bg;
    }
  }, [bg]);

  const crossfade = () => {
    dispatch({ type: 'SET_DISP_TEXT', payload: false })
    setFade(true);
    setTimeout(() => {
      bgTmp.current = bg;
      setFade(false);
    }, 1000);
  }

  useEffect(() => {
    if (!fade) {
      dispatch({ type: 'SET_DISP_TEXT', payload: true });
    }
  }, [fade, dispatch]);

  if (bg.image.startsWith('#')) {
    return (
      <div className="background" style={{ background: bg.image }} />
    );
  } else {
    return (
      <>
        <img
          src={`${state.permanent.imagesFolder}/${bg.image}.${extension}`}
          alt="background"
          className={`background`}
        />
        <img
          src={`${state.permanent.imagesFolder}/${bgTmp.current.image}.${extension}`}
          alt="background"
          className={`background ${fade ? 'fade' : ''}`}
        />
      </>
    );
  }
};


export default BackgroundLayer