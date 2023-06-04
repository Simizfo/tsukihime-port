import LineComponent from "../components/LineComponent";

type Props = {
  pages: Page[],
  text: Line[],
}

import { useContext, useEffect, useRef } from 'react';
import { Line, Page } from "../types";
import { store } from "../context/GameContext";

const HistoryLayer = ({ pages, text }: Props) => {
  const { state, dispatch } = useContext(store)
  const historyRef = useRef<HTMLDivElement>(null)

  //if right click and history is displayed, hide history
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (state.dispHistory) {
        dispatch({ type: 'SET_DISP_HISTORY', payload: false })
      }
    }
    window.addEventListener('contextmenu', handleContextMenu)
    return () => window.removeEventListener('contextmenu', handleContextMenu)
  })

  //on mouse wheel up display history
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 && !state.dispHistory && pages.length !== 0) {
        dispatch({ type: 'SET_DISP_HISTORY', payload: true })
      }
    }
    window.addEventListener('wheel', handleWheel)
    return () => window.removeEventListener('wheel', handleWheel)
  })

  //on scroll bottom in history, hide history
  useEffect(() => {
    const handleScroll = (e: any) => {
      const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight
      if (bottom) {
        dispatch({ type: 'SET_DISP_HISTORY', payload: false })
      }
    }
    const history = document.getElementById('history')
    history?.addEventListener('scroll', handleScroll)
    return () => history?.removeEventListener('scroll', handleScroll)
  })

  useEffect(() => {
    dispatch({ type: 'SET_DISP_TEXT', payload: !state.dispHistory })
  }, [state.dispHistory])

  useEffect(() => {
    if (state.dispHistory) {
      const historyElement = historyRef.current
      historyElement!.scrollTop = historyElement!.scrollHeight - historyElement!.clientHeight - 1
    }
  }, [pages, text, state.dispHistory])

  //if a left click is made outside #history, hide history
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.button === 0 && state.dispHistory && !historyRef.current?.contains(e.target as Node)) {
        dispatch({ type: 'SET_DISP_HISTORY', payload: false })
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  })

  return (
    <div className={`box-history ${state.dispHistory ? "show" : ""}`}>
      <div className="box-text" id="history" ref={historyRef}>
        <div className="text-container">
          {/* lignes des pages précédentes */}
          {pages.map((page, i) =>
            page.map((line: any, j: any) =>
              <LineComponent key={i + "_" + j} line={line} />
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