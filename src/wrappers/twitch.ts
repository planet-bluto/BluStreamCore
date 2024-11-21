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

authProvider.onRefresh(async (userId, newTokenData) => {fs.writeFile(TOKEN_STORE_PATH, JSON.stringify(newTokenData, null, 4), "utf-8")})
authProvider.addUser(process.env.CHANNEL_ID, tokenData )
authProvider.addIntentsToUser(process.env.CHANNEL_ID, ['chat'])


//// APICLIENT
import { ApiClient } from '@twurple/api'
export const apiClient = new ApiClient({ authProvider })


//// TWITCH CHAT
import { ChatClient, parseEmotePositions, buildEmoteImageUrl, ChatMessage } from '@twurple/chat'
const chatClient = new ChatClient({ authProvider, channels: ['planet_bluto'] })
chatClient.connect()

chatClient.onMessageFailed(print)
chatClient.onNoPermission(print)
chatClient.onAuthenticationSuccess(print)

export async function twitchAutoMSG(text: string, replyTo: null | 2026 = null, includePrefix: boolean = true) {
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
import { parseChatCommand } from '../helpers/twitch_chat_commands'

const fetcher = new EmoteFetcher(undefined, undefined, {apiClient})
const parser = new EmoteParser(fetcher, {
    // Custom HTML format
    template: '<img class="emoji" alt="{name}" src="{link}">',
    // Match without :colons:
    match: /(\w+)+?/g
})

Promise.all([
  // Twitch global
  // fetcher.fetchTwitchEmotes(),
  // Twitch channel
  // fetcher.fetchTwitchEmotes(channelId),
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
  // chatClient.onMessage(trackActivity)
})

var chatterIdCache: {[index: string]: string} = {}
var chatterColorCache: {[index: string]: string} = {}
function appendTwitchMessage(channel: string, user: string, text: string, msg: ChatMessage) {
  if (text.startsWith("!")) {return} // no slashies... >:(

  let please_be_the_color = "#ffffff"
  
  // TODO: Reliably get the color of the chatter
  // msg._raw.split(";").forEach((elem: string) => {
  //   if (elem.startsWith("color")) {
  //     please_be_the_color = elem.split("=")[1]
  //   }
  // })

  chatterColorCache[msg.userInfo.userId] = please_be_the_color
  chatterIdCache[msg.userInfo.userName] = msg.userInfo.userId
}