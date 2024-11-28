import { ChatMessage } from "@twurple/chat";
import { twitchAutoMSG } from "./twitch";
import { Godot } from "./godot";
import { getCurrentTrack } from './omni';
import { shoutout } from "./artists";

var twitchChatCommands: {[index: string]: { args: string[], aliases: string[], desc: string, func: Function }} = {}
var twitchChatCommandFuncs: {[index: string]: Function} = {}

export async function parseChatCommand(channel: string, user: string, text: string, msg: ChatMessage) {
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
  if (text.startsWith(">")) {
    let AD_ID = (text.substring(1)).toUpperCase().replaceAll(" ", "_")
    let ad: any = await Godot.getAdInfoFromID(AD_ID)
    if (!ad.error) {
      let raw_text = `[⠀/⠀>${ad.id}⠀]${ad.desc != "" ? `:⠀${ad.desc}` : ""}`

      await twitchAutoMSG(raw_text, msg, false)
    }
  }
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

// !echo Text Command
export const EchoCommand = TwitchChatCommand("echo", [], ["e"], "Echos text", async (channel: string, user: string, text: string, msg: ChatMessage) => {
  if (user == "planet_bluto") {
    // BluBot.SayEvent(text)
    twitchAutoMSG(text)
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

// !nowplaying Text Command
export const NowPlayingCommand = TwitchChatCommand("nowplaying", [], ["np"], "Returns information about the currently playing song", async (channel: string, user: string, text: string, msg: ChatMessage) => {
  let CurrentTrack = getCurrentTrack()
  if (CurrentTrack) {
    await twitchAutoMSG(`${CurrentTrack.title} - ${CurrentTrack.author.name}: ${CurrentTrack.url}`, msg, true)
  }
})

// !spark Text Command
// export const SparkCommand = TwitchChatCommand("spark", [], ["current_spark", "sparks"], "Returns information about your current spark", async (channel: string, user: string, text: string, msg: ChatMessage) => {
//   var spark = await Sparks.get(msg.userInfo.userId)
//   if (spark) {
//     await twitchAutoMSG(`@${user} Current Spark: [Charge: (${spark.total_charge} / ${Sparks.EVOLVE_QUOTA}) | Prominent Type: ${spark.prominent_charge.titleCase()}]`)
//   } else {
//     await twitchAutoMSG(`@${user} You have no spark... somehow...`)
//   }
// })

// !bumper Text Command
export const BumperCommand = TwitchChatCommand("bumper", [], ["ad", "blubot"], "Returns information about what's currently on blubot's screen", async (channel: string, user: string, text: string, msg: ChatMessage) => {
  var ad: any = await Godot.getAdInfo()

  var raw_text = `[⠀/⠀>${ad.id}⠀]${ad.desc != "" ? `:⠀${ad.desc}` : ""}`
  
  // await chatClient.say("planet_bluto", raw_text, {replyTo: msg})
  await twitchAutoMSG(raw_text, msg, false)
})

// !shoutout Text Command
export const ShoutoutCommand = TwitchChatCommand("shoutout", [], ["so", "shout"], "Shouts out a cool artist :)", async (channel: string, user: string, text: string, msg: ChatMessage) => {
  if (user == "planet_bluto") {
    var exists = await shoutout(text)
    if (!exists) {
      await twitchAutoMSG(`who is dat...`)
    }
  }
})

// !shoutout Text Command

// !shoutout Text Command