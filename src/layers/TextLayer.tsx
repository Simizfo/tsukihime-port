import { useEffect, useState, Fragment, memo } from "react"
import moonIcon from '../assets/icons/icon_moon.svg'
import pageIcon from '../assets/icons/icon_bars.svg'
import Timer from "../utils/timer"
import { TEXT_SPEED } from "../utils/constants"
import { convertText } from "../utils/utils"
import { displayMode, settings } from "../utils/variables"
import { useObserver } from "../utils/Observer"
import script from "../utils/script"

const icons: {[key: string]: string} = {
  "moon": moonIcon,
  "page": pageIcon
}

const scriptInterface: {
  text: string,
  fastForward: boolean,
  onFinish: VoidFunction|undefined
} = {
  text: "",
  fastForward: false,
  onFinish: undefined
}

function appendText(text: string) {
  script.history.top.text += text
  scriptInterface.text = script.history.top.text
}

function onBreakChar(_: string, cmd: string, onFinish: VoidFunction) {
  appendText(cmd)
  let delay = 0
  switch(cmd) {
    case '@' : delay = settings.autoClickDelay; break
    case '\\' : delay = settings.nextPageDelay; break
    default : throw Error(`unknown break char ${cmd}`)
  }
  if (delay > 0) {
    const timer = new Timer(delay, onFinish)
    timer.start()
    return { next: timer.skip.bind(timer) }
  } else {
    return { next: onFinish }
  }
}

export const commands = {
  'br' : appendText.bind(null, "\n"),
  '@'  : onBreakChar,
  '\\' : onBreakChar,
  '`'  : (text:string, _: string, onFinish: VoidFunction)=> {
    appendText(text)
    if (text == '\n') // line breaks are displayed instantly
      return;

    scriptInterface.onFinish = ()=> {
      scriptInterface.onFinish = undefined,
      scriptInterface.fastForward = false
      onFinish()
    }
    return {
      next: () => {
        scriptInterface.fastForward = true;
      }
    }
  }
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

type Props = {
  [key: string] : any // other properties to apply to the root 'div' element of the component
}

const TextLayer = memo(({...props}: Props) => {

  const [ text, setText ] = useState<string>("")
  const [ immediate, setImmediate ] = useState<boolean>(false)
  const [ previousText, setPreviousText ] = useState<string[]>([]) // lines to display entirely
  const [ newText, setNewText ] = useState<string>("") // line to display gradually
  const [ visibleText, setVisibleText ] = useState<string>("") // part of the last line that is displayed
  const [ hiddenText, setHiddenText ] = useState<string>("") // part of the last line not yet displayed
  const [ cursor, setCursor ] = useState<number>(0) // position of the cursor on the last line.
  const [ glyph, setGlyph ] = useState<string>('') // id of the animated glyph to display at end of line

  const [ display, setDisplay ] = useState<boolean>(displayMode.text)

  useObserver(setDisplay, displayMode, 'text')
  useObserver(setText, scriptInterface, 'text')
  useObserver(setImmediate, scriptInterface, 'fastForward')

  useObserver((_opacity: number)=> {
    //TODO
  }, settings, "textPanelOpacity")

  useObserver((_font: string)=> {
    //TODO
  }, settings, "font")

  useEffect(()=> {
    const previous = previousText.join('\n') + newText
    if (previous != text) {
      if (text.startsWith(previous)) {
        setPreviousText((previous).split('\n'))
        setNewText(text.substring(previous.length))
      } else {
        setPreviousText([])
        setNewText(text)
      }
      if (!displayMode.text && text.length > 0)
        displayMode.text = true
      setCursor(0)
    }
  }, [text])

  useEffect(()=> {
    if (newText.length > 0) {
      const textSpeed = settings.textSpeed
      if (immediate || textSpeed == TEXT_SPEED.instant) {
        setCursor(newText.length)
        scriptInterface.onFinish?.()
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
            scriptInterface.onFinish?.()
          }
        }, true)
        timer.start()
        setCursor(index)
        return timer.cancel.bind(timer)
      }
    } else if (previousText.length > 0) {
      scriptInterface.onFinish?.()
    }
  }, [previousText, newText, immediate])

  useEffect(()=> {
    //if last character is '@' or '\', display the appropriate image
    if (cursor >= newText.length) {
      setVisibleText(newText)
      setHiddenText("")
      switch(newText.charAt(newText.length-1))
      {
        case '@' : setGlyph('moon'); break
        case '\\' : setGlyph('page'); break
        default : setGlyph(''); break
      }
    } else {
      setGlyph('')
      setVisibleText(newText.substring(0, cursor))
      setHiddenText(newText.substring(cursor))
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
          {convertText(visibleText)}{convertText(hiddenText, {style:{visibility: 'hidden'}})}
          {glyph.length > 0 &&
            <img src={icons[glyph]} alt={glyph} id={glyph} className="cursor" />
          }
        </span>
      </div>
    </div>
  )
})

export default TextLayer
