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

const playing_track = new AudioManager()

const Window = () => {
  const { state, dispatch } = useContext(store)
  const [sceneNumber, setSceneNumber] = useState(374)
  const [scene, setScene] = useState<string[]>([])
  const [choices, setChoices] = useState<Choice[]>([])
  const [index, setIndex] = useState(state.game.index) //line
  const [text, setText] = useState<Line[]>([]) //current text
  const [pages, setPages] = useState<Page[]>([])
  const [bg, setBg] = useState<Background>({ image: '', type: ''})
  const [characters, setCharacters] = useState<Character[]>([])

  useEffect(() => {
    setNewScene(sceneNumber)

    if (state.game.track !== '' && !playing_track.isPlaying()) {
      playing_track.loadAudio(state.game.track)
      playing_track.play()
      playing_track.setLoop(true)
    }
    return () => {
      playing_track.stop()
    }
  }, [])

  useEffect(() => {
    playing_track.setVolume(state.game.volume)
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
      if (e.key === 'Enter') { //TODO: empêcher de laisser appuyé
        nextLine()
      }
      if (e.ctrlKey) {
        nextLine()
      }
    }
    return addEventListener({event: 'keydown', handler: handleKeyDown})
  })
  
  //go to next line that starts with `
  const nextLine = (i = index) => {
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

  const processLine = (line: string) => {
    const prefix = line.split(' ')[0]

    switch(prefix) {
      case 'bg':
        foundBackground(line)
        break
      case 'play':
        foundPlay(line)
        break
      case 'playstop':
        foundPlaystop()
        break
      case 'wave':
        foundWave(line)
        break
      case 'waveloop':
        foundWaveloop(line)
        break
      case 'wavestop':
        foundWavestop(line)
        break
      case 'br':
        foundBr()
        break
      case 'ld':
        foundLd(line)
        break
      case 'cl':
        foundCl(line)
        break
      case 'waittimer':
        foundWaittimer(line)
        break
    }
    
    function foundBackground(line: string) {
      const bgTmp: Background = {
        image: line.split('"')[1],
        type: line.split(',')[1].replace('%', '')
      }
      if (bgTmp.image.includes('image\\event\\')) {
        dispatch({ type: 'ADD_GAME_EVENT_IMAGE', payload: bgTmp.image })
      }
      setBg(bgTmp)
    }

    function foundPlay(line: string) {
      const track = "CD/" + line.split('"')[1]
      if (playing_track.isPlaying()) playing_track.stop()
      playing_track.loadAudio(track)
      playing_track.play()
      playing_track.setLoop(true)
      playing_track.setVolume(state.game.volume)
      dispatch({ type: 'SET_GAME', payload: { ...state.game, track: track } })
    }

    function foundPlaystop() {
      playing_track.stop()
      dispatch({ type: 'SET_GAME', payload: { ...state.game, track: '' } })
    }

    function foundWave(line: string) {
      // wave se0
      let waveStr = line.split(' ')[1]
      const audio = new AudioManager()
      audio.loadAudio(STRALIAS_JSON[waveStr])
      audio.setVolume(state.game.volume)
      audio.play()
    }

    function foundWaveloop(line: string) {
      let waveStr = line.split(' ')[1]
      waveStr = STRALIAS_JSON[waveStr]
      // wave.handleAudio("play")
    }

    function foundWavestop(line: string) {
      // wave.handleAudio("stop")
    }

    function foundBr() {
      const newText: Line[] = text
      newText.push({ line: 'br' })
      setText(newText)
    }

    //add sprite
    function foundLd(line: string) {
      const characterTmp: Character = {
        image: line.split(',')[1].split('"')[1].split(':a;')[1].replace('image\\tachi\\', '').replace('.jpg', ''),
        type: line.split(',')[2].replace('%', ''),
        pos: line.split(',')[0].replace('ld ', '')
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
    function foundCl(line: string) {
      const pos = line.split(',')[0].replace('cl ', '')
      const newCharacters = characters.filter((c: Character) => c.pos !== pos)
      setCharacters(newCharacters)
    }

    function foundWaittimer(line: string) {
      const time = line.split(' ')[1]
      setTimeout(() => {
        console.log('waittimer')
      }, parseInt(time))
    }
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