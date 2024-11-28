import path from "path"
import fs from "fs/promises"
import express from 'express';
import { app, setupRoom } from "./web_server"
import { Socket } from "socket.io";
import { Godot } from "./godot";
import { apiClient } from "./twitch";
import { ConsoleCommands } from "./console_commands";
import { Artists, shoutout } from "./artists";
import { OBS } from "./obs";

const WEBSITE_PATH = path.resolve(__dirname, "../../website")

app.use('/', express.static(WEBSITE_PATH))

app.get("/", (req, res) => {
  res.sendFile('/index.html', {root: WEBSITE_PATH})
})

setupRoom("control_panel", (socket: Socket, callback: Function) => {
  // print(socket)
  socket.on("print", print)

  socket.on("request_artists", () => { socket.emit("artists_received", Artists.getAll()) })

  socket.on("request_popups", async () => {
    var popups = await Godot.getPopups()
    socket.emit("popups_received", popups)
  })

  socket.on("request_emotes", async () => {
    let files = await fs.readdir("./website/assets/emotes")
    files = files.filter(file => !file.startsWith("."))

    files = files.map(emotePath => {
      let pathBits = emotePath.split(".")
      pathBits = pathBits.splice(0, pathBits.length-1)
      return pathBits.join(".")
    })

    socket.emit("emotes_received", files)
  })

  socket.on("shoutout", (friend_id) => { shoutout(friend_id) })

  socket.on("spawn_popup", (popup_id) => { Godot.spawnPopup(popup_id) })

  // socket.on("chatter_timeout", (twitch_id, duration) => { timeout(twitch_id, duration) })

  socket.on("stream_start", () => { OBS.start() })

  // socket.on("start_end_screen", () => { start_end_screen() })
  
  socket.on("get_title_header", async (callback) => {
    let res = await apiClient.channels.getChannelInfoById(process.env.CHANNEL_ID)
    if (res == null) { callback(null); return null }
    let titleBits = res.title.split(" (")

    let title = titleBits.shift()
    let header = titleBits.join(" (").replace(")", "")
    
    callback({title, header})
  })

  socket.on("set_header_emote", (emote) => {
    ConsoleCommands["set_header_emote"].func(...(emote.split(" ")))
  })

  socket.on("set_header", (header) => {
    ConsoleCommands["set_header"].func(...(header.split(" ")))
  })

  socket.on("set_title", (title) => {
    ConsoleCommands["set_title"].func(...(title.split(" ")))
  })

  socket.on("category_search", async (query, callback) => {
    let toReturn: any[] = []

    if (query != "") {
      let categories = await apiClient.search.searchCategories(query, {limit: 10})
      toReturn = categories.data.map(game => {
        return {id: game.id, name: game.name}
      }) 
    }

    callback(toReturn)
  })

  socket.on("set_category", id => {
    ConsoleCommands["set_game"].func(...(id.split(" ")))
  })

  socket.on("obs_zoom", OBS.zoom)

  socket.on("obs_zoom_preset", OBS.zoom_preset)

  callback()
})