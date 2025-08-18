import fs from 'node:fs/promises'





//// AUTHENTICATION
// TODO: Make this file generate automatically when it's missing...
const TOKEN_STORE_PATH = '../../token_store.json'
const tokenData = require(TOKEN_STORE_PATH)

import { RefreshingAuthProvider } from '@twurple/auth'
export const authProvider = new RefreshingAuthProvider({
  clientId: process.env.TWITCH_CLIENT_ID, 
  clientSecret: process.env.TWITCH_CLIENT_SECRET
})

class TwitchMessageSettingsClass {
  autoMessagesEnabled: boolean = true
}

export const TwitchMessageSettings = new TwitchMessageSettingsClass()

authProvider.onRefresh(async (userId, newTokenData) => {fs.writeFile(TOKEN_STORE_PATH, JSON.stringify(newTokenData, null, 4), "utf-8")})
authProvider.addUser(process.env.CHANNEL_ID, tokenData )
authProvider.addIntentsToUser(process.env.CHANNEL_ID, ['chat'])





//// APICLIENT
import { ApiClient, HelixChatBadgeSet } from '@twurple/api'
export const apiClient = new ApiClient({ authProvider })

import { EventSubWsListener } from '@twurple/eventsub-ws';
import { EventSubChannelCheerEvent, EventSubChannelFollowEvent, EventSubChannelHypeTrainBeginEvent, EventSubChannelHypeTrainEndEvent, EventSubChannelRaidEvent, EventSubChannelRedemptionAddEvent, EventSubChannelSubscriptionEvent, EventSubChannelSubscriptionGiftEvent, EventSubChannelSubscriptionMessageEvent } from '@twurple/eventsub-base';
export const twitchListener = new EventSubWsListener({ apiClient })

import EventEmitter from 'eventemitter3'
export const TwitchEvents = new EventEmitter()





//// TWITCH CHAT
import { ChatClient, parseEmotePositions, buildEmoteImageUrl, ChatMessage } from '@twurple/chat'
const chatClient = new ChatClient({ authProvider, channels: ['planet_bluto'] })
chatClient.connect()

chatClient.onMessageFailed(print)
chatClient.onNoPermission(print)
chatClient.onAuthenticationSuccess(print)

// User Cache
var chatterIdCache: {[index: string]: string} = {}
var chatterColorCache: {[index: string]: string} = {}
var chatterBadgeCache: {[index: string]: string[]} = {}

export async function userResolveID(userResolvable: string) {
  if (chatterIdCache[userResolvable]) { return chatterIdCache[userResolvable] }

  try {
    let userById = await apiClient.users.getUserById(userResolvable)
    if (userById) { return userById.id }
  } catch(err) {
    // ...
  }

  try {
    let userByName = await apiClient.users.getUserByName(userResolvable)
    if (userByName) { return userByName.id }
  } catch(err) {
    // ...
  }
}

export async function getUserColor(userResolvable: string) { // ID, then DisplayName
  let returnColor = "#ffffff";

  if (chatterColorCache[userResolvable]) {
    returnColor = chatterColorCache[userResolvable] // Try cached color first...
  } else {
    let userId = await userResolveID(userResolvable)
    if (userId) {
      let color = await apiClient.chat.getColorForUser(userId)
      if (color) {
        returnColor = color // Then fetched... 
      }
    }
  }

  return returnColor
}

export async function getUserBadges(userResolvable: string) {
  let returnBadges: string[] = [];

  if (chatterBadgeCache[userResolvable]) {
    returnBadges = chatterBadgeCache[userResolvable] // Try cached color first...
  } else {
    let userId = await userResolveID(userResolvable)
    if (userId) { returnBadges = chatterBadgeCache[userId] }
  }

  return returnBadges
}

export async function twitchAutoMSG(text: string, replyTo: (ChatMessage | 2026 | null) = null, includePrefix: boolean = true) {
  // const AUTO_PREFIX = "[ / >]: "
  const AUTO_PREFIX = "planet298BluBot "

  var content = (includePrefix ? AUTO_PREFIX + text : text)

  if (replyTo == 2026) {
    await apiClient.chat.sendAnnouncement(process.env.CHANNEL_ID, {color: "blue", message: text})
  } else if (replyTo) {
    await chatClient.say("planet_bluto", content, {replyTo})
  } else {
    await chatClient.action("planet_bluto", content)
  }
}

