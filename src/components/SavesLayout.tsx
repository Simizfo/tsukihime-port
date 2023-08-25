import { ChangeEvent, MouseEvent, Fragment, memo, useEffect, useState } from "react"
import { SCREEN, displayMode } from "../utils/display"
import { bb, wbb } from "../utils/utils"
import { PageContent, SceneName } from "../types"
import { SAVE_EXT } from "../utils/constants"
import { SaveState, QUICK_SAVE_ID, deleteSaveState, getSaveState, listSaveStates, loadSaveState, storeCurrentState, addSavesChangeListener, removeSavesChangeListener, exportSave, loadSaveFiles } from "../utils/savestates"
import { getSceneTitle } from "../utils/scriptUtils"
import { BsDownload, BsFileEarmarkArrowUp, BsPlusCircle, BsTrash } from "react-icons/bs"
import { useNavigate } from "react-router-dom"
import strings from "../utils/lang"
import { Tooltip } from 'react-tooltip'
import { settings } from "../utils/variables"
import { graphicElements } from "./GraphicsComponent"

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
  if (!phase || !phase.route || !phase.routeDay) {
    return bb(getSceneTitle(context.label as SceneName) ?? "")
  }
  return wbb(strings.scenario.routes[phase.route][phase.routeDay])
}

function phaseDay(saveState: SaveState) {
  const day = saveState.context.phase?.day
  return day ? wbb(strings.scenario.days[day-1]) : ""
}

//##############################################################################
//#                               SUB COMPONENTS                               #
//##############################################################################

const SaveSummary = memo(({saveState}: {saveState: SaveState})=> {
  const page = saveState.page
  switch (page?.contentType) {
    case "text" :
      return <>{(page as PageContent<"text">).text.trim()}</>
    case "choice" :
      const {choices, selected: sel} = (page as PageContent<"choice">)
      return <>{choices.map(({index: i, str})=>
        <Fragment key={i}>{i > 0 && <>, </>}
          <span className={`choice ${sel == i ? "selected" : ""}`} key={i}>
            {str}
          </span>
        </Fragment>
      )}</>
    case "skip" :
      return <span className="scene-skip">
        {getSceneTitle((page as PageContent<"skip">).scene)}
      </span>
    case "phase" :
      const day = phaseDay(saveState)
      return <>
        {phaseTitle(saveState)}
        {day && <>, {day}</>}
      </>
    default :
      throw Error(`unimplemented page type`)
  }
})

type SaveListItemProps = {
  id: number,
  saveState: SaveState,
  onSelect: (id: number)=>void,
  focusedSave?: number,
  [key: string]: any
}
const SaveListItem = ({id, saveState, onSelect, focusedSave, ...props}: SaveListItemProps)=> {
  const date = new Date(saveState.date as number)
  return (
    <button className={`save-container ${id==focusedSave ? "active" : ""}`}
        onClick={onSelect.bind(null, id)}
        {...(id==QUICK_SAVE_ID ? {'quick-save':''} : {})}
        {...props}>
      <div className={`graphics ${saveState.context.monochrome ? "monochrome" : ""}`}>
        {graphicElements(saveState.graphics ?? saveState.context.graphics ?? {bg: ""}, {}, 'sd')}
      </div>
      <div className="deta">
        <div className="date">
          <b>{date.toLocaleDateString(strings.locale)}</b> {date.toLocaleTimeString(strings.locale)}
        </div>
        <div className="line">
          <SaveSummary saveState={saveState}/>
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
        {graphicElements(saveState?.graphics ?? saveState?.context.graphics ?? {bg:"notreg"}, {}, settings.resolution)}
      </div>
      {id != undefined && saveState != undefined &&
        <div className="deta">
          <div>{phaseTitle(saveState)}</div>
          <div>{phaseDay(saveState)}</div>

          <div className="actions">
            <Tooltip id="tooltip" className="tooltip" delayShow={800} />
            <button onClick={deleteSave.bind(null, id)}
              data-tooltip-id="tooltip" data-tooltip-content="Delete">
              <BsTrash />
            </button>
            <button onClick={()=>exportSave([id])}
              data-tooltip-id="tooltip" data-tooltip-content="Download">
              <BsDownload />
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
      if (displayMode.screen != SCREEN.WINDOW)
        navigate(SCREEN.WINDOW)
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
  console.log(focusedId)
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
            onMouseLeave={setFocusedSave.bind(null, undefined)}
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
            onMouseLeave={setFocusedSave.bind(null, undefined)}
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
