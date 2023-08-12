import { Fragment, useEffect, useRef, useState } from 'react';
import { addEventListener, convertText, objectMatch } from "../utils/utils";
import { displayMode } from '../utils/display';
import { SaveState, loadSaveState } from "../utils/savestates";
import { useObserver } from '../utils/Observer';
import history from '../utils/history';
import script from '../utils/script';

type Props = {
  [key: string] : any // other properties to apply to the root 'div' element of the component
}

const HistoryLayer = (props: Props) => {
  const [ display, setDisplay ] = useState(displayMode.history)
  const historyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    //on mouse wheel up display history
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey)
        return
      if (e.deltaY < 0 && !display && objectMatch(displayMode, {menu:false, saves:false})) {
        if (!history.empty) // at least one element in the iterator
          setDisplay(true)
        script.autoPlay = false
      } else if (e.deltaY > 0 && display && historyRef.current?.scrollHeight == historyRef.current?.clientHeight) {
        setDisplay(false)
      }
      //TODO: scroll down: close if scroll past bottom
    }
    return addEventListener({event: 'wheel', handler: handleWheel})
  })

  useObserver(setDisplay, displayMode, 'history')

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
      const bottom = e.target.scrollHeight - Math.round(e.target.scrollTop) === e.target.clientHeight
      if (bottom) {
        setDisplay(false)
      }
    }
    return addEventListener({event: 'scroll', handler: handleScroll, element: historyRef.current})
  })

  useEffect(() => {
    //scroll to the bottom of history
    if (display) {
      const historyElement = historyRef.current
      historyElement!.scrollTop = historyElement!.scrollHeight - historyElement!.clientHeight - 1
    }
  }, [display])

  function onClick(saveState: SaveState) {
    setDisplay(false)
    loadSaveState(saveState)
  }
  const {className, ...otherProps} = props
  return (
    <div className={`box box-history ${display ? "show " : ""}${className}`} {...otherProps}>
      <div className="box-text" id="history" ref={historyRef}>
        <div className="text-container">
          {/* lignes des pages précédentes */}
          {Array.from(history, ({contentType, text, saveState}, i) =>
            <Fragment key={i}>
              {i > 0 && <hr {...{"page-type": contentType}}/>}
              {saveState &&
                <button className="menu-btn load" onClick={onClick.bind(null,saveState)}>Load</button>
              }
              {text.split('\n').map((line, i) =>
                <Fragment key={i}>
                  {i > 0 && <br/>}
                  {convertText(line)}
                </Fragment>
              )}
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
