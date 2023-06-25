import { Line } from "../types"
import moonIcon from '../assets/icons/icon_moon.svg'
import pageIcon from '../assets/icons/icon_bars.svg'
import { useEffect, useState, useContext } from "react"
import { store } from "../context/GameContext"
import { TEXT_SPEED } from "../utils/constants"

type Props = {
  line: Line,
  printInstantly: boolean,
  isLastLine?: boolean,
}

const LineComponent = ({ line, printInstantly, isLastLine }: Props) => {
  const { state } = useContext(store)
  const [displayedLine, setDisplayedLine] = useState('')

  useEffect(() => {
    if (printInstantly || state.permanent.textSpeed === TEXT_SPEED.instant) {
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
      }, state.permanent.textSpeed)

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