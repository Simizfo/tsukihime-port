import { ChangeEvent, useEffect, useState } from "react"
import { SCREEN, displayMode } from "../utils/display"
import { addEventListener, convertText, parseBBcode } from "../utils/utils"
import { SceneName } from "../types";
import { SAVE_EXT, SCENE_ATTRS } from "../utils/constants";
import { SaveState, QUICK_SAVE_ID, deleteSaveState, getSaveState, listSaveStates, loadSaveState, storeCurrentState, addSavesChangeListener, removeSavesChangeListener, exportSave, loadSaveFiles } from "../utils/savestates";
import { getSceneTitle } from "../utils/scriptUtils";
import { BsFileEarmarkArrowUp } from "react-icons/bs";
import { FaPlusCircle, FaTrash, FaDownload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { graphicElements } from "../layers/GraphicsLayer";

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
    <button className="save-container"
        onClick={onSelect.bind(null, id)}
        {...(id==QUICK_SAVE_ID ? {'quick-save':''} : {})}
        {...props}>
      <div className="graphics">
        {graphicElements(saveState.graphics ?? saveState.context.graphics, {}, true)}
      </div>
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
type SaveDetailsProps = {
  id?: number, saveState?: SaveState, deleteSave: (id: number)=>void,
  [key:string]: any
}
const SaveDetails = ({id, saveState, deleteSave, ...props}: SaveDetailsProps)=> {
  return (
    <div className="info" {...props}>
      <div className="graphics">
        {graphicElements(saveState?.graphics ?? saveState?.context.graphics ?? {bg:"notreg"}, {}, true)}
      </div>
      {id != undefined && saveState != undefined &&
        <div className="deta">
          <div>{phaseTitle(saveState)}</div>
          <div>{phaseDay(saveState)}</div>

          <div className="actions">
            <button onClick={deleteSave.bind(null, id)}>
              <FaTrash />
            </button>
            <button onClick={()=>exportSave([id])}>
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
type Props = {
  variant: "save"|"load",
  back: (saveLoaded:boolean)=>void,
}
const SavesLayer = ({variant, back}: Props) => {
  const navigate = useNavigate()
  const [saves, setSaves] = useState<Array<[number,SaveState]>>([])
  const [focusedId, setFocusedSave] = useState<number>()

  useEffect(()=> {
    const onChange = ()=> {
      setSaves(listSaveStates().sort(compareSaveStates))
    }
    addSavesChangeListener(onChange)
    onChange()
    return removeSavesChangeListener.bind(null, onChange) as VoidFunction
  }, [])

  function createSave() {
    storeCurrentState(new Date().getTime())
  }

  function importSaves(event: ChangeEvent) {
    console.log("import saves from file")
    loadSaveFiles((event.target as HTMLInputElement)?.files)
  }

  function onSaveSelect(id: number) {
    if (variant == "save") {
      if (confirm("Are you sure you want to overwrite this save?")) {
        /*
        storeCurrentState(id)
        /*/
        deleteSaveState(id)
        storeCurrentState(new Date().getTime())
        //*/
      }
    } else {
      loadSaveState(id)
      if (displayMode.screen != SCREEN.WINDOW)
        navigate(SCREEN.WINDOW)
      back(true)
    }
  }

  function deleteSave(id: number) {
    if (confirm("Are you sure you want to delete this save ?")) {
      deleteSaveState(id)
      if (id == focusedId)
        setFocusedSave(undefined)
    }
  }

  const focusedSave = focusedId != undefined ? getSaveState(focusedId) : undefined
  const title = variant == "save" ? "Save" : "Load"
  return (
    <div id="saves-layout">
      <h2 className="page-title">{title}</h2>
      <div className="saves">
        {variant === "save" ?
          <button className="save-container create" onClick={createSave}>
            <FaPlusCircle />
          </button>
        : <>
          <label htmlFor="import" className="save-container import" tabIndex={0}>
            <BsFileEarmarkArrowUp />
          </label>
          <input type="file" id="import" onChange={importSaves}
            accept={`.${SAVE_EXT}`} style={{display: "none"}}/>
        </>}

        {saves.filter(([id, _])=> variant === "load" || id !== QUICK_SAVE_ID)
          .map(([id, ss]) =>
          <SaveListItem key={id} id={id}
            saveState={ss} onSelect={onSaveSelect}
            onMouseEnter={setFocusedSave.bind(null, id)}/>
        )}
      </div>

      <SaveDetails id={focusedId} saveState={focusedSave} deleteSave={deleteSave}/>
      <div className="save-buttons">
        <button className="menu-btn back-button" onClick={back.bind(null, false)}>
          Back
        </button>
      </div>
    </div>
  )
}

export default SavesLayer
