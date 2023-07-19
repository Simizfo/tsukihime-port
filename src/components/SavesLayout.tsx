import { FaPlusCircle } from "react-icons/fa"
import { listSaveStates, storeLastSaveState } from "../utils/savestates"
import SaveComponent from "./SaveComponent"

type Props = {
  variant: "save" | "load"
}

const SavesLayout = ({variant}: Props) => {
  const saves = listSaveStates()
  console.log(saves)
  const createSave = () => {
    storeLastSaveState(new Date().getTime())
  }

  const handleAction = () => {
    if (variant === "save") {
      if (confirm("Are you sure you want to overwrite this save?")) {
        //TODO overwrite
      }
    }

    if (variant === "load") {
      //TODO load
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

        {/* TODO map */}
        <button className="save-container" onClick={handleAction}>
          <img src="./image/event/his_e02b.jpg" />
          
          <div className="deta">
            <div className="date">
              <b>2023/07/17</b> 19:48
            </div>
            <div className="line">
              test test test test test test test test test test test test test test test test test test test test test test test test test test test test test 
            </div>
          </div>
        </button>

        {Array.from(saves).map(([key, value]) => (
          <SaveComponent key={key} element={value} handleAction={handleAction} />
        ))}
      </div>

      <div className="info">
        <img src="./image_x2/event/his_e02b.webp" />

        Affinités<br />
        <button className="affinity">Export save</button>
      </div>
    </div>
  )
}

export default SavesLayout