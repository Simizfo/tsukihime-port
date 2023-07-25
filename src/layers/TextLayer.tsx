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
  glyph: string|undefined,
  fastForward: boolean,
  onFinish: VoidFunction|undefined
} = {
  text: "",
  glyph: undefined,
  fastForward: false,
  onFinish: undefined
}

function appendText(text: string) {
  script.history.top.text += text
  scriptInterface.text = script.history.top.text
  scriptInterface.glyph = undefined
}

function onBreakChar(_: string, cmd: string, onFinish: VoidFunction) {
  let delay = 0
  switch(cmd) {
    case '@' :
      scriptInterface.glyph = "moon"
      delay = settings.autoClickDelay
      break
    case '\\' :
      scriptInterface.glyph = "page"
      delay = settings.nextPageDelay
      break
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
  const [ cursor, setCursor ] = useState<number>(0) // position of the cursor on the last line.
  const [ glyph, setGlyph ] = useState<string>('') // id of the animated glyph to display at end of line

  const [ display, setDisplay ] = useState<boolean>(displayMode.text)

  useObserver(setDisplay, displayMode, 'text')
  useObserver(setText, scriptInterface, 'text')
  useObserver(setImmediate, scriptInterface, 'fastForward')
  useObserver((glyph)=> {
    if (glyph) {
      setPreviousText(scriptInterface.text.split('\n'))
      setNewText("")
    }
    setGlyph(glyph)
  }, scriptInterface, 'glyph')

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

  const {className, ...remaining_props} = props
  const visibleText = newText.substring(0, cursor)
  const hiddenText = newText.substring(cursor)
  return (
    <div className={`box box-text ${!display ? "hide ":""}${className||''}`} {...remaining_props}>
      <div className="text-container">
        {previousText.map((line, i)=>
          <Fragment key={i}>
            {i > 0 && <br/>}
            {convertText(line)}
          </Fragment>)}
        <span>
          {glyph ? <>
            &#8203;
            <img src={icons[glyph]} alt={glyph} id={glyph} className="cursor" />
            &#8203;
          </> : <>
            {convertText(visibleText)}
            {convertText(hiddenText, {style:{visibility: 'hidden'}})}
          </>}
        </span>
      </div>
    </div>
  )
})

export default TextLayer
