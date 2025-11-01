import { Socket } from "socket.io";
import { Godot } from "./godot";

export function setupTrackingSocket(socket: Socket) {
  socket.on("payload", payload => {
    // print("payload: ", payload)
    Godot.send_tracking_payload(payload)
  })
}