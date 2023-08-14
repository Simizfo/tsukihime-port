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
import { gameContext } from '../utils/variables';
import { quickSave, quickLoad, loadSaveState } from "../utils/savestates";
import SkipLayer from '../layers/SkipLayer';
import SavesLayer from '../layers/SavesLayer';
import history from '../utils/history';
import { HiMenu } from 'react-icons/hi';
import GestureHandler from '../utils/touch';
import { toast } from 'react-toastify';
import { useObserver } from '../utils/Observer';
import { useNavigate } from 'react-router-dom';
import { SCREEN, displayMode } from '../utils/display';
import { KeysMatching } from '../types';

//##############################################################################
//#                                KEY MAPPING                                 #
//##############################################################################

function isViewAnyOf(...views: Array<typeof displayMode.currentView>) {
  return views.includes(displayMode.currentView)
}

const keyMap = new KeyMap({
  "next":     [()=> isViewAnyOf("text", "graphics"),
              {key: "Enter"},
              {key: "Control", repeat: true},
              {key: "Meta", repeat: true},
              {key: "ArrowDown", repeat: false},
              {key: "ArrowRight", repeat: false}],
  "auto_play":[()=> displayMode.currentView == "text",
              {key: "E", repeat: false}],
  "page_nav": [()=> isViewAnyOf("text", "graphics", "dialog"),
              {key: "PageUp", [KeyMap.args]: "prev"},
              {key: "PageDown", [KeyMap.args]: "next"}],
  "history":  [()=> isViewAnyOf("text", "dialog"),
              {key: "ArrowUp", repeat: false},
              {key: "ArrowLeft", repeat: false},
              {key: "H", repeat: false}],
  "graphics": {code: "Space", repeat: false, [KeyMap.condition]: ()=>isViewAnyOf("text", "graphics", "dialog")},
  "back":     [
              {key: "Escape", repeat: false},
              {key: "Backspace", repeat: false}],
  "q_save":   {key: "S", repeat: false, [KeyMap.condition]: ()=> !displayMode.saveScreen},
  "q_load":   {key: "L", repeat: false, [KeyMap.condition]: ()=> !displayMode.saveScreen},
  "load":     [()=> isViewAnyOf("text", "graphics"),
              {key: "A", repeat: false}],
  "save":     [()=> isViewAnyOf("text", "graphics"),
              {key: "Z", repeat: false}],
  "bg_move":  [()=> isViewAnyOf("text", "graphics"),
              {key: "ArrowUp", ctrlKey: true, repeat: false, [KeyMap.args]: "up"},
              {key: "ArrowDown", ctrlKey: true, repeat: false, [KeyMap.args]: "down"}]
}, (action, _evt, ...args)=> {
  switch(action) {
    case "next"     : next(); break
    case "back"     : back(); break
    case "auto_play": script.autoPlay = !script.autoPlay; break
    case "page_nav" : page_nav(args[0]); break
    case "history"  : toggleView('history'); break
    case "graphics" : toggleView('graphics'); break
    case "load"     : toggleView('load'); break
    case "save"     : toggleView('save'); break
    case "q_save"   : quickSave(); break
    case "q_load"   : quickLoad(); break
    case "bg_move"  : moveBg(args[0]); break
  }
})

//##############################################################################
//#                              ACTION FUNCTIONS                              #
//##############################################################################

function toggleView(v: KeysMatching<typeof displayMode, boolean>) {
  stopAutoPlay()
  displayMode[v] = !displayMode[v]
}

function stopAutoPlay() {
  let result = false
  if (script.autoPlay) {
    script.autoPlay = false
    toast("Auto-play stopped", {
      autoClose: 500,
      toastId: 'ap-stop'
    })
    result = true
  }
  if (script.isFastForward) {
    script.fastForward(undefined)
    toast("Fast-Forward stopped", {
      autoClose: 500,
      toastId: 'ff-stop'
    })
    result = true
  }
  return result
}

function back() {
  stopAutoPlay()
  switch (displayMode.currentView) {
    case "saves"    : displayMode.saveScreen = false; break
    case "history"  : displayMode.history = false; break
    case "menu"     : displayMode.menu = false; break;
    case "graphics" : // open the menu if the current view is texts,
    case "dialog"   : // graphics or dialog
    case "text"     : displayMode.menu = true; break
    default : console.error(`cannot exit unknown view "${displayMode.currentView}"`)
  }
}
function canDisableGraphics() {
  return script.isCurrentLineText() ||
         script.currentLine.startsWith("select") ||
         script.currentLine.match(/gosub\s+\*(?!(left|right))/)
}
function next() {
  if (isViewAnyOf("text", "graphics")) {
    if (displayMode.currentView == "graphics" && canDisableGraphics()) // text has been hidden manually
      displayMode.graphics = false
    else if (!stopAutoPlay())
      script.next()
  }
}

function page_nav(direction: "prev"|"next") {
  stopAutoPlay()
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
}

function toggleMenu() {
  displayMode.menu = !displayMode.menu
  stopAutoPlay()
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

const Window = () => {
  const navigate = useNavigate()

  useObserver(navigate, displayMode, 'screen',
      { filter: screen => screen != SCREEN.WINDOW })

  const rootElmtRef = useRef(null)
  useEffect(()=> {
    const swipeHandler = new GestureHandler(rootElmtRef.current, {
      swipeTrigDistance: 50,
      onSwipe: (direction)=> {
        if (displayMode.text) {
          stopAutoPlay()
          switch(direction) {
            case "up" : displayMode.graphics = true; return true
            case "down" : displayMode.history = true; return true
            case "left" : displayMode.menu = true; return true
            case "right" : page_nav("prev"); return true
          }
        } else if (displayMode.graphics) {
          //TODO : move background ?
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
    evt.preventDefault()
    back()
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
