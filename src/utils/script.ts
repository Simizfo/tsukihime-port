import { commands as graphicCommands } from "../layers/GraphicsLayer"
import { Choice } from "../types"
import { commands as audioCommands } from "./AudioManager"
import { observe } from "./Observer"
import Timer from "./timer"
import { fetchFBlock, fetchScene } from "./utils"
import { commands as variableCommands, getGameVariable, gameContext, settings } from "./variables"

type CommandHandler = {next: VoidFunction}
type CommandProcessFunction = (arg: string, cmd: string, onFinish: VoidFunction)=>CommandHandler|void
type CommandMap = Map<string, CommandProcessFunction|null>
type TextCallback = (str:string)=>void
type ChoicesCallback = (choices: Choice[])=>void

let pendingText: string|undefined = undefined
let pendingPage: boolean = false
let pendingChoices: Choice[]|undefined = undefined
let textCallback: TextCallback = (text)=> { pendingText = text }
let newPageCallback: VoidFunction = ()=> { pendingPage = true }
let choicesCallback: ChoicesCallback = (choices)=> { pendingChoices = choices }

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
   * Set the callback to call when the 'select' command i reached
   */
  set onChoices(callback: (choices: Choice[])=>void) {
    choicesCallback = callback
    if (pendingChoices) {
      callback(pendingChoices)
      pendingChoices = undefined
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
  'skip'      : processScriptMvmt,
  'goto'      : processScriptMvmt,
  'gosub'     : processScriptMvmt,
  'return'    : processScriptMvmt,

  'select'    : processChoices,

  '*'         : null,
  '!s'        : null,

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
    while((index = token.search(/[%\$]/)) != -1) {
      const stopIndex = token.substring(index+1).search(/\W/)+index+1
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

function processScriptMvmt(arg: string, cmd: string) {
  arg = arg.trim()
  switch (cmd) {
    case 'skip' :
      gameContext.index += parseInt(arg)-1;
      return;
    case 'goto' :
      if (/^\*f\d+a?$/.test(arg)) {
        gameContext.label = arg.substring(1)
        gameContext.index = 0
        return {next:()=>{}}; // prevent processing next line
      } else if (arg == "*endofplay") {
        //TODO end session, return to title screen
        return
      } else {
        return
      }
    case 'gosub' :
      if (arg == "*right_phase" || arg == "*left_phase") {
        //TODO process right_pahse, with vars temp.phase_bg,
        // temp.phase_title_a, temp.phase_title_b
      } else if (arg == "*ending") {
        // ending is called from the scene. If necessary, set the scene
        // as completed before jumping to ending
      }
      if (/^\*s\d+a?$/.test(arg)) {
        //TODO ask skip if already read
        gameContext.label = arg.substring(1)
        gameContext.index = 0
        return {next:()=>{}}; // prevent processing next line
      } else {
        return
      }
    case 'return' :
      onSceneEnd();
      return {next:()=>{}}; // prevent processing next line
  }
}

function processChoices(arg: string) {
  const choices: Choice[] = []
  const tokens = arg.split(/`,|(?<=\*\w+),/)
  for (let i = 0; i < tokens.length; i+= 2) {
    choices.push({
      str: tokens[i].trim().substring(1), // remove '`'
      label: tokens[i+1].trim().substring(1) // remove '*'
    })
  }
  choicesCallback(choices)
  return {next:()=>{}}; // prevent processing next line
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
    const {label: scene, index} = gameContext
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
  } else if (sceneLines?.length > 0 && gameContext.index > sceneLines.length) {
    onSceneEnd()
  }
}

/**
 * Executed when {@link gameContext.label} is modified.
 * Loads the scene or script block and starts the execution of lines.
 * {@link gameContext.index} is not modified.
 * To start from line 0, set {@link gameContext.index} to 0.
 * @param label id of the scene or block to load.
 */
async function loadLabel(label: string) {
  console.log(`load label ${label}`)
  sceneLines = []
  if (/^s\d+a?$/.test(label)) {
    label = label.substring(1)
    console.log(`load scene ${label}`)
    sceneLines = await fetchScene(label)
    processCurrentLine()
  } else if (/^f\d+a?$/.test(label)) {
    console.log(`load block ${label}`)
    label = label.substring(1)
    sceneLines = await fetchFBlock(label)
    processCurrentLine()
  } else if (/^skip\d+a?$/.test(label)) {
    console.log(`load block ${label}`)
    sceneLines = await fetchFBlock(label)
    processCurrentLine()
  } else {
    throw Error(`unknown label ${label}`)
  }
}

async function onSceneEnd() {
  const label = gameContext.label
  console.log(`ending ${label}`)
  if (/^s\d+a?$/.test(label)) {
    // add scene to completed scenes
    if (!settings.completedScenes.includes(label))
      settings.completedScenes.push(label)
    gameContext.label = `skip${label.substring(1)}`
    gameContext.index = 0;
  }
}

observe(gameContext, 'label', loadLabel)
observe(gameContext, 'index', processCurrentLine)
