import { io, Socket } from "socket.io-client";
import { Godot } from "./godot"
import EventEmitter from "eventemitter3";

class HourglassClass extends EventEmitter {
  _socket: Socket

  constructor() {
    super()
    this._socket = io("http://localhost:4687/")
    this._socket.on("connect", async () => {
      print("Hourglass Connected!")

      var currentStatus = await this._socket.emitWithAck("get_status")
      print("Hourglass Status: ", currentStatus)
    })
    this._socket.on("disconnect", async (reason, details) => {
      print("Hourglass Disconnected!")
    })
    this._socket.onAny((eventName, ...args) => {
      this.emit(eventName, ...args)
    })
  }
}

const HourglassEvents = new HourglassClass()

HourglassEvents.on("start", (currentState, duration, timestamp) => {
  print("Hourglass Started With State: ", currentState, duration, timestamp)
  Godot.send_hourglass("start", currentState, duration, timestamp)
})

HourglassEvents.on("ended", (oldState, newState) => {
  print(`Hourglass Ended: ${oldState} => ${newState}`)
  Godot.send_hourglass("ended", oldState, newState)
})

HourglassEvents.on("pause", (remaining) => {
  print("Hourglass Paused: ", remaining)
  Godot.send_hourglass("pause", remaining)
})