import { FaPlusCircle } from "react-icons/fa"
import { QUICK_SAVE_ID, SaveState, exportSaveFile, getSaveState, listSaveStates, loadSaveFile as loadSaveFiles, loadSaveState, storeLastSaveState } from "../utils/savestates"
import { useEffect, useState } from "react"
import { graphicsElement } from "../layers/GraphicsLayer"
import { SCREEN, displayMode } from "../utils/variables"
import { convertText } from "../utils/utils"
import { useNavigate } from "react-router-dom"

type Props = {
  variant: "save" | "load"
}

function saveElement(id: string|number, saveState: SaveState,
                     props: {[key:string]:any}) {
  const date = new Date(saveState.date as number)
  return (
    <button className="save-container" key={id} {...(id==QUICK_SAVE_ID ? {'quick-save':''} : {})}
            {...props}>
      <div className="graphics">{
        Object.entries(saveState.context.graphics).map(([pos, image])=>
          image && graphicsElement(pos as any, image, {key: pos}))
      }</div>
      <div className="deta">
        <div className="date">
          <b>{date.toLocaleDateString()}</b> {date.toLocaleTimeString()}
        </div>
        <div className="line">
          {convertText(saveState.text ?? "")}
        </div>
      </div>
    </button>
  )
}

// sort savestates quick save first, then from most recent to oldest
function compareSaveStates([id1, ss1]: [number, SaveState], [id2, ss2]: [number, SaveState]) {
  return id1 == QUICK_SAVE_ID ? -1
      : id2 == QUICK_SAVE_ID ? 1
      : (ss2.date ?? 0) - (ss1.date ?? 0)
}

const SavesLayout = ({variant}: Props) => {

  const navigate = useNavigate()
  const [saves, setSaves] = useState<Array<[number,SaveState]>>([])
  const [focusedId, setFocusedSave] = useState<number>()

  function updateSavesList() {
    setSaves(listSaveStates().sort(compareSaveStates))
  }
  useEffect(()=> {
    updateSavesList()
  }, [])

  function createSave() {
    storeLastSaveState(new Date().getTime())
    updateSavesList()
  }

  function importSaves() {
    loadSaveFiles(undefined, { ignoreSettings: false })
      .then(updateSavesList)
  }

  function exportSaves(...ids: number[]) {
    if (ids.length == 0)
      exportSaveFile({ omitSettings: false})
    else
      exportSaveFile({ omitSettings: false, saveStateFilter: ids})
  }

  const handleAction = (id:number) => {
    if (variant === "save") {
      if (confirm("Are you sure you want to overwrite this save?")) {
        storeLastSaveState(id)
      }
    }

    if (variant === "load") {
      loadSaveState(id)
      if (displayMode.screen != SCREEN.WINDOW)
        //TODO avoid going back to default scene in Window.tsx
        navigate(SCREEN.WINDOW)
      
      displayMode.save = false
      displayMode.load = false
    }
  }
  const focusedSave = focusedId != undefined ? getSaveState(focusedId) : undefined

  return (
    <div id="saves-layout">
      <div className="saves">
        {variant === "save" &&
        <button className="save-container create" onClick={createSave}>
          <FaPlusCircle />
        </button>
        }

        {saves.map(([id, ss]) => saveElement(id, ss, {
          onMouseEnter: setFocusedSave.bind(null, id),
          onClick: handleAction.bind(null, id)}
        ))}
      </div>

      <div className="info">
        <div className="graphics">
          {Object.entries(focusedSave?.context.graphics??{bg:"notreg"}).map(([pos, image])=>
            image && graphicsElement(pos as any, image, {key: pos}))
          }
        </div>
        {focusedId != undefined &&
          <div className="deta">
            <button className="export" onClick={()=>exportSaves(focusedId)}>Export save</button>
          </div>
        }
      </div>
    </div>
  )
}

export default SavesLayout
