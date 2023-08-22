import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion'
import '../styles/game.scss';
import HistoryLayer from '../layers/HistoryLayer';
import ChoicesLayer from '../layers/ChoicesLayer';
import MenuLayer from '../layers/MenuLayer';
import TextLayer from '../layers/TextLayer';
import GraphicsLayer, { moveBg } from '../layers/GraphicsLayer';
import KeyMap, { inGameKeymap } from '../utils/KeyMap';
import script from '../utils/script';
import { gameContext } from '../utils/variables';
import { quickSave, quickLoad, loadSaveState } from "../utils/savestates";
import SkipLayer from '../layers/SkipLayer';
import SavesLayer from '../layers/SavesLayer';
import history from '../utils/history';
import { HiMenu } from 'react-icons/hi';
import GestureHandler from '../utils/touch';
import { toast } from 'react-toastify';
import { useObserved, useObserver } from '../utils/Observer';
import { useNavigate } from 'react-router-dom';
import { SCREEN, displayMode } from '../utils/display';
import { KeysMatching } from '../types';
import { useLanguageRefresh } from '../utils/lang';
import ConfigLayer from '../layers/ConfigLayer';
import { getScrollableParent } from '../utils/utils';

//##############################################################################
//#                                KEY MAPPING                                 #
//##############################################################################

function isViewAnyOf(...views: Array<typeof displayMode.currentView>) {
  return views.includes(displayMode.currentView)
}

const keyMap = new KeyMap(inGameKeymap, (action, evt, ...args)=> {
  switch(action) {
    case "next"     : next(); break
    case "back"     : back(); break
    case "auto_play": script.autoPlay = !script.autoPlay; break
    case "page_nav" : page_nav(args[0], evt); break
    case "history"  : toggleView('history'); break
    case "graphics" : toggleView('graphics'); break
    case "load"     : toggleView('load'); break
    case "save"     : toggleView('save'); break
    case "config"   : toggleView('config'); break
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

function stopAutoPlay(displayToast=true) {
  let result = false
  if (script.autoPlay) {
    script.autoPlay = false
    if (displayToast)
      toast("Auto-play stopped", {
        autoClose: 500,
        toastId: 'ap-stop'
      })
    result = true
  }
  if (script.isFastForward) {
    script.fastForward(undefined)
    if (displayToast)
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
    case "config"   : displayMode.config = false; break
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
         script.currentLine?.startsWith("select") ||
         //script.currentLine?.startsWith("osiete") || TODO uncomment if necessary, or remove
         script.currentLine?.match(/gosub\s+\*(?!(left|right))/)
}
function next() {
  if (isViewAnyOf("text", "graphics")) {
    if (displayMode.currentView == "graphics" && canDisableGraphics()) // text has been hidden manually
      displayMode.graphics = false
    else if (!stopAutoPlay())
      script.next()
  }
}

function page_nav(direction: "prev"|"next", event?: KeyboardEvent) {
  stopAutoPlay(!(event?.repeat))
  switch (direction) {
    case "prev":
      let ss = history.get(history.length < 2 ? -1 : -2)
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
  const [showMenuBtn] = useObserved(displayMode, "graphics", (v)=>!v)
  useLanguageRefresh()

  useObserver(navigate, displayMode, 'screen',
      { filter: screen => screen != SCREEN.WINDOW })

  const rootElmtRef = useRef(null)
  useEffect(()=> {
    const swipeHandler = new GestureHandler(rootElmtRef.current, {
      swipeTrigDistance: 50,
      onSwipe: (direction, _dist, evt)=> {
        if (direction == "")
          return
        const oppositeDir = direction == "left" ? "right"
                          : direction == "right" ? "left"
                          : direction == "up" ? "down"
                          : "up"
        if (getScrollableParent(evt.target as HTMLElement, [oppositeDir]) != null)
          return
        switch (displayMode.currentView) {
          case "menu" :
            if (direction == 'right') {
              back()
              return true
            }
            break
          case "text" :
          case "graphics" : // TODO move background instead of opening views ?
          case "dialog" :
            switch(direction) {
              case "up" : toggleView('graphics'); return true;
              case "left" : toggleView('menu'); return true;
              case "right" : toggleView('history'); return true;
              case "down" : toggleView('history'); return true;
            }
            break
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

      <ConfigLayer />

      <SkipLayer />

      {showMenuBtn &&
        <button className="menu-button" onClick={toggleMenu}>
          <HiMenu />
        </button>
      }
      <MenuLayer />
    </motion.div>
  )
}

export default Window;
