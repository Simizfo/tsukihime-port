import LineComponent from "../components/LineComponent"
import { Line } from "../types"

type Props = {
  text: Line[],
  handleClick: () => void,
  displayText: boolean,
}

const TextLayer = ({ text, handleClick, displayText }: Props) => {

  return (
    <div className={`box-text ${displayText ? "" : "hide"}`} onClick={handleClick}>
      <div className="text-container">
        {text.map((line, i) =>
          <LineComponent key={i} line={line} isLastLine={text.length - 1 === i} />
        )}
      </div>
    </div>
  )
}

export default TextLayer