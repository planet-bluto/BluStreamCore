import { setupRoom, SocketIO } from "../workers/web_server";

export interface MessagePayload {
  id?: number;
  content: string; // HTML parseable- sanitizing handled on the erm... this end (backend)
  header?: string; // Usually the author of a message- but can also be the source or type of announcement...
  badges?: string[]; // Array of resolveable image source strings
  style?: { // falls back to all specified defaults
    header_color?: string; // falls back to #252525
    border_color?: string; // falls back to #024aca
    header_format?: boolean // falls back to false
    flashing?: boolean // falls back to false; if true it will override border_color property
 };
  sound?: string; // Resolveable audio source string | falls back to a default noise
  platform?: "twitch" | "youtube" | "discord"; // None will just not show a platform indicator
  extra?: {[index: string]: any}; // Extra random info you wanna attach to the message...
}

export function SOUND_FX(filename: string, ext: string = 'wav') {
  return `./assets/audio/${filename}.${ext}`
}

const DEFAULT_PAYLOAD: MessagePayload = {
  content: "",
  badges: [],
  style: {
    header_color: "#252525",
    border_color: "#024aca",
    header_format: false,
    flashing: false,
  },
  sound: SOUND_FX("chat_blip"),
  extra: {}
}

class MessageHelperClass {
  messages: MessagePayload[] = [];

  constructor() {
    setupRoom("chat", (callback: Function) => {
      callback({messages: this.messages.slice(-10)})
    })
  }

  add(message: MessagePayload) {
    let assigned_message = Object.assign(unique(DEFAULT_PAYLOAD), message)
    if (DEFAULT_PAYLOAD.style) { assigned_message.style = Object.assign(unique(DEFAULT_PAYLOAD.style), message.style) }
    assigned_message["id"] = this.messages.length
    this.messages.push(assigned_message)

    print("mew msg: ", assigned_message)

    SocketIO.to("chat").emit("add", assigned_message)
  }

  remove(id: number) {
    SocketIO.to("chat").emit("remove", id)
  }

  edit(id: number, edit_payload: {[index: string]: any}) { // Any object to Object.assign over in the front-end/browser src
    SocketIO.to("chat").emit("edit", id, edit_payload)
  }
}

export const MessageHelper = new MessageHelperClass()