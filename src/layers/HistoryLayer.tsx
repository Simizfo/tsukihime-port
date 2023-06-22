import LineComponent from "../components/LineComponent";
import React, { useContext, useEffect, useRef } from 'react';
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
      if (e.deltaY < 0 && !state.disp.history && !state.disp.menu && pages.length !== 0) {
        dispatch({ type: 'SET_DISP_HISTORY', payload: true })
      }
    }
    return addEventListener({event: 'wheel', handler: handleWheel})
  })

  useEffect(() => {
    //on right click, when history is displayed, hide history
    const handleContextMenu = (e: MouseEvent) => {
      if (state.disp.history) {
        dispatch({ type: 'SET_DISP_HISTORY', payload: false })
      }
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
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
    dispatch({ type: 'SET_DISP_TEXT', payload: !state.disp.history })
  }, [state.disp.history])

  useEffect(() => {
    //scroll to the bottom of history
    if (state.disp.history) {
      const historyElement = historyRef.current
      historyElement!.scrollTop = historyElement!.scrollHeight - historyElement!.clientHeight - 1
    }
  }, [state.disp.history])

  return (
    <div className={`box box-history ${state.disp.history ? "show" : ""}`}>
      <div className="box-text" id="history" ref={historyRef}>
        <div className="text-container">
          {/* lignes des pages précédentes */}
          {pages.map((page, i) =>
            <React.Fragment key={`histo_page_${i}`}>
              {page.map((line: Line, j: any) =>
                <LineComponent key={`histo_page_${i}_${j}`} line={line} printInstantly={true} />
              )}
              {i !== pages.length - 1 && <hr />}
            </React.Fragment>
          )}

          <hr />
          
          {/* lignes de la page actuelle */}
          {text.map((line, i) =>
            <LineComponent key={`histo_text_${i}`} line={line} printInstantly={true} />
          )}
        </div>
      </div>

      <footer>
        <button onClick={() => dispatch({ type: 'SET_DISP_HISTORY', payload: false })}>Close</button>
      </footer>
    </div>
  )
}


export default HistoryLayer