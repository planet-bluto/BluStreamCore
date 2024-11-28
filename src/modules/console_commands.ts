import { Godot } from "./godot"
import { apiClient } from "./twitch"
import { SocketIO } from "./web_server"

const readline = require('node:readline')
const { stdin: input, stdout: output } = require('node:process')
const rl = readline.createInterface({ input, output })
export let ConsoleCommands: {[index: string]: {args: string[], desc: string, aliases: string[], func: Function}} = {}
var mains: string[] = []
rl.on("line", (input: string) => {
  let args = input.split(" ")
  let cmd = args.shift()

  if (cmd) {
    ConsoleCommands[cmd]?.func(...args)
  }
})

function ConsoleCommand(name: string, aliases: string[], args: string[], desc: string, func: Function) {
  ConsoleCommands[name] = {args, desc, aliases, func}
  mains.push(name)
  aliases.forEach(alias => {
    ConsoleCommands[alias] = {args, desc, aliases, func}
  })
}

ConsoleCommand("ping", [], [], "Prints 'pong!'", () => {
  print("pong!")
})

ConsoleCommand("help", [], ["<?command>"], "A list of commands OR get help on a specific command", (cmd: string) => {
  if (!cmd) {
    let lines: string[] = []

    mains.forEach(cmd => {
      let info = ConsoleCommands[cmd]
      lines.push(`> ${cmd} ${info.args.join(" ")}\n   ${info.desc}\n\n`)
    })

    print(`\nCommand Help:\n${lines.join("\n")}`)
  } else {
    let info = ConsoleCommands[cmd]
    print(`\nCommand Help:\n${cmd} ${info.args.join(" ")}\n\nDescription:\n${info.desc}\n\nAliases:\n${info.aliases}`)
  }
})

ConsoleCommand("set_header", ["sh", "head"], ["[new_header]"], "Changes the stream header on the layout and Twitch (and Discord?)", async (...args: string[]) => {
  let new_header = args.join(" ")
  SocketIO.emit("header_update", new_header)

  let channelInfo = await apiClient.channels.getChannelInfoById(process.env.CHANNEL_ID)
  if (channelInfo == null) { return }
  let new_title = channelInfo.title.split(" (")[0] + ` (${new_header})`

  let res = await apiClient.channels.updateChannelInfo(process.env.CHANNEL_ID, {title: new_title})
  print(res + " (Updated stream header!)")
})

ConsoleCommand("set_header_emote", ["she", "emote"], ["[emote_name]"], "Changes the stream header's emote on the layout (and Discord?)", async (...args: string[]) => {
  let new_emote = args.join(" ")
  SocketIO.emit("header_emote_update", new_emote)
})

ConsoleCommand("set_title", ["st", "title"], ["[new_header]"], "Changes the stream title on Twitch", async (...args: string[]) => {
  let this_title = args.join(" ")

  let channelInfo = await apiClient.channels.getChannelInfoById(process.env.CHANNEL_ID)
  if (channelInfo == null) { return }
  let new_title = this_title + " (" + channelInfo.title.split(" (")[1]

  let res = await apiClient.channels.updateChannelInfo(process.env.CHANNEL_ID, {title: new_title})
  print(res + " (Updated stream title!)")
})

// why tf do I add command desc I'm da nigga who made them and fuckin' only one who used them...
ConsoleCommand("game_lookup", ["gl"], ["[game_title]"], "Searches for games", async (...args: string[]) => {
  let query = args.join(" ")
  print(`Searching for... '${query}'`)
  let categories = await apiClient.search.searchCategories(query, {limit: 10})
  categories.data.forEach(game => {
    print(`[${game.id}] ${game.name}`)
  })
})

