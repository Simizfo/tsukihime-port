import { Fragment, useEffect, useRef, useState } from 'react';
import { addEventListener, convertText } from "../utils/utils";
import { displayMode } from '../utils/variables';
import { observe, unobserve } from '../utils/Observer';

type Props = {
  pages: Iterable<string>,
  text: string,
}

const HistoryLayer = ({ pages, text }: Props) => {
  const [ display, setDisplay ] = useState(displayMode.history)
  const historyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    //on mouse wheel up display history
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 && !display && !displayMode.menu) {
        const it = pages[Symbol.iterator]()
        if (!it.next().done) // at least one element in the iterator
          setDisplay(true)
      }
      //TODO: scroll down: close if scroll past bottom
    }
    return addEventListener({event: 'wheel', handler: handleWheel})
  })

  useEffect(()=> {
    observe(displayMode, 'history', setDisplay)
    return ()=> {
      unobserve(displayMode, 'history', setDisplay)
    }
  }, [])

  useEffect(()=> {
    if (display != displayMode.history)
      displayMode.history = display
  }, [display])

  useEffect(() => {
    //on right click, when history is displayed, hide history
    const handleContextMenu = (_e: MouseEvent) => {
      if (display) {
        setDisplay(false)
      }
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
  })


  useEffect(() => {
    //when scrolled to the bottom of history, hide history
    const handleScroll = (e: any) => {
      const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight
      if (bottom) {
        setDisplay(false)
      }
    }
    return addEventListener({event: 'scroll', handler: handleScroll, element: historyRef.current})
  })

  useEffect(() => {
    displayMode.text = !display
  }, [display])

  useEffect(() => {
    //scroll to the bottom of history
    if (display) {
      const historyElement = historyRef.current
      historyElement!.scrollTop = historyElement!.scrollHeight - historyElement!.clientHeight - 1
    }
  }, [display])

  return (
    <div className={`box box-history ${display ? "show" : ""}`}>
      <div className="box-text" id="history" ref={historyRef}>
        <div className="text-container">
          {/* lignes des pages précédentes */}
          {Array.from(pages, (page, i) =>
            <Fragment key={i}>
              {i > 0 && <hr/>}
              {page.split('\n').map((line, i)=>
                <Fragment key={i}>
                  {i > 0 && <br/>}
                  {convertText(line)}
                </Fragment>
              )}
            </Fragment>
          )}

          <hr />

          {/* lignes de la page actuelle */}
          {text.split('\n').map((line, i)=>
            <Fragment key={i}>
              {i > 0 && <br/>}
              {convertText(line)}
            </Fragment>
          )}
        </div>
      </div>

      <footer>
        <button onClick={() => setDisplay(false)}>Close</button>
      </footer>
    </div>
  )
}


export default HistoryLayer
