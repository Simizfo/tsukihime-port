import { useEffect, useState } from "react"
import SavesLayout from "../components/SavesLayout"
import { displayMode } from "../utils/variables"
import { addEventListener } from "../utils/utils"
import { observe, unobserve } from '../utils/Observer';

const SavesLayer = () => {
  const [displaySave, setDisplaySave] = useState<boolean>(displayMode.save)
  const [displayLoad, setDisplayLoad] = useState<boolean>(displayMode.load)

  useEffect(() => {
    displayMode.save = displaySave
  }, [displaySave])

  useEffect(() => {
    displayMode.load = displayLoad
  }, [displayLoad])

  useEffect(()=> {
    observe(displayMode, 'save', setDisplaySave)
    return ()=> {
      unobserve(displayMode, 'save', setDisplaySave)
    }
  }, [])

  useEffect(()=> {
    observe(displayMode, 'load', setDisplayLoad)
    return ()=> {
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