import { useContext, useEffect, useRef, useState } from 'react';
import '../styles/game.scss';
import audio from '../utils/AudioManager';
import HistoryLayer from '../layers/HistoryLayer';
import { Background, Character, Choice } from '../types';
import { Queue, fetchChoices, fetchGoToNextScene, fetchScene } from '../utils/utils';
import ChoicesLayer from '../layers/ChoicesLayer';
import CharactersLayer from '../layers/CharactersLayer';
import TextLayer from '../layers/TextLayer';
import BackgroundLayer from '../layers/BackgroundLayer';
import { store } from '../context/GameContext';
import MenuLayer from '../layers/MenuLayer';
import { HISTORY_MAX_PAGES, STRALIAS_JSON } from '../utils/constants';
import KeyMap from '../utils/KeyMap';

let timer: number|null = null;
const INIT_SCENE = 20

const keyMapping = {
  "next": [{key: "Enter", repeat: false},
           {key: "Control", repeat: true}],
  "graphics": {code: "Space", repeat: false},
  "menu": {key: "Escape", repeat: false/*, [KeyMap.condition]: ()=>TODO not in menu*/ },
  "back": {key: "Escape", repeat: false},
  "save": {key: "S", ctrlKey: true/*, [KeyMap.condition]: ()=>true*/ }
}

const Window = () => {
  const { state, dispatch } = useContext(store)
  const [sceneNumber, setSceneNumber] = useState(INIT_SCENE)
  const [scene, setScene] = useState<string[]>([])
  const [choices, setChoices] = useState<Choice[]>([])
  const [lineIdx, setLineIdx] = useState(state.game.index) //line index in scene file
  const [text, setText] = useState<string[]>([]) //text on current page
  const [pages, setPages] = useState<Queue<string[]>>(new Queue([], HISTORY_MAX_PAGES))
  const [bg, setBg] = useState<Background>(state.game.bg)
  const [characters, setCharacters] = useState<Map<string,Character>>(new Map())
  const keyMap = useRef<KeyMap>(new KeyMap(keyMapping))
  const lastBreak = useRef<string>('')
  const [skipBreaks, setSkipBreaks] = useState<number>(0)
  const [fastForward, setFastForward] = useState<boolean>(false)

//##############################################################################
//#                                    INIT                                    #
//##############################################################################

  useEffect(() => {
    setSceneNumber(INIT_SCENE)

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

  keyMap.current.setCallback((action: string, _event: KeyboardEvent)=> {
    switch(action) {
      case "next" : next(); break
      case "graphics":
        if(!state.disp.menu && !state.disp.history)
          toggleGraphics();
        break
      case "menu" :
        dispatch({ type: 'SET_DISP_MENU', payload: !state.disp.menu })
        break
      case "back" : break
      case "save" : return true //prevent default behaviour of Ctrl+S
    }
  })

  useEffect(() => {
    dispatch({ type: 'SET_GAME', payload: { ...state.game, bg: bg } })
  }, [bg])

  useEffect(() => {
    audio.masterVolume = state.game.volume.master;
    audio.trackVolume = state.game.volume.track;
    audio.seVolume = state.game.volume.se;
  }, [state.game.volume])

//##############################################################################
//#                              SCENE PROCESSING                              #
//##############################################################################
/*
  useEffect(() => {
    if (scene.length !== 0)
     nextLine()
  }, [scene])
*/
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
    switch(breakChar) {
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

  function onLineComplete() {
    setSkipBreaks(0)
    if (lastBreak.current == '\\') {
      setPages(new Queue<string[]>(pages).push(text))
      setText([])
    }
    lastBreak.current = ''
    setLineIdx(lineIdx+1)
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
    'resettimer': processTimer,
    'waittimer' : processTimer,
    'mov'       : processVarCmd,
    'add'       : processVarCmd,
    'sub'       : processVarCmd,
    'inc'       : processVarCmd,
    'dec'       : processVarCmd,
    'return'    : processReturn,
    'gosub'     : null,
    'goto'      : null,
  }

  function processCmd(line: string) {

    if (!/^[a-zA-Z]/.test(line))
      return; // not a command (does not start with a letter)
    //TODO line that start with '*' are labels used by gosub and goto

    let index = line.indexOf(' ');
    if (index === -1)
      index = line.length;
    const cmd = line.substring(0, index);
    const arg = line.substring(index+1);
    //TODO replace known variables in args ?
    if (cmd in commands) {
      const wait = commands[cmd as keyof typeof commands]?.(arg, cmd)
      if (!wait)
        onLineComplete()
    }
    else
      console.error(`unknown command [${line}]`);
  }

  function processBr() {
    setText([...text, "br"])
  }

  /**
   * "*5" -> track05.ogg
   */
  function getTrackFile(track: string): string {
    const paddedNumber = track.replace(/\D/g, '').padStart(2, '0');
    return `track${paddedNumber}.ogg`;
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

  function processTimer(arg: string, cmd: string) {
    switch (cmd) {
      case 'resettimer' : break
      case 'waittimer' :
        let time_to_wait = parseInt(arg)
        if (timer !== null)
          time_to_wait = timer + time_to_wait - Date.now();
        setTimeout(onLineComplete, time_to_wait)
        return true
      default : throw Error(`unknown timer command ${cmd} ${arg}`)
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
        if (!state.disp.choices) {
          next()
        }
        break
      case 1 : // middle button
        break
      case 2 : // right button
        toggleGraphics()
        break
      case 3 : // back button
        break
      case 4 : // forward button
        break
      default :
        console.error(`unknown mouse button ${evt.button}`)
        break
    }
  }

  return (
    <div className="window" tabIndex={-1} /*tabindex attribute necessary for keyboard event*/
         onKeyDown={keyMap.current.onKeyEvent as any as React.KeyboardEventHandler}>
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
