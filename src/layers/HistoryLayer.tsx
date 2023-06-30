import { Fragment, useContext, useEffect, useRef } from 'react';
import { store } from "../context/GameContext";
import { addEventListener, convertText } from "../utils/utils";

type Props = {
  pages: Iterable<string[]>,
  text: string[],
}

const HistoryLayer = ({ pages, text }: Props) => {
  const { state, dispatch } = useContext(store)
  const historyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    //on mouse wheel up display history
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 && !state.disp.history && !state.disp.menu) {
        const it = pages[Symbol.iterator]()
        if (!it.next().done) // at least one element in the iterator
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
          {Array.from(pages, (page, i) =>
            <Fragment key={i}>
              {i > 0 && <hr/>}
              {page.map(convertText)}
            </Fragment>
          )}

          <hr />

          {/* lignes de la page actuelle */}
          {text.map(convertText)}
        </div>
      </div>

      <footer>
        <button onClick={() => dispatch({ type: 'SET_DISP_HISTORY', payload: false })}>Close</button>
      </footer>
    </div>
  )
}


export default HistoryLayer
