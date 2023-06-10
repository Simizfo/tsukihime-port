import { useContext } from "react"
import { store } from "../context/GameContext"
import { Background } from "../types"

type Props = {
  bg: Background
}

const BackgroundLayer = ({ bg }: Props) => {
  const { state } = useContext(store)
  const extension = state.permanent.imagesFolder === 'image' ? 'jpg' : 'webp'

  if (bg.image.startsWith('#')) {
    return (
      <div className="background"
        style={{background:bg.image}}
        draggable={false}/>
    )
  } else {
    return (
      <img src={`${state.permanent.imagesFolder}/${bg.image}.${extension}`}
        alt="background"
        className="background"
        draggable={false} />
    )
  }
}

export default BackgroundLayer