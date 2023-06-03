import { useEffect, useState } from 'react';
import textScript from '../assets/game/scenes/scene21.txt';
import '../styles/game.scss';
import straliasJson from '../assets/game/stralias.json';
import AudioTsuki from '../utils/AudioTsuki';
import LineComponent from '../components/LineComponent';
import HistoryScreen from './HistoryScreen';
import { Line, Page } from '../types';

const wave = new AudioTsuki()

const Window = () => {
  const [scene, setScene] = useState<string[]>([])
  const [index, setIndex] = useState(0) //line
  const [text, setText] = useState<Line[]>([]) //current text
  const [history, setHistory] = useState<Line[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [bg, setBg] = useState('')

  useEffect(() => {
    fetchScene()
  }, [])

  const fetchScene = async () => {
    const script = await fetch(textScript)

    const data = await script.text();

    //split data on \n or @
    const lines = data.split(/[\n@]/)
    const result: any = {};

    lines.forEach((line, index) => {
      result[index] = line
    });
    // console.log(result); // Check the output in the console

    setScene(result)
  }

  //init
  useEffect(() => {
    if (scene.length !== 0) {
      let i = index
      do {
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
    nextLine()
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
    </div>
  )
}

export default Window;