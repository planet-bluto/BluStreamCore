declare global {
    // type print = (...args: any[]) => void
    function print(...args: any[]): void
}

global.print = console.log

export {}