const game_id_presets: {[index: string]: string} = {
  "game dev": "1469308723",
  "dev": "1469308723",
  "chatting": "509658",
  "just chatting": "509658",
  "brawlhalla": "460316",
  "mkwii": "18871",
  "mk8": "941530474",
  "mk8d": "941530474",
  "srb2 kart": "504413385",
  "srb2kart": "504413385",
  "ring racers": "1308655139",
  "drrr": "1308655139",
  "minecraft": "27471",
  "mc": "27471",
  "rivals": "488436",
  "roa": "488436",
  "rivals of aether": "488436",
  "rivals 2": "330654616",
  "rivals2": "330654616",
  "roa2": "330654616",
  "roa 2": "330654616",
}
ConsoleCommand("set_game", ["sg"], ["[id]"], "Sets stream game/category", async (...args: string[]) => {
  let id = (args.join(" ")).toLowerCase()

  if (Object.keys(game_id_presets).includes(id)) { id = game_id_presets[id] }

  let res = await apiClient.channels.updateChannelInfo(process.env.CHANNEL_ID, {gameId: id})
  print(res + " (Updated stream category!)")
})

ConsoleCommand("debug", ["d"], ["[type]", "[user]", "[number]", "[content]"], "Tests an event", async (...args: string[]) => {
  let type = args.shift()
  let user = args.shift()
  let number = Number(args.shift())
  let content: null | string = args.join(" ")

  number = (number != null ? Number(number) : 0)
  content = (content == "" ? null : content)

  Godot.emit("debug", type, user, content, number)
})

// ConsoleCommand("start_stream", ["start", "s"], [], "Manually tracks the timestamp this command is ran as a stream start for event tracking", async (...args: string[]) => {
//   trackStreamStart()
// })

// ConsoleCommand("undo_stream_start", ["undo_start", "us"], ["[?amount]"], "Removes one or a specified of stream start events", async (...args: string[]) => {
//   let amount

//   if (args.length > 0) {
//     amount = Math.abs(Number(args[0]))
//   } else {
//     amount = 1
//   }

//   let StreamStartDB = await DB.fetch("stream_starts")
//   StreamStartDB.data = StreamStartDB.data.slice(0, -amount)
//   await StreamStartDB.write()

//   print(`Removed ${amount} Stream Starts...`)
// })

ConsoleCommand("list_subs", ["ls"], [], "Lists all subs of the channel", async (...args: string[]) => {
  let subs = await apiClient.subscriptions.getSubscriptions(process.env.CHANNEL_ID)
  print(subs.data.map(sub => sub.userDisplayName).filter(subName => subName != "planet_bluto"))
})

// ConsoleCommand("temp_get_id", [], [], "Gets scene item id whatever", async (...args: string[]) => {
//   let sceneItemName = args.join(" ")
//   let sceneItemId = await obs.call("GetSceneItemId", {sceneName: "Main (Root)", sourceName: sceneItemName})
//   print("Scene Item ID: ", sceneItemId)
// })

// ConsoleCommand("blubot_context", [], [], "Gets BluBot System Instructions", async (...args: string[]) => {
//   let systemInstruction = BluBot.compileContext().join("\n")
//   print("BluBot Sys Instruction:\n\n", systemInstruction)
// })

ConsoleCommand("id_to_user", ["itu"], [], "Gets user from ID", async (...args: string[]) => {
  let user = await apiClient.users.getUserById(args.join(" "))
  if (user == null) { return }
  print(user.displayName)
})

ConsoleCommand("user_to_id", ["uti"], [], "Gets user's ID", async (...args: string[]) => {
  let user = await apiClient.users.getUserByName(args.join(" "))
  if (user == null) { return }
  print(user.id)
})

// ConsoleCommand("get_active_users_since_timestamp", ["active_users"], [], "Gets all the user IDs of the active users since a certain timestamp", async (...args: string[]) => {
//   let arg = args.join(" ")
//   print(arg)

//   let timestamp = null
//   if (arg != "") {
//     timestamp = Number(arg)
//   }

//   let active_users = await Activity.getActiveUsersSinceTimestamp(timestamp)
//   let users = await apiClient.users.getUsersByIds(active_users)
//   print(users.map(user => {
//     return {
//       id: user.id,
//       name: user.displayName,
//     }
//   }))
// })

// ConsoleCommand("friend", [], [], "Return Friend OBJ", async (...args: string[]) => {
//   print(JSON.stringify(Friends.getByID(args.join(" "))))
// })

// ConsoleCommand("blink", [], [], "Blinks", async (...args: string[]) => {
//   let res = await obs.call("GetSceneItemTransform", {sceneName: "Main - Focus WHATEVER", sceneItemId: 1})
//   print(res)
// })