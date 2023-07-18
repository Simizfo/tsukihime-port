import { FaPlusCircle } from "react-icons/fa"

type Props = {
  variant: "save" | "load"
}

const SavesLayout = ({variant}: Props) => {
  const handleSave = () => {
    console.log("save")
  }

  return (
    <div id="saves-layout">
      <div className="saves">
        {variant === "save" &&
        <button className="save-container create" onClick={handleSave}>
          <FaPlusCircle />
        </button>
        }

        {/* TODO map */}
        <button className="save-container">
          <img src="./image_x2/event/his_e02b.webp" />
          <div>
            <div className="date">
              <b>2023/07/17</b> 19:48
            </div>
            <div className="line">
              test test test test test test test test test test test test test test test test test test test test test test test test test test test test test 
            </div>
          </div>
        </button>
      </div>

      <div className="deta">
        <img src="./image_x2/event/his_e02b.webp" />

        Affinités<br />
        <button className="affinity">Export save</button>
      </div>
    </div>
  )
}

export default SavesLayout