// Emote Parsing...
import { EmoteFetcher, EmoteParser } from '@mkody/twitch-emoticons'
import { parseChatCommand } from './twitch_chat_commands'
import { MessageHelper, MessagePayload } from './messages';

const fetcher = new EmoteFetcher(undefined, undefined, {apiClient})
const parser = new EmoteParser(fetcher, {
    // Custom HTML format
    template: '<img class="emoji" alt="{name}" src="{link}">',
    // Match without :colons:
    match: /(\w+)+?/g
})

// GET *MOST EMOTES
Promise.all([
  // Twitch global
  // fetcher.fetchTwitchEmotes(),
  // Twitch channel
  // fetcher.fetchTwitchEmotes(process.env.CHANNEL_ID),
  // BTTV global
  fetcher.fetchBTTVEmotes(),
  // BTTV channel
  fetcher.fetchBTTVEmotes(Number(process.env.CHANNEL_ID)),
  // 7TV global
  fetcher.fetchSevenTVEmotes(),
  // 7TV channel
  fetcher.fetchSevenTVEmotes(Number(process.env.CHANNEL_ID)),
  // FFZ global
  fetcher.fetchFFZEmotes(),
  // FFZ channel
  fetcher.fetchFFZEmotes(Number(process.env.CHANNEL_ID))
]).then(() => {
  chatClient.onMessage(appendTwitchMessage)
  chatClient.onMessage(parseChatCommand)
})

// GET ALL BADGES
let allBadges: HelixChatBadgeSet[] = []
async function getAllBadges() {
  var channelBadges = await apiClient.chat.getChannelBadges(process.env.CHANNEL_ID)
  var globalBadges = await apiClient.chat.getGlobalBadges()
  allBadges = channelBadges.concat(globalBadges)
}

getAllBadges()

// CHAT PROCESSING
import sanitizeHtml from 'sanitize-html'
import { BluStreamDB, chargeSpark, trackActivity } from './blu_stream_db'
import { BluBotAI } from './blubotai'
import { SocketIO } from './web_server'

async function appendTwitchMessage(channel: string, user: string, text: string, msg: ChatMessage) {
  print(msg)
  SocketIO.emit("chatter_push", {id: msg.userInfo.userId, username: msg.userInfo.userName})

  if (text.startsWith("!")) {return} // no slashies... >:(

  // Colors
  let please_be_the_color = "#ffffff"
  if (msg.userInfo.color) {
    please_be_the_color = msg.userInfo.color
    chatterColorCache[msg.userInfo.userId] = please_be_the_color
  }

  chatterIdCache[msg.userInfo.userName] = msg.userInfo.userId

  // Badges
  var userBadges = Array.from(msg.userInfo.badges).map(badgeEntry => {
    var badgeSet = allBadges.find(badgeSet => badgeSet.id == badgeEntry[0])
    if (!badgeSet) { return null }
    var badgeVersion = badgeSet.getVersion(badgeEntry[1])
    if (!badgeVersion) { return null }
    return badgeVersion.getImageUrl(2)
  }).filter(badgeUrl => (badgeUrl != null))

  chatterBadgeCache[msg.userInfo.userId] = userBadges

  if (msg.rewardId != null) { return }

  await chargeSpark(msg.userInfo.userId, ["CHAT"])
  await trackActivity(msg.userInfo.userId, "chat", { text: msg.text })

  // Text Emote Parsing and Cleaning :)
  let current_text = sanitizeHtml(text)
  current_text = parser.parse(current_text)

  let emotePositions = parseEmotePositions(text, msg.emoteOffsets)

  let cached: string[] = []
  emotePositions.forEach(emotePart => {
    if (!cached.includes(emotePart.id)) {
      var emoteSRC = buildEmoteImageUrl(emotePart.id, {
        size: "2.0"
      })
      
      current_text = current_text.replaceAll(emotePart.name, `<img class="emoji" alt="${emotePart.name}" src="${emoteSRC}"> `)

      cached.push(emotePart.id)
    }
  })

  // Forward to Socket!
  MessageHelper.add({
    header: msg.userInfo.userName,
    content: current_text,
    badges: userBadges,
    platform: "twitch",
    style: {
      header_color: please_be_the_color,
      header_format: true
    },
    extra: {
      twitch: true,
      userId: msg.userInfo.userId
    }
  })
}

