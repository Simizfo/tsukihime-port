import { ChangeEvent, MouseEvent, useEffect, useState } from "react"
import { SCREEN, displayMode } from "../utils/display"
import { bb, noBb } from "../utils/Bbcode"
import { SceneName } from "../types"
import { SAVE_EXT } from "../utils/constants"
import { SaveState, QUICK_SAVE_ID, deleteSaveState, getSaveState, listSaveStates, loadSaveState, storeCurrentState, addSavesChangeListener, removeSavesChangeListener, exportSave, loadSaveFiles } from "../utils/savestates"
import { getSceneTitle } from "../utils/scriptUtils"
import { BsFileEarmarkArrowUp, BsPlusCircle } from "react-icons/bs"
import strings from "../utils/lang"
import SaveListItem from "./save/SaveListItem"
import SaveDetails from "./save/SaveDetails"

//##############################################################################
//#                               TOOL FUNCTIONS                               #
//##############################################################################

// sort savestates quick save first, then from most recent to oldest
function compareSaveStates([id1, ss1]: [number, SaveState], [id2, ss2]: [number, SaveState]) {
  return id1 == QUICK_SAVE_ID ? -1
      : id2 == QUICK_SAVE_ID ? 1
      : (ss2.date ?? 0) - (ss1.date ?? 0)
}

export function phaseTitle(saveState: SaveState) {
  const context = saveState.context
  const phase = context.phase
  if (!phase || !phase.route || !phase.routeDay) {
    return bb(getSceneTitle(context.label as SceneName) ?? "")
  }
  return noBb(strings.scenario.routes[phase.route][phase.routeDay])
}

export function phaseDay(saveState: SaveState) {
  const day = saveState.context.phase?.day
  return day ? noBb(strings.scenario.days[day-1]) : ""
}


//##############################################################################
//#                               MAIN COMPONENT                               #
//##############################################################################

type Props = {
  variant: "save"|"load",
  back: (saveLoaded: boolean)=>void,
}
const SavesLayer = ({variant, back}: Props) => {
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

  function importSaves(event: ChangeEvent|MouseEvent) {
    console.log("import saves from file")
    loadSaveFiles((event.target as HTMLInputElement)?.files, event.type == "contextmenu")
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
      displayMode.screen = SCREEN.WINDOW
      back(true)
    }
  }

  function deleteSave(id: number) {
    if (confirm("Are you sure you want to delete this save?")) {
      deleteSaveState(id)
      if (id == focusedId)
        setFocusedSave(undefined)
    }
  }

  const focusedSave = focusedId != undefined ? getSaveState(focusedId) : undefined
  const title = strings.saves[variant == "save" ? "title-save" : "title-load"]

  return (
    <main id="saves-layout">
      <h2 className="page-title">{title}</h2>
      <div className="saves">
        {variant === "save" ?
          <button
            className={`save-container create ${focusedId === 1 ? "active" : ""}`}
            onClick={createSave}
            onFocus={setFocusedSave.bind(null, 1)}
            onPointerEnter={setFocusedSave.bind(null, 1)}
            onMouseEnter={setFocusedSave.bind(null, 1)}
            onMouseLeave={setFocusedSave.bind(null, undefined)}
          >
            <BsPlusCircle />
          </button>
        : <>
          <label htmlFor="import"
            className={`save-container import ${focusedId === 2 ? "active" : ""}`}
            tabIndex={0}
            onContextMenu={importSaves}
            onFocus={setFocusedSave.bind(null, 2)}
            onPointerEnter={setFocusedSave.bind(null, 2)}
            onMouseEnter={setFocusedSave.bind(null, 2)}
          >
            <BsFileEarmarkArrowUp />
          </label>
          <input type="file" id="import" onChange={importSaves}
            onContextMenu={importSaves}
            accept={`.${SAVE_EXT}`} style={{display: "none"}}/>
        </>}

        {saves.filter(([id, _])=> variant === "load" || id !== QUICK_SAVE_ID)
          .map(([id, ss]) =>
          <SaveListItem key={id} id={id}
            saveState={ss} onSelect={onSaveSelect}
            focusedSave={focusedId}
            onFocus={setFocusedSave.bind(null, id)}
            onPointerEnter={setFocusedSave.bind(null, id)}
            onMouseEnter={setFocusedSave.bind(null, id)}
          />
        )}
      </div>

      <SaveDetails id={focusedId} saveState={focusedSave} deleteSave={deleteSave}/>
      <div className="save-buttons">
        <button className="menu-btn back-button" onClick={back.bind(null, false)}>
          {strings.back}
        </button>
      </div>
    </main>
  )
}

export default SavesLayer
