import LineComponent from "../components/LineComponent"
import { Line } from "../types"

type Props = {
  text: Line[],
  handleClick: () => void
}

const TextLayer = ({ text, handleClick }: Props) => {
  return (
    <div className="box-text" onClick={handleClick}>
      <div className="text-container">
        {text.map((line, i) =>
          <LineComponent key={i} line={line} isLastLine={text.length - 1 === i} />
        )}
      </div>
    </div>
  )
}

export default TextLayer