import { useEffect, useRef } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion'
import '../styles/game.scss';
import HistoryLayer from '../layers/HistoryLayer';
import ChoicesLayer from '../layers/ChoicesLayer';
import MenuLayer from '../layers/MenuLayer';
import TextLayer from '../layers/TextLayer';
import GraphicsLayer, { moveBg } from '../layers/GraphicsLayer';
import KeyMap from '../utils/KeyMap';
import script from '../utils/script';
import { objectMatch } from '../utils/utils';
import { SCREEN, displayMode, gameContext } from '../utils/variables';
import { quickSave, quickLoad } from "../utils/savestates";
import SkipLayer from '../layers/SkipLayer';
import SavesLayer from '../layers/SavesLayer';

//##############################################################################
//#                                KEY MAPPING                                 #
//##############################################################################

const keyMap = new KeyMap({
  "next":     [()=> objectMatch(displayMode, {menu: false, choices: false, history: false, load: false, save: false}),
              {key: "Enter", repeat: false},
              {key: "Control", repeat: true},
              {key: "ArrowDown", repeat: false},
              {key: "ArrowRight", repeat: false}],
  "history":  [()=> objectMatch(displayMode, {text: true, menu: false, history: false, load: false, save: false}),
              {key: "ArrowUp", repeat: false},
              {key: "ArrowLeft", repeat: false},
              {key: "H", repeat: false}],
  "graphics": {code: "Space", repeat: false, [KeyMap.condition]: ()=>objectMatch(displayMode, {menu: false, history: false, load: false, save: false})},
  "menu":     [
              {key: "Escape", repeat: false, [KeyMap.condition]: ()=>(displayMode.menu || !displayMode.history) && !displayMode.load && !displayMode.save},
              {key: "Backspace", repeat: false, [KeyMap.condition]: ()=>displayMode.menu}],
  "q_save":   {key: "S", repeat: false},
  "q_load":   {key: "L", repeat: false},
  "load":     [()=> objectMatch(displayMode, {menu: false, history: false, load: false, save: false}),
              {key: "A", repeat: false}],
  "save":     [()=> objectMatch(displayMode, {menu: false, history: false, load: false, save: false}),
              {key: "Z", repeat: false}],
  "bg_move":  [()=> objectMatch(displayMode, {menu: false, history: false, load: false, save: false}),
              {key: "ArrowUp", ctrlKey: true, repeat: false, [KeyMap.args]: "up"},
              {key: "ArrowDown", ctrlKey: true, repeat: false, [KeyMap.args]: "down"}]
}, (action, _evt, ...args)=> {
    switch(action) {
      case "next"     : next(); break
      case "history"  : toggleHistory(); break
      case "graphics" : toggleGraphics(); break
      case "menu"     : toggleMenu(); break
      case "q_save"   : quickSave(); break
      case "q_load"   : quickLoad(); break;
      case "load"     : toggleLoad(); break
      case "save"     : toggleSave(); break
      case "bg_move"  : moveBg(args[0]); break
    }
})

//##############################################################################
//#                              ACTION FUNCTIONS                              #
//##############################################################################

function next() {
  if (objectMatch(displayMode, {choices: false, menu: false, history: false})) {
    if (!displayMode.text && script.currentLine.startsWith('`')) // text has been hidden manually
      toggleGraphics()
    else
      script.next()
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

function toggleSave() {
  displayMode.save = !displayMode.save
}

function toggleLoad() {
  displayMode.load = !displayMode.load
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

const Window = () => {

  const rootElmtRef = useRef(null)

  useEffect(()=> {
    displayMode.screen = SCREEN.WINDOW
    //TODO wait for screen transition animation to end before starting the script
    if (gameContext.label == '') {
      if (!quickLoad()) {
        gameContext.label = 's20';
        gameContext.index = 0;
      }
    }

    keyMap.enable(document, "keydown", {
      capture: false // default if bubble. set to true to change to capture
    })
    return keyMap.disable.bind(keyMap, document, "keydown")
  }, [])

  const onContextMenu = (evt: React.MouseEvent) => {
    if (!displayMode.history) {
      toggleMenu()
      evt.preventDefault()
    }
  }

  return (
    <motion.div
      className="page window" ref={rootElmtRef}
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{scale: 1.5, opacity: 0}}
      transition={{duration: 0.5}}
      onContextMenu={onContextMenu}>
      <GraphicsLayer onClick={next} />

      <TextLayer onClick={next}/>

      <ChoicesLayer />

      <HistoryLayer />

      <SavesLayer />

      <SkipLayer />

      <button className="menu-button" onClick={toggleMenu}>
        <FaArrowLeft />
      </button>
      <MenuLayer />
    </motion.div>
  )
}

export default Window;
