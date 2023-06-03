import { Line } from "../types"
import moonIcon from '../assets/icons/icon_moon.svg'

type Props = {
  line: Line,
  isLastLine?: boolean,
}

const LineComponent = ({ line, isLastLine }: Props) => {

  const lineDisplay = (line: string) => {
    if (line === 'br') {
      return <br />
    } else {
      return <span>{line.replace(/`/g, '').replace(/\\/g, '')}</span>
    }
  }

  return (
    <>
    {lineDisplay(line.line)}
    {isLastLine && <img src={moonIcon} alt="moon" id="moon" />}
    {line.lineHasEnded && <br />}
    </>
  );
}

export default LineComponent;