import { useEffect, useRef, useState } from "react"
import { displayMode } from "../utils/display"
import { addEventListener } from "../utils/utils"
import { useObserved, useObserver } from '../utils/Observer';
import ConfigLayout from "../components/ConfigLayout";


function back() {
  displayMode.config = false
}

const ConfigLayer = () => {
  const [display, setDisplay] = useObserved(displayMode, 'config')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleContextMenu = (_e: MouseEvent) => {
      displayMode.config = false
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key == "Escape") {
        displayMode.config = false
      }
    }
    return addEventListener({event: 'keydown', handler: handleKeyDown})
  }, [])
  
  return (
    <div className={`box box-save ${display ? "show" : ""}`} ref={rootRef}>
      <div className="page-content">
        <ConfigLayout back={back} />
      </div>
    </div>
  )
}

export default ConfigLayer
