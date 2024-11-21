import { ChatMessage } from "@twurple/chat";
import { twitchAutoMSG } from "../wrappers/twitch";

var twitchChatCommands: {[index: string]: { args: string[], aliases: string[], desc: string, func: Function }} = {}
var twitchChatCommandFuncs: {[index: string]: Function} = {}

export function parseChatCommand(channel: string, user: string, text: string, msg: ChatMessage) {
  //// '!' commands
  text = text.trim()
  let textBits: string[] = text.split(" ")
  let cmd = (textBits.shift()?.slice(1) || null)

  if (text.startsWith("!") && cmd != null) {
    if (Object.keys(twitchChatCommandFuncs).includes(cmd)) {
      let thisCMDfunc = twitchChatCommandFuncs[cmd]
      thisCMDfunc(channel, user, textBits.join(" "), msg)
    }
  }

  //// '>' ad commands
  // TODO: ...this...
  // if (text.startsWith(">")) {
  //   let AD_ID = (text.substring(1)).toUpperCase().replaceAll(" ", "_")
  //   let ad = await Godot.getAdInfoFromID(AD_ID)
  //   if (!ad.error) {
  //     let raw_text = formatAdToText(ad)

  //     await twitchAutoMSG(raw_text, msg, false)
  //   }
  // }
}

function TwitchChatCommand(cmd: string, args: string[], aliases: string[] = [], desc = "", func: Function = (() => {})){
  twitchChatCommands[cmd] = {
    args,
    aliases,
    desc,
    func
  }

  Array(cmd).concat(aliases).forEach(name => {
    twitchChatCommandFuncs[name] = func
  })

  return twitchChatCommands[cmd]
}

// !ping Text Command
const PingCommand = TwitchChatCommand("ping", [], ["p"], "Pings the PLANET_BLUTO_LIVE_STREAM_MANAGER backend (for debugging)", async (channel: string, user: string, text: string, msg: ChatMessage) => {
  if (user == "planet_bluto") {
    // BluBot.SayEvent("pong!")
    twitchAutoMSG("pong! (v2)")
  }
})