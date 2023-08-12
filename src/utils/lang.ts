import { deepAssign, objectsEqual } from "./utils"
import { defaultSettings, settings } from "./variables"
import _languages from '../assets/lang/languages.json'
import defaultStrings from '../assets/lang/default.json'
import { notifyObservers, observe } from "./Observer"
import { SCENE_ATTRS } from "./constants"
import { RouteName, RouteDayName } from "../types"


export type LangCode = keyof typeof _languages

export type LangFile = typeof defaultStrings & {
  scenario: {
    days: string[]
    routes: Record<RouteName, Record<RouteDayName, string>>,
    scenes: typeof SCENE_ATTRS.scenes
  }
}

type LangDesc = {
  "display-name": string,
  "lang-file": `${string}.json`,
  fallback?: LangCode,
  authors?: string,
}
const languages = _languages as Record<LangCode, LangDesc>

export { languages }

export const langDesc: LangDesc = {
  "display-name": "",
  "lang-file": "default.json",
}

export const strings = deepAssign({}, defaultStrings) as LangFile

async function loadStrings(language: LangCode): Promise<LangFile|undefined> {
  const {"lang-file": url, fallback} = languages[language] ?? languages[defaultSettings.language]

  let strings = fallback ? await loadStrings(fallback)
              : deepAssign({}, defaultStrings) as LangFile
  if (!strings)
    return undefined
  const response = await fetch(url.startsWith("http") ? url : `./src/assets/lang/${url}`)
  if (response.ok) {
    const json = await response.json() as LangFile
    deepAssign(strings, json)
  } else {
    console.error(`Unable to load json for language ${language}. Response code: ${response.status}`)
    return undefined
  }
  return strings as LangFile
}
async function updateStrings() {

  const chosenLanguage = {
    fallback: undefined, // force the presence of undefined fields in the lang. desc.
    authors: undefined,
    ...(languages[settings.language] ?? languages[defaultSettings.language])
  }
  deepAssign(langDesc, chosenLanguage)
  loadStrings(settings.language).then(strs=> {
    if(strs && objectsEqual(langDesc, chosenLanguage))
      deepAssign(strings, strs as LangFile)
  })
}
observe(settings, "language", updateStrings)
updateStrings()

export default strings

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.strings = strings
