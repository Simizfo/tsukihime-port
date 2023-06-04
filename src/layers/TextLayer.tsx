import { useContext } from "react"
import LineComponent from "../components/LineComponent"
import { Line } from "../types"
import { store } from "../context/GameContext"

type Props = {
  text: Line[],
  handleClick: () => void,
}

const TextLayer = ({ text, handleClick }: Props) => {
  const { state, dispatch } = useContext(store)

  return (
    <div className={`box-text ${state.dispText ? "" : "hide"}`} onClick={handleClick}>
      <div className="text-container">
        {text.map((line, i) =>
          <LineComponent key={i} line={line} isLastLine={text.length - 1 === i} />
        )}
      </div>
    </div>
  )
}

export default TextLayer