import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setDiscordSocket } from './discord';
import { setupTrackingSocket } from './tracking';

export const app = express()
const httpServer = createServer(app)

let roomSetups: {[index: string]: Function} = {}
export function setupRoom(roomName: string, func: Function) {
  roomSetups[roomName] = func
}

export const SocketIO = new Server(httpServer, {
  cors: {
    origin: '*', // Replace with your client's origin
    methods: ['*'],
  },
})

SocketIO.on('connection', (socket) => {
  console.log('+ New Socket')

  socket.on('disconnect', () => {
    console.log('- Bye Socket')
  })

  socket.onAny((eventName: string, ...args) => {
    if (eventName.startsWith("sub_")) {
      let bits = eventName.split("_")
      bits.shift()
      let roomName = bits.join("_")

      if (roomSetups[roomName]) { roomSetups[roomName](socket, ...args) }

      socket.join(roomName)
    }
  })

  socket.on("discord_identify", () => {
    setDiscordSocket(socket)
  })

  socket.on("sub_phone_tracking", () => {
    setupTrackingSocket(socket)
  })
})


export function startWebServer() {
  httpServer.listen(process.env.WEB_PORT, () => {
    console.log(`Listening: ${process.env.WEB_PORT}`)
  })
}