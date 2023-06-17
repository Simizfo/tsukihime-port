import { useContext, useEffect, useState } from 'react';
import '../styles/game.scss';
import { AudioManager } from '../utils/AudioManager';
import HistoryLayer from '../layers/HistoryLayer';
import { Background, Character, Choice, Line, Page } from '../types';
import { fetchChoices, fetchGoToNextScene, fetchScene, addEventListener, getTrackFile } from '../utils/utils';
import ChoicesLayer from '../layers/ChoicesLayer';
import CharactersLayer from '../layers/CharactersLayer';
import TextLayer from '../layers/TextLayer';
import BackgroundLayer from '../layers/BackgroundLayer';
import { store } from '../context/GameContext';
import MenuLayer from '../layers/MenuLayer';
import { HISTORY_MAX_PAGES, STRALIAS_JSON } from '../utils/constants';

const audio = new AudioManager()
let timer: number|null = null;

const Window = () => {
  const { state, dispatch } = useContext(store)
  const [sceneNumber, setSceneNumber] = useState(20)
  const [scene, setScene] = useState<string[]>([])
  const [choices, setChoices] = useState<Choice[]>([])
  const [index, setIndex] = useState(state.game.index) //line
  const [text, setText] = useState<Line[]>([]) //current text
  const [pages, setPages] = useState<Page[]>([])
  const [bg, setBg] = useState<Background>(state.game.bg)
  const [characters, setCharacters] = useState<Map<string,Character>>(new Map())

  useEffect(() => {
    dispatch({ type: 'SET_GAME', payload: { ...state.game, bg: bg } })
  }, [bg])

  useEffect(() => {
    setNewScene(sceneNumber)

    if (state.game.track !== '' && !audio.isTrackPlaying()) {
      audio.setSoundFileUrl(state.game.track,  "CD/" + state.game.track), 
      audio.playTrack(state.game.track, true)
    }
    return () => {
      audio.stopTrack()
      audio.stopSE()
    }
  }, [])

  useEffect(() => {
    audio.masterVolume = state.game.volume.master;
    audio.trackVolume = state.game.volume.track;
    audio.seVolume = state.game.volume.se;
  }, [state.game.volume])

  useEffect(() => {
    if (scene.length !== 0) nextLine()
  }, [scene])

  const setNewScene = async (sceneNumber: number) => {
    setIndex(0)
    setText([])
    setSceneNumber(sceneNumber)
    const sceneTmp = await fetchScene(sceneNumber)
    setScene(sceneTmp)
    const choicesTmp = await fetchChoices(sceneNumber)
    setChoices(choicesTmp)
    dispatch({ type: 'SET_DISP_CHOICES', payload: false })
  }

  useEffect(() => {
    if (choices.length === 0 && state.disp.choices) {
      goToNextScene()
    }
  }, [state.disp.choices])

  const goToNextScene = async () => {
    const nextScene = await fetchGoToNextScene(sceneNumber)
    setNewScene(nextScene)
  }

  useEffect(() => {
    if (pages.length > HISTORY_MAX_PAGES) {
      setPages(pages.slice(1)) //limit history pages
    }
  }, [pages])

  //on press enter, go to next line
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.repeat) {
        nextLine()
      }
      if (e.ctrlKey) {
        nextLine()
      }
    }
    return addEventListener({event: 'keydown', handler: handleKeyDown})
  })
  
  //go to next line that starts with `
  const nextLine = async (i = index) => {
    //check if previous line has ended
    if (text[text.length - 1]?.lineHasEnded || text.length === 0) {
      do {
        if (scene[i] === "return") {
          dispatch({ type: 'SET_DISP_CHOICES', payload: true })
          return
        }
        processLine(scene[i])
        i++
      } while (!scene[i]?.startsWith('`'))
    } else {
      i++
    }
    setIndex(i)
    setters(i)
  }

  const setters = (i: number) => {
    const lineHasEnded = !(scene[i + 1]?.startsWith(' '))
    
    let newText: Line[] = text

    const previousLine = text[text.length - 1]
    if (previousLine?.line.endsWith('\\')) { // reset text and add the page to pages
      setPages([...pages, text])
      newText = []
    }

    const newLine = { line: scene[i], lineHasEnded: lineHasEnded, read: true }
    newText.push(newLine)
    setText(newText)
  }

  const getVariable = (name: string) => {
    const variables = state.game.variables;
    for (const variable of variables) {
      if (variable.name == name)
        return variable.value;
    }
    return null;
  }

  function ignore() {
    //do nothing
  }
  const commands = {
    'bg'        : processImage,
    'ld'        : processImage,
    'cl'        : processImage,
    'play'      : processAudio,
    'playstop'  : processAudio,
    'wave'      : processAudio,
    'waveloop'  : processAudio,
    'wavestop'  : processAudio,
    'br'        : processBr,
    'resettimer': processTimer,
    'waittimer' : processTimer,
    'mov'       : processVar,
    'add'       : processVar,
    'sub'       : processVar,
    'inc'       : processVar,
    'dec'       : processVar,
    'gosub'     : ignore, // TODO jump to label, then jump back to next line on return
    'goto'      : ignore, // TODO jump to label, no return
  };

  async function processLine(line: string) {

    if (!/^[a-zA-Z]/.test(line))
      return; // not a command (does not start with a letter)
    //TODO line that start with '*' are labels used by gosub and goto
    
    let index = line.indexOf(' ');
    if (index === -1)
      index = line.length;
    const cmd = line.substring(0, index);
    const arg = line.substring(index+1);
    //TODO replace known variables in args ?
    if (cmd in commands)
      await commands[cmd as keyof typeof commands](arg, cmd);
    else
      console.error(`unknown command [${line}]`);
  }

  function processAudio(arg: string, cmd: string) {
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

  function processBr() {
    const newText: Line[] = text
    newText.push({ line: 'br' })
    setText(newText)
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
        const bgTmp: Background = {
          image: image as string,
          type: type
        }
        if (bgTmp.image.includes('event\\')) {
          dispatch({ type: 'ADD_GAME_EVENT_IMAGE', payload: image })
        }
        setBg(bgTmp)
    }
  }

  function processTimer(arg: string, cmd: string) {
    switch (cmd) {
      case 'resettimer' :
        timer = Date.now()
        break
      case 'waittimer' :
        let time_to_wait = parseInt(arg)
        if (timer !== null)
          time_to_wait = timer + time_to_wait - Date.now();
        
        return new Promise((resolve)=> {
          setTimeout(resolve, time_to_wait)
          //TODO store 'resolve', and call it to skip timer
        });
      default : throw Error(`unknown timer command ${cmd} ${arg}`)
    }
  }

  function processVar(arg: string, cmd: string) {
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
  const handleClick = () => {
    if (!state.disp.choices) {
      nextLine()
    }
  }

  return (
    <div className="window">
      <HistoryLayer pages={pages} text={text} />

      <BackgroundLayer bg={bg} />

      <CharactersLayer characters={Array.from(characters.values())} />

      <TextLayer text={text} handleClick={handleClick} />

      {state.disp.choices &&
        <ChoicesLayer choices={choices} setNewScene={setNewScene} />
      }

      <MenuLayer />
    </div>
  )
}

export default Window;