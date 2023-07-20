import { useEffect, useState } from "react"
import SavesLayout from "../components/SavesLayout"
import { displayMode } from "../utils/variables"
import { addEventListener } from "../utils/utils"
import { observe, unobserve } from '../utils/Observer';

const SavesLayer = () => {
  const [displaySave, setDisplaySave] = useState<boolean>(displayMode.save)
  const [displayLoad, setDisplayLoad] = useState<boolean>(displayMode.load)
  const [title, setTitle] = useState<string>(displaySave ? "Save" : "Load")

  useEffect(() => {
    displayMode.save = displaySave
    if (displaySave) setTitle("Save")
  }, [displaySave])

  useEffect(() => {
    displayMode.load = displayLoad
    if (displayLoad) setTitle("Load")
  }, [displayLoad])

  useEffect(()=> {
    observe(displayMode, 'save', setDisplaySave)
    observe(displayMode, 'load', setDisplayLoad)
    return ()=> {
      unobserve(displayMode, 'save', setDisplaySave)
      unobserve(displayMode, 'load', setDisplayLoad)
    }
  }, [])

  useEffect(() => {
    const handleContextMenu = (_e: MouseEvent) => {
      if (displaySave) setDisplaySave(false)
      if (displayLoad) setDisplayLoad(false)
    }
    return addEventListener({event: 'contextmenu', handler: handleContextMenu})
  })

  return (
    <div className={`box box-save ${displaySave || displayLoad ? "show" : ""}`}>
      <div className="page-content">
        <h2 className="page-title">{title}</h2>
        {displaySave &&
        <SavesLayout variant={"save"} />
        }

        {displayLoad &&
        <SavesLayout variant={"load"} />
        }

        <button className="menu-btn back-button" onClick={() => {
          setDisplaySave(false)
          setDisplayLoad(false)
        }}>
          Back
        </button>
      </div>
    </div>
  )
}

export default SavesLayer
