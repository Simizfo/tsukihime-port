import { useEffect, useState } from "react"
import { SCREEN, displayMode } from "../utils/variables"
import { addEventListener, convertText, parseBBcode } from "../utils/utils"
import { useObserver } from '../utils/Observer';
import { SceneName } from "../types";
import { SCENE_ATTRS } from "../utils/constants";
import { SaveState, QUICK_SAVE_ID, deleteSaveState, exportSaveFile, getSaveState, listSaveStates, loadSaveState, storeLastSaveState } from "../utils/savestates";
import { getSceneTitle } from "../utils/scriptUtils";
import { graphicElements } from "./GraphicsLayer";
import { BsFileEarmarkArrowUp } from "react-icons/bs";
import { FaPlusCircle, FaTrash, FaDownload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { loadSaveFile } from "../utils/savestates";

//##############################################################################
//#                               TOOL FUNCTIONS                               #
//##############################################################################

// sort savestates quick save first, then from most recent to oldest
function compareSaveStates([id1, ss1]: [number, SaveState], [id2, ss2]: [number, SaveState]) {
  return id1 == QUICK_SAVE_ID ? -1
      : id2 == QUICK_SAVE_ID ? 1
      : (ss2.date ?? 0) - (ss1.date ?? 0)
}

function phaseTitle(saveState: SaveState) {
  const context = saveState.context
  const phase = context.phase
  if (phase.route == "" || phase.routeDay == "") {
    return parseBBcode(getSceneTitle(context.label as SceneName) ?? "")
  }
  return parseBBcode(SCENE_ATTRS.routes[phase.route][phase.routeDay])
}

function phaseDay(saveState: SaveState) {
  return parseBBcode(SCENE_ATTRS.days[saveState.context.phase.day])
}

function deleteSave(id: number) {
  if (confirm("Are you sure you want to delete this save ?")) {
    deleteSaveState(id)
  }
}

function exportSaves(...ids: number[]) {
  if (ids.length == 0)
    exportSaveFile({ omitSettings: true})
  else
    exportSaveFile({ omitSettings: true, saveStateFilter: ids})
}

function hideSavesLayer() {
  displayMode.save = false
  displayMode.load = false
}

//##############################################################################
//#                               SUB COMPONENTS                               #
//##############################################################################

type SaveListItemProps = {
  id: number, saveState: SaveState, onSelect: (id: number)=>void,
  [key: string]: any
}
const SaveListItem = ({id, saveState, onSelect, ...props}: SaveListItemProps)=> {
  const date = new Date(saveState.date as number)
  return (
    <div className="save-container" key={id}
        onClick={onSelect.bind(null, id)}
        {...(id==QUICK_SAVE_ID ? {'quick-save':''} : {})}
        {...props}>
      <div className="graphics">
        {graphicElements(saveState.context.graphics)}
      </div>
      <div className="deta">
        <div className="date">
          <b>{date.toLocaleDateString()}</b> {date.toLocaleTimeString()}
        </div>
        <div className="line">
          {convertText(saveState.text ?? "")}
        </div>
      </div>
    </div>
  )
}
type SaveDetailsProps = {
  id?: number, saveState?: SaveState, deleteSave: (id: number)=>void,
  [key:string]: any
}
const SaveDetails = ({id, saveState, deleteSave, ...props}: SaveDetailsProps)=> {
  return (
    <div className="info" {...props}>
      <div className="graphics">
        {graphicElements(saveState?.context.graphics??{bg:"notreg"})}
      </div>
      {id != undefined &&
        <div className="deta">
          <div>{phaseTitle(saveState as SaveState)}</div>
          <div>{phaseDay(saveState as SaveState)}</div>

          <div className="actions">
            <button onClick={deleteSave.bind(null, id)}>
              <FaTrash />
            </button>
            <button onClick={()=>exportSaves(id)}>
              <FaDownload />
            </button>
          </div>
        </div>
      }
    </div>
  )
}

//##############################################################################
//#                               MAIN COMPONENT                               #
//##############################################################################

const SavesLayer = () => {
  const navigate = useNavigate()
  const [display, setDisplay] = useState(displayMode.save || displayMode.load)
  const [saveVariant, setSaveVariant] = useState<boolean>(displayMode.save)
  const [saves, setSaves] = useState<Array<[number,SaveState]>>([])
  const [focusedId, setFocusedSave] = useState<number>()

  function onDisplayChange() {
    setDisplay(displayMode.save || displayMode.load)
    setSaveVariant(displayMode.save)
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
    loadSaveFile(undefined, { ignoreSettings: true })
      .then(updateSavesList)
  }

  function onSaveSelect(id: number) {
    if (saveVariant) {
      if (confirm("Are you sure you want to overwrite this save?")) {
        storeLastSaveState(id)
        updateSavesList()
      }
    } else {
      loadSaveState(id)
      if (displayMode.screen != SCREEN.WINDOW)
        navigate(SCREEN.WINDOW)
      hideSavesLayer()
    }
  }

  const focusedSave = focusedId != undefined ? getSaveState(focusedId) : undefined
  const title = saveVariant ? "Save" : "Load"
  return (
    <div className={`box box-save ${display ? "show" : ""}`}>
      <div className="page-content">
        <div id="saves-layout">
          <h2 className="page-title">{title}</h2>
          <div className="saves">
            {saveVariant ? <>
              <button className="save-container create" onClick={createSave}>
                <FaPlusCircle />
              </button>
            </> : <>
              <label htmlFor="import" className="save-container import">
                <BsFileEarmarkArrowUp />
              </label>
              <input type="file" id="import" onChange={importSaves}
                accept=".thsave" style={{display: "none"}}/>
            </>}

            {saves.map(([id, ss]) => <SaveListItem id={id}
                saveState={ss} onSelect={onSaveSelect}
                onMouseEnter={setFocusedSave.bind(null, id)}/>
            )}
          </div>

          <SaveDetails id={focusedId} saveState={focusedSave} deleteSave={deleteSave}/>
          <div className="save-buttons">
            <button className="menu-btn back-button" onClick={hideSavesLayer}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SavesLayer
