import EventEmitter from "eventemitter3";
import { Socket } from "socket.io"
import { MessageHelper } from "./messages";
import { getCurrentTrack, OmniMusic } from "./omni";
import { Godot } from "./godot";

// var discordSocket: null | Socket = null
const { toHTML } = require('../lib/discord_markdown.js')

function makeSpeaker(raw_speaker: { user: any; member?: any; voice_state?: any }) {
  var {member, user, voice_state} = raw_speaker
  var nick = member?.nick

  return {
    id: raw_speaker.user.id,
    name: (nick || raw_speaker.user.globalName), // Cache the thingy
    avatar: ( member.avatar ?
      `https://cdn.discordapp.com/guilds/${member.guildId}/users/${member.userId}/avatars/${member.avatar}.png` : 
      `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    ),
    speaking: false,
    mute: voice_state.mute,
    deaf: voice_state.deaf
  }
}

class VoiceChatClass extends EventEmitter {
  speakers: any[] = [];
  channelId: string | null = null;

  constructor() {
    super()
    this.speakers = []
    this.channelId = null
  }

  setupSpeakers(raw_speakers: any) {
    this.speakers = []
    this.speakers = raw_speakers.map(makeSpeaker)
  }
  

  _track(key: string, user_id: string, value: any, eventName: string) {
    if (this.channelId) {
      var speaker_ind = this.speakers.findIndex(this_speaker => this_speaker.id == user_id)
      if (speaker_ind != -1 && this.speakers[speaker_ind][key] != value) {
        this.speakers[speaker_ind][key] = value
        this.emit(eventName, this.speakers[speaker_ind])
      }
    }
  }

  trackSpeaking(user_id: string, state: boolean) {
    this._track("speaking", user_id, state, "speak")
  }

  trackJoining(raw_speaker: any) {
    var new_speaker = makeSpeaker(raw_speaker)
    this.speakers.push(new_speaker)
    this.emit("join", new_speaker)
  }

  trackLeaving(speaker_id: string) {
    var speaker_ind = this.speakers.findIndex(this_speaker => this_speaker.id == speaker_id)
    var old_speaker = this.speakers.remove(speaker_ind)
    this.emit("leave", old_speaker)
  }

  trackMuting(user_id: string, state: boolean) {
    this._track("mute", user_id, state, "mute")
  }

  trackDeafening(user_id: string, state: boolean) {
    this._track("deaf", user_id, state, "deafen")
  }

  trackClientJoining(members: any[]) {
    this.setupSpeakers(members)
    this.emit("client_join", this.speakers)
  }

  trackClientLeaving() {
    this.channelId = null
    this.emit("client_leave")
  }
}

/*

- speaker {id, name, avatar, speaking, mute, deaf} <- context sensitive object representing someone in a voice chat

- speak(speaker) // speaker.speaking
- join(speaker)
- leave(speaker)
- mute(speaker) // speaker.mute
- deafen(speaker) // speaker.deaf
- client_join(speakers)
- client_leave()

*/

export const VoiceChat = new VoiceChatClass()

export async function setDiscordSocket(socket: Socket) {
  print("+ Discord Socket")
  let discordSocket = socket

  discordSocket.on("discord_message_create", async (msg) => {
    // appendMessage(author, text, platform, author_style = null, important = false)
    if (msg.member && msg.author && msg.content) {
      MessageHelper.add({
        header: (msg.member.nick || msg.author.globalName || msg.author.username),
        content: toHTML(msg.content),
        platform: "discord", 
        style: {
          header_color: (msg.member.colorString || "#fff"),
          header_format: true
        },
      })
    }

    if (msg.content.startsWith(".blu")) { // user commands ??
      let args = msg.content.split(" ")
      let prefix = args.shift()
      let cmd = args.shift()

      async function blu_cmd_play() {
        let song_link = args.join(" ")
        var track = await OmniMusic["play_track_next"]((msg.member.nick || msg.author.globalName || msg.author.username), song_link)
        var success = (track != null)
        
        await discordSocket.emitWithAck("send_message", msg.channel_id, `Added song ***"${track.author.name} - ${track.title}"*** to queue! :)`)
        
        if (success) {
          MessageHelper.add({
            badges: ["./assets/icons/song.png"],
            header: (msg.member.nick || msg.author.globalName || msg.author.username),
            content: `High Priority Song Request: <span style="color: #ffffff">[<img class="emoji" alt="${track.service.code}" src="./assets/omni_icons/${track.service.code}.png"> ${track.title} - ${track.author.name}]</span>`,
            platform: "twitch",
            style: {
              header_color: (msg.member.colorString || "#fff"),
              border_color: "#ffe737",
              // border_color: Sparks.TypeInfo.MUSE.color,
            }
          })
        }
      }

      async function blu_cmd_nowPlaying() {
        let CurrentTrack = getCurrentTrack()
        if (CurrentTrack) {
          await discordSocket.emitWithAck("send_message", msg.channel_id, `## [**"${CurrentTrack.author.name} - ${CurrentTrack.title}"**](<${CurrentTrack.url}>)`)
        } else {
          await discordSocket.emitWithAck("send_message", msg.channel_id, `Nothing is playing, FOOL!!`)
        }
      }

      async function blu_cmd_queue() {
        var queue = await OmniMusic["fetch_queue"]()

        if (queue.length > 0) {
          let resString = queue.map((entry: any, ind: number) => `${ind+1}. **${entry.title} - ${entry.author.name}** *(queued by: **${entry.queuer}**)*`).join("\n")
          
          await discordSocket.emitWithAck("send_message", msg.channel_id, ("### Play Next Queue: \n\n" + resString))
        } else {
          await discordSocket.emitWithAck("send_message", msg.channel_id, "The queue is empty, FOOL!!")
        }
        
      }

      switch (cmd) {
        case 'ping':
          await discordSocket.emitWithAck("send_message", msg.channel_id, `Pong!`)
        break;
        case 'play':
          blu_cmd_play()
        break;
        case 'p':
          blu_cmd_play()
        break;
        case 'nowplaying':
          blu_cmd_nowPlaying()
        break;
        case 'np':
          blu_cmd_nowPlaying()
        break;
        case 'queue':
          blu_cmd_queue()
        break;
        case 'q':
          blu_cmd_queue()
        break;
      }
    }
  })

  discordSocket.on("discord_speaking_update", event => {
    function isTalking(speakingFlags: number) {
      return ((speakingFlags & 1) == 1)
    }
    VoiceChat.trackSpeaking(event.userId, isTalking(event.speakingFlags))
    // io.to("sub_voice_status").emit("sub_voice_status_update", state)
  })

  discordSocket.on("discord_voice_state_update", (raw_events) => {
    var events = raw_events.voiceStates.filter((voiceState: any) => {
      var channelIdRelevant = (voiceState.channelId == VoiceChat.channelId)
      var oldChannelIdRelevant = (voiceState.oldChannelId == VoiceChat.channelId)
      return (VoiceChat.channelId != null ? (channelIdRelevant || oldChannelIdRelevant) : false)
    })

    events.forEach(async (event: any) => {
      if (event.oldChannelId == event.channelId) {
        VoiceChat.trackMuting(event.userId, (event.selfMute || event.mute))
        VoiceChat.trackDeafening(event.userId, (event.selfDeaf || event.deaf))
      } else {
        if (event.channelId == VoiceChat.channelId) {
          var raw_speaker = await discordSocket.emitWithAck("get_raw_speaker", event.userId)
          VoiceChat.trackJoining(raw_speaker)
        } else {
          VoiceChat.trackLeaving(event.userId)
        }
      }
    })
    // io.to("sub_voice_status").emit("sub_voice_status_channel_update", member_objs)
  })

  discordSocket.on("discord_client_join_voice", async (raw_speakers) => {
    VoiceChat.trackClientJoining(raw_speakers)

    var newChannelId = await discordSocket.emitWithAck("get_channel_id")
    VoiceChat.channelId = newChannelId
  })
  discordSocket.on("discord_client_left_voice", () => {
    VoiceChat.trackClientLeaving()
  })

  var raw_speakers = await discordSocket.emitWithAck("get_raw_speakers")
  if (raw_speakers != null) { VoiceChat.setupSpeakers(raw_speakers) }

  var channelId = await discordSocket.emitWithAck("get_channel_id")
  VoiceChat.channelId = channelId

  if (Godot.connected) {
    Godot.send_voice_join_event(VoiceChat.speakers)
  } else {
    Godot.on("connected", (idx: number) => {
      Godot.send_voice_join_event(VoiceChat.speakers, idx)
    })
  }
}

