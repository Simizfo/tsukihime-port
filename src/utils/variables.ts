import { observe, observeChildren } from "./Observer"
import { IMAGES_FOLDERS, TEXT_SPEED } from "./constants"
import { objectMatch, overrideAttributes, requestFilesFromUser, textFileUserDownload } from "./utils"

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
  enableSceneSkip: true, // ask to skip scenes
  volume: {
    master: 1,
    track: 1,
    se: 1,
  },
  completedScenes: new Array<string>(), // list of scenes that have been completed
}

// load from file
let savedSettings = (()=>{
  const result = structuredClone(defaultsSettings)
  const fileContent = localStorage.getItem('permanent')
  if (fileContent && fileContent.length > 0)
    overrideAttributes(result, JSON.parse(fileContent), false)
  return result
})()
// deep-copy savedSettings
export const settings = structuredClone(savedSettings)

function saveSettings() {
  if (!objectMatch(savedSettings, settings, false)) {
    settings.completedScenes.sort()
    overrideAttributes(savedSettings, settings, false)
    localStorage.setItem('permanent', JSON.stringify(savedSettings))
  }
}

function onCompletionChange() {
  settings.completedScenes.sort()
  saveSettings()
}

observe(settings, 'imagesFolder'   , saveSettings)
observe(settings, 'textSpeed'      , saveSettings)
observe(settings, 'galleryBlur'    , saveSettings)
observe(settings, 'enableSceneSkip', saveSettings)
observeChildren(settings, 'eventImages'    , saveSettings)
observeChildren(settings, 'volume'         , saveSettings)
observeChildren(settings, 'completedScenes', onCompletionChange)

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
  skip: boolean,
  bgAlignment: 'top'|'center'|'bottom'
} = {
  screen: SCREEN.TITLE,
  menu: false,
  history: false,
  text: true,
  choices: false,
  skip: false,
  bgAlignment: 'center'
}

//##############################################################################
//#                             SCENARIO VARIABLES                             #
//##############################################################################

export const gameContext = {
//_____________________________position in scenario_____________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  label: '', // scene id
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
  flags: new Array<string>(),
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
  get kohaku() { return this.kohaku_true }
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

function getVarLocation(name: string): [any, string] {
  if (!['$','%'].includes(name.charAt(0)))
    throw Error(`Ill-formed variable name in 'mov' command: "${name}"`)
  name = name.substring(1)
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
  else if (/^clear_[a-z]+/.test(name)) {
    parent = completion
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

const saveStates = new Map<number|string, SaveState>()

export function createSaveState(id: number|string, store=true) {
  const ss: SaveState = {
    context: structuredClone(gameContext),
    progress: structuredClone(progress)}
  if (store)
    saveStates.set(id, ss)
  return ss
}
export function loadSaveState(ss: any|SaveState) {
  if (ss.constructor != Object)
    ss = saveStates.get(ss)
  if (ss) {
    overrideAttributes(gameContext, ss.context, false)
    overrideAttributes(progress, ss.progress, false)
  }
}

export function exportSave() {
  const content = JSON.stringify({
    settings: savedSettings,
    saveStates: Object.fromEntries(saveStates.entries())
  })
  const date = new Date()
  const dateString = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`
  textFileUserDownload(content, `tsukihime_save_${dateString}.thsave`)
}

export async function loadSave(save:string|undefined=undefined) {
  if (!save) {
    const file = await requestFilesFromUser({accept: ".thsave"}) as File|null
    if (!file)
      return // canceled by user
    save = await new Promise(resolve=> {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = (evt)=> { resolve(evt.target?.result as string)}
    })
    if (!save)
      return;
  }
  const content = JSON.parse(save);
  overrideAttributes(settings, content.settings, false);
  saveStates.clear()
  for (const [id, ss] of Object.entries(content.saveStates)) {
    saveStates.set(id, ss as SaveState)
  }
}

//###   PUT IN GLOBAL FOR DEBUG   ###
declare global {
  interface Window {
    [key: string]: any;
  }
}
window.settings = settings
window.progress = progress
window.displayMode = displayMode
window.g = window.gameContext = gameContext
window.temp_vars = temp
displayMode.screen = SCREEN.WINDOW