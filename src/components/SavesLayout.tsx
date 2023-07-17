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
      {variant === "save" &&
      <button className="saves-container create" onClick={handleSave}>
        <FaPlusCircle />
      </button>
      }

      {/* TODO map */}
      <div className="saves-container">
        Saved on 2023-07-17 19:48
      </div>
    </div>
  )
}

export default SavesLayout