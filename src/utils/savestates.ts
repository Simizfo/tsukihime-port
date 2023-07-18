import script from "./script";
import { overrideAttributes, requestFilesFromUser, textFileUserDownload } from "./utils";
import { gameContext, progress, settings } from "./variables";

//##############################################################################
//#                                 SAVESTATES                                 #
//##############################################################################

const STORAGE_KEY = "savestates"

export type SaveState = {
  context: typeof gameContext;
  progress: typeof progress;
  text?: string
}

type SaveStateId = number | string

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
    context: structuredClone(gameContext),
    progress: structuredClone(progress)
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
  saveStates.set(id, ss)
  updateLocalStorage()
}

/**
 * Store the last savestate from the script'shistory into the savestate map,
 * with the specified id.
 * @param id unique id of the savestate in the map.
 */
export function storeLastSaveState(id: SaveStateId) {
  const ss = script.history.top?.saveState
  if (!ss)
    return false
  ss.text = script.history.top.text
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

/**
 * Restore the context and progress from the specified savestate.
 * If the savestate is stored in the script's history, all pages
 * after the one associated with the savestate will be removed from the history.
 * @param ss savestate to load, or its id in the savestate map.
 * @returns true if the savestate has been loaded, false otherwise.
 */
export function loadSaveState(ss: SaveStateId | SaveState) {
  if (ss.constructor == Number || ss.constructor == String)
    ss = saveStates.get(ss) as SaveState
  if (ss) {
    let index = 0
    for (let i = 0; i < script.history.length; i++) {
      if (ss == script.history.get(i).saveState) {
        index = i
        break
      }
    }
    script.history.trimTop(history.length - index)
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
export const quickSave = storeLastSaveState.bind(null, 'quick')

/**
 * Loads the savestate with the id 'quick' from the script's history,
 * and restores the context and progress from it.
 */
export const quickLoad = loadSaveState.bind(null, 'quick')

/**
 * Creates an iterator of key-value pairs from the stored savestates,
 * where the key is the id of the savestate in the map, and the value
 * is the savestate itself.
 * @returns the created iterator.
 */
export function listSaveStates(): IterableIterator<[SaveStateId, SaveState]> {
  return saveStates.entries()
}

//##############################################################################
//#                                GLOBAL SAVE                                 #
//##############################################################################

/**
 * Export the settings and savestates to a json file and lets the user
 * download it.
 */
export function exportGlobalSave() {
  const content = JSON.stringify({
    settings: overrideAttributes({}, settings, false),
    saveStates: listSaveStates()
  });
  const date = new Date()
  const dateString = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`
  textFileUserDownload(content, `tsukihime_save_${dateString}.thsave`)
}

/**
 * Restores settings and savestates from a file requested to the user,
 * or from the specified stringified JSON.
 * @param save stringified JSON, or undefined to ask the user for it.
 */
export async function loadGlobalSave(save: string | undefined = undefined) {
  if (!save) {
    const file = await requestFilesFromUser({ accept: ".thsave" }) as File | null
    if (!file)
      return; // canceled by user
    save = await new Promise(resolve => {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = (evt) => { resolve(evt.target?.result as string); }
    });
    if (!save)
      return
  }
  const content = JSON.parse(save)
  overrideAttributes(settings, content.settings, false)
  clearSaveStates()
  restoreSaveStates(content.saveStates)
}
