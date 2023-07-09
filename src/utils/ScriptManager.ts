import { commands as graphicCommands } from "../layers/GraphicsLayer"
import { commands as audioCommands } from "./AudioManager"
import { observe } from "./Observer"
import Timer from "./timer"
import { fetchScene } from "./utils"
import { commands as variableCommands, getGameVariable, gameContext } from "./variables"

type CommandHandler = {next: VoidFunction}
type CommandProcessFunction = (arg: string, cmd: string, onFinish: VoidFunction)=>CommandHandler|void
type CommandMap = Map<string, CommandProcessFunction|null>
type TextCallback = (str:string)=>void


let textCallback: TextCallback = (text:string)=> { pendingText = text }
let newPageCallback: VoidFunction = ()=> { pendingPage = true }
let returnCallback: VoidFunction = ()=> { pendingReturn = true }

let sceneLines: Array<string> = []
let currentCommand: CommandHandler|undefined
let pendingText: string|undefined = undefined
let pendingPage: boolean = false
let pendingReturn: boolean = false

export const script = {
  set onText(callback: TextCallback) {
    textCallback = callback
    if (pendingText) {
      callback(pendingText)
      pendingText = undefined
    }
  },
  set onPage(callback: VoidFunction) {
    newPageCallback = callback
    if (pendingPage) {
      callback()
      pendingPage = false
    }
  },
  set onReturn(callback: VoidFunction) {
    returnCallback = callback
    if (pendingReturn) {
      callback()
      pendingReturn = false
    }
  },
  next(): void {
    if (currentCommand)
      currentCommand.next()
  }
}
export default script

//##############################################################################
//#                                  COMMANDS                                  #
//##############################################################################

const commands:CommandMap = new Map(Object.entries({
  '`'         : processText,
  '\\'        : processText,
  'br'        : processText,

  'resettimer': null, // all 'waittimer' are immediately after 'resettimer'
  'waittimer' : processTimerCmd,
  '!w'        : processTimerCmd,

  'if'        : processIfCmd,
  'skip'      : (n: string)=>{ gameContext.index += parseInt(n)-1 },
  // return value prevents processing the next line
  'return'    : ()=> { returnCallback(); return {next:()=>{}} },

  'gosub'     : null,
  'goto'      : null,
  
  ...graphicCommands,
  ...audioCommands,
  ...variableCommands,
}))

function processTimerCmd(arg: string, _: string, onFinish: VoidFunction) {
  const time_to_wait = parseInt(arg)
  const timer = new Timer(time_to_wait, onFinish)
  timer.start()
  return {next: timer.skip.bind(timer)}
}

function checkIfCondition(condition: string) {
  const expression = condition.split(' ').map(token=> {
    let index
    while((index = token.search(/%\$/)) != -1) {
      const stopIndex = token.substring(index+1).search(/\W/)
      token = token.substring(0, index)
            + getGameVariable(token.substring(index, stopIndex))
            + token.substring(stopIndex)
    }
    return token
  }).join(' ')
  const f = new Function("return " + expression)
  return f()
}

function processIfCmd(arg: string, _: string, onFinish: VoidFunction) {

  let index = arg.search(/ [a-z]/)
  if (index == -1)
    throw Error(`no separation between condition and command: "if ${arg}"`)
  const condition = arg.substring(0, index)
  return checkIfCondition(condition) && processLine(arg.substring(index+1), onFinish)

}

function processText(text: string, cmd:string, onFinish: VoidFunction) {
  if (cmd == "br") {
    text = "\n"
  } else if (cmd == '\\') {
    text = "`\\"
  }
  if (!text.endsWith('\n'))
    text = text+'\n'
  let index
  let inlineTimer: CommandHandler|undefined
  const next = ()=> {
    if (inlineTimer) { // timer running.
      inlineTimer.next() // Fast-forward timer
    } else if (text.startsWith('\\')) {
      newPageCallback()
      onFinish()
    } else if (text.startsWith('!w')) {
      const cmdEndIndex = text.search(/ |$/)
      const time = text.substring(2, cmdEndIndex)
      text = text.substring(cmdEndIndex)
      inlineTimer = processTimerCmd('!w', time, ()=> {
        inlineTimer = undefined;
        next()
      })
    } else if (text.length > 0) {
      index = text.search(/@|\\|!\w|\n/)
      const breakChar = text.charAt(index)
      let token = text.substring(0, index)
      switch (breakChar) {
        case '@' :
        case '\n' :
          index ++
          token += breakChar
          break;
        case '\\' :
          token += breakChar
          break;
        case '!' :
          index = text.indexOf(' ', index)
          break
      }
      
      text = text.substring(index)
      textCallback(token)
    } else {
      onFinish()
    }
  }
  next()
  return { next }
}

//##############################################################################
//#                                 OBSERVERS                                  #
//##############################################################################

export function processLine(line: string, onFinish: VoidFunction) {
  let cmd, args, i
  if (line.startsWith('`')) {
    cmd = '`'
    args = line.substring(1)
  } else {
    if (line.startsWith('!')) {
      i = line.search(/\d|$/)
    } else {
      i = line.indexOf(' ')
    }
    if (i == -1)
      i = line.length
    cmd = line.substring(0, i)
    args = line.substring(i+1)
    if (args.endsWith('\\')) {
      args = args.substring(0, args.length-1)
      const originalOnFinish = onFinish
      onFinish = ()=> {
        processLine('\\', originalOnFinish)
      }
    }
  }
  if (!commands.has(cmd)) {
    const {scene, index} = gameContext
    console.error(`unknown command scene ${scene}:${index}: ${line}`)
  }

  currentCommand = commands.get(cmd)?.(args, cmd, onFinish) as typeof currentCommand
  if (!currentCommand)
    onFinish()
}

function incrementLineIndex() {
  currentCommand = undefined
  gameContext.index++
}
function processCurrentLine() {
  if (sceneLines?.length > 0 && gameContext.index < sceneLines.length) {
    if (gameContext.index == 0)
      newPageCallback()
    
    let line = sceneLines[gameContext.index]
    console.log(`Processing line ${gameContext.index}: ${line}`)
    processLine(line, incrementLineIndex)
  } else if (sceneLines?.length == 0 ?? true){
    console.error(`Cannot process line ${gameContext.index}: scene not loaded`)
  } else { // index > sceneLines.length
    console.error(`Reached end of file`)
  }
}

function loadScene(sceneNumber: number) {
  console.log(`loading scene $${sceneNumber}.`)
  sceneLines = []
  if (sceneNumber > 0) {
    fetchScene(sceneNumber).then(lines=>{
      sceneLines = lines
      console.log(`scene $${sceneNumber} loaded. ${sceneLines.length} lines.`)
      processCurrentLine()
    })
  }
}

observe(gameContext, 'scene', loadScene)
observe(gameContext, 'index', processCurrentLine)

//###   SET HERE FOR DEBUG PURPOSE   ###
gameContext.scene = 20
