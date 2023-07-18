import { SaveState } from "./utils/savestates"

export type Page = {
  saveState: SaveState|undefined,
  text: string
}

export type Choice = {
  str: string,
  label: string,
}

//bg "image\bg\bg_05a.jpg",%type_lcartain_mid
export type Background = {
  image: string,
  type: string,
}

export type Sprite = {
  image: string,
  type: string
}