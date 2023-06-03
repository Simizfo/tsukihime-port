import { Line } from "../types"
import moonIcon from '../assets/icons/icon_moon.svg'
import pageIcon from '../assets/icons/icon_bars.svg'

type Props = {
  line: Line,
  isLastLine?: boolean,
}

const LineComponent = ({ line, isLastLine }: Props) => {
  const isLastLineOfPage = line.line.endsWith('\\')

  const lineDisplay = (line: string) => {
    if (line === 'br') {
      return <br />
    } else {
      let cursor:JSX.Element | null = null
      if (isLastLine && !isLastLineOfPage) {
        cursor = <img src={moonIcon} alt="moon" id="moon" className="cursor" />
      } else if (isLastLine && isLastLineOfPage) {
        cursor = <img src={pageIcon} alt="page" id="page" className="cursor" />
      }
      return (
        <span>
          {line.replace(/`/g, '').replace(/\\/g, '')}
          {cursor}
        </span>
      )
    }
  }

  return (
    <>
    {lineDisplay(line.line)}
    {line.lineHasEnded && <br />}
    </>
  );
}

export default LineComponent;