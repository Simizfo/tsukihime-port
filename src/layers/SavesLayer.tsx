import { useEffect, useRef, useState } from "react"
import { displayMode } from "../utils/display"
import { addEventListener } from "../utils/utils"
import { useObserver } from '../utils/Observer';
import SavesLayout from "../components/SavesLayout";


function back() {
  displayMode.save = false
  displayMode.load = false
}

const SavesLayer = () => {
  const [display, setDisplay] = useState(displayMode.saveScreen)
  const rootRef = useRef<HTMLDivElement>(null)

  function onDisplayChange() {
    const display = displayMode.saveScreen
    setDisplay(display)
    if (!display && rootRef.current?.contains(document.activeElement))
      (document.activeElement as HTMLElement).blur?.();
  }
  useObserver(onDisplayChange, displayMode, "saveScreen")

  useEffect(() => {
    const handleContextMenu = (_e: MouseEvent) => {
      displayMode.saveScreen = false
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
  }, [])

  return (
    <div className={`box box-save ${display ? "show" : ""}`} ref={rootRef}>
      {display && 
        <div className="page-content">
          <SavesLayout variant={displayMode.savesVariant as "save"|"load"} back={back} />
        </div>
      }
    </div>
  )
}

export default SavesLayer
