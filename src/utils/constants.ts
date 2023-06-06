import straliasJson from '../assets/game/stralias.json'
import numaliasJson from '../assets/game/numalias.json'

export const STRALIAS_JSON = JSON.parse(JSON.stringify(straliasJson))
export const NUMALIAS_JSON = JSON.parse(JSON.stringify(numaliasJson))

export const initialContextState = {
  disp: {
    text: true,
    history: false,
    choices: false,
    menu: false,
  },
  game: {
    scene: 20,
    index: 0,
    regard: {
      ark: 0,
      ciel: 0,
      akiha: 0,
      kohaku: 0,
      hisui: 0,
    }
  }
}

export const HISTORY_MAX_PAGES = 20