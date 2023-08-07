import { useEffect, useRef } from 'react';
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
import { quickSave, quickLoad, loadSaveState } from "../utils/savestates";
import SkipLayer from '../layers/SkipLayer';
import SavesLayer from '../layers/SavesLayer';
import history from '../utils/history';
import { HiMenu } from 'react-icons/hi';
import GestureHandler from '../utils/touch';
import { isScene } from '../utils/scriptUtils';
import { toast } from 'react-toastify';

//##############################################################################
//#                                KEY MAPPING                                 #
//##############################################################################

const keyMap = new KeyMap({
  "next":     [()=> objectMatch(displayMode, {menu: false, choices: false, history: false, load: false, save: false}),
              {key: "Enter"},
              {key: "Control", repeat: true},
              {key: "Meta", repeat: true},
              {key: "ArrowDown", repeat: false},
              {key: "ArrowRight", repeat: false}],
  "auto_play":[()=> objectMatch(displayMode, {text: true, menu: false, choices: false, history: false, load: false, save: false}),
              {key: "E", repeat: false}],
  "page_nav": [()=> objectMatch(displayMode, {menu: false, history: false, load: false, save: false}),
              {key: "PageUp", [KeyMap.args]: "prev"},
              {key: "PageDown", [KeyMap.args]: "next"}],
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
      case "auto_play": toggleAutoPlay(); break
      case "page_nav" : page_nav(args[0]); break
      case "history"  : toggleHistory(); break
      case "graphics" : toggleGraphics(); break
      case "menu"     : toggleMenu(); break
      case "q_save"   : quickSave(); break
      case "q_load"   : quickLoad(); break
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
    if (!displayMode.text && script.currentLine?.startsWith('`')) // text has been hidden manually
      toggleGraphics()
    else if (script.isFastForward || script.autoPlay) {
      if (script.isFastForward) {
        script.fastForward(undefined)
        toast("Fast-Forward stopped", {
          autoClose: 500,
          toastId: 'ff-stop'
        })
      }
      if (script.autoPlay) {
        script.autoPlay = false
        toast("Auto-play stopped", {
          autoClose: 500,
          toastId: 'ap-stop'
        })
      }
    } else {
      script.next()
    }
  }
}

function page_nav(direction: "prev"|"next") {
  switch (direction) {
    case "prev":
      let page = history.get(history.length < 2 ? -1 : -2)
      let ss = page?.saveState
      if (ss)
        loadSaveState(ss)
      break
    case "next":
      if (!script.isFastForward) {
        const currLabel = gameContext.label
        script.fastForward((_l, _i, label)=>{
          return script.getOffsetLine(-1)?.endsWith('\\')
              || label != currLabel
        })
      }
      break;
  }
  script.autoPlay = false
}

function toggleAutoPlay() {
  script.autoPlay = !script.autoPlay;
}

function toggleMenu() {
  displayMode.menu = !displayMode.menu
  script.autoPlay = false
}

function toggleGraphics() {
  displayMode.text = !displayMode.text
  script.autoPlay = false
}

function toggleHistory() {
  displayMode.text = !displayMode.text
  displayMode.history = !displayMode.history
  script.autoPlay = false
}

function toggleSave() {
  displayMode.save = !displayMode.save
  script.autoPlay = false
}

function toggleLoad() {
  displayMode.load = !displayMode.load
  script.autoPlay = false
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

const Window = () => {

  const rootElmtRef = useRef(null)
  useEffect(()=> {
    const swipeHandler = new GestureHandler(rootElmtRef.current, {
      swipeTrigDistance: 50,
      onSwipe: (direction)=> {
        if (objectMatch(displayMode, {history: false, menu: false, save: false, load: false})) {
          switch(direction) {
            case "left" : toggleMenu(); return true
            case "down" : toggleHistory(); return true
            case "right" : page_nav("prev"); return true
            case "up" : toggleGraphics(); return true
          }
        }
      }
    })
    return swipeHandler.disable.bind(swipeHandler)
  }, [rootElmtRef])

  useEffect(()=> {
    displayMode.screen = SCREEN.WINDOW
    //TODO wait for screen transition animation to end before starting the script
    if (gameContext.label == '') {
      script.moveTo('openning')
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
        <HiMenu />
      </button>
      <MenuLayer />
    </motion.div>
  )
}

export default Window;
