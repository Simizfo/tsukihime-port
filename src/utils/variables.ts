import { ViewRatio, NumVarName, StrVarName, VarName, LabelName, RouteName, RouteDayName } from "../types"
import { observe, observeChildren } from "./Observer"
import { TEXT_SPEED } from "./constants"
import { LangCode, LangFile } from "./lang"
import Timer from "./timer"
import { deepFreeze, objectMatch, deepAssign } from "./utils"

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
  language: "en-mm" as LangCode, // [not implemented]
  fixedRatio: ViewRatio.unconstrained,
  // H-related settings
  blurThumbnails: true,
  warnHScenes: false,
  // other settings
  volume: {
    master: 5,
    track: 10,
    se: 10,
  },
  // saved progress
  eventImages: new Array<string>(),
  completedScenes: new Array<string>(),
})

// load from file
const savedSettings = (()=> {
  const result = structuredClone(defaultSettings)
  const fileContent = localStorage.getItem(SETTINGS_STORAGE_KEY)
  if (fileContent && fileContent.length > 0)
    deepAssign(result, JSON.parse(fileContent))
  return result
})()
// deep-copy savedSettings
export const settings = structuredClone(savedSettings)

const savePostPoneTimer = new Timer(0, saveSettings)

function saveSettings() {
  savePostPoneTimer.cancel()
  if (!objectMatch(savedSettings, settings, false)) {
    settings.completedScenes.sort()
    deepAssign(savedSettings, settings)
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

export const gameContext = {
//_____________________________position in scenario_____________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  label: '' as LabelName|'', // script block label
  index: 0, // line index in the labeled script block.
  phase: {
    route: "" as RouteName|"",
    routeDay: "" as RouteDayName|"",
    day: 0,
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
}
//_______________________________script variables_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const progress = {
  regard: {
    ark: 0,
    ciel: 0,
    akiha: 0,
    kohaku: 0,
    hisui: 0,
  },
  flags: new Array<string>(),
}
export const temp = { // temporaty variables (do not need to be saved)
  phasebg: "",      // not used in this web-based implementation (yet)
  phasetitle_a: "", // not used in this web-based implementation (yet)
  phasetitle_b: "", // not used in this web-based implementation (yet)
  rockending: -1, // written, but never read in the script.
  flushcount: 0,  //used in for loops in the script
}

export const defaultGameContext = deepFreeze(structuredClone(gameContext))
export const defaultProgress = deepFreeze(structuredClone(progress))

//##############################################################################
//#                                 FUNCTIONS                                  #
//##############################################################################

//___________________________________commands___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const completion = new Proxy({
  get ark_good()    { return settings.completedScenes.includes("53a") ? 1 : 0 },
  get ark_true()    { return settings.completedScenes.includes("52a") ? 1 : 0 },
  get ciel_good()   { return settings.completedScenes.includes("308") ? 1 : 0 },
  get ciel_true()   { return settings.completedScenes.includes("310") ? 1 : 0 },
  get akiha_good()  { return settings.completedScenes.includes("384") ? 1 : 0 },
  get akiha_true()  { return settings.completedScenes.includes("385") ? 1 : 0 },
  get hisui_good()  { return settings.completedScenes.includes("413") ? 1 : 0 },
  get hisui_true()  { return settings.completedScenes.includes("412") ? 1 : 0 },
  get kohaku_true() { return settings.completedScenes.includes("429") ? 1 : 0 },
  get ark()    { return this.ark_good    + this.ark_true   },
  get ciel()   { return this.ciel_good   + this.ciel_true  },
  get akiha()  { return this.akiha_good  + this.akiha_true },
  get hisui()  { return this.hisui_good  + this.hisui_true },
  get kohaku() { return this.kohaku_true },
  get cleared() {
    return this.ark + this.ciel + this.akiha + this.hisui + this.kohaku
  }
}, {set: ()=> true }) // setter prevents error when trying to write the values

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

function getVarLocation(fullName: VarName): [any, string] {
  if (!['$','%'].includes(fullName.charAt(0)))
    throw Error(`Ill-formed variable name in 'mov' command: "${fullName}"`)
  let name = fullName.substring(1)
  let parent
  if (name in temp) {
    parent = temp
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
    parent = completion
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
