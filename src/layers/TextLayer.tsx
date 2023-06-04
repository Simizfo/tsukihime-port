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

  //on spacebar press toggle display text
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !state.dispHistory && !state.dispChoices && !state.dispMenu) {
        dispatch({ type: 'SET_DISP_TEXT', payload: !state.dispText })
      }
    }
    return addEventListener({event: 'keydown', handler: handleKeyDown})
  })

  return (
    <div className={`box box-text ${state.dispText ? "" : "hide"}`} onClick={handleClick}>
      <div className="text-container">
        {text.map((line, i) =>
          <LineComponent key={i} line={line} isLastLine={text.length - 1 === i} />
        )}
      </div>
    </div>
  )
}

export default TextLayer