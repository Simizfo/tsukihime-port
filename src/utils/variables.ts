import { observe } from "./Observer"
import { IMAGES_FOLDERS, TEXT_SPEED } from "./constants"
import { objectMatch, objectsMerge } from "./utils"

//##############################################################################
//#                          ENGINE-RELATED VARIABLES                          #
//##############################################################################

//___________________________________settings___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const defaultsSettings = {
  imagesFolder: IMAGES_FOLDERS.image_x2,
  eventImages: new Array<string>(),
  textSpeed: TEXT_SPEED.normal,
  galleryBlur: true,
  volume: {
    master: 1,
    track: 1,
    se: 1,
  },
}

// deep-copy defaultsSettings
export const settings = objectsMerge({}, defaultsSettings) as typeof defaultsSettings
// load from file
const savedSettings = JSON.parse(localStorage.getItem('permanent')||"{}")
objectsMerge(settings, savedSettings, {override: true})

function saveSettings() {
  if (!objectMatch(settings, savedSettings)) {
    objectsMerge(savedSettings, settings, {override: true, copySymbols: false})
    localStorage.setItem('permanent', JSON.stringify(savedSettings))
  }
}

observe(settings, 'imagesFolder', saveSettings)
observe(settings, 'eventImages', saveSettings)
observe(settings, 'textSpeed', saveSettings)
observe(settings, 'galleryBlur', saveSettings)
observe(settings.volume, 'master', saveSettings)
observe(settings.volume, 'track', saveSettings)
observe(settings.volume, 'se', saveSettings)

//_________________________________display mode_________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export enum SCREEN {
  TITLE = "/title",
  WINDOW = "/window",
  GALLERY = "/gallery",
  CONFIG = "/config",
}
export const displayMode : {
  screen: SCREEN,
  menu: boolean,
  history: boolean,
  text: boolean,
  choices: boolean,
  bgAlignment: 'top'|'center'|'bottom'
} = {
  screen: SCREEN.TITLE,
  menu: false,
  history: false,
  text: true,
  choices: false,
  bgAlignment: 'center'
}

//##############################################################################
//#                             SCENARIO VARIABLES                             #
//##############################################################################

export const gameContext = {
//_____________________________position in scenario_____________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  scene: 0, // set later. (0 is ignored by ScriptManager)
  index: 0,
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
  // flags.[1-9,A-Z]: number
  flags: Object.fromEntries(
    Array.from({length: 35},(_, i) => [(i+1).toString(36).toUpperCase(),0])
  ),
}
export const temp = { // temporaty variables (do not need to be saved)
  phasebg: "",      // not used in this web-based implementation (yet)
  phasetitle_a: "", // not used in this web-based implementation (yet)
  phasetitle_b: "", // not used in this web-based implementation (yet)
  rockending: -1, // written, but never read in the script.
  flushcount: 0,  //used in for loops in the script
}

//##############################################################################
//#                                 FUNCTIONS                                  #
//##############################################################################

//___________________________________commands___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function getVarLocation(name: string): [any, string] {
  if (!['$','%'].includes(name.charAt(0)))
    throw Error(`Ill-formed variable name in 'mov' command: "${name}"`)
  name = name.substring(1)
  let parent
  if (name in temp) {
    parent = temp
  }
  else if (/^flg[1-9A-Z]$/.test(name)) {
    parent = progress.flags
    name = name.charAt(3)
  }
  else if (/^[a-z]+_regard$/.test(name)) {
    parent = progress.regard
    name = name.substring(0,name.indexOf('_'))
  }
  else {
    throw Error(`Unknown variable ${name}`)
  }
  return [parent, name]
}


export function getGameVariable(name: string): number|string {
  const [parent, attrName] = getVarLocation(name)
  return parent[attrName as keyof typeof parent]
}

export function setGameVariable(name: string, value: string|number) {
  if (name.charAt(0) == '%')
    value = +value // convert to number if the value is a string
  const [parent, attrName] = getVarLocation(name);

  (parent[attrName as keyof typeof parent] as string|number) = value
}

export function processVarCmd(arg: string, cmd: string) {
  const [name, v] = arg.split(',')
  let currVal = getGameVariable(name);
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

//__________________________________save-state__________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

type SaveState = {context: typeof gameContext, progress: typeof progress}

export function createSaveState(): SaveState {
  const ss: SaveState = {context: {}, progress: {}} as SaveState
  objectsMerge(ss.context, gameContext, {copySymbols: false})
  objectsMerge(ss.progress, progress, {copySymbols: false})
  return ss
}
export function loadSaveState(ss: SaveState) {
  objectsMerge(gameContext, ss.context, {override: true})
  objectsMerge(progress, ss.progress, {override: true})
}

//###   PUT IN GLOBAL FOR DEBUG   ###
window.settings = settings
window.progress = progress
window.displayMode = displayMode
window.gameContext = gameContext
window.temp_vars = temp
displayMode.screen = SCREEN.WINDOW