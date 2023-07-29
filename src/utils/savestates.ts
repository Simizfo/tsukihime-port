import { overrideAttributes, requestFilesFromUser, textFileUserDownload } from "./utils";
import { defaultGameContext, defaultProgress, gameContext, progress, settings } from "./variables";
import history from './history';

//##############################################################################
//#                                 SAVESTATES                                 #
//##############################################################################

const STORAGE_KEY = "savestates"

export type SaveState = {
  context: typeof gameContext;
  progress: typeof progress;
  text?: string;
  date?: number;
}

type SaveStateId = number

export const QUICK_SAVE_ID: SaveStateId = 0

const saveStates = new Map<SaveStateId, SaveState>()

{
  const restored = localStorage.getItem(STORAGE_KEY)
  if (restored)
    restoreSaveStates(JSON.parse(restored))
}

function updateLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(
    Array.from(saveStates.entries())))
}

/**
 * Store all the savestates from the iterator in the savestates map
 * @param keyValuePairs iterator of [id, savestate].
 */
function restoreSaveStates(keyValuePairs: IterableIterator<[SaveStateId, SaveState]>) {
  for (const [id, ss] of keyValuePairs) {
    saveStates.set(id, ss as SaveState)
  }
  updateLocalStorage()
}

/**
 * Creates a savestates that contains the current gameContext and the progress
 * (flags, character regards).
 * @returns the created savestate.
 */
export function createSaveState() {
  const ss: SaveState = {
    context: overrideAttributes({}, gameContext, false) as typeof gameContext,
    progress: overrideAttributes({}, progress, false) as typeof progress
  }
  return ss
}

/**
 * Store the savestate in a map with the specified id.
 * If a previous savestate has the same id, the new one replaces it.
 * @param id unique id of the savestate in the map.
 * @param ss savestate to store.
 */
export function storeSaveState(id: SaveStateId, ss: SaveState) {
  if (!ss.date)
    ss.date = Date.now()
  saveStates.set(id, ss)
  updateLocalStorage()
}

/**
 * Store the last savestate from the script'shistory into the savestate map,
 * with the specified id.
 * @param id unique id of the savestate in the map.
 */
export function storeLastSaveState(id: SaveStateId) {
  const ss = history.last?.saveState
  if (!ss)
    return false
  ss.text = history.last.text
  storeSaveState(id, ss)
  return true
}

/**
 * Delete from the savestate map the savesate with the specified id
 * @param id unique id of the savestate in the map.
 */
export function deleteSaveState(id: SaveStateId) {
  saveStates.delete(id)
  updateLocalStorage()
}

/**
 * Delete all savestates from the savestates map.
 */
export function clearSaveStates() {
  saveStates.clear()
  updateLocalStorage()
}

export function getSaveState(id: SaveStateId) {
  return saveStates.get(id)
}

/**
 * Restore the context and progress from the specified savestate.
 * If the savestate is stored in the script's history, all pages
 * after the one associated with the savestate will be removed from the history.
 * @param ss savestate to load, or its id in the savestate map.
 * @returns true if the savestate has been loaded, false otherwise.
 */
export function loadSaveState(ss: SaveStateId | SaveState) {
  if (ss.constructor == Number)
    ss = saveStates.get(ss) as SaveState
  if (ss) {
    let index = 0
    for (let i = 0; i < history.length; i++) {
      if (ss == history.get(i).saveState) {
        index = i
        break
      }
    }
    history.onSaveStateLoaded(ss as SaveState)
    overrideAttributes(gameContext, (ss as SaveState).context, false)
    overrideAttributes(progress, (ss as SaveState).progress, false)
    return true
  }
  return false
}

/**
 * Stores the last savestate of the script's history in the savestate map
 * with the id 'quick".
 */
export const quickSave = storeLastSaveState.bind(null, QUICK_SAVE_ID)

/**
 * Loads the savestate with the id 'quick' from the script's history,
 * and restores the context and progress from it.
 */
