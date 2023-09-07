import { ViewRatio, NumVarName, StrVarName, VarName, LabelName, RouteName, RouteDayName } from "../types"
import { observe, observeChildren } from "./Observer"
import { TEXT_SPEED } from "./constants"
import { SCREEN, displayMode } from "./display"
import { endings } from "./endings"
import { LangCode, LangFile } from "./lang"
import Timer from "./timer"
import { deepFreeze, deepAssign, jsonDiff, objectsEqual, resettable } from "./utils"

//##############################################################################
//#                           APP-RELATED VARIABLES                            #
//##############################################################################

//___________________________________settings___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS_STORAGE_KEY = "settings"
export const defaultSettings = deepFreeze({
  // scene settings
  textSpeed: TEXT_SPEED.normal,
  autoClickDelay: 500,
  nextPageDelay: 2500,
  fastForwardDelay: 5,
  enableSceneSkip: true, // ask to skip scenes
  preventUnreadSkip: false, // [not implemented]
  // graphics settings
  font: "Ubuntu", // [not implemented]
  textPanelOpacity: 0.5, // [not implemented]
  resolution: "hd" as keyof LangFile["images"]["redirect-ids"][string],
  language: "en-mm" as LangCode,
  fixedRatio: ViewRatio.unconstrained,
  // H-related settings
  blurThumbnails: true,
  warnHScenes: false,
  // audio settings
  volume: {
    master: 5,
    track: 10,
    se: 10,
  },
  trackFormat: "CD_everafter/track$.mp3",
  // saved progress
  eventImages: new Array<string>(),
  completedScenes: new Array<string>(),
})

// load from file
let savedSettings = (()=>{
  const fileContent = localStorage.getItem(SETTINGS_STORAGE_KEY)
  if (fileContent && fileContent.length > 0)
    return JSON.parse(fileContent)
  else return {}
})()
export const settings = deepAssign(defaultSettings, savedSettings, {clone: true})
// deep-copy savedSettings

const savePostPoneTimer = new Timer(0, saveSettings)

function saveSettings() {
  savePostPoneTimer.cancel()
  settings.completedScenes.sort()
  const diff = jsonDiff(settings, defaultSettings)
  if (!objectsEqual(diff, savedSettings, false)) {
    savedSettings = diff
    if (Object.keys(diff).length == 0)
      localStorage.removeItem(SETTINGS_STORAGE_KEY)
    else
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(savedSettings))
  }
}

function postPoneSaveSettings() {
  if (!savePostPoneTimer.started) {
    savePostPoneTimer.start()
  }
}

for (const key of Reflect.ownKeys(settings)) {
  const k = key as keyof typeof settings
  if (typeof settings[k] == "object")
    observeChildren(settings, k, postPoneSaveSettings)
  else {
    observe(settings, k, postPoneSaveSettings)
  }
}

//##############################################################################
//#                             SCENARIO VARIABLES                             #
//##############################################################################

const [gameContext, resetContext, defaultGameContext] = resettable(deepFreeze({
//_____________________________position in scenario_____________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  label: '' as LabelName|'', // script block label
  index: 0, // line index in the labeled script block.
  phase: {
    route: "" as RouteName|"",
    routeDay: "" as RouteDayName|"",
    day: 0,
    bg: ""
  },
//_______________________________audio, graphics________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  audio: {
    track: "",
    looped_se: "",
  },
  graphics: {
    bg: "",
    l : "",
    c : "",
    r : "",
  },
  monochrome: "",
}))
//_______________________________script variables_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const [progress, resetProgress, defaultProgress] = resettable(deepFreeze({
  regard: {
    ark: 0,
    ciel: 0,
    akiha: 0,
    kohaku: 0,
    hisui: 0,
  },
  flags: new Array<string>(),
}))
const [temp, resetTemp] = resettable({ // temporaty variables (do not need to be saved)
  rockending: -1, // written, but never read in the script.
  flushcount: 0,  //used in for loops in the script
})

export { gameContext, defaultGameContext, progress, defaultProgress, temp }
window.addEventListener('load', ()=> {
  observe(displayMode, 'screen', (screen)=> {
    if (screen != SCREEN.WINDOW) {
      resetContext()
      resetProgress()
      resetTemp()
    }
  })
})

//##############################################################################
//#                                 FUNCTIONS                                  #
//##############################################################################

//___________________________________commands___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const endingsProxy = new Proxy({}, {
  get(_, name: string) {
    if (Object.hasOwn(endings, name))
      return (endings[name as keyof typeof endings]).seen ? 1 : 0
    switch(name) {
      case "ark" : return (endings.ark_good ? 0 : 1)
                        + (endings.ark_true ? 0 : 1)
      case "ciel" : return (endings.ciel_good ? 0 : 1)
                         + (endings.ciel_true ? 0 : 1)
      case "akiha" : return (endings.akiha_good ? 0 : 1)
                          + (endings.akiha_true ? 0 : 1)
      case "hisui" : return (endings.hisui_good ? 0 : 1)
                          + (endings.hisui_true ? 0 : 1)
      case "kohaku" : return (endings.kohaku_true ? 0 : 1)
      case "cleared" : return endingsProxy.ark + endingsProxy.ciel +
          endingsProxy.akiha + endingsProxy.hisui + endingsProxy.kohaku
    }
  },
  set() { return true } // setter prevents error when script tries to write values
}) as Record<keyof typeof endings, 0|1> &
    {ark: 0|1|2, ciel: 0|1|2, akiha: 0|1|2, hisui: 0|1|2, kohaku: 0|1,
     cleared: number}

