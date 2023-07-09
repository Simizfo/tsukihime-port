import { useEffect, useState, Fragment, memo } from "react"
import moonIcon from '../assets/icons/icon_moon.svg'
import pageIcon from '../assets/icons/icon_bars.svg'
import Timer from "../utils/timer"
import { TEXT_SPEED } from "../utils/constants"
import { convertText } from "../utils/utils"
import { displayMode, settings } from "../utils/variables"
import { observe, unobserve } from "../utils/Observer"

const icons: {[key: string]: string} = {
  "moon": moonIcon,
  "page": pageIcon
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

type Props = {
  text: string, // text to display
  immediate: boolean, // immediately display the full text
  onFinish: VoidFunction, // function to call when reaching '@', '\' or '\n'
  [key: string] : any // other properties to apply to the root 'div' element of the component
}

const TextLayer = memo(({ text, immediate = false, onFinish, ...props }: Props) => {

  const [ previousLines, setPreviousLines ] = useState<string[]>([]) // lines to display entirely
  const [ lastLine, setLastLine ] = useState<string>("") // line to display gradually
  const [ cursor, setCursor ] = useState<number>(0) // position of the cursor on the last line.
  const [ startIndex, setStartIndex ] = useState<number>(0)
  const [ glyph, setGlyph ] = useState<string>('') // id of the animated glyph to display at end of line

  const [ display, setDisplay ] = useState<boolean>(displayMode.text)

  useEffect(()=> {
    observe(displayMode, 'text', setDisplay)
    return ()=> {
      unobserve(displayMode, 'text', setDisplay)
    }
  }, [])

  useEffect(()=> {
    const index = text.lastIndexOf('\n', text.length-2)
    let lines
    if (index == -1)
      lines = [text]
    else
      lines = [...text.substring(0, index).split('\n'), text.substring(index+1)]
    setLastLine(lines.pop()??"")
    if (lines.length != previousLines.length) {
      setStartIndex(0)
    } else {
      setStartIndex(cursor)
    }
    setPreviousLines(lines)
  }, [text])

  useEffect(()=> {
    if (lastLine.length > 0) {
      const textSpeed = settings.textSpeed
      if (immediate || textSpeed == TEXT_SPEED.instant || startIndex >= lastLine.length) {
        setCursor(lastLine.length)
        onFinish()
      } else {
        let index = startIndex
        // gradually display next characters
        const timer = new Timer(textSpeed, ()=> {
          index++
          while (lastLine.charAt(index+1) == '-')
            index++
          setCursor(index)
          if (index >= lastLine.length) {
            timer.cancel()
            onFinish()
          }
        }, true)
        timer.start()
        setCursor(index)
        return timer.cancel.bind(timer)
      }
    } else if (previousLines.length > 0) {
      onFinish()
    }
  }, [previousLines, lastLine, startIndex, immediate])

  useEffect(()=> {
    //if last character is '@' or '\', display the appropriate image
    if (cursor >= lastLine.length) {
      switch(lastLine.charAt(lastLine.length-1))
      {
        case '@' : setGlyph('moon'); break
        case '\\' : setGlyph('page'); break
        default : setGlyph(''); break
      }
    } else {
      setGlyph('')
    }
  }, [cursor])

  const {className, ...remaining_props} = props

  return (
    <div className={`box box-text ${!display ? "hide ":""}${className||''}`} {...remaining_props}>
      <div className="text-container">
        {previousLines.map((line, i)=>
          <Fragment key={i}>
            {i > 0 && <br/>}
            {convertText(line)}
          </Fragment>)}
        {previousLines.length > 0 && lastLine.length > 0 && <br/>}
        <span>
          {convertText(lastLine.substring(0, cursor).replace('\n', ''))}
          {glyph.length > 0 &&
            <img src={icons[glyph]} alt={glyph} id={glyph} className="cursor" />
          }
        </span>
      </div>
    </div>
  )
})

export default TextLayer
