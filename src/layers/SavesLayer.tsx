import { useEffect, useState } from "react"
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

  function onDisplayChange() {
    setDisplay(displayMode.save || displayMode.load)
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

  return (
    <div className={`box box-save ${display ? "show" : ""}`}>
      <div className="page-content">
        <SavesLayout variant={displayMode.save ? "save" : "load"} back={back} />
      </div>
    </div>
  )
}

export default SavesLayer
