import { useEffect, useState } from 'react';
import '../styles/game.scss';
import straliasJson from '../assets/game/stralias.json';
import AudioTsuki from '../utils/AudioTsuki';
import LineComponent from '../components/LineComponent';
import HistoryScreen from './HistoryScreen';
import { Choice, Line, Page } from '../types';
import { fetchChoices, fetchGoToNextScene, fetchScene } from '../utils/utils';
import ChoicesScreen from './ChoicesScreen';

const wave = new AudioTsuki()

const Window = () => {
  const [sceneNumber, setSceneNumber] = useState(20)
  const [scene, setScene] = useState<string[]>([])
  const [choices, setChoices] = useState<Choice[]>([])
  const [displayChoices, setDisplayChoices] = useState(false)
  const [index, setIndex] = useState(0) //line
  const [text, setText] = useState<Line[]>([]) //current text
  const [history, setHistory] = useState<Line[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [bg, setBg] = useState('')

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
    if (line.startsWith('bg ')) {
      let bg = line.split('"')[1]
      setBg(bg)
    } else if (line.startsWith('waveloop ')) {
      let waveStr = line.split(' ')[1]
      waveStr = JSON.parse(JSON.stringify(straliasJson))[waveStr]
      // wave.addWave(waveStr, true)
    } else if (line.startsWith('wavestop')) {
      // wave.handleAudio("stop", false)
    } else if (line.startsWith('br')) {
      let newText = text
      newText.push({ line: 'br' })
      setText(newText)
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

      <div className="box-text" onClick={handleClick}>
        {text.map((line, i) =>
          <LineComponent key={i} line={line} />
        )}
      </div>

      {displayChoices &&
        <ChoicesScreen choices={choices} setNewScene={setNewScene} />
      }
    </div>
  )
}

export default Window;