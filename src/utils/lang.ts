import { bb, deepAssign } from "./utils"
import { defaultSettings, settings } from "./variables"
import defaultStrings from '../assets/lang/default.json'
import { observe, useObserver } from "./Observer"
import { SCENE_ATTRS } from "./constants"
import { RouteName, RouteDayName } from "../types"
import { useReducer } from "react"
const LANG_DIR = `${import.meta.env.BASE_URL}lang/`
const LANGUAGES_LIST_URL = `${LANG_DIR}languages.json`

export type LangCode = string


export type LangFile = typeof defaultStrings & {
  scenario: {
    days: string[],
    routes: Record<RouteName, Record<RouteDayName, string>>,
    scenes: typeof SCENE_ATTRS.scenes
  },
  images: {
    "redirect-ids": Record<string, {thumb:`${string}\$${string}`, sd:`${string}\$${string}`, hd:`${string}\$${string}`}>,
    "redirected-images": Record<string, string>
  }
}

type LangDesc = {
  "display-name": string,
  "lang-file"?: `${string}.json`,
  fallback?: LangCode,
  authors?: string,
}

export const langDesc: LangDesc = {
  "display-name": "",
  "lang-file": "default.json",
}
export const languages: Record<LangCode, LangDesc> = { }

export const {
  images,
  ...strings
} = deepAssign({}, defaultStrings) as LangFile

async function loadStrings(language: LangCode): Promise<LangFile|undefined> {
  const {"lang-file": url, fallback} = languages[language] ?? languages[defaultSettings.language]

  let strings = fallback ? await loadStrings(fallback)
              : deepAssign({}, defaultStrings) as LangFile
  if (!strings)
    return undefined
  if (url) {
    const response = await fetch(url.indexOf(':') >= 0 ? url : `${LANG_DIR}${url}`)
    if (response.ok) {
      const json = await response.json() as LangFile
      deepAssign(strings, json)
    } else {
      console.error(`Unable to load json for language ${language}. Response code: ${response.status}`)
      return undefined
    }
  }
  return strings as LangFile
}

let loadedLanguage = ""

async function updateStrings() {
  let lang = settings.language
  if (!Object.hasOwn(languages, lang)) {
    console.error(`unknwon language ${lang}. Reverting to default.`)
    settings.language = lang = defaultSettings.language
  }
  loadStrings(settings.language).then(strs=> {
    if(strs && lang == settings.language) {
      const {images: imgs, ..._strings} = strs as LangFile;
      deepAssign(strings, _strings)
      deepAssign(images, imgs)
      deepAssign(langDesc, (languages[lang]))
      loadedLanguage = lang
    }
  })
}

async function fetchLanguagesList() {
  const response = await fetch(LANGUAGES_LIST_URL)
  if (response.ok) {
    const json = await response.json() as typeof languages
    deepAssign(languages, json)
    return true
  } else {
    console.error(`Unable to load languages list. Response code: ${response.status}`)
    return false
  }
}
addEventListener("load", async ()=> { // put in "load" event to avoid cirular dependencies
  const ok = await fetchLanguagesList()
  if (!ok)
    return
  observe(settings, "language", updateStrings)
  updateStrings()
})

export async function waitLanguageLoad() {
  if (loadedLanguage == settings.language)
    return
  return new Promise(resolve=> {
    observe(strings, 'translation-name', resolve, {once: true})
  })
}

export function useLanguageRefresh() {
  const [_updateNum, forceUpdate] = useReducer(x => (x + 1) % 100, 0);
  useObserver(forceUpdate, strings, 'translation-name')
}

export default strings

//##############################################################################
//#                        TRANSLATION-RELATED GETTERS                         #
//##############################################################################

export function imageUrl(img: string, res=settings.resolution) {
  const redirectId = images["redirected-images"][img] ?? ""
  let url = images["redirect-ids"][redirectId][res].replace('$', img)
  if (url.lastIndexOf(".") <= url.lastIndexOf('/'))
    url += ".webp"
  if (!url.startsWith("http"))
    url = `${import.meta.env.BASE_URL}${url}`
  return url
}

export function phaseTitle(route: RouteName, routeDay: RouteDayName) {
  return bb(strings.scenario.routes[route][routeDay])
}

export function dayTitle(day: number) {
  return day > 0 ? bb(strings.scenario.days[day-1]) : ""
}

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.strings = strings
