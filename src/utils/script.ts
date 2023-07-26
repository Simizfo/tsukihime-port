import { commands as choiceCommands } from "../layers/ChoicesLayer"
import { commands as graphicCommands } from "../layers/GraphicsLayer"
import { commands as textCommands } from "../layers/TextLayer"
import { Page } from "../types"
import { commands as audioCommands } from "./AudioManager"
import { observe } from "./Observer"
import Stack from "./Stack"
import { HISTORY_MAX_PAGES, SCENE_ATTRS } from "./constants"
import { commands as timerCommands } from "./timer"
import { fetchFBlock, fetchScene } from "./utils"
import { commands as variableCommands, getGameVariable, gameContext, settings, displayMode, SCREEN } from "./variables"
import { createSaveState } from "./savestates"

type CommandHandler = {next: VoidFunction}
type CommandProcessFunction =
    ((arg: string, cmd: string, onFinish: VoidFunction)=>CommandHandler|void)
type CommandMap = Map<string, CommandProcessFunction|null>

type SkipCallback = (sceneTitle: string|undefined, confirm:(skip: boolean)=>void)=>void
let skipCallback: SkipCallback = ()=> { throw Error(`script.onSkipPrompt not specified`) }

let sceneLines: Array<string> = []
let lastLine = {label: "", index: 0}
let currentCommand: CommandHandler | undefined
let skipCommand: VoidFunction | undefined
let lineSkipped: boolean = false

const BLOCK_CMD = {next: ()=>{}} // prevent proceeding to next line

const history = new Stack<Page>([], HISTORY_MAX_PAGES)

export const script = {
  /**
   * Set the callback to call when a scene can be skipped
   */
  set onSkipPrompt(callback: SkipCallback) {
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
  },

  moveTo(label: string, index: number = -1) {
    gameContext.label = label
    gameContext.index = index
  }
}
export default script

function isScene(label: string): boolean {
  //TODO create a list of unique scene names (e.g., openning, eclipse)
  return /^\*?s\d+a?$/.test(label) || ["openning"].includes(label)
}

function onPageBreak(createSS=true) {
  if (history.top?.text.length == 0)
    history.pop() // remove empty pages from history
  history.push({ saveState: createSS ? createSaveState() : undefined, text: ""})
}

function getSceneName(label: `s${number}${'a'|''}`): string|undefined {
  const attrs = SCENE_ATTRS.scenes[label]
  if (!attrs)
    return undefined
  if ("title" in attrs)
    return attrs.title
  else {
    const {r, d, s} = attrs
    let route: keyof typeof SCENE_ATTRS.routes
    if (typeof r == "object" && 'flg' in r) {
      if (getGameVariable(`%flg${r.flg}`))
        route = r["1"]
      else 
        route = r["0"]
    } else {
      route = r
    }
    let sceneName = SCENE_ATTRS.routes[route][d]
    if (s)
      sceneName += " - " + s
    return sceneName
  }
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
  'goto'      : processGoto,
  'gosub'     : processGosub,

  'skip'      : (n: string)=> { gameContext.index += parseInt(n) },
  'return'    : ()=> { onSceneEnd(); return BLOCK_CMD },

  'setwindow' : null,
  'windoweffect' : null,
  'setcursor' : null,
  'autoclick' : null,

  '*'         : null,
  '!s'        : null,
}))

// (%var|n)(op)(%var|n)
const opRegexp = /(?<lhs>(%\w+|\d+))(?<op>[=!><]+)(?<rhs>(%\w+|\d+))/
function checkIfCondition(condition: string) {
  let value = true
  for (const [i, token] of condition.split(' ').entries()) {
    if (i % 2 == 0) {
      const match = opRegexp.exec(token)
      if (!match) throw Error(
        `Unable to parse expression "${token}" in condition ${condition}`)

      let {_lhs, op, _rhs} = match.groups as any
      const lhs = _lhs.startsWith("%")? getGameVariable(_lhs) : parseInt(_lhs)
      const rhs = _rhs.startsWith("%")? getGameVariable(_rhs) : parseInt(_rhs)

      switch (op) {
        case '==' : value = (lhs == rhs); break
        case '!=' : value = (lhs != rhs); break
        case '<'  : value = (lhs <  rhs); break
        case '>'  : value = (lhs >  rhs); break
        case '<=' : value = (lhs <= rhs); break
        case '>=' : value = (lhs >= rhs); break
        default : throw Error (
          `unknown operator ${op} in condition ${condition}`)
      }
    } else {
      switch (token) {
        case "&&" : if (!value) return false; break
        case "||" : if (value) return true; break
        default : throw Error(
          `Unable to parse operator "${token}" in condition ${condition}`)
      }
    }
  }
  return value
}

function processIfCmd(arg: string, _: string, onFinish: VoidFunction) {
  let index = arg.search(/ [a-z]/)
  if (index == -1)
    throw Error(`no separation between condition and command: "if ${arg}"`)
  const condition = arg.substring(0, index)
  if (checkIfCondition(condition))
    processLine(arg.substring(index+1)).then(onFinish)
}

function processGoto(arg: string) {
  if (/^\*f\d+a?$/.test(arg)) {
    script.moveTo(arg.substring(1), 0)
    return BLOCK_CMD // prevent processing next line
  } else if (arg == "*endofplay") {
    //TODO end session, return to title screen
  }
}

