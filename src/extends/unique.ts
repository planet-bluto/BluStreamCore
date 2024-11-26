declare global {
  // type print = (...args: any[]) => void
  function unique(obj: Object): Object
}

global.unique = (obj: Object) => {
  return JSON.parse(JSON.stringify(obj))
}

export {}