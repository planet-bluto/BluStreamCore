import { ChargeType } from "./charge_type";

export const EVOLVE_AMOUNT = 240

export const ChargePresets: {[index: string]: {type: ChargeType, amount: number}} = {
  CHAT: {type: "bolta", amount: 1},
  CHARGE: {type: "bolta", amount: 24},
  SONG_LIKE: {type: "muse", amount: 4},
  SONG_REQUEST: {type: "muse", amount: 12},
  SONG_NOW: {type: "muse", amount: 40},
  BB_PROMPT: {type: "codec", amount: 24},
  BB_SAY: {type: "codec", amount: 6},
  BB_BUMPER: {type: "codec", amount: 2},
  SUBMIT_BUMPER: {type: "visu", amount: 80},
  POPUP_ROULETTE: {type: "malo", amount: 24},
  POPUP_AD: {type: "malo", amount: 12},
}