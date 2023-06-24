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
      if (e.code === 'Space' && !state.disp.history && !state.disp.choices && !state.disp.menu) {
        dispatch({ type: 'SET_DISP_TEXT', payload: !state.disp.text })
      }
    }
    return addEventListener({event: 'keydown', handler: handleKeyDown})
  })

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (e.button === 2 && !state.disp.history && !state.disp.text) {
        dispatch({ type: 'SET_DISP_TEXT', payload: true })
      }
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
  })

  return (
    <div className={`box box-text ${state.disp.text ? "" : "hide"}`} onClick={handleClick}>
      <div className="text-container">
        {text.map((line, i) =>
          <LineComponent key={`text_${i}`}
            line={line}
            printInstantly={i !== text.length - 1}
            isLastLine={text.length - 1 === i} />
        )}
      </div>
    </div>
  )
}

export default TextLayer