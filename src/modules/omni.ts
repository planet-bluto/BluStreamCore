import EventEmitter from "eventemitter3";
import { io, Socket } from "socket.io-client";
import { twitchAutoMSG } from "./twitch";
import { MessageHelper } from "./messages";

export class OmniMusicClass extends EventEmitter {
  _socket: Socket;

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
}

export const OmniMusic = new OmniMusicClass()

OmniMusic._socket.on("connect", () => {
  OmniMusic._socket.emit("$streamServer")
})

var CurrentTrack: any = null
export function getCurrentTrack() { return CurrentTrack }

OmniMusic.on("nowplaying", event => {
  CurrentTrack = event.track
  twitchAutoMSG(`Now Playing: ${CurrentTrack.title} - ${CurrentTrack.author.name}`)

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