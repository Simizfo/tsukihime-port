import { SaveState } from "./utils/savestates"

export type Page = {
  contentType: 'text'|'choice'|'skip'|'phase'
  saveState: SaveState|undefined,
  text: string
}

export type Choice = {
  str: string,
  label: LabelName,
}

export type Background = {
  image: string,
  type: string,
}

export type Sprite = {
  image: string,
  type: string
}

export enum ViewRatio {
  unconstrained = "",
  fourByThree = "4/3",
  sixteenByNine = "16/9",
}

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

export type Digit = '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'
export type LcLetter = 'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'|'i'|'j'|'k'
      |'l'|'m'|'n'|'o'|'p'|'q'|'r'|'s'|'t'|'u'|'v'|'w'|'x'|'y'|'z'
export type UcLetter = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'
      |'L'|'M'|'N'|'O'|'P'|'Q'|'R'|'S'|'T'|'U'|'V'|'W'|'X'|'Y'|'Z'
export type Letter = LcLetter|UcLetter

export type RouteName = 'aki'|'ark'|'cel'|'his'|'koha'|'others'
export type RouteDayName = `${number}${'a'|'b'}`|'pro'|'epi'|'end'|'fin'

export type SceneName = `s${number}${'a'|''}` |
  "openning" | "ending" | "eclipse" | `mm${string}`
export type LabelName = SceneName |
  `f${number}${'a'|''}` | `skip${number}${'a'|''}` |
  'endofplay'

export type NumVarName = `%${string}`
export type StrVarName = `$${string}`
export type VarName = NumVarName | StrVarName

export type GalleryImg = {
  img: string,
  sensitive: boolean
  src?: string
}