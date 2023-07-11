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

let pendingText: string|undefined = undefined
let pendingPage: boolean = false
let pendingReturn: boolean = false
let textCallback: TextCallback = (text:string)=> { pendingText = text }
let newPageCallback: VoidFunction = ()=> { pendingPage = true }
let returnCallback: VoidFunction = ()=> { pendingReturn = true }

let sceneLines: Array<string> = []
let currentCommand: CommandHandler|undefined

export const script = {
  /**
   * Set the callback to call when text must be displayed in the game
   */
  set onText(callback: TextCallback) {
    textCallback = callback
    if (pendingText) {
      callback(pendingText)
      pendingText = undefined
    }
  },
  /**
   * Set the callback to call when the text page has ended
   */
  set onPage(callback: VoidFunction) {
    newPageCallback = callback
    if (pendingPage) {
      callback()
      pendingPage = false
    }
  },
  /**
   * Set the callback to call when the 'return' command has been reached in the script.
   * The script will not automatically move to the next line.
   */
  set onReturn(callback: VoidFunction) {
    returnCallback = callback
    if (pendingReturn) {
      callback()
      pendingReturn = false
    }
  },
  /**
   * function to call to move to the next step of the current command.
   * Most commands will interpet it as a "skip".
   */
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
  // return value prevents automatically processing the next line
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
  // make the expression evaluable by replacing
  // variable names by their values
  const expression = condition.split(' ').map(token=> {
    let index
    //search for '%' or '$' that start variables
    while((index = token.search(/%\$/)) != -1) {
      const stopIndex = token.substring(index+1).search(/\W/)
      // replace the variable by its value
      token = token.substring(0, index)
            + getGameVariable(token.substring(index, stopIndex))
            + token.substring(stopIndex)
    }
    return token
  }).join(' ')
  // transform the expression into an executable function, and return the result
  const f = new Function("return " + expression)
  return f()
}

function processIfCmd(arg: string, _: string, onFinish: VoidFunction) {

  let index = arg.search(/ [a-z]/)
  if (index == -1)
    throw Error(`no separation between condition and command: "if ${arg}"`)
  const condition = arg.substring(0, index)
  if (checkIfCondition(condition))
    return processLine(arg.substring(index+1), onFinish)

}

function processText(text: string, cmd:string, onFinish: VoidFunction) {
  // special cases : 'br' and '\' command are transformed into text
  if (cmd == "br")
    text = "\n"
  else if (cmd == '\\')
    text = "\\"
  
  // make sure the text line ends with a '\n'
  if (!text.endsWith('\n'))
    text = text+'\n'
  
  // split the text on inline timers.
  const inlineTimerIndex = text.search('!w');
  if (inlineTimerIndex >= 0)
  {
    const endIndex = text.indexOf(' ', inlineTimerIndex)
    const textAfter = text.substring(endIndex)
    const inlineTimer = text.substring(inlineTimerIndex, endIndex)
    // once the text before the timer is processed,
    // execute the timer, and then process the remaining text.
    onFinish = processLine.bind(null, inlineTimer,
        processLine.bind(null, `\`${textAfter}`, onFinish))
    text = text.substring(0, inlineTimerIndex)
  }
  
  let index
  // the text is split into tokens at all '@' and '\'.
  // tokens are sent one at a time to the script.onText
  // at every call of script.next.
  const next = ()=> {
    if (text.startsWith('\\')) {
      newPageCallback()
      onFinish()
    } else if (text.length > 0) {
      index = text.search(/@|\\|\n|$/)
      const breakChar = text.charAt(index)
      let token = text.substring(0, index+1)
      if (breakChar != '\\')
        index ++

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

/**
 * Execute the script line. Extract the command name and arguments from the line,
 * and calls the appropriate function to process it.
 * Update currentCommand. When a line must be split into multiple commands,
 * use this function to process all sub-commands
 * @param line the script line to process
 * @param onFinish callback function called when the line has been processed
 */
export function processLine(line: string, onFinish: VoidFunction) {
  let cmd, args, i
  if (line.startsWith('`')) {
    // following space (if present) is part of the argument
    cmd = '`'
    args = line.substring(1)
  } else {
    if (line.startsWith('!')) {
      // argument is not separated from the command name by a space
      i = line.search(/\d|$/)
    } else {
      i = line.indexOf(' ')
    }
    // split the line into [cmd, arguments]
    if (i == -1)
      i = line.length
    cmd = line.substring(0, i)
    args = line.substring(i+1)
    // if the line ends with a '\' and is not a text command,
    // execute the '\' command separately
    if (args.endsWith('\\')) {
      args = args.substring(0, args.length-1)
      //when the first command finishes, execute the '\\' command
      onFinish = processLine.bind(null, '\\', onFinish)
    }
  }
  if (!commands.has(cmd)) {
    const {scene, index} = gameContext
    console.error(`unknown command scene ${scene}:${index}: ${line}`)
  }

  currentCommand = commands.get(cmd)?.(args, cmd, onFinish) as typeof currentCommand
  // if the command does not return a CommandHandler,
  // it has been executed instantly and won't call the onFinish callback
  if (!currentCommand)
    onFinish()
}

/**
 * Default callback for script lines.
 * Move to next script line.
 */
function incrementLineIndex() {
  currentCommand = undefined
  gameContext.index++
}
/**
 * Executed when {@link gameContext.index} is modified,
 * or when the scene is loaded.
 * Calls the execution of the command at the current line index
 * in the scene file
 */
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

/**
 * Executed when {@link gameContext.scene} is modified.
 * loads the scene and starts the execution of lines.
 * {@link gameContext.index} is not modified. to start a scene from the beginning,
 * set {@link gameContext.scene} to 0.
 * @param sceneNumber number of the scene to load.
 */
function loadScene(sceneNumber: number) {
  console.log(`loading scene ${sceneNumber}.`)
  sceneLines = []
  if (sceneNumber > 0) {
    fetchScene(sceneNumber).then(lines=>{
      sceneLines = lines
      console.log(`scene ${sceneNumber} loaded. ${sceneLines.length} lines.`)
      processCurrentLine()
    })
  }
}

observe(gameContext, 'scene', loadScene)
observe(gameContext, 'index', processCurrentLine)

//###   SET HERE FOR DEBUG PURPOSE   ###
