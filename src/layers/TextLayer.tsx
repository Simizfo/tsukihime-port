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

  const [ previousText, setPreviousText ] = useState<string[]>([]) // lines to display entirely
  const [ newText, setNewText ] = useState<string>("") // line to display gradually
  const [ cursor, setCursor ] = useState<number>(0) // position of the cursor on the last line.
  const [ glyph, setGlyph ] = useState<string>('') // id of the animated glyph to display at end of line

  const [ display, setDisplay ] = useState<boolean>(displayMode.text)

  useEffect(()=> {
    observe(displayMode, 'text', setDisplay)
    return ()=> {
      unobserve(displayMode, 'text', setDisplay)
    }
  }, [])

  useEffect(()=> {
    const previous = previousText.join('\n') + newText
    if (text.startsWith(previous)) {
      setPreviousText((previous).split('\n'))
      setNewText(text.substring(previous.length))
    } else {
      setPreviousText([])
      setNewText(text)
    }
    setCursor(0)
  }, [text])

  useEffect(()=> {
    if (newText.length > 0) {
      const textSpeed = settings.textSpeed
      if (immediate || textSpeed == TEXT_SPEED.instant) {
        setCursor(newText.length)
        onFinish()
      } else {
        let index = 0
        // gradually display next characters
        const timer = new Timer(textSpeed, ()=> {
          index++
          while (newText.charAt(index+1) == '-')
            index++
          setCursor(index)
          if (index >= newText.length) {
            timer.cancel()
            onFinish()
          }
        }, true)
        timer.start()
        setCursor(index)
        return timer.cancel.bind(timer)
      }
    } else if (previousText.length > 0) {
      onFinish()
    }
  }, [previousText, newText, immediate])

  useEffect(()=> {
    //if last character is '@' or '\', display the appropriate image
    if (cursor >= newText.length) {
      switch(newText.charAt(newText.length-1))
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
        {previousText.map((line, i)=>
          <Fragment key={i}>
            {i > 0 && <br/>}
            {convertText(line)}
          </Fragment>)}
        <span>
          {convertText(newText.substring(0, cursor))}
          {glyph.length > 0 &&
            <img src={icons[glyph]} alt={glyph} id={glyph} className="cursor" />
          }
        </span>
      </div>
    </div>
  )
})

export default TextLayer
