import { useEffect, useState, useContext, Fragment, memo } from "react"
import { store } from "../context/GameContext"
import moonIcon from '../assets/icons/icon_moon.svg'
import pageIcon from '../assets/icons/icon_bars.svg'
import Timer from "../utils/timer"
import { TEXT_SPEED } from "../utils/constants"
import { convertText } from "../utils/utils"

const icons: {[key: string]: string} = {
  "moon": moonIcon,
  "page": pageIcon
}

//##############################################################################
//#                               TOOL FUNCTIONS                               #
//##############################################################################

function nextBreak(text: string, startIndex = 0): number {
  let index = text.indexOf('@', startIndex)
  if (index == -1) {
    index = text.indexOf('\\', startIndex)
    if (index == -1)
      index = text.length
  }
  return index
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

type Props = {
  text: string[], // text lines to display
  skipBreaks?: number, // number of '@' or '\' to skip on the last line. Defaults to 0
  fastforward?: boolean, // immediately display the text up to the next '@' or '\'
  onBreak: (breakChar: string)=>void // function to call when reaching '@', '\' or '\n'
  [key: string] : any // other properties to apply to the root 'div' element of the component
}

const TextLayer = memo(({ text, skipBreaks = 0, fastforward = false, onBreak, ...props }: Props) => {

  const [ previousLines, setPreviousLines ] = useState<string[]>([]) // lines to display entirely
  const [ lastLine, setLastLine ] = useState<string>("") // line to display gradually
  const [ cursor, setCursor ] = useState<number>(0) // position of the cursor on the last line.
  const [ glyph, setGlyph ] = useState<string>('') // id of the animated glyph to display at end of line

  const { state } = useContext(store)

  useEffect(()=> {
    setPreviousLines(text.slice(0, -1))
    setLastLine(text[text.length-1] || "")
  }, [text])

  useEffect(()=> {
    // calculate how many characters to display when the component is updated
    if (lastLine.length != 0) {
      let index = 0
      if (skipBreaks > 0){
        let breaksSkipped = 0
        while (breaksSkipped < skipBreaks && index != -1) {
          index = nextBreak(lastLine, index+1)
          breaksSkipped++
        }
        if (index == -1)
          index = lastLine.length
      }

      const textSpeed = state.permanent.textSpeed

      if (fastforward || textSpeed == TEXT_SPEED.instant) {
        //jump directly to next '@' of '\\'
        index = nextBreak(lastLine, index+1)
        setCursor(index)
        onBreak(lastLine.charAt(index)||'\n')
      } else if (index >= lastLine.length) {
        setCursor(lastLine.length)
        onBreak('\n')
      } else {
        // gradually display next characters
        const timer = new Timer(textSpeed, ()=> {
          index++
          const char = lastLine.charAt(index) || '\n'
          if (['@','\\','\n'].includes(char)) {
            timer.pause()
            onBreak(char)
          }
          else {
            while (lastLine.charAt(index+1) == '-')
              index++
          }
          setCursor(index)
        }, true)
        timer.start()
        setCursor(index)
        return timer.cancel.bind(timer)
      }
    }
  }, [lastLine, skipBreaks, fastforward])

  useEffect(()=> {
    //if last character is '@' or '\', display the appropriate image
    switch(lastLine.charAt(cursor))
    {
      case '@' : setGlyph('moon'); break
      case '\\' : setGlyph('page'); break
      default : setGlyph(''); break
    }
  }, [cursor])

  const {className, ...remaining_props} = props

  return (
    <div className={`box box-text ${className||''}`} {...remaining_props}>
      <div className="text-container">
        {previousLines.map((line, i)=>
          <Fragment key={i}>
            {i > 0 && <br/>}
            {convertText(line)}
          </Fragment>)}
        {previousLines.length > 0 && lastLine.length > 0 && <br/>}
        <span>
          {convertText(lastLine.substring(0, cursor))}
          {glyph.length > 0 &&
            <img src={icons[glyph]} alt={glyph} id={glyph} className="cursor" />
          }
        </span>
      </div>
    </div>
  )
})

export default TextLayer
