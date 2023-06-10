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
    scene: 22,
    index: 0,
    bg: {
      image: "",
      type: "",
    },
    regard: {
      ark: 0,
      ciel: 0,
      akiha: 0,
      kohaku: 0,
      hisui: 0,
    },
    track: "",
    looped_se: "",
    volume: {
      master: 1,
      track: 1,
      se: 1,
    },
    variables: [],
  },
  permanent: {
    imagesFolder: "image_x2",
    eventImages: [],
  }
}

export const HISTORY_MAX_PAGES = 20

export enum CHARACTERS {
  arcueid = "Arcueid",
  ciel = "Ciel",
  akiha = "Akiha",
  kohaku = "Kohaku",
  hisui = "Hisui",
  others = "Others",
}

export const GALLERY_IMAGES = {
  arcueid: [
    "ark_e01", "ark_e02", "ark_e03", "ark_e04", "ark_e04b", "ark_e05a", "ark_e05b", "ark_e06a", "ark_e06b", "ark_e07", "ark_e08", "ark_e09", "ark_e10", 
    "ark_f01", "ark_f02", "ark_f03",
    "ark_h01", "ark_h02", "ark_h03", "ark_h04", "ark_h05", "ark_h06", "ark_h07", "ark_h08", "ark_h09", "ark_h10", "ark_h11", "ark_h12", "ark_h13"
  ],
  ciel: [
    "cel_e01", "cel_e02a", "cel_e02b", "cel_e03a", "cel_e03b", "cel_e04", "cel_e05a", "cel_e05b", "cel_e06a", "cel_e06b", "cel_e07a", "cel_e07b", "cel_e07c", "cel_e08", "cel_e09",
    "cel_f01", "cel_f01b", "cel_f02",
    "cel_h01", "cel_h02", "cel_h03a", "cel_h03b", "cel_h04a", "cel_h04b", "cel_h05a", "cel_h05b", "cel_h06a", "cel_h06b", "cel_h07a", "cel_h07b", "cel_h08a", "cel_h08b", "cel_h09a", "cel_h09b", "cel_h10", "cel_h11a", "cel_h11b"
  ],
  akiha: [
    "aki_e01", "aki_e01b", "aki_e02", "aki_e03", "aki_e04", "aki_e04b", "aki_e05a", "aki_e05b", "aki_e06", "aki_e07a", "aki_e07b", "aki_e08", "aki_e09",
    "aki_f01", "aki_f02",
    "aki_h01", "aki_h02", "aki_h03", "aki_h04", "aki_h05", "aki_h06", "aki_h07", "aki_h08", "aki_h09", "aki_h10", "aki_h11", "aki_h12", "aki_h13", "aki_h14", "aki_h15", 
  ],
  kohaku: [
    "koha_e01a", "koha_e01b", "koha_e02", "koha_e03", "koha_e04", "koha_e05", "koha_e06", "koha_e07", "koha_e08",
    "koha_f01", "koha_f01b", "koha_f02", "koha_f03",
    "koha_h01", "koha_h02", "koha_h03", "koha_h04", "koha_h05", "koha_h06a", "koha_h06b", "koha_h07", "koha_h08", "koha_h10", "koha_h10b", "koha_h11"
  ],
  hisui: [
    "his_e01", "his_e01b", "his_e02", "his_e02b", "his_e02b2", "his_e03", "his_e04", "his_e05", "his_e06", "his_e07a", "his_e07b", "his_e08", "his_e09",
    "his_f01", "his_f02", "his_f03",
    "his_h01", "his_h02", "his_h03", "his_h04a", "his_h04b", "his_h05", "his_h06", "his_h06b", "his_h07", "his_h08", "his_h09", "his_h10", "his_h11", "his_h12", "his_h13", "his_h14", "his_h15", "his_h16"
  ],
  others: [
    "ao_01", "ao_02", "hal_e01", "nero_e04", "stk_e01a", "stk_e01b", "stk_e01c", "stk_e01d", "stk_e02", "stk_e03"
  ],
}

export enum BgTransition {
  type_crossfade_slw = "type_crossfade_slw", //fade
  type_lcartain_mid = "type_lcartain_mid" //bars transition from left to right
}