const flagsProxy = new Proxy({}, {
  get(_, flag: string) {
    return progress.flags.includes(flag) ? 1 : 0
  },
  set(_, flag: string, value: number) {
    if (value == 0 && progress.flags.includes(flag))
      progress.flags.splice(progress.flags.indexOf(flag),1)
    else if (value == 1 && !progress.flags.includes(flag)) {
      progress.flags.push(flag)
      progress.flags.sort()
    }
    return true
  }
})

const routePhaseRE = /word\\p(?<route>[a-z]+)_(?<rDay>\d+[ab])/
const ignoredPhaseRE = /(?<ignored>bg\\.*)/
const parseTitleA = (val: string)=> val.match(routePhaseRE)?.groups ??
                                    val.match(ignoredPhaseRE)?.groups ?? {}
const dayPhaseRE = /word\\day_(?<day>\d+)/
const rawScenePhaseRE = /word\\(?<scene>\w+)/
const parseTitleB = (val: string)=> val.match(dayPhaseRE)?.groups ??
                                    val.match(rawScenePhaseRE)?.groups ?? {}

const phaseProxy = new Proxy({}, {
  get (_, varName: `phase${`title_${'a'|'b'}`|'bg'}`) {
    const {route, routeDay, day, bg} = gameContext.phase
    switch(varName) {
      case "phasebg" : return `"${bg}"`
      case "phasetitle_a" :
        return day > 0 ? `"a;image\\word\\p${route}_${routeDay}.jpg"`
                       : `"a;image\\bg\\ima_10.jpg"`
      case "phasetitle_b" :
        return day > 0 ? `"a;image\\word\\day_${day.toString().padStart(2, "0")}.png`
                       : `"a;image\\word\\${routeDay}.jpg`
    }
  },
  set (_, varName: `phase${`title_${'a'|'b'}`|'bg'}`, value: string) {
    switch(varName) {
      case "phasebg" : gameContext.phase.bg = value; return true
      case "phasetitle_a" :
        const {route = "", rDay = "", ignored = ""} = parseTitleA(value.toLowerCase())
        if (!(route && rDay) && !ignored)
          throw Error(`Cannot parse ${varName} ${value}`)
        deepAssign(gameContext.phase, {
          route : (route as RouteName) || "others",
          routeDay : (rDay as RouteDayName) || ""
        })
        return true
      case "phasetitle_b" :
        const {day = "", scene = ""} = parseTitleB(value.toLowerCase())
        if (!day && !scene)
          throw Error(`Cannot parse ${varName} ${value}`)
        gameContext.phase.day = parseInt(day) || 0
        if (scene)
          gameContext.phase.routeDay = scene as RouteDayName
        return true
      default :
        return false
    }
  }
})

function getVarLocation(fullName: VarName): [any, string] {
  if (!['$','%'].includes(fullName.charAt(0)))
    throw Error(`Ill-formed variable name in 'mov' command: "${fullName}"`)
  let name = fullName.substring(1)
  let parent
  if (name in temp) {
    parent = temp
  }
  else if (name.startsWith("phase")) {
    parent = phaseProxy
  }
  else if (/^flg[1-9A-Z]$/.test(name)) {
    parent = flagsProxy
    name = name.charAt(3)
  }
  else if (/^[a-z]+_regard$/.test(name)) {
    parent = progress.regard
    name = name.substring(0,name.indexOf('_'))
  }
  else if (/^clear(ed|_[a-z])+/.test(name)) {
    parent = endingsProxy
    name = name.substring(name.indexOf('_')+1) // 0 if no '_' in name
  }
  else {
    throw Error(`Unknown variable ${name}`)
  }
  return [parent, name]
}
export function getGameVariable(name: NumVarName): number;
export function getGameVariable(name: StrVarName): string;
export function getGameVariable(name: VarName) : number|string
export function getGameVariable(name: VarName) {
  const [parent, attrName] = getVarLocation(name)
  return parent[attrName as keyof typeof parent]
}

export function setGameVariable(name: NumVarName, value: number): void;
export function setGameVariable(name: StrVarName, value: string): void;
export function setGameVariable(name: VarName, value: number|string): void
export function setGameVariable(name: VarName, value: number|string) {
  if (name.charAt(0) == '%')
    value = +value // convert to number if the value is a string
  const [parent, attrName] = getVarLocation(name)
  parent[attrName as keyof typeof parent] = value
}

function processVarCmd(arg: string, cmd: string) {
  const [name, v] = arg.split(',') as [VarName, string]
  let currVal = getGameVariable(name)
  if (currVal === null && cmd != 'mov')
    throw Error(`Reading undefined variable. [${cmd} ${arg}]`)

  switch (cmd) {
    case 'mov' : setGameVariable(name, v); break
    case 'add' : setGameVariable(name, currVal + v); break
    case 'sub' : setGameVariable(name, currVal as number - parseInt(v)); break
    case 'inc' : setGameVariable(name, currVal as number + 1); break
    case 'dec' : setGameVariable(name, currVal as number - 1); break
  }
}

export const commands = {
  'mov': processVarCmd,
  'add': processVarCmd,
  'sub': processVarCmd,
  'inc': processVarCmd,
  'dec': processVarCmd,
}

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

declare global {
  interface Window {
    [key: string]: any
  }
}
window.settings = settings
window.progress = progress
window.g = window.gameContext = gameContext
window.temp_vars = temp