function processGosub(arg: string) {
  if (arg == "*right_phase" || arg == "*left_phase") {
    //TODO process right_phase, with vars temp.phase_bg,
    // temp.phase_title_a, temp.phase_title_b
  } else if (arg == "*ending") {
    // ending is called from the scene. If necessary, set the scene
    // as completed before jumping to ending
  } else if (isScene(arg)) {
    script.moveTo(arg.substring(1))
    return BLOCK_CMD
  }
}

function splitText(text: string) {
  const instructions = new Array<{ cmd:string, arg:string }>()
  let index = 0
  // replace spaces with en-spaces at the beginning of the line
  while (text.charCodeAt(index) == 0x20)
    index++
  text = "\u2002".repeat(index) + text.substring(index)
  // split tokens at every '@', '\', '!xxx'
  while (text.length > 0) {
    index = text.search(/@|\\|!\w|$/)
    if (index > 0)
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
//#                            EXECUTE SCRIPT LINES                            #
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
  const endPageBreak = line.endsWith('\\') && line.length > 1

  if (endPageBreak) // '\\' will be added as an individual command at the end
    line = line.substring(0, line.length-1)

  if (line.startsWith('`')) {
    // following space (if present) is part of the argument
    line = line.substring(1)
    if (!endPageBreak)
      line += '\n'
    instructions.push(...splitText(line))
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
    if (lineSkipped)
      break
    const command = commands.get(cmd)
    if (command) {
      await new Promise<void>(resolve=> {
        currentCommand = command(arg, cmd, resolve) as typeof currentCommand
        if (currentCommand)
          skipCommand = resolve // if the command must be skipped at some point
        else
          resolve()
      })
      currentCommand = undefined
      skipCommand = undefined
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
 * when the scene is loaded, or when the screen changes.
 * Calls the execution of the command at the current line index
 * in the scene file
 */
async function processCurrentLine() {
  const {index, label} = gameContext
  const lines = sceneLines
  if (index < 0 || // no valid line index
      label.length == 0 || // no specified scene
      lines.length == 0 || // scene not loaded
      displayMode.screen != SCREEN.WINDOW) // not in the right screen
    return

  if (currentCommand) {
    if (lastLine.index == index &&
        lastLine.label == label)
      return
    // Index has been changed by outside this function.
    // Skip remaining instructions in the previous line.
    // Resolve the promise of the ongoing command.
    lineSkipped = true
    skipCommand?.()
    // Process the current line after aborting the previous line
    setTimeout(processCurrentLine, 0)
    return
  }

  lastLine.index = index
  lastLine.label = label
  if (index < lines.length) {
    if (isScene(label) && (index == 0 || lines[index-1].endsWith('\\')))
      onPageBreak()

    let line = sceneLines[index]
    console.log(`${label}:${index}: ${line}`)
    await processLine(line)
    if (gameContext.index != index || gameContext.label != label) {
      // the context has been changed while processing the line.
      // processCurrentLine() will be called again by the observer.
      // The index should not be incremented
      lineSkipped = false
    } else {
      gameContext.index++
    }
  } else {
    onSceneEnd()
  }
}

async function fetchSceneLines() {
  const label = gameContext.label
  let fetchedLines: string[]|undefined = undefined
  if (isScene(label))
    fetchedLines = await fetchScene(label)
  else if (/^(f|skip)\d+a?$/.test(label))
    fetchedLines = await fetchFBlock(label)

  if (fetchedLines == undefined)
    throw Error(`error while fetching lines for label ${label}`)
  // check if context was changed while fetching the file
  if (label == gameContext.label) {
    sceneLines = fetchedLines
    processCurrentLine()
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
  sceneLines = [] // set to empty to prevent execution of previous scene
  if (gameContext.index == -1)
    onSceneStart()
  else if (label != "")
    fetchSceneLines()
}

function onSceneEnd(label = gameContext.label) {
  console.log(`ending ${label}`)
  if (isScene(label)) {
    // add scene to completed scenes
    if (!settings.completedScenes.includes(label))
      settings.completedScenes.push(label)
    if (/^s\d+a?$/.test(label))
      script.moveTo(`skip${label.substring(1)}`)
    else if (label == "openning")
      script.moveTo('s20')
  }
}

function warnHScene(callback: VoidFunction) {
  alert("You are about to read an H-scene. Beware of your surroundings.")
  callback()
}

function onSceneStart() {
  const label = gameContext.label as keyof typeof SCENE_ATTRS.scenes
  if (settings.enableSceneSkip && settings.completedScenes.includes(label)) {
    skipCallback(getSceneName(label), async skip=> {
      if (skip)
        onSceneEnd(label)
      else {
        // check if context was changed while asking user
        if (label == gameContext.label) {
          gameContext.index = 0
          fetchSceneLines()
        }
      }
    })
  } else if (settings.warnHScenes && SCENE_ATTRS.scenes[label]?.h) {
    warnHScene(()=> {
      gameContext.index = 0
      fetchSceneLines()
    })
  } else {
    gameContext.index = 0
    fetchSceneLines()
  }
}

observe(gameContext, 'label', loadLabel)
observe(gameContext, 'index', processCurrentLine)
observe(displayMode, 'screen', (screen)=> {
  if (screen == SCREEN.WINDOW)
    processCurrentLine()
  else {
    //clear values not in gameContext
    currentCommand = undefined
  }
})

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.script = script
