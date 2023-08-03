import { FaDownload, FaPlusCircle, FaTrash } from "react-icons/fa"
import { QUICK_SAVE_ID, SaveState, deleteSaveState, exportSaveFile, getSaveState, listSaveStates, loadSaveFile as loadSaveFiles, loadSaveState, storeLastSaveState } from "../utils/savestates"
import { useEffect, useState } from "react"
import { graphicElements } from "../layers/GraphicsLayer"
import { SCREEN, displayMode } from "../utils/variables"
import { convertText, parseBBcode } from "../utils/utils"
import { useNavigate } from "react-router-dom"
import { SCENE_ATTRS } from "../utils/constants"
import { LabelName, SceneName } from "../types"
import { getSceneTitle } from "../utils/scriptUtils"

function saveElement(id: number, saveState: SaveState, onAction: (a:'select'|'delete')=>void,
                     props: Record<string, any>) {
  const date = new Date(saveState.date as number)
  return (
    <div className="save-container" key={id} {...(id==QUICK_SAVE_ID ? {'quick-save':''} : {})}
            onClick={onAction.bind(null, 'select')} {...props}>
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
    return getSceneTitle(context.label as SceneName) ?? ""
  }
  return SCENE_ATTRS.routes[phase.route][phase.routeDay]
}

function phaseDay(saveState: SaveState) {
  return SCENE_ATTRS.days[saveState.context.phase.day]
}

type Props = {
  variant: "save" | "load"
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
      exportSaveFile({ omitSettings: true})
    else
      exportSaveFile({ omitSettings: true, saveStateFilter: ids})
  }

  const handleAction = (id: number, action: 'select'|'delete') => {
    if (action == 'delete') {
      if (confirm("Are you sure you want to delete this save ?")) {
        deleteSaveState(id)
      }
    }
    else if (variant == "save") {
      if (confirm("Are you sure you want to overwrite this save?")) {
        storeLastSaveState(id)
        updateSavesList()
      }
    } else {
      loadSaveState(id)
      if (displayMode.screen != SCREEN.WINDOW)
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

        {saves.map(([id, ss]) => saveElement(id, ss, handleAction.bind(null, id), {
          onMouseEnter: setFocusedSave.bind(null, id)}
        ))}
      </div>

      <div className="info">
        <div className="graphics">
          {graphicElements(focusedSave?.context.graphics??{bg:"notreg"})}
        </div>
        {focusedId != undefined &&
          <div className="deta">
            <div>{parseBBcode(phaseTitle(focusedSave as SaveState))}</div>
            <div>{parseBBcode(phaseDay(focusedSave as SaveState))}</div>

            <div className="actions">
              <button onClick={handleAction.bind(null, focusedId, 'delete')}>
                <FaTrash />
              </button>
              <button onClick={()=>exportSaves(focusedId)}>
                <FaDownload />
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  )
}

export default SavesLayout
