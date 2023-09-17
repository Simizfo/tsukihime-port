import { TSForceType, deepAssign } from "./utils"
import { defaultSettings, settings } from "./variables"
import defaultStrings from '../assets/lang/default.json'
import { observe, useObserver } from "./Observer"
import { SCENE_ATTRS } from "./constants"
import { RouteName, RouteDayName } from "../types"
import { useReducer } from "react"
import { bb, closeBB } from "./Bbcode"
const LANG_DIR = `${import.meta.env.BASE_URL}lang/`
const LANGUAGES_LIST_URL = `${LANG_DIR}languages.json`

//##############################################################################
//#                              TYPES, VARIABLES                              #
//##############################################################################

export type LangCode = string

type LangDesc = {
  "display-name": string
  "lang-file"?: string
  fallback?: LangCode
  authors?: string
}

type ImageRedirect<format extends string> = {thumb:format, sd:format, hd: format}

type TextImage = {
  bg?: string,
} & (
  { top: string|string[], center?: never, bottom?: never } |
  { center: string|string[], top?: never, bottom?: never } |
  { bottom: string|string[], top?: never, center?: never }
)

export type LangFile = typeof defaultStrings & {
  scenario: {
    days: string[],
    routes: Record<RouteName, Record<RouteDayName, string>>,
    scenes: typeof SCENE_ATTRS.scenes
  },
  images: {
    "redirect-ids": Record<string, ImageRedirect<`${string}\$${string}`>>,
    "redirected-images": Record<string, string|ImageRedirect<string>>,
    "words": Record<string, TextImage>
  },
  credits: (TextImage & {delay?: number})[]
}

let langDesc: LangDesc = {
  "display-name": ""
}
export const languages: Record<LangCode, LangDesc> = { }

let images : LangFile["images"]
const strings = (()=> {
  let {images: _imgs, ...strings} = deepAssign({}, defaultStrings) as LangFile
  images = _imgs
  return strings
})() as Omit<LangFile, keyof typeof images>

export { strings }

let loadedLanguage = ""

//##############################################################################
//#                              PUBLIC FUNCTIONS                              #
//##############################################################################

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

//_________________________translation-related getters__________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function imageUrl(img: string, res=settings.resolution) {
  let imgRedirect = images["redirected-images"][img] ?? ""
  let src
  if (imgRedirect.constructor == String) {
    imgRedirect = images["redirect-ids"][imgRedirect]
  }
  else {
    TSForceType<ImageRedirect<string>>(imgRedirect)
  }
  if (res == "thumb" && !("thumb" in imgRedirect))
    res = "sd"
  if (res == "sd" && !("sd" in imgRedirect))
    res = "hd"
  else if (res == "hd" && !("hd" in imgRedirect))
    res = "sd"
  src = imgRedirect[res].replace('$', img)
  if (src.startsWith('#'))
    return src
  if (!/^\w+:\/\//.test(src)) // does not start with "<protocol>://"
    src = `${import.meta.env.BASE_URL}${src}`
  return src
}

function textImageToStr(textImg: TextImage): string {
  const {center, top, bottom, bg="#000000"} = textImg
  let [text, vAlign] = center ? [center, 'c'] :
                       top    ? [top   , 't'] :
                       bottom ? [bottom, 'b'] :
                       [null, '']
  if (text) {
    if (Array.isArray(text))
      text = text.map(closeBB).join('\n')
    text = `$${vAlign}\`${text}\``
  }
  return `${bg}${text??""}`
}

export function wordImage(img: string) : string {
  if (img.startsWith("word/"))
    img = img.substring("word/".length)
  const textImage = images.words[img as keyof typeof images.words]
  if (!textImage) {
    throw Error(`unknown word-image ${img}`)
  }
  return textImageToStr(textImage)
}

export function credits() : [string, number][] {
  return strings.credits.map(({delay=5600, ...textImage})=> [textImageToStr(textImage), delay])
}

export function phaseTitle(route: RouteName, routeDay: RouteDayName) {
  return bb(strings.scenario.routes[route][routeDay])
}

export function dayTitle(day: number) {
  return day > 0 ? bb(strings.scenario.days[day-1]) : ""
}

//________________________________languages list________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function addLang(id: LangCode, description: LangDesc, tranlationFileJSON?: Partial<LangFile>) {
  if (!("lang-file" in description)) {
    if (!tranlationFileJSON)
      throw Error(`added languages must specify a "lang-file" in their descriptor, or a translation json`)
    storeTranslation(id, tranlationFileJSON)
  }
  languages[id] = description
  saveLanguagesList()
}

export function deleteLang(id: LangCode) {
  delete languages[id]
  localStorage.removeItem(`lang_${id}`)
  saveLanguagesList()
}

//##############################################################################
//#                             PRIVATE FUNCTIONS                              #
//##############################################################################

addEventListener("load", async ()=> { // update in "load" event to avoid circular dependencies
  console.log("registering language settings observer")
  const ok = await getLanguagesList()
  if (!ok)
    return
  observe(settings, "language", updateStrings)
  updateStrings()
})

//___________________________________strings____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

async function loadStrings(language: LangCode): Promise<LangFile|undefined> {
  const {"lang-file": url, fallback} = languages[language] ?? languages[defaultSettings.language]
  
  console.log(language, url, fallback)

  let strings = fallback ? await loadStrings(fallback)
              : deepAssign({}, defaultStrings) as LangFile
  if (!strings)
    return undefined

  const localFile = localStorage.getItem(`lang_${language}`)
  console.log(localFile)
  const json = localFile ? JSON.parse(localFile) as Partial<LangFile>
      : url ? await fetch(url.indexOf(':') >= 0 ? url : `${LANG_DIR}${url}`).then(
        (response)=> {
          console.log(response)
          if (response.ok) {
            return response.json()
          } else {
            console.error(`Unable to load json for language ${language}. Response code: ${response.status}`)
            return undefined
          }
        })
      : undefined
  console.log(json)
  if (json) {
    deepAssign(strings, json)
  }
  return strings as LangFile
}

async function updateStrings() {
  let lang = settings.language
  if (!Object.hasOwn(languages, lang)) {
    console.error(`unknwon language ${lang}. Reverting to default.`)
    settings.language = lang = defaultSettings.language
  }
  console.log(`loading strings for ${settings.language}`)
  const strs  = await loadStrings(settings.language)
  if (strs && lang == settings.language) {
    const {images: imgs, ..._strings} = strs as LangFile;
    deepAssign(strings, _strings)
    images = imgs
    langDesc = languages[lang]
    loadedLanguage = lang
  }
}

//________________________________languages list________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

async function getLanguagesList(forceUpdate=false) {
  const jsonStr = forceUpdate ? null : localStorage.getItem("languages")
  if (jsonStr) {
    deepAssign(languages, JSON.parse(jsonStr))
    return true
  } else {
    const response = await fetch(LANGUAGES_LIST_URL)
    if (response.ok) {
      const json = await response.json() as typeof languages
      deepAssign(languages, json)
      saveLanguagesList()
      return true
    } else {
      console.error(`Unable to load languages list. Response code: ${response.status}`)
      return false
    }
  }
}

function saveLanguagesList() {
  localStorage.setItem("languages", JSON.stringify(languages))
}

function storeTranslation(id: LangCode, json: Partial<LangFile>) {
  localStorage.setItem(`lang_${id}`, JSON.stringify(json))
}

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.strings = strings
