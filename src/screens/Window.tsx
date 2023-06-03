import { useEffect, useState } from 'react';
import textScript from '../assets/game/scenes/scene21.txt';
import '../styles/game.scss';
import straliasJson from '../assets/game/stralias.json';
import AudioTsuki from '../utils/AudioTsuki';
import LineComponent from '../components/LineComponent';

const wave = new AudioTsuki()

const Window = () => {
  const [scene, setScene] = useState<string[]>([])
  const [index, setIndex] = useState(0) //line
  const [text, setText] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [bg, setBg] = useState('')

  //I have a very long text file. I want to display the first line that starts with `
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
    //check if multidimensional array is empty
    if (scene.length !== 0) {
      let i = index
      do {
        processLine(scene[i])
  
        i++
      } while (!scene[i].startsWith('`'))
      setIndex(i)

      let hasEnded
      if (scene[i + 1] !== undefined && scene[i + 1].startsWith(' ')) {
        hasEnded = false
      } else {
        hasEnded = true
      }

      let newText: any[] = text
      newText.push({ line: scene[i], hasEnded: hasEnded })
      setText(newText)
      setHistory([...history, { line: scene[i], hasEnded: hasEnded }])
    }
  }, [scene])
  

  //on press enter, go to next line
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
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
    if (text[text.length - 1].hasEnded) {
      do {
        processLine(scene[i])
        i++
      } while (!scene[i].startsWith('`'))
    } else {
      i++
    }
    setIndex(i)

    let hasEnded = true
    if (scene[i + 1] !== undefined && scene[i + 1].startsWith(' ')) {
      hasEnded = false
    }
    
    let newText: any[] = text

    //if previous array last element in history ends with \, reset text
    const lastElement = history[history.length - 1].line
    if (lastElement !== undefined && lastElement[lastElement.length - 1] === '\\') {
      newText = []
    }

    //push new line accompanied with hasEnded
    const newLine = { line: scene[i], hasEnded: hasEnded }
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
    <div className="window" onClick={handleClick}>
      <img src={"/" + bg} alt="background" className="background" />

      <div className="box-text">
        {text.map((line, i) =>
          <LineComponent key={i} line={line} />
        )}
      </div>

    </div>
  )
}

export default Window;