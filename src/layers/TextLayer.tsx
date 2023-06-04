import { useContext, useEffect } from "react"
import LineComponent from "../components/LineComponent"
import { Line } from "../types"
import { store } from "../context/GameContext"
import { addEventListener } from "../utils/utils"

type Props = {
  text: Line[],
  handleClick: () => void,
}

const TextLayer = ({ text, handleClick }: Props) => {
  const { state, dispatch } = useContext(store)

  //on right click toggle display text
  useEffect(() => {
    const handleRightClick = (e: MouseEvent) => {
      if (e.button === 2 && !state.dispHistory && !state.dispChoices) {
        dispatch({ type: 'SET_DISP_TEXT', payload: !state.dispText })
      }
    }
    return addEventListener({event: 'mousedown', handler: handleRightClick})
  })

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