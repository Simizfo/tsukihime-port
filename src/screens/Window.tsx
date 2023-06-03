import { useEffect, useState } from 'react';
import '../styles/game.scss';
import straliasJson from '../assets/game/stralias.json';
import AudioTsuki from '../utils/AudioTsuki';
import LineComponent from '../components/LineComponent';
import HistoryScreen from './HistoryScreen';
import { Character, Choice, Line, Page } from '../types';
import { fetchChoices, fetchGoToNextScene, fetchScene } from '../utils/utils';
import ChoicesLayerScreen from './ChoicesLayerScreen';
import CharactersLayerScreen from './CharactersLayerScreen';

const wave = new AudioTsuki()

const Window = () => {
  const [sceneNumber, setSceneNumber] = useState(21) //20
  const [scene, setScene] = useState<string[]>([])
  const [choices, setChoices] = useState<Choice[]>([])
  const [displayChoices, setDisplayChoices] = useState(false)
  const [index, setIndex] = useState(0) //line
  const [text, setText] = useState<Line[]>([]) //current text
  const [history, setHistory] = useState<Line[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [bg, setBg] = useState('')
  const [characters, setCharacters] = useState<Character[]>([])

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const sceneTmp = await fetchScene(sceneNumber)
    setScene(sceneTmp)
    const choicesTmp = await fetchChoices(sceneNumber)
    setChoices(choicesTmp)
  }

  //init
  useEffect(() => {
    if (scene.length !== 0) {
      let i = index
      do {
        if (scene[i] === "return") {
          setDisplayChoices(true)
          return
        }
        processLine(scene[i])
  
        i++
      } while (!scene[i].startsWith('`'))
      setIndex(i)

      let lineHasEnded = true
      if (scene[i + 1] !== undefined && scene[i + 1].startsWith(' ')) {
        lineHasEnded = false
      }

      let newText: Line[] = text
      newText.push({ line: scene[i], lineHasEnded: lineHasEnded, read: true })
      setText(newText)
      setHistory([...history, { line: scene[i], lineHasEnded: lineHasEnded }])
    }
  }, [scene])

  const setNewScene = async (sceneNumber: number) => {
    setIndex(0)
    setText([])
    setSceneNumber(sceneNumber)
    const sceneTmp = await fetchScene(sceneNumber)
    setScene(sceneTmp)
    const choicesTmp = await fetchChoices(sceneNumber)
    setChoices(choicesTmp)
    setDisplayChoices(false)
  }

  useEffect(() => {
    if (choices.length === 0 && displayChoices) {
      goToNextScene()
    }
  }, [displayChoices])

  const goToNextScene = async () => {
    const nextScene = await fetchGoToNextScene(sceneNumber)
    setNewScene(nextScene)
  }

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
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  })

  //go to next line that starts with `
  const nextLine = () => {
    let i = index

    //check if previous line has ended
    if (text[text.length - 1].lineHasEnded) {
      do {
        if (scene[i] === "return") {
          setDisplayChoices(true)
          return
        }
        processLine(scene[i])
        i++
      } while (!scene[i].startsWith('`'))
    } else {
      i++
    }
    setIndex(i)

    let lineHasEnded = true
    if (scene[i + 1] !== undefined && scene[i + 1].startsWith(' ')) {
      lineHasEnded = false
    }
    
    let newText: Line[] = text

    //if previous array last element in history ends with \, reset text and add the page to pages
    const lastElement = history[history.length - 1].line
    if (lastElement !== undefined && lastElement[lastElement.length - 1] === '\\') {
      setPages([...pages, text])
      newText = []
    }

    const newLine = { line: scene[i], lineHasEnded: lineHasEnded, read: true }
    newText.push(newLine)
    setText(newText)
    setHistory([...history, newLine])
  }

  const processLine = (line: string) => {
    if (line.startsWith('bg ')) { //background
      let bg = line.split('"')[1]
      setBg(bg)
    } else if (line.startsWith('waveloop ')) { //loop wave
      let waveStr = line.split(' ')[1]
      waveStr = JSON.parse(JSON.stringify(straliasJson))[waveStr]
      // wave.addWave(waveStr, true)
    } else if (line.startsWith('wavestop')) { //stop wave
      // wave.handleAudio("stop", false)
    } else if (line.startsWith('br')) { //saut de ligne
      let newText = text
      newText.push({ line: 'br' })
      setText(newText)
    } else if (line.startsWith('ld ')) { //ajoute un sprite personnage
      //ld c,":a;image\tachi\stk_t01.jpg",%type_lshutter_fst
      let character:Character = {
        image: line.split(',')[1].split('"')[1].split(':a;')[1].replace('image\\tachi\\', '').replace('.jpg', ''),
        type: line.split(',')[2].replace('%', ''),
        pos: line.split(',')[0].replace('ld ', '')
      }

      //if there is already a character with the same position, replace it
      const index = characters.findIndex((c: Character) => c.pos === character.pos)
      if (index !== -1) {
        const newCharacters = characters
        newCharacters[index] = character
        setCharacters(newCharacters)
      } else {
        setCharacters([...characters, character])
      }
    } else if (line.startsWith('cl ')) { //enlève un sprite personnage
      const pos = line.split(',')[0].replace('cl ', '')
      const newCharacters = characters.filter((c: Character) => c.pos !== pos)
      setCharacters(newCharacters)
    }
  }

  const handleClick = () => {
    if (!displayChoices) {
      nextLine()
    }
  }

  return (
    <div className="window">
      <HistoryScreen pages={pages} text={text} />

      <img src={"/" + bg} alt="background" className="background" />

      <CharactersLayerScreen characters={characters} />

      <div className="box-text" onClick={handleClick}>
        <div className="text-container">
          {text.map((line, i) =>
            <LineComponent key={i} line={line} isLastLine={text.length - 1 === i} />
          )}
        </div>
      </div>

      {displayChoices &&
        <ChoicesLayerScreen choices={choices} setNewScene={setNewScene} />
      }
    </div>
  )
}

export default Window;