twitchListener.onChannelChatClearUserMessages(process.env.CHANNEL_ID, process.env.CHANNEL_ID, async (event) => {
  print("oop-")
  let toRemove: number[] = []

  MessageHelper.messages.forEach((msg: MessagePayload) => {
    if (msg.extra && msg.extra.twitch && msg.extra.userId == event.userId && msg.id) {
      toRemove.push(msg.id)
    }
  })

  MessageHelper.remove(toRemove)

  print(MessageHelper)
})





//// TWITCH EVENTS

// Follow Event
twitchListener.onChannelFollow(process.env.CHANNEL_ID, process.env.CHANNEL_ID, (event: EventSubChannelFollowEvent) => {
  TwitchEvents.emit("follow", event.userDisplayName)
})

// Sub Event
twitchListener.onChannelSubscriptionMessage(process.env.CHANNEL_ID, async (event: EventSubChannelSubscriptionMessageEvent) => {
  TwitchEvents.emit("sub", event.userDisplayName, (Number(event.tier) / 1000), event.messageText)
})

// Sub Event
twitchListener.onChannelSubscription(process.env.CHANNEL_ID, async (event: EventSubChannelSubscriptionEvent) => {
  TwitchEvents.emit("sub", event.userDisplayName, (Number(event.tier) / 1000))
})

// Gift Sub Event
twitchListener.onChannelSubscriptionGift(process.env.CHANNEL_ID, async (event: EventSubChannelSubscriptionGiftEvent) => {
  TwitchEvents.emit("giftsub", event.gifterName, event.amount)
})

// Raid Event
twitchListener.onChannelRaidTo(process.env.CHANNEL_ID, async (event: EventSubChannelRaidEvent) => {
  TwitchEvents.emit("raid", event.raidingBroadcasterDisplayName, event.viewers)
})

// Bit Event
twitchListener.onChannelCheer(process.env.CHANNEL_ID, async (event: EventSubChannelCheerEvent) => {
  TwitchEvents.emit("bit", event.userDisplayName, event.bits, event.message)
})

// Hype Train Events
twitchListener.onChannelHypeTrainBegin(process.env.CHANNEL_ID, async (event: EventSubChannelHypeTrainBeginEvent) => {
  TwitchEvents.emit("hypetrain", 0)
})
twitchListener.onChannelHypeTrainEnd(process.env.CHANNEL_ID, async (event: EventSubChannelHypeTrainEndEvent) => {
  TwitchEvents.emit("hypetrain", event.level)
})


export async function fulfill(event: EventSubChannelRedemptionAddEvent, cancel = false) {
  var fulfilled = false

  try {
    await event.updateStatus(cancel ? "CANCELED" : "FULFILLED")
    fulfilled = true
  } catch(err) {
    print("Oh hell no", err)
  }

  return fulfilled
}

const BluBotEmojiMap = {
  "SHOCK": "😱",
  "MAD": "😡",
  "THANK": "🙏",
  "CONFUSED": "❔",
  "THREAT": "🔪",
  "EYEROLL": "🙄",
}

BluBotAI.on("output", async (output: {mood: string; content: string}[]) => {
  var raw_lines = output.map(line => line.content)
  var lines = output.map(line => {
    return `${BluBotEmojiMap[line.mood as keyof typeof BluBotEmojiMap]} ${line.content}`
  })

  var text = lines.join("\n")
  // client.channels WHAT THE FUCK DO YOU MEAN YOU HAVEN'T USED DISCORD.JS ONCE YET??

  var raw_text = raw_lines.join(" ")
  MessageHelper.add({
    badges: ["./assets/icons/blubot.png"],
    header: "[  / >] BLU_BOT", 
    content: raw_text, 
    platform: "twitch", 
    style: {
      header_color: "#8CD612",
      header_format: false,
    }
  })
  await twitchAutoMSG(raw_text)
})

export async function timeout(userId: string, duration?: number) {
  print(`> Pretend I banned ${userId} right now...`)
  await apiClient.moderation.banUser(process.env.CHANNEL_ID, {user: userId, duration, reason: "I said so, bitch"})
}