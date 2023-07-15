import { SaveState } from "./utils/variables"

export type Page = {
  saveState: SaveState,
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