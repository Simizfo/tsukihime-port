import { useContext, useEffect, useRef, useState } from 'react';
import '../styles/game.scss';
import audio from '../utils/AudioManager';
import HistoryLayer from '../layers/HistoryLayer';
import { Background, Character, Choice, ContextState } from '../types';
import { Queue, fetchChoices, fetchGoToNextScene, fetchScene, moveBg, objectMatch } from '../utils/utils';
import ChoicesLayer from '../layers/ChoicesLayer';
import CharactersLayer from '../layers/CharactersLayer';
import TextLayer from '../layers/TextLayer';
import BackgroundLayer from '../layers/BackgroundLayer';
import { store } from '../context/GameContext';
import MenuLayer from '../layers/MenuLayer';
import { HISTORY_MAX_PAGES, STRALIAS_JSON } from '../utils/constants';
import KeyMap from '../utils/KeyMap';

const INIT_SCENE = 20

const Window = () => {
  const { state, dispatch } = useContext(store)
  const [sceneNumber, setSceneNumber] = useState(INIT_SCENE)
  const [scene, setScene] = useState<string[]>([])
  const [choices, setChoices] = useState<Choice[]>([])
  const [lineIdx, setLineIdx] = useState<number>(0) //line index in scene file
  const [text, setText] = useState<string[]>([]) //text on current page
  const [pages, setPages] = useState<Queue<string[]>>(new Queue([], HISTORY_MAX_PAGES))
  const [bg, setBg] = useState<Background>(state.game.bg)
  const [characters, setCharacters] = useState<Map<string,Character>>(new Map())
  const lastBreak = useRef<string>('')
  const [skipBreaks, setSkipBreaks] = useState<number>(0)
  const [fastForward, setFastForward] = useState<boolean>(false)

//##############################################################################
//#                                    INIT                                    #
//##############################################################################

  useEffect(() => {
    if (state.game.track !== '' && !audio.isTrackPlaying()) {
      audio.setSoundFileUrl(state.game.track,  "CD/" + state.game.track),
      audio.playTrack(state.game.track, true)
    }

    return () => {
      audio.stopTrack()
      audio.stopSE()
    }
  }, [])

//##############################################################################
//#                                   HOOKS                                    #
//##############################################################################
  const stateRef = useRef<ContextState>(state)

  const rootElmtRef = useRef(null)

  useEffect(()=>{
    stateRef.current = state
  }, [state])


  const keyMap = useRef<KeyMap>(new KeyMap({
    "next": [()=> objectMatch(stateRef.current.disp, {menu: false, choices: false, history: false}),
      {key: "Enter", repeat: false},
      {key: "Control", repeat: true},
      {key: "ArrowDown", repeat: false},
      {key: "ArrowRight", repeat: false}],
    "history": [()=> objectMatch(stateRef.current.disp, {text: true, menu: false, history: false}),
      {key: "ArrowUp", repeat: false},
      {key: "ArrowLeft", repeat: false}],
    "graphics": {code: "Space", repeat: false, [KeyMap.condition]: ()=>objectMatch(stateRef.current.disp, {menu: false, history: false})},
    "menu": {key: "Escape", repeat: false, [KeyMap.condition]: ()=>!stateRef.current.disp.menu },
    "back": {key: "Escape", repeat: false},
    "save": {key: "S", ctrlKey: true},
    "bg_move": [()=> objectMatch(stateRef.current.disp, {menu: false, history: false}),
      {[KeyMap.args]: "up", key: "ArrowUp", repeat: false},
      {[KeyMap.args]: "down", key: "ArrowDown", repeat: false}]
  }))

  keyMap.current.setCallback((action, _event: KeyboardEvent, ...args)=> {
    switch(action) {
      case "next" : next(); break
      case "history": break // TODO show history
      case "graphics": toggleGraphics(); break
      case "menu" :
        dispatch({ type: 'SET_DISP_MENU', payload: !state.disp.menu })
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
      keyMap.current.enable(elmt, "keydown", {
        capture: false // default if bubble. set to true to change to capture
      })
      return keyMap.current.disable.bind(keyMap.current, elmt, "keydown")
    }
  }, [rootElmtRef.current])

  useEffect(() => {
    dispatch({ type: 'SET_GAME', payload: { ...state.game, bg: bg } })
  }, [bg])

  useEffect(() => {
    audio.masterVolume = state.permanent.volume.master;
    audio.trackVolume = state.permanent.volume.track;
    audio.seVolume = state.permanent.volume.se;
  }, [state.permanent.volume])

//##############################################################################
//#                              SCENE PROCESSING                              #
//##############################################################################

  useEffect(()=> {
    setLineIdx(0)
    setText([])
  }, [scene])

  useEffect(()=> {
    fetchChoices(sceneNumber).then(setChoices)
    fetchScene(sceneNumber).then(setScene)
    dispatch({ type: 'SET_DISP_CHOICES', payload: false })
  }, [sceneNumber])

  useEffect(() => {
    if (choices.length === 0 && state.disp.choices) {
      fetchGoToNextScene(sceneNumber).then(setSceneNumber)
    }
  }, [state.disp.choices])

  const onTextBreak = (breakChar: string)=> {
    switch(breakChar.charAt(0)) {
      case '!' : // wait a certain amount of time
        lastBreak.current = breakChar
        console.log(breakChar)
        processTimer(breakChar.substring(2), breakChar.substring(0,2))
        break
      case '@' : // waiting for user
      case '\\' : // page end, waiting for user
        lastBreak.current = breakChar
        break
      case '\n' : // line end, move to next line
        onLineComplete()
        break
    }
  }

  function next() {
    if (objectMatch(state.disp, {text: false, menu: false, history: false})) {
      toggleGraphics()
    }
    else if (objectMatch(state.disp, {text: true, menu: false, history: false})) {
      if (scene[lineIdx].startsWith('`')) {
        if (lastBreak.current) {// text is stopped at '@' or '\'
          setFastForward(false)
          setSkipBreaks(skipBreaks+1)
        }
        else {
          setFastForward(true)
        }
      } else {
        //TODO skip timeout for command
      }
    }
  }

  function onLineComplete() {
    if (lastBreak.current.startsWith('!')) { // command in middle of text line
      setSkipBreaks(skipBreaks+1)
      setFastForward(false)
    } else {
      setSkipBreaks(0)
      if (lastBreak.current == '\\') {
        setPages(new Queue<string[]>(pages).push(text))
        setText([])
      }
      lastBreak.current = ''
      setLineIdx(lineIdx+1)
    }
  }

  useEffect(()=> {
    if (scene && scene.length > 0) {
      const line = scene[lineIdx]
      //console.log(`[SCRIPT]${lineIdx.toString().padStart(3)}/${scene.length}|${line}`)
      if (line.startsWith('`')) {
        setText([...text, line])
      }
      else {
        processCmd(line)
      }
    }
  }, [lineIdx, scene])

  function getVariable(name: string) {
    const variables = state.game.variables;
    for (const variable of variables) {
      if (variable.name == name)
      return variable.value;
    }
    return null;
  }

  const commands = {
    'bg'        : processImage,
    'ld'        : processImage,
    'cl'        : processImage,
    'play'      : processAudioCmd,
    'playstop'  : processAudioCmd,
    'wave'      : processAudioCmd,
    'waveloop'  : processAudioCmd,
    'wavestop'  : processAudioCmd,
    'br'        : processBr,
    'waittimer' : processTimer,
    'mov'       : processVarCmd,
    'add'       : processVarCmd,
    'sub'       : processVarCmd,
    'inc'       : processVarCmd,
    'dec'       : processVarCmd,
    'return'    : processReturn,
    'resettimer': null, // all 'waittimer' are immediately after 'resettimer'
    'gosub'     : null,
    'goto'      : null,
    'quakex'    : null, //TODO : vertical shake effect
    'quakey'    : null, //TODO : horizontal shake effect
    'monocro'   : null, //TODO : fade screen to monochrome
  }

  function processCmd(line: string) {

    if (!/^[a-zA-Z\!]/.test(line))
      return; // not a command (does not start with a letter or a '!')
    //TODO line that start with '*' are labels used by gosub and goto
    let func = null,
        cmd = null,
        args = null
    if (line.startsWith("!w")) {
      func = processTimer
      cmd = line.substring(0, 2)
      args = line.substring(2)
    } else {
      let index = line.indexOf(' ');
      if (index === -1)
        index = line.length;
      cmd = line.substring(0, index);
      args = line.substring(index+1);
      //TODO replace known variables in args ?
      if (cmd in commands) {
        func = commands[cmd as keyof typeof commands]
      }
      else {
        console.error(`unknown command scene ${sceneNumber}:${lineIdx}[${line}]`);
        onLineComplete()
      }
    }
    const wait = func?.(args, cmd)
    if (!wait)
      onLineComplete()
  }

  function processBr() {
    setText([...text, "br"])
  }

  /**
   * "*5" -> track05.mp3
   */
  function getTrackFile(track: string): string {
    const paddedNumber = track.replace(/\D/g, '').padStart(2, '0');
    return `track${paddedNumber}.mp3`;
  }

  function processAudioCmd(arg: string, cmd: string) {
    let {track, looped_se} = state.game;
    let name = arg
    switch(cmd) {
      case 'play' :
        track = getTrackFile(name)
        const path = "CD/" + track
        audio.setSoundFileUrl(track, path)
        audio.playTrack(track, true)
        break
      case 'playstop' :
        track = ''
        audio.stopTrack()
        break
      case 'wave' :
      case 'waveloop' :
        const loop = (cmd == 'waveloop')
        looped_se = loop ? name : ''
        audio.setSoundFileUrl(name, STRALIAS_JSON[name])
        audio.playSE(name, loop);
        break
      case 'wavestop' :
        looped_se = ''
        audio.stopSE();
        break
    }
    dispatch({ type: 'SET_GAME', payload: { ...state.game, track: track, looped_se :looped_se } });
  }

  function processImage(arg: string, cmd: string) {
    let args = arg.split(',')
    let pos:string|null = null,
        image:string|null = null,
        type:string|null = null

    switch(cmd) {
      case 'bg': [image, type] = args; break
      case 'ld': [pos, image, type] = args; break
      case 'cl': [pos, type] = args; break
      default : throw Error(`unknown image command ${cmd} ${arg}`)
    }

    // get image
    if (image != null) {
      if (image.startsWith('$')) { // variable
        image = getVariable(image) as string|null
        if (image === null)
          throw Error(`undefined variable for [${cmd} ${arg}]`)
      }
      if (image.startsWith('"') && image.endsWith('"')) {
        // remove ':a;', 'image/', 'image/tachi/', '"', '.jpg'
        image = image.replace(/:a;|image[\/\\](tachi[\/\\])?|"|\.jpg/g, '')
      }
      else if (!image.startsWith('#')) { // not image nor color
        throw Error(`Ill-formed arguments for [${cmd} ${arg}]`)
      }
    }
    if (type != null) {
      type = type.replace('%', '');
    }

    switch(cmd) {
      case 'cl' : {
        const newCharacters = new Map(characters)
        newCharacters.delete(pos as string);
        setCharacters(newCharacters)
        break
      }
      case 'ld' : {
        const newCharacters = new Map(characters);
        newCharacters.set(pos as string, {
          image: image as string,
          type: type,
          pos: pos as string
        });
        setCharacters(newCharacters)
        break
      }
      case 'bg' :
        const path = image as string
        const bgTmp: Background = {
          image: image as string,
          type: type
        }
        if (path.includes('event\\')) {
          dispatch({ type: 'ADD_GAME_EVENT_IMAGE', payload: path })
        }
        setBg(bgTmp)
        return true
    }
  }

  function processTimer(arg: string, cmd?: string) {
    switch (cmd) {
      case 'waittimer' :
      case '!w' :
        let time_to_wait = parseInt(arg)
        setTimeout(onLineComplete, time_to_wait)
        return true
      default :
        throw Error(`unknown timer command ${cmd} ${arg}`)
    }
  }

  function processVarCmd(arg: string, cmd: string) {
    const [name, ...args] = arg.split(',')
    let value = getVariable(name);
    if (value === null && cmd != 'mov')
      throw Error(`Reading undefined variable. [${cmd} ${arg}]`)

    switch (cmd) {
      case 'mov' :
        if (name.startsWith('%'))
          value = parseInt(args[0])
        else if (name.startsWith('$'))
          value = args[0]
        else
          throw Error(`Ill-formed variable name in 'mov' command: [${arg}]`)
        break
      case 'add' :
        value += args[0] // can be number or string
        break
      case 'sub' :
        (value as number) -= parseInt(args[0])
        break
      case 'inc' :
        (value as number) += 1
        break
      case 'dec' :
        (value as number) -= 1
        break
    }
    dispatch({ type: 'SET_VAR', payload: {name: name, value: value} })
  }

  function processReturn() {
    dispatch({ type: 'SET_DISP_CHOICES', payload: true })
  }

  function toggleGraphics() {
    dispatch({ type: 'SET_DISP_TEXT', payload: !state.disp.text })
  }

  const handleClick = (evt : MouseEvent) => {
    switch(evt.button) {
      case 0 : // left button
        if (objectMatch(state.disp, {choices: false, history: false, menu: false})) {
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
      <HistoryLayer pages={pages} text={text} />

      <BackgroundLayer bg={bg} onTransitionEnd={onLineComplete}/>

      <CharactersLayer characters={Array.from(characters.values())} />

      <TextLayer text={text} fastforward={fastForward} skipBreaks={skipBreaks}
                {...(state.disp.text ? {} : {className:"hide"})}
                 onBreak={onTextBreak} onClick={handleClick} />

      {state.disp.choices &&
        <ChoicesLayer choices={choices} setNewScene={setSceneNumber} />
      }

      <MenuLayer />
    </div>
  )
}

export default Window;
