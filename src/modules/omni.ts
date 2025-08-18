import EventEmitter from "eventemitter3";
import { io, Socket } from "socket.io-client";
import { fulfill, getUserBadges, getUserColor, twitchAutoMSG, TwitchMessageSettings } from "./twitch";
import { MessageHelper } from "./messages";
import { EventSubChannelRedemptionAddEvent } from "@twurple/eventsub-base";
import { chargeSpark, trackActivity } from "./blu_stream_db";
import { ChargePresets } from "../types/charge_presets";
import { ChargeTypeInfo } from "../types/charge_type";

export class OmniMusicClass extends EventEmitter {
  _socket: Socket;
  _active_lowers: {[index: string]: null | number} = {};

  constructor() {
    super()
    this._socket = io("http://localhost:8080/")
    this._socket.on("connect", () => {
      print("+ Omni Socket")
      this._socket.emit("$reg_nowplaying")
      this._socket.emit("$reg_progress")
      this._socket.emit("$reg_status")
    })
    this._socket.onAny((eventName, ...args) => {
      this.emit(eventName, ...args)
    })
    // this._socket.on("nowplaying", event => {
    //   // print("Omni Now Playing:", event)
    //   Godot.send_omni_event("nowplaying", event)
    // })
    // this._socket.on("progress", event => {
    //   // print("Omni Progress:", event)
    //   Godot.send_omni_event("progress", event)
    // })
    // this._socket.on("status", event => {
    //   // print("Omni Status:", event)
    //   this.emit("status", event)
    //   Godot.send_omni_event("status", event)
    // })
  }

  async queue_track(userName: string, trackURL: string) {
    var track = await this._socket.emitWithAck("$stream_add_to_queue", [userName, trackURL])
    return track
  }

  async play_track_next(userName: string, trackURL: string) {
    var track = await this._socket.emitWithAck("$stream_play_next", [userName, trackURL])
    return track
  }

  async fetch_queue() {
    var queue = await this._socket.emitWithAck("$stream_fetch_queue", [])
    return (queue || [])
  }

  async reduceVolume(id: string, volume = 0.1) {
    let theLowest = Object.values(this._active_lowers).every(val => (val == null || volume < val))
    this._active_lowers[id] = volume

    if (theLowest) {
      // print("erm...", id, volume)
      this._socket.emit("$stream_set_volume", [volume])
    }
  }

  async raiseVolume(id: string | null = null) {
    if (id != null) { this._active_lowers[id] = null }

    let byLowest = Object.values(this._active_lowers).sort((valA, valB) => { return (valA || 1) - (valB || 1) })
    this._socket.emit("$stream_set_volume", [(byLowest[0] || 1.0)])
  }
}

export const OmniMusic = new OmniMusicClass()

OmniMusic._socket.on("connect", () => {
  OmniMusic._socket.emit("$streamServer")
})

var CurrentTrack: any = null
export function getCurrentTrack() { return CurrentTrack }

OmniMusic.on("nowplaying", event => {
  CurrentTrack = event.track
  if (TwitchMessageSettings.autoMessagesEnabled) { twitchAutoMSG(`Now Playing: ${CurrentTrack.title} - ${CurrentTrack.author.name}`) }

  MessageHelper.add({
    badges: ["./assets/icons/song.png"],
    header: "Now Playing!",
    content: `<span style="color: #ffffff">[<img class="emoji" alt="${CurrentTrack.service.code}" src="./assets/omni_icons/${CurrentTrack.service.code}.png"> ${CurrentTrack.title} - ${CurrentTrack.author.name}]</span>`,
    style: {
      header_color: "#ffe737",
      border_color: "#F68F37"
    }
  })
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function song_queue_reward(type: "queue_track" | "play_track_next", event: EventSubChannelRedemptionAddEvent) {
  let local_reward_id = (type == "play_track_next" ? "SONG_NOW" : "SONG_REQUEST")
  
  var infoProms = await Promise.all([
    OmniMusic[type](event.userDisplayName, event.input),
    getUserColor(event.userDisplayName),
  ])
  var track = infoProms[0]
  let userColor = infoProms[1]

  var success = (track != null)
  if (success) {
    twitchAutoMSG(`@${event.userDisplayName} Added '${track.title} - ${track.author.name}' to${type == "play_track_next" ? " priority" : ""} queue!`)
    MessageHelper.add({
      badges: ["./assets/icons/song.png"],
      header: event.userDisplayName,
      content: `${type == "play_track_next" ? "High Priority " : ""}Song Request: <span style="color: #ffffff">[<img class="emoji" alt="${track.service.code}" src="./assets/omni_icons/${track.service.code}.png"> ${track.title} - ${track.author.name}]</span>`,
      platform: "twitch",
      style: {
        header_color: userColor,
        border_color: ChargeTypeInfo[ChargePresets[local_reward_id].type].color
      }
    })
  } else {
    // appendMessage(event.userDisplayName, event.input, "twitch", `color: ${userColor}`, [], userBadges)
    twitchAutoMSG(`@${event.userDisplayName} Error occured... :^(`)
  }

  await fulfill(event, !success)
  if (success) {
    await chargeSpark(event.userId, [(type == "play_track_next" ? "SONG_NOW" : "SONG_REQUEST")])
    await trackActivity(event.userId, "song_request", track.omni_id)
  }

  // print(`From REDEEMPTION, got MSG: `, REDEEM_MSGS[event.id])
}