import { useContext, useEffect, useState } from 'react';
import '../styles/game.scss';
import { AudioManager } from '../utils/AudioManager';
import HistoryLayer from '../layers/HistoryLayer';
import { Background, Character, Choice, Line, Page } from '../types';
import { fetchChoices, fetchGoToNextScene, fetchScene, addEventListener } from '../utils/utils';
import ChoicesLayer from '../layers/ChoicesLayer';
import CharactersLayer from '../layers/CharactersLayer';
import TextLayer from '../layers/TextLayer';
import BackgroundLayer from '../layers/BackgroundLayer';
import { store } from '../context/GameContext';
import MenuLayer from '../layers/MenuLayer';
import { HISTORY_MAX_PAGES, STRALIAS_JSON } from '../utils/constants';

const audio = new AudioManager()

const Window = () => {
  const { state, dispatch } = useContext(store)
  const [sceneNumber, setSceneNumber] = useState(20)
  const [scene, setScene] = useState<string[]>([])
  const [choices, setChoices] = useState<Choice[]>([])
  const [index, setIndex] = useState(state.game.index) //line
  const [text, setText] = useState<Line[]>([]) //current text
  const [pages, setPages] = useState<Page[]>([])
  const [bg, setBg] = useState<Background>(state.game.bg)
  const [characters, setCharacters] = useState<Character[]>([])

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
    }
  }, [])

  useEffect(() => {
    audio.masterVolume = state.game.volume;
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

  function ignore() {
    //do nothing
  }
  const commands = {
    'bg'        : processBg,
    'play'      : processPlay,
    'playstop'  : processPlaystop,
    'wave'      : processWave,
    'waveloop'  : processWaveloop,
    'wavestop'  : processWavestop,
    'br'        : processBr,
    'ld'        : processLd,
    'cl'        : processCl,
    'resettimer': ignore, //'resettimer' and 'waittimer' are always together
    'waittimer' : processWaittimer,
    'mov'       : ignore, // TODO store variable
    'gosub'     : ignore, // TODO jump to label, then jump back to next line on return
    'goto'      : ignore, // TODO jump to label, no return
  };

  const processLine = async (line: string) => {

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
      await commands[cmd as keyof typeof commands](arg);
    else
      console.error(`unknown command [${line}]`);
  }
    
  function processBg(arg: string) {
    //TODO : process correctly $xxxxxxx / #xxxxxxx backgrounds
    const [bg, type] = arg.split(',').map(x=>x.trim());
    
    if (bg.startsWith('"') && bg.endsWith('"')) {
      const bgTmp: Background = {
        image: bg.substring(1, bg.length-1),
        type: type.replace('%', '')
      }
      if (bgTmp.image.includes('image\\event\\')) {
        dispatch({ type: 'ADD_GAME_EVENT_IMAGE', payload: bgTmp.image })
      }
      setBg(bgTmp)
    }
    else if (bg.startsWith('#')) { // color
      //TODO
    }
    else if (bg.startsWith('$')) { //variable
      //TODO
    }
    else {
      throw Error(`Ill-formed 'bg' command arguments [${arg}]`)
    }
  }

  function processPlay(arg: string) {
    const name = arg.split('"')[1];
    const path = "CD/" + name;
    audio.setSoundFileUrl(name, path);
    audio.playTrack(name, true);
    audio.masterVolume = state.game.volume
    dispatch({ type: 'SET_GAME', payload: { ...state.game, track: name } })
  }

  function processPlaystop() {
    audio.stopTrack()
    dispatch({ type: 'SET_GAME', payload: { ...state.game, track: '' } })
  }

  function processWave(arg: string) {
    let waveStr = arg
    audio.setSoundFileUrl(waveStr, STRALIAS_JSON[waveStr])
    audio.masterVolume = state.game.volume;
    audio.playSE(waveStr);
  }

  function processWaveloop(arg: string) {
    let waveStr = arg
    audio.setSoundFileUrl(waveStr, STRALIAS_JSON[waveStr])
    audio.masterVolume = state.game.volume;
    audio.playSE(waveStr, true);
  }

  function processWavestop() {
    audio.stopSE();
  }

  function processBr() {
    const newText: Line[] = text
    newText.push({ line: 'br' })
    setText(newText)
  }

  //add sprite
  function processLd(arg: string) {
    let [pos, image, type] = arg.split(',');
    if (image.startsWith('"') && image.endsWith('"')) {
      image = image.substring(1, image.length-1)
                   .replace('image\\tachi\\', '')
                   .replace('image/tachi/', '')
                   .replace('.jpg', '')
                   .replace(':a;', '')
    }
    else if (image.startsWith('$')) { // variable
      //TODO
    }
    else {
      throw Error(`Ill-formed 'ld' command arguments [${arg}]`)
    }
    const characterTmp: Character = {
      image: image,
      type: type.replace('%', ''),
      pos: pos
    }

    //if there is already a character with the same position, replace it
    const index = characters.findIndex((c: Character) => c.pos === characterTmp.pos)
    const newCharacters = [...characters]
    if (index !== -1) {
      newCharacters[index] = characterTmp
    } else {
      newCharacters.push(characterTmp)
    }
    setCharacters(newCharacters)
  }

  //remove sprite
  function processCl(arg: string) {
    const pos = arg.split(',')[0]
    const newCharacters = characters.filter((c: Character) => c.pos !== pos)
    setCharacters(newCharacters)
  }

  function processWaittimer(arg: string) {
    const time = parseInt(arg)
    return new Promise((resolve)=> {
      setTimeout(resolve, time)
    });
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

      <CharactersLayer characters={characters} />

      <TextLayer text={text} handleClick={handleClick} />

      {state.disp.choices &&
        <ChoicesLayer choices={choices} setNewScene={setNewScene} />
      }

      <MenuLayer />
    </div>
  )
}

export default Window;