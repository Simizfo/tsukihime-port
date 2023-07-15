import { useEffect, useRef, useState } from 'react';
import '../styles/game.scss';
import { motion } from 'framer-motion'
import HistoryLayer from '../layers/HistoryLayer';
import { Stack, objectMatch } from '../utils/utils';
import ChoicesLayer from '../layers/ChoicesLayer';
import TextLayer from '../layers/TextLayer';
import MenuLayer from '../layers/MenuLayer';
import { HISTORY_MAX_PAGES } from '../utils/constants';
import KeyMap from '../utils/KeyMap';

import script from '../utils/script';
import { SCREEN, displayMode, createSaveState, exportSave, gameContext, loadSave } from '../utils/variables';
import GraphicsLayer, { moveBg } from '../layers/GraphicsLayer';
import { FaArrowLeft } from 'react-icons/fa';
import SkipLayer from '../layers/SkipLayer';
import { Page } from '../types';

const keyMap = new KeyMap({
  "next":     [()=> objectMatch(displayMode, {menu: false, choices: false, history: false}),
              {key: "Enter", repeat: false},
              {key: "Control", repeat: true},
              {key: "ArrowDown", repeat: false},
              {key: "ArrowRight", repeat: false}],
  "history":  [()=> objectMatch(displayMode, {text: true, menu: false, history: false}),
              {key: "ArrowUp", repeat: false},
              {key: "ArrowLeft", repeat: false},
              {key: "H", repeat: false}],
  "graphics": {code: "Space", repeat: false, [KeyMap.condition]: ()=>objectMatch(displayMode, {menu: false, history: false})},
  "menu":     [
              {key: "Escape", repeat: false, [KeyMap.condition]: ()=>(displayMode.menu || !displayMode.history)},
              {key: "Backspace", repeat: false, [KeyMap.condition]: ()=>displayMode.menu}],
  "save":     {key: "S", ctrlKey: true},
  "load":     {key: "O", ctrlKey: true},
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
      case "history": toggleHistory(); break
      case "graphics": toggleGraphics(); break
      case "menu" : toggleMenu(); break
      case "save" :
        exportSave();
        return true // prevent default behaviour of Ctrl+S
      case "load" :
        loadSave();
        return true // prevent default behaviour of Ctrl+O
      case "bg_move" :
        moveBg(args[0])
        break
    }
  })

  useEffect(()=> {
    keyMap.enable(document, "keydown", {
      capture: false // default if bubble. set to true to change to capture
    })
    return keyMap.disable.bind(keyMap, document, "keydown")
  }, [])


//##############################################################################
//#                              SCENE PROCESSING                              #
//##############################################################################

  /**
   * - `"running"`: the text is progressively being displayed
   * - `"idle"`: hit a '@' or '\', and waiting for user to move to next
   * - `"none"`: current command is not text-related (last text-command has ended)
   */
  const textState = useRef<"running"|"idle"|"none">("none")
  const history = useRef<Stack<Page>>(new Stack([], HISTORY_MAX_PAGES))

  useEffect(()=> {
    gameContext.label = 's29';
    gameContext.index = 0;
  }, [])

  useEffect(function() {
    script.onText = function(str:string) {
      if (history.current.length == 0)
        throw Error("The history should have at least one page")
      //keep fast-forward if previous text did not end with '@' or '\'
      const trimmed = text.trim()
      const lastChar = trimmed.charAt(trimmed.length-1)
      if (['@','\\'].includes(lastChar))
        setFastForward(false)
      history.current.top.text += str
      setText(history.current.top.text)
      textState.current = "running"
    }
    script.onPageStart = function() {
      setFastForward(false)
      if (history.current.top?.text.length == 0)
        history.current.pop() // remove empty pages from history
      history.current.push({saveState: createSaveState(), text: ""})
      setText("")
    }
  }, [text])
  
  const onTextBreak = ()=> {
    const breakChar = text?.charAt(text.length-1)??""
    if (!['\\','@'].includes(breakChar)) {
      textState.current = "none"
      script.next()
    } else {
      textState.current = "idle"
    }
  }

  function next() {
    if (objectMatch(displayMode, {choices: false, menu: false, history: false})) {
      if (!displayMode.text && textState.current == "idle") // text has been hidden manually
        toggleGraphics()
      else if (textState.current != 'running') {
        script.next()
        textState.current = "none"
      } else {
        setFastForward(true)
      }
    }
  }

  function toggleMenu() {
    displayMode.menu = !displayMode.menu
  }

  function toggleGraphics() {
    displayMode.text = !displayMode.text
  }

  function toggleHistory() {
    displayMode.text = !displayMode.text
    displayMode.history = !displayMode.history
  }

  const onContextMenu = (evt: React.MouseEvent) => {
    if (!displayMode.history) {
      toggleMenu()
      evt.preventDefault()
    }
  }

  return (
    <motion.div
      className="window" ref={rootElmtRef}
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{scale: 1.5, opacity: 0}}
      transition={{duration: 0.5}}
      onContextMenu={onContextMenu}>
      <HistoryLayer pages={history.current} />

      <GraphicsLayer onClick={next} />

      <TextLayer text={text??""} immediate={fastForward}
        onFinish={onTextBreak} onClick={next}/>

      <ChoicesLayer />

      <SkipLayer />

      <button className="menu-button" onClick={toggleMenu}>
        <FaArrowLeft />
      </button>
      <MenuLayer />
    </motion.div>
  )
}

export default Window;
