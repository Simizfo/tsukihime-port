import { IMAGES_FOLDERS, TEXT_SPEED } from "./utils/constants"
import { SaveState } from "./utils/variables"

export type Line = {
  line: string,
  lineHasEnded?: boolean,
  read?: boolean,
}

export type Page = {
  saveState: SaveState,
  text: string
}

export type Choice = {
  str: string,
  label: string,
}

//ld c,":a;image\tachi\stk_t01.jpg",%type_lshutter_fst
export type Character = {
  image: string,
  type: string,
  pos: string, //r, l, c
}

//bg "image\bg\bg_05a.jpg",%type_lcartain_mid
export type Background = {
  image: string,
  type: string,
}

export type ContextState = {
  disp: {
    text: boolean,
    history: boolean,
    choices: boolean,
    menu: boolean,
  },
  game: {
    scene: number,
    index: number,
    bg: Background,
    regard: {
      ark: number,
      ciel: number,
      akiha: number,
      kohaku: number,
      hisui: number,
    },
    track: string,
    looped_se: string,
    variables: {name: string, value: number|string}[], // TODO: consider using a Map instead
  },
  permanent: {
    imagesFolder: IMAGES_FOLDERS,
    eventImages: string[],
    textSpeed: TEXT_SPEED,
    galleryBlur: boolean,
    volume: {
      master: number,
      track: number,
      se: number
    },
  }
}