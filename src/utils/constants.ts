import straliasJson from '../assets/game/stralias.json'
import numaliasJson from '../assets/game/numalias.json'
import sceneAttrs from '../assets/game/scene_attrs.json'
import { Digit, RouteDayName, RouteName, SceneName, UcLetter } from '../types'

export const APP_VERSION = import.meta.env.VITE_VERSION

export const STRALIAS_JSON = JSON.parse(JSON.stringify(straliasJson))
export const NUMALIAS_JSON = JSON.parse(JSON.stringify(numaliasJson))
export const SCENE_ATTRS : {
  days: string[],
  routes: Record<RouteName, Record<RouteDayName, string>>,
  scenes: Record<SceneName, ({
    title: string,
  } | {
      r: (RouteName | { flg: UcLetter|Digit, "0": RouteName, "1": RouteName }),
      d: RouteDayName
      s?: (string | { flg: UcLetter|Digit, "0": string, "1": string }),
  }) & {
    h?: boolean
  }>
 } = JSON.parse(JSON.stringify(sceneAttrs))

export enum IMAGES_FOLDERS {
  image = "image",
  image_x2 = "image_x2",
}

export enum TEXT_SPEED {
  instant = 0,
  fast = 1,
  normal = 20,
  slow = 50,
}

export const HISTORY_MAX_PAGES = 20