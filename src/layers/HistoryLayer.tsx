import LineComponent from "../components/LineComponent";
import { useContext, useEffect, useRef } from 'react';
import { Line, Page } from "../types";
import { store } from "../context/GameContext";
import { addEventListener } from "../utils/utils";

type Props = {
  pages: Page[],
  text: Line[],
}

const HistoryLayer = ({ pages, text }: Props) => {
  const { state, dispatch } = useContext(store)
  const historyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    //on mouse wheel up display history
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 && !state.dispHistory && pages.length !== 0) {
        dispatch({ type: 'SET_DISP_HISTORY', payload: true })
      }
    }
    return addEventListener({event: 'wheel', handler: handleWheel})
  })

  useEffect(() => {
    //on right click, when history is displayed, hide history
    const handleContextMenu = (e: MouseEvent) => {
      if (state.dispHistory) {
        dispatch({ type: 'SET_DISP_HISTORY', payload: false })
      }
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
  })

  useEffect(() => {
    //if a left click is made outside #history, hide history
    const handleClick = (e: MouseEvent) => {
      if (e.button === 0 && state.dispHistory && !historyRef.current?.contains(e.target as Node)) {
        dispatch({ type: 'SET_DISP_HISTORY', payload: false })
      }
    }
    return addEventListener({event: 'mousedown', handler: handleClick})
  })

  useEffect(() => {
    //when scrolled to the bottom of history, hide history
    const handleScroll = (e: any) => {
      const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight
      if (bottom) {
        dispatch({ type: 'SET_DISP_HISTORY', payload: false })
      }
    }
    return addEventListener({event: 'scroll', handler: handleScroll, element: historyRef.current})
  })

  useEffect(() => {
    dispatch({ type: 'SET_DISP_TEXT', payload: !state.dispHistory })
  }, [state.dispHistory])

  useEffect(() => {
    //scroll to the bottom of history
    if (state.dispHistory) {
      const historyElement = historyRef.current
      historyElement!.scrollTop = historyElement!.scrollHeight - historyElement!.clientHeight - 1
    }
  }, [state.dispHistory])

  return (
    <div className={`box box-history ${state.dispHistory ? "show" : ""}`}>
      <div className="box-text" id="history" ref={historyRef}>
        <div className="text-container">
          {/* lignes des pages précédentes */}
          {pages.map((page, i) =>
            page.map((line: any, j: any) =>
              <LineComponent key={`${i}_${j}`} line={line} />
            )
          )}

          {/* lignes de la page actuelle */}
          {text.map((line, i) =>
            <LineComponent key={i} line={line} />
          )}
        </div>
      </div>
    </div>
  )
}


export default HistoryLayer