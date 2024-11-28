import { setupRoom, SocketIO } from "./web_server";
import { getUserColor, TwitchEvents } from "./twitch";
import { Socket } from 'socket.io';

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
  id_int: number = 0;
  messages: MessagePayload[] = [];

  constructor() {
    setupRoom("chat", (socket: Socket, callback: Function) => {
      callback({messages: this.messages.slice(-10)})
    })
  }

  add(message: MessagePayload) {
    let assigned_message = Object.assign(unique(DEFAULT_PAYLOAD), message)
    if (DEFAULT_PAYLOAD.style) { assigned_message.style = Object.assign(unique(DEFAULT_PAYLOAD.style), message.style) }
    assigned_message["id"] = this.id_int
    this.messages.push(assigned_message)

    SocketIO.to("chat").emit("add", assigned_message)

    this.id_int++
  }

  remove(ids: number[]) {
    this.messages = this.messages.filter(msg => (!ids.includes((msg.id || -1))))
    SocketIO.to("chat").emit("remove", ids)
  }

  edit(id: number, edit_payload: {[index: string]: any}) { // Any object to Object.assign over in the front-end/browser src
    SocketIO.to("chat").emit("edit", id, edit_payload)
  }
}

export const MessageHelper = new MessageHelperClass()





//// TWITCH EVENT HOOKUP

function addTwitchEvent(obj: MessagePayload) {
  let twitchPreset = {
    platform: "twitch",
    style: {
      border_color: "#ffe737"
    },
    sound: SOUND_FX("blubot_notif")
  }

  let newObj = Object.assign(unique(twitchPreset), obj)
  newObj.style = Object.assign(unique(twitchPreset.style), obj.style)

  MessageHelper.add(newObj)
}

TwitchEvents.on("follow", async (userName: string) => {
  addTwitchEvent({
    badges: ["./assets/icons/sub.png"],
    header: userName,
    content: `Just <span style="color: #ffffff">followed</span> the channel! Welcome to PLANET_BLUTO!`,
    style: {
      header_color: (await getUserColor(userName)),
      header_format: true,
    }
  })
})

TwitchEvents.on("sub", async (userName: string, months: number, content: string) => {
  addTwitchEvent({
    badges: ["./assets/icons/sub.png"],
    header: userName,
    content: `<span style="color: #ffffff">Subscribed for ${months} month${(months > 1 ? "s" : "")}!</span><br>${(content != null ? content : "")}`,
    style: {
      header_color: (await getUserColor(userName)),
      header_format: true,
    }
  })
})

TwitchEvents.on("giftsub", async (userName: string, amount: number) => {
  addTwitchEvent({
    badges: ["./assets/icons/gift.png"],
    header: userName,
    content: `<span style="color: #ffffff">Gifted ${amount} subscription${(amount > 1 ? "s" : "")}</span> to chat!`,
    style: {
      header_color: (await getUserColor(userName)),
      header_format: true,
    }
  })
})

TwitchEvents.on("raid", async (userName: string, viewers: number) => {
  addTwitchEvent({
    badges: ["./assets/icons/people.png"],
    header: userName,
    content: `Raided the stream with <span style="color: #ffffff">${viewers} viewer${(viewers > 1 ? "s" : "")}!</span>`,
    style: {
      header_color: (await getUserColor(userName)),
      header_format: true,
    }
  })
})

TwitchEvents.on("bit", async (userName: string, amount: number, content: string) => {
  addTwitchEvent({
    badges: ["./assets/icons/money.png"],
    header: userName,
    content: `<span style="color: #ffffff">Cheered ${amount} bit${(amount > 1 ? "s" : "")}!</span><br>${(content != null ? content : "")}`,
    style: {
      header_color: (await getUserColor(userName)),
      header_format: true,
    }
  })
})

TwitchEvents.on("hypetrain", async (level: number) => {
  if (level == 0 || level == null) {
    addTwitchEvent({
      badges: ["./assets/icons/system.png"],
      header: "HYPE TRAIN!!",
      content: `A HypeTrain has just started!`,
      style: {
        header_color: "#ffffff",
        header_format: false,
      }
    })
  } else {
    addTwitchEvent({
      badges: ["./assets/icons/system.png"],
      header: "HYPE TRAIN ENDED",
      content: `We reached Hype Train <span style="color: #ffffff">Level ${level}!${(level > 1 ? "!" : "")}</span>`,
      style: {
        header_color: "#ffffff",
        header_format: false,
      }
    })
  }
})