import { useEffect, useState, memo } from "react"
import moonIcon from '../assets/icons/icon_moon.svg'
import pageIcon from '../assets/icons/icon_bars.svg'
import { preprocessText, resettable } from "../utils/utils"
import { settings } from "../utils/variables"
import { observe, useObserved } from "../utils/Observer"
import history from "../utils/history"
import { SCREEN, displayMode } from "../utils/display"
import { PageContent } from "../types"
import { BBTypeWriter, Bbcode } from "../utils/Bbcode"

const icons: Record<"moon"|"page", string> = {
  "moon": moonIcon,
  "page": pageIcon
}

const [scriptInterface, resetSI] = resettable({
  text: "" as string,
  glyph: undefined as keyof typeof icons|undefined,
  fastForward: false as boolean,
  onFinish: undefined as VoidFunction|undefined
})

observe(displayMode, 'screen', resetSI, {filter: s => s != SCREEN.WINDOW})


history.addListener(()=> {
  scriptInterface.text = ""
  scriptInterface.glyph = undefined
})

function appendText(text: string) {
  const lastPage = history.last.page as PageContent<"text">
  lastPage.text += text
  scriptInterface.text = lastPage.text
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
  return { next: ()=> {
    scriptInterface.glyph = undefined
    onFinish()
  }, autoPlayDelay: delay}
}

export const commands = {
  'br' : appendText.bind(null, "\n"),
  '@'  : onBreakChar,
  '\\' : onBreakChar,
  '`'  : (text:string, _: string, onFinish: VoidFunction)=> {
    appendText(preprocessText(text))
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

type Props = { } & React.ComponentPropsWithoutRef<"div">

const TextLayer = memo(({...props}: Props) => {

  const [ display ] = useObserved(displayMode, 'text')
  const [ text ] = useObserved(scriptInterface, 'text')
  const [ lines, setLines ] = useState<string[]>([])
  const [ immediate ] = useObserved(scriptInterface, 'fastForward')
  const [ glyph ] = useObserved(scriptInterface, 'glyph')

  useEffect(()=> {
    if (glyph) {
      scriptInterface.onFinish?.()
    }
  }, [glyph])

  useEffect(()=> {
    const previous = lines.join('\n')
    if (previous != text) {
      setLines(text.trimEnd().split('\n'))
      if (!displayMode.text && text.length > 0)
        displayMode.text = true
    }
  }, [text])

  const {className, ...remaining_props} = props
  const classList = ['box', 'box-text']
  if (!display || (text.length == 0)) classList.push('hide')
  if (className) classList.push(className)
  const [previousLines, lastLine] = [lines.slice(0, lines.length-1), lines[lines.length-1]]
  
  const glyphNode = glyph && <span><img src={icons[glyph]} alt={glyph} id={glyph} className="cursor" /></span>

  return (
    <div className={classList.join(' ')} {...remaining_props}>
      <div className="text-container">
        {previousLines.map((line, i)=> <>
          {line && <Bbcode text={line} key={i}/>}
          <br/>
        </>)}
        {lastLine ?
          <BBTypeWriter charDelay={immediate ? 0 : settings.textSpeed} text={lastLine} hideTag="hide"
            onFinish={()=> { scriptInterface.onFinish?.() }} rootSuffix={glyphNode}/>
        : glyphNode
        }
        
      </div>
    </div>
  )
})

export default TextLayer
