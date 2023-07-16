import { commands as choiceCommands } from "../layers/ChoicesLayer"
import { commands as graphicCommands } from "../layers/GraphicsLayer"
import { commands as textCommands } from "../layers/TextLayer"
import { Page } from "../types"
import { commands as audioCommands } from "./AudioManager"
import { observe } from "./Observer"
import Stack from "./Stack"
import { HISTORY_MAX_PAGES } from "./constants"
import { commands as timerCommands } from "./timer"
import { fetchFBlock, fetchScene, objectMatch } from "./utils"
import { commands as variableCommands, getGameVariable, gameContext, settings, createSaveState } from "./variables"

type CommandHandler = {next: VoidFunction}
type CommandProcessFunction = (arg: string, cmd: string, onFinish: VoidFunction)=>CommandHandler|void
type CommandMap = Map<string, CommandProcessFunction|null>

type SkipCallback = (confirm:(skip: boolean)=>void)=>void
let skipCallback: SkipCallback = ()=> { throw Error(`script.onSkipPrompt not specified`) }

let sceneLines: Array<string> = []
let currentCommand: CommandHandler | undefined
let skipCommand: VoidFunction | undefined
let lineSkipped: boolean = false
const BLOCK_CMD = {next: ()=>{}}

const history = new Stack<Page>([], HISTORY_MAX_PAGES)

export const script = {
  /**
   * Set the callback to call when a scene can be skipped
   */
  set onSkipPrompt(callback: (confirm:(skip: boolean)=>void)=>void) {
    skipCallback = callback
  },
  /**
   * function to call to move to the next step of the current command.
   * Most commands will interpet it as a "skip".
   */
  next(): void {
    if (currentCommand)
      currentCommand.next()
  },

  get currentLine() {
    return sceneLines[gameContext.index]
  },

  get history() {
    return history
  }
}
export default script

function isScene(label: string): boolean {
  return /^\*?s\d+a?$/.test(label)
}

function onPageBreak(createSS=true) {
  if (history.top?.text.length == 0)
    history.pop() // remove empty pages from history
  history.push({ saveState: createSS ? createSaveState() : undefined, text: ""})
}


//##############################################################################
//#                                  COMMANDS                                  #
//##############################################################################

const commands:CommandMap = new Map(Object.entries({

  ...textCommands,
  ...graphicCommands,
  ...audioCommands,
  ...timerCommands,
  ...variableCommands,
  ...choiceCommands,

  'if'        : processIfCmd,
  'skip'      : processScriptMvmt,
  'goto'      : processScriptMvmt,
  'gosub'     : processScriptMvmt,
  'return'    : processScriptMvmt,

  '*'         : null,
  '!s'        : null,
}))

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
    processLine(arg.substring(index+1)).then(onFinish)

}

function processScriptMvmt(arg: string, cmd: string) {
  arg = arg?.trim()
  switch (cmd) {
    case 'skip' :
      gameContext.index += parseInt(arg);
      return;
    case 'goto' :
      if (/^\*f\d+a?$/.test(arg)) {
        gameContext.label = arg.substring(1)
        gameContext.index = 0
        return BLOCK_CMD // prevent processing next line
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
      } else if (isScene(arg)) {
        arg = arg.substring(1)
        if (settings.completedScenes.includes(arg)) {
          console.log(`scene ${arg} already completed`)
          skipCallback((skip)=>{
            gameContext.label = skip ? `skip${arg.substring(1)}` : arg
            gameContext.index = 0
          })
        } else {
          gameContext.label = arg
          gameContext.index = 0
        }
        return BLOCK_CMD // prevent processing next line
      }
      break
    case 'return' :
      onSceneEnd();
      return BLOCK_CMD // prevent processing next line
  }
}

function splitText(text: string) {
  const instructions = new Array<{ cmd:string, arg:string }>()
  let index = 0
  while (text.length > 0) {
    index = text.search(/@|\\|!\w|$/)
    instructions.push({cmd:'`',arg: text.substring(0, index)})
    text = text.substring(index)
    switch (text.charAt(0)) {
      case '@' :
      case '\\' :
        instructions.push({cmd: text.charAt(0), arg:""})
        text = text.substring(1)
        break
      case '!' : // !w<time>
        const argIndex = text.search(/\d|\s|$/)
        const endIndex = text.search(/\s|$/)
        instructions.push({
          cmd: text.substring(0, argIndex),
          arg: text.substring(argIndex, endIndex)})
        text = text.substring(endIndex)
        break
    }
  }
  return instructions
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
export async function processLine(line: string) {
  const instructions = new Array<{cmd:string,arg:string}>()
  const endPageBreak = line.endsWith('\\');

  if (endPageBreak) // '\\' will be added as an individual command at the end
    line = line.substring(0, line.length-1)
  
  if (line.startsWith('`')) {
    // following space (if present) is part of the argument
    line = line.substring(1)
    if (!endPageBreak)
      line += '\n'
    instructions.push(...splitText(line.substring(1)))
  } else if (line.startsWith('!')) {
    instructions.push(...splitText(line)) // '!w' are handled as inline commands
  } else {
    let index = line.indexOf(' ')
    if (index == -1)
      index = line.length
    instructions.push({
      cmd: line.substring(0,index),
      arg: line.substring(index+1)
    })
  }

  if (endPageBreak)
    instructions.push({cmd:'\\',arg:''})
  
  for (const [i, {cmd, arg}] of instructions.entries()) {
    if (lineSkipped) {
      break
    }
    const command = commands.get(cmd)
    if (command) {
      await new Promise<void>(resolve=> {
        currentCommand = command(arg, cmd, resolve) as typeof currentCommand
        if (currentCommand)
          skipCommand = resolve
        else
          resolve()
      })
      currentCommand = undefined
      skipCommand = undefined
      // add history pages after executing '\'.
      // TODO allow loading those pages. To prevent error, they cannot be loaded
      if (cmd == '\\' && i < instructions.length) {
        onPageBreak(false)
      }
    }
    else if (!commands.has(cmd)) {
      const {label: scene, index} = gameContext
      console.error(`unknown command ${scene}:${index}: ${line}`)
      debugger
    }
  }
  return currentCommand
}

/**
 * Executed when {@link gameContext.index} is modified,
 * or when the scene is loaded.
 * Calls the execution of the command at the current line index
 * in the scene file
 */
async function processCurrentLine() {
  if (currentCommand) {
    // Index has been changed by outside this function.
    // Skip remaining instructions in the previous line.
    lineSkipped = true
    skipCommand?.() // Resolve the promise of the ongoing command.
    // Process the current line after aborting the previous line
    setTimeout(processCurrentLine, 0)
    return
  }

  const {index, label} = gameContext
  const lines = sceneLines
  if (lines?.length > 0 && index < lines.length) {
    if (isScene(label) && (index == 0 || lines[index-1].endsWith('\\')))
      onPageBreak()

    let line = sceneLines[index]
    console.log(`Processing line ${index}: ${line}`)
    await processLine(line);
    if (gameContext.index != index || gameContext.label != label)
      lineSkipped = false
    else {
      gameContext.index++
    }
    
  } else if (sceneLines?.length > 0 && index > sceneLines.length) {
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

function onSceneEnd() {
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