// Godot.send_voice_event(type, speaker)
// Godot.send_join_voice_event(speakers)
// Godot.send_left_voice_event()

VoiceChat.on("speak", (speaker) => {
  // print(`${speaker.name} ${(speaker.speaking ? "is now" : "has stopped")} speaking!`)
  // if (speaker.speaking) {
  //   OmniMusic.reduceVolume(`speak_${speaker.id}`, (speaker.id == "334039742205132800" ? 0.4 : 0.8))
  // } else {
  //   OmniMusic.raiseVolume(`speak_${speaker.id}`)
  // }
  Godot.send_voice_event("speak", speaker)
})

VoiceChat.on("join", (speaker) => {
  // print(`${speaker.name} has joined the voice chat!`)
  Godot.send_voice_event("join", speaker)
})

VoiceChat.on("leave", (speaker) => {
  // print(`${speaker.name} has left the voice chat!`)
  Godot.send_voice_event("leave", speaker)
})

VoiceChat.on("mute", (speaker) => {
  // print(`${speaker.name} has ${(speaker.mute ? "" : "un")}muted!`)
  Godot.send_voice_event("mute", speaker)
})

VoiceChat.on("deafen", (speaker) => {
  // print(`${speaker.name} has ${(speaker.deaf ? "" : "un")}deafened!`)
  Godot.send_voice_event("deafen", speaker)
})

VoiceChat.on("client_join", (speakers) => {
  // print(`Client joined a voice chat:`, speakers.map(speaker => speaker.name))
  Godot.send_voice_join_event(speakers)
})

VoiceChat.on("client_leave", () => {
  // print(`Client left the voice chat`)
  Godot.send_voice_left_event()
})