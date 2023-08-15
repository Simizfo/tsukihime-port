import { bb, deepAssign, objectsEqual } from "./utils"
import { defaultSettings, settings } from "./variables"
import _languages from '../assets/lang/languages.json'
import defaultStrings from '../assets/lang/default.json'
import { observe } from "./Observer"
import { SCENE_ATTRS } from "./constants"
import { RouteName, RouteDayName } from "../types"


export type LangCode = keyof typeof _languages

export type LangFile = typeof defaultStrings & {
  scenario: {
    days: string[],
    routes: Record<RouteName, Record<RouteDayName, string>>,
    scenes: typeof SCENE_ATTRS.scenes
  },
  images: {
    "redirect-ids": Record<string, {sd:`${string}\$${string}`, hd:`${string}\$${string}`}>,
    "redirected-images": Record<string, string>
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
  const response = await fetch(url.startsWith("http") ? url : `./lang/${url}`)
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
    if(strs && objectsEqual(langDesc, chosenLanguage)) {
      const {images: _images, ..._strings} = strs as LangFile;
      deepAssign(strings, _strings)
      deepAssign(images, _images)
    }
  })
}
observe(settings, "language", updateStrings)
updateStrings()

export default strings

//##############################################################################
//#                       TRANSLATION-RELATED FUNCTIONS                        #
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
