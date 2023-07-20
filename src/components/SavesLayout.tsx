import { FaPlusCircle } from "react-icons/fa"
import { QUICK_SAVE_ID, SaveState, listSaveStates, loadSaveState, storeLastSaveState } from "../utils/savestates"
//import SaveComponent from "./SaveComponent"
import { useState } from "react"
import { graphicsElement } from "../layers/GraphicsLayer"
import { displayMode } from "../utils/variables"

type Props = {
  variant: "save" | "load"
}

function saveElement(id: string|number, saveState: SaveState,
                     props: {[key:string]:any}) {
  const date = new Date(saveState.date as number)
  return (
    <button className="save-container" key={id} quick-save={id==QUICK_SAVE_ID}
            {...props}>
      {graphicsElement("bg", saveState.context.graphics.bg)}
      <div className="deta">
        <div className="date">
          <b>{date.toLocaleDateString()}</b> {date.toLocaleTimeString()}
        </div>
        <div className="line">
          {saveState.text ?? ""}
        </div>
      </div>
    </button>
  )
}

const SavesLayout = ({variant}: Props) => {
  const [saves, setSaves] = useState<Array<[number,SaveState]>>(listSaveStates())
  const [focusedSave, setFocusedSave] = useState<SaveState|null>(null)

  console.log(saves)

  const createSave = () => {
    storeLastSaveState(new Date().getTime())
    setSaves(listSaveStates())
  }

  const handleAction = (id:number) => {
    if (variant === "save") {
      if (confirm("Are you sure you want to overwrite this save?")) {
        storeLastSaveState(id)
      }
    }

    if (variant === "load") {
      loadSaveState(id)
      displayMode.save = false
      displayMode.load = false
    }
  }

  return (
    <div id="saves-layout">
      <div className="saves">
        {variant === "save" &&
        <button className="save-container create" onClick={createSave}>
          <FaPlusCircle />
        </button>
        }

        {saves.map(([id, ss]) => saveElement(id, ss, {
          onMouseEnter: setFocusedSave.bind(null, ss),
          onClick: handleAction.bind(null, id)}
        ))}
      </div>

      <div className="info">
        {graphicsElement("bg", focusedSave?.context.graphics.bg ?? "notreg")}

        Affinités<br />
        <button className="affinity">Export save</button>
      </div>
    </div>
  )
}

export default SavesLayout
