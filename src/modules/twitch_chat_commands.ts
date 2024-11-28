import { ChatMessage } from "@twurple/chat";
import { twitchAutoMSG } from "./twitch";

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
export const PingCommand = TwitchChatCommand("ping", [], ["p"], "Pings the PLANET_BLUTO_LIVE_STREAM_MANAGER backend (for debugging)", async (channel: string, user: string, text: string, msg: ChatMessage) => {
  if (user == "planet_bluto") {
    // BluBot.SayEvent("pong!")
    twitchAutoMSG("pong! (v2)")
  }
})

// !discord Text Command
export const DiscordCommand = TwitchChatCommand("discord", [], [], "Returns a link to the >PLANET_BLUTO Discord Server", async (channel: string, user: string, text: string, msg: ChatMessage) => {
  await twitchAutoMSG("Join the >PLANET_BLUTO Discord: https://discord.planet-bluto.net/", msg, true)
})

// !project_http Text Command
export const ProjectHTTPCommand = TwitchChatCommand("project_http", [], ["http", "projecthttp", "game"], "Returns information about my current game project, ProjectHTTP (Hit That Turn Please)!", async (channel: string, user: string, text: string, msg: ChatMessage) => {
  await twitchAutoMSG("ProjectHTTP (Hit That Turn Please!) is a fast-paced techinical kart racer with 5 different vehicle types (Kart, Bike, Skates, Board, & ATV/Tank), and character specific mechanics and 'skills' instead of a global item pool! For more information: https://projecthttp.planet-bluto.net/", msg, false)
})