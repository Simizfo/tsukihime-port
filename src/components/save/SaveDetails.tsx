import { Tooltip } from "react-tooltip"
import { SaveState, exportSave } from "../../utils/savestates"
import { graphicElements } from "../GraphicsComponent"
import { phaseDay, phaseTitle } from "../SavesLayout"
import { settings } from "../../utils/variables"
import { BsDownload, BsTrash } from "react-icons/bs"

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
            <button onClick={() => exportSave([id])}
              data-tooltip-id="tooltip" data-tooltip-content="Download">
              <BsDownload />
            </button>
          </div>
        </div>
      }
    </div>
  )
}

export default SaveDetails