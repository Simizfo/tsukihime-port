import { useEffect, useRef, useState } from "react"
import { displayMode } from "../utils/variables"
import { addEventListener } from "../utils/utils"
import { useObserver } from '../utils/Observer';
import SavesLayout from "../components/SavesLayout";


function back() {
  displayMode.save = false
  displayMode.load = false
}

const SavesLayer = () => {
  const [display, setDisplay] = useState(displayMode.save || displayMode.load)
  const rootRef = useRef<HTMLDivElement>(null)

  function onDisplayChange() {
    const display = displayMode.save || displayMode.load
    setDisplay(display)
    if (!display && rootRef.current?.contains(document.activeElement))
      (document.activeElement as HTMLElement).blur?.();
  }
  useObserver(onDisplayChange, displayMode, "save")
  useObserver(onDisplayChange, displayMode, "load")

  useEffect(() => {
    const handleContextMenu = (_e: MouseEvent) => {
      displayMode.save = false
      displayMode.load = false
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key == "Escape") {
        displayMode.save = false
        displayMode.load = false
      }
    }
    return addEventListener({event: 'keydown', handler: handleKeyDown})
  }, [])
  
  return (
    <div className={`box box-save ${display ? "show" : ""}`} ref={rootRef}>
      <div className="page-content">
        <SavesLayout variant={displayMode.save ? "save" : "load"} back={back} />
      </div>
    </div>
  )
}

export default SavesLayer
