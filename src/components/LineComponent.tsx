import { Line } from "../types"
import moonIcon from '../assets/icons/icon_moon.svg'
import pageIcon from '../assets/icons/icon_bars.svg'
import { useEffect, useState } from "react"

type Props = {
  line: Line,
  printInstantly: boolean,
  isLastLine?: boolean,
}

const LETTER_DELAY = 20

const LineComponent = ({ line, printInstantly, isLastLine }: Props) => {
  const [displayedLine, setDisplayedLine] = useState('')

  useEffect(() => {
    if (printInstantly) {
      setDisplayedLine(line.line)
      return
    } else {
      let currentIndex = 0
      const interval = setInterval(() => {
        setDisplayedLine(line.line.slice(0, currentIndex));
        currentIndex++
        if (currentIndex > line.line.length) {
          clearInterval(interval)
        }
      }, LETTER_DELAY)

      return () => clearInterval(interval)
    }
  }, [line, printInstantly])

  const isLastLineOfPage = line.line.endsWith('\\');

  const lineDisplay = (line: string) => {
    if (line === 'br') {
      return <br />
    } else {
      let cursor: JSX.Element | null = null
      if (isLastLine && !isLastLineOfPage) {
        cursor = <img src={moonIcon} alt="moon" id="moon" className="cursor" />
      } else if (isLastLine && isLastLineOfPage) {
        cursor = <img src={pageIcon} alt="page" id="page" className="cursor" />
      }
      return (
        <span>
          {displayedLine.replace(/`/g, '').replace(/\\/g, '')}
          {displayedLine.length === line.length && cursor}
        </span>
      );
    }
  };

  return (
    <>
      {lineDisplay(line.line)}
      {line.lineHasEnded && <br />}
    </>
  )
}

export default LineComponent;