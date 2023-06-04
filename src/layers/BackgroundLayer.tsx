import { Background } from "../types"

type Props = {
  bg: Background
}

const BackgroundLayer = ({ bg }: Props) => {
  return (
    <img src={`/${bg.image}`} alt="background" className="background" draggable={false} />
  )
}

export default BackgroundLayer