export const quickLoad = loadSaveState.bind(null, QUICK_SAVE_ID)

/**
 * Creates an iterator of key-value pairs from the stored savestates,
 * where the key is the id of the savestate in the map, and the value
 * is the savestate itself.
 * @returns the created iterator.
 */
export function listSaveStates(): Array<[SaveStateId, SaveState]> {
  return Array.from(saveStates.entries())
}

export function getLastSave(): SaveState {
  return Array.from(saveStates.values()).reduce(
    (ss1, ss2)=>(ss1.date ?? 0) > (ss2.date ?? 0) ? ss1 : ss2)
}

export function blankSaveState() : SaveState {
  return {
    context: defaultGameContext,
    progress: defaultProgress
  }
}

//##############################################################################
//#                                 SAVE FILES                                 #
//##############################################################################
type exportSaveFileOptions = {
  omitSettings?: boolean,
  saveStateFilter?: SaveStateId[]
}
/**
 * Export the settings and savestates to a json file and lets the user
 * download it. The settings can be omitted using the parameter
 * {@link omitSettings}, and the save-states to be exported can be filtered
 * by providing an array of ids in the parameter {@link saveStateFilter}.
 * @param exportSettings true if the settings must be omitted in the save file.
 *        Default: false
 * @param saveStateFilter array of save-state ids to export. Empty array:
 *        save-states are omitted. Default : all saves are exported.
 */
export function exportSaveFile({
      omitSettings= false,
      saveStateFilter= undefined
    }: exportSaveFileOptions = {}) {
  const content = JSON.stringify({
    ...(!omitSettings ? {
      settings: overrideAttributes({}, settings, false)
    } : {}),
    ...(!saveStateFilter ? {
      saveStates: listSaveStates()
    } : saveStateFilter.length > 0 ? {
      saveStates: listSaveStates().filter(([id,_ss])=>saveStateFilter.includes(id))
    } : {})
  });
  const date = new Date(listSaveStates().filter(([id,_ss])=>saveStateFilter?.includes(id))[0][1].date as number)
  const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate()}`
  textFileUserDownload(content, `tsukihime_${dateString}.thsave`)
}

type loadSaveFileOptions = {
  ignoreSettings?: boolean,
  ignoreSaveStates?: boolean
}
/**
 * Restores settings and savestates from one or multiple files requested
 * to the user or from the specified stringified JSON. Settings can be ignored
 * using the parameter {@link ignoreSettings}, and save-states can be ignored
 * using the parameter {@link ignoreSaveStates}.
 * @param save stringified JSON, or undefined to ask the user for it.
 * @param ignoreSettings true if the settings must be ignored
 *        in the save file. Default: false
 * @param ignoreSaveStates true if the save-states must be ignored
 *        in the save file. Default: false
 */
export async function loadSaveFile(save: string | undefined = undefined, {
      ignoreSettings = true,
      ignoreSaveStates = true
    }: loadSaveFileOptions = {}): Promise<boolean> {
  if (!save) {
    let files = await requestFilesFromUser({ multiple: true, accept: ".thsave" })
    if (!files)
      return false; // canceled by user
    if (files instanceof File)
      files = [files]
    let success = true
    for (const file of files) {
      success &&= await new Promise<string>((resolve,reject) => {
        const reader = new FileReader()
        reader.readAsText(file)
        reader.onload = (evt) => {
          if (evt.target?.result?.constructor == String)
            resolve(evt.target.result)
          else
            reject(`cannot read save file ${file.name}`)
        }
      }).then(
        (text)=>loadSaveFile(text, {ignoreSettings, ignoreSaveStates}),
        (errorMsg)=> {
        throw Error(errorMsg)
      });
    }
    return success
  } else {
    const content = JSON.parse(save)
    if (ignoreSettings && content.settings)
      overrideAttributes(settings, content.settings, false)
    if (ignoreSaveStates && content.saveStates)
      restoreSaveStates(content.saveStates)
    return true
  }
}
