import { useEffect, useRef, useState } from 'react';
import '../styles/game.scss';
import HistoryLayer from '../layers/HistoryLayer';
import { Queue, moveBg, objectMatch } from '../utils/utils';
import ChoicesLayer from '../layers/ChoicesLayer';
import TextLayer from '../layers/TextLayer';
import MenuLayer from '../layers/MenuLayer';
import { HISTORY_MAX_PAGES } from '../utils/constants';
import KeyMap from '../utils/KeyMap';

import script from '../utils/ScriptManager';
import { SCREEN, displayMode, gameContext } from '../utils/variables';
import GraphicsLayer from '../layers/GraphicsLayer';

const keyMap = new KeyMap({
  "next":     [()=> objectMatch(displayMode, {menu: false, choices: false, history: false}),
              {key: "Enter", repeat: false},
              {key: "Control", repeat: true},
              {key: "ArrowDown", repeat: false},
              {key: "ArrowRight", repeat: false}],
  "history":  [()=> objectMatch(displayMode, {text: true, menu: false, history: false}),
              {key: "ArrowUp", repeat: false},
              {key: "ArrowLeft", repeat: false}],
  "graphics": {code: "Space", repeat: false, [KeyMap.condition]: ()=>objectMatch(displayMode, {menu: false, history: false})},
  "menu":     {key: "Escape", repeat: false, [KeyMap.condition]: ()=>!displayMode.menu },
  "back":     {key: "Escape", repeat: false},
  "save":     {key: "S", ctrlKey: true},
  "bg_move":  [()=> objectMatch(displayMode, {menu: false, history: false}),
              {key: "ArrowUp", ctrlKey: true, repeat: false, [KeyMap.args]: "up"},
              {key: "ArrowDown", ctrlKey: true, repeat: false, [KeyMap.args]: "down"}]
})

const Window = () => {
  const [text, setText] = useState<string>("") //text on current page
  const [fastForward, setFastForward] = useState<boolean>(false)

//##############################################################################
//#                                   HOOKS                                    #
//##############################################################################

  const rootElmtRef = useRef(null)

  useEffect(()=> {
    displayMode.screen = SCREEN.WINDOW
  }, [])

//_________________________________Key Mapping__________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  keyMap.setCallback((action, _event: KeyboardEvent, ...args)=> {
    switch(action) {
      case "next" : next(); break
      case "history": break // TODO show history
      case "graphics": toggleGraphics(); break
      case "menu" :
        displayMode.menu = !displayMode.menu
        break
      case "back" : break
      case "save" : return true //prevent default behaviour of Ctrl+S
      case "bg_move" :
        moveBg(args[0])
        break
    }
  })

  useEffect(()=> {
    if (rootElmtRef.current) {
      const elmt = rootElmtRef.current as HTMLElement
      keyMap.enable(elmt, "keydown", {
        capture: false // default if bubble. set to true to change to capture
      })
      return keyMap.disable.bind(keyMap, elmt, "keydown")
    }
  }, [rootElmtRef.current])


//##############################################################################
//#                              SCENE PROCESSING                              #
//##############################################################################

  const textFinished = useRef<boolean>(true)
  const history = useRef<Queue<string>>(new Queue([], HISTORY_MAX_PAGES))

  useEffect(()=> {
    gameContext.scene = 20;
    gameContext.index = 0;
  }, [])

  useEffect(function() {
    script.onText = function(str:string) {
      //keep fast-forward if previous text did not end with '@' or '\'
      const trimmed = text.trim()
      const lastChar = trimmed.charAt(trimmed.length-1)
      if (['@','\\'].includes(lastChar))
        setFastForward(false)
      setText(text+str)
      textFinished.current = false
    }
    script.onPage = function(){
      setFastForward(false)
      if (text) { //TODO: allow empty pages
        history.current?.push(text)
        //TODO: include some context in the history: copy variables, active sounds and graphics
      }
      setText("")
    }
  }, [text])
  
  const onTextBreak = ()=> {
    textFinished.current = true
    const breakChar = text?.charAt(text.length-1)??""
    if (!['\\','@'].includes(breakChar)) {
      script.next()
    }
  }

  function next() {
    if (objectMatch(displayMode, {menu: false, history: false})) {
      if (!displayMode.text)
        toggleGraphics()
      else if (textFinished.current) {
        script.next()
      } else {
        setFastForward(true)
      }
    }
  }

  function toggleGraphics() {
    displayMode.text = !displayMode.text
  }

  const handleClick = (evt : MouseEvent) => {
    switch(evt.button) {
      case 0 : // left button
        if (objectMatch(displayMode, {choices: false, history: false, menu: false})) {
          next()
        }
        break
      case 1 : // middle button
        break
      case 2 : // right button
        toggleGraphics()
        break
      case 3 : // back button
        //TODO show history
        break
      case 4 : // forward button
        break
      default :
        console.error(`unknown mouse button ${evt.button}`)
        break
    }
  }

  return (
    <div className="window" ref={rootElmtRef}>
      <HistoryLayer pages={history.current} text={text??""} />

      <GraphicsLayer />

      <TextLayer text={text??""} immediate={fastForward}
                 onFinish={onTextBreak} onClick={handleClick} />

      <ChoicesLayer />
      <MenuLayer />
    </div>
  )
}

export default Window;
