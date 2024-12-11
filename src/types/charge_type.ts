export type ChargeType = "bolta" | "codec" | "malo" | "muse" | "visu"

export const ChargeTypeInfo: {[type in ChargeType]: {color: string}} = {
  bolta: {
    color: "#024aca"
  },
  codec: {
    color: "#8CD612"
  },
  malo: {
    color: "#E03C28"
  },
  muse: {
    color: "#ffe737"
  },
  visu: {
    color: "#6264DC"
  }
}