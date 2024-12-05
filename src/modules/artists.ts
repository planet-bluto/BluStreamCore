import fs from "fs/promises"
import _, { last } from "lodash"

const ShoutoutUpdater = require("planet-bluto-net-shoutout-updater")
import request from "sync-request"
import { apiClient, twitchAutoMSG } from "./twitch";

function format(str: string) {
	str = str.toUpperCase()
	str = ">" + str
	str = str.replaceAll(" ", "_")
	// str = str + "..."
	return str
}

class Notion {
  _token: string;
  _api_host = "https://api.notion.com/v1/"

  constructor(token: string) {
    this._token = token
  }

  _baseRequest(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, data = {}) {
    var res = request(method, (this._api_host+path), {
      headers: {
        "Authorization": `Bearer ${this._token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      json: data,
    })

    return JSON.parse(res.getBody("utf8"))
  }

  get(path: string) {
    return this._baseRequest("GET", path)
  }

  post(path: string, data = {}) {
    return this._baseRequest("POST", path, data)
  }

  patch(path: string, data = {}) {
    return this._baseRequest("PATCH", path, data)
  }
}

var notion_client = new Notion(process.env.NOTION_SECRET)
var database_entries = notion_client.post(`databases/72e1453ad4e445a0b5eef3822b232a4a/query`)
var art_database_entries = notion_client.post(`databases/b788b11c42ae4268814fa4fcad209179/query`)
var raw_artist_data = database_entries.results
var raw_art_data = art_database_entries.results

var the_arts: {[index: string]: any} = {}
var serialized_art_data = raw_art_data.map((art_entry: any) => {
  var props = art_entry.properties

  const parseMedia = (path = "icon") => {
    var obj = art_entry[path]
    return (obj != null ? obj[Object.keys(obj)[1]].url : null)
  }

  const parseText = (propName: string, def: string = "") => {
    var result = ""
    var prop = props[propName]

    try {
      var sub_prop = prop.type
      result = (prop[sub_prop].length > 0 ? prop[sub_prop].map((entry: any) => entry.plain_text).join("") : def)
    } catch (err) {
      result = def
    }

    return result
  }

  const parseNumber = (propName: string, def: string = "") => {
    var prop = props[propName]

    return prop.number
  }

  const parseTimestamp = (propName: string) => {
    let text = parseText(propName)

    const nanFallback = (num: number, fallback: number) => {
      if (Number.isNaN(num)) {
        return fallback
      } else {
        return num
      }
    }

    if (text != "") {
      if (text.includes(":")) {
        let textBits = text.split(":")

        let min = nanFallback(Number(textBits[0]), 0)
        let sec = nanFallback(Number(textBits[1]), 0)
  
        return ((min * 60) + sec)
      } else {
        return nanFallback(Number(text), -1)
      }
    } else {
      return -1
    }
  }

  const parseRelation = (propName: string) => {
    var prop = props[propName]
    return prop.relation.map((entry: any) => entry.id)
  }

  const parseMulti = (propName: string) => {
    var prop = props[propName]
    return prop.multi_select.map((select: any) => select.name)
  }

  var serialized_art_entry = {
    nid: art_entry.id,
    name: parseText("Name"),
    artists: parseRelation("Artist"),
    fields: parseMulti("Fields"),
    filename: parseText("Filename"),
    file_start: parseTimestamp("File Start"),
    file_end: parseTimestamp("File End"),
    platforms: parseMulti("Platform(s)"),
    media: parseMedia("cover")
  }

  serialized_art_entry.artists.forEach((artist: any) => {
    if (!Array.isArray(the_arts[artist])) { the_arts[artist] = [] }
    the_arts[artist].push(serialized_art_entry)
  })

  return serialized_art_entry
})

var the_artists: {[index: string]: any} = {}
var serialized_artist_data = raw_artist_data.map((artist_entry: any) => {
  var props = artist_entry.properties

  const parseIcon = () => {
    var {icon} = artist_entry
    return (icon != null ? icon[Object.keys(icon)[1]].url : null)
  }

  const parseText = (propName: string, def: string = "") => {
    var result = ""
    var prop = props[propName]

    try {
      var sub_prop = prop.type
      result = (prop[sub_prop].length > 0 ? prop[sub_prop].map((entry: any) => entry.plain_text).join("") : def)
    } catch (err) {
      result = def
    }

    return result
  }

  const parseCheckbox = (propName: string) => {
    var prop = props[propName]
    return prop.checkbox
  }

  const parseIds = (propName: string) => {
    var text = parseText(propName)
    return (text != "" ? text.split(",") : [])
  }

  const parseMulti = (propName: string) => {
    var prop = props[propName]
    return prop.multi_select.map((select: any) => select.name)
  }

  const parseSelect = (propName: string, fallback: string) => {
    var prop = props[propName]
    return (prop.select ? prop.select.name : fallback)
  }
  
  const parseRelation = (propName: string) => {
    var prop = props[propName]
    return prop.relation.map((entry: any) => entry.id)
  }
  
  const parseURLs = (propName: string) => {
    var links: {[index: string]: string} = {}
    var text = parseText(propName)
    var textBits = text.split(", ")

    textBits.forEach(textBit => {
      var subTextBits = textBit.split(" ")
      links[subTextBits[0]] = subTextBits[1]
    })
    
    return links
  }

  var serialized_artist_entry = {
    icon: parseIcon(),
    id: parseText("ID"),
    artIds: parseRelation("Art"),
    name: parseText("Name"),
    formatted_name: format(parseText("Name")),
    desc: parseText("Description"),
    discordIds: parseIds("Discord ID(s)"),
    musicIds: parseIds("Music ID(s)"),
    fields: parseMulti("Fields"),
    twitchId: parseText("Twitch ID"),
    links: parseURLs("URLs"),
    style: {
      animated_icon: parseCheckbox("Animated Icon"),
      border_type: parseSelect("Border Type", "Straight"),
      top_border_color: parseText("Top Border Color", "#252525"),
      bottom_border_color: parseText("Bottom Border Color", "#252525"),
      name_color: parseText("Name Color", "#ffffff"),
      background_color: parseText("Background Color", "#151515"),
      no_icon_outline: parseCheckbox("No Icon Outline"),
      icon_outline_color: parseText("Icon Outline Color", "#151515"),
      element_outline_color: parseText("Element Outline Color", "#050505"),
    }
  }

  the_artists[artist_entry.id] = serialized_artist_entry

  return serialized_artist_entry
})

var dupe_the_arts = Object.assign({}, the_arts)

Object.keys(the_arts).forEach(artist_id => {
  var art = dupe_the_arts[artist_id]
  art.forEach((art_entry: any, ind: number) => {
    the_arts[artist_id][ind].artists = the_arts[artist_id][ind].artists.map((this_artist_id: string) => {
      try {
        return the_artists[this_artist_id].id
      } catch (err) {
        return this_artist_id
      }
    })
  })
})

Object.keys(the_artists).forEach((artist_id: string) => {
  var artist = the_artists[artist_id]
  artist["art"] = (the_arts[artist_id] || [])

  artist["art"].sort((a: any, b: any) => {
    var a_ind = artist.artIds.indexOf(a.nid)
    var b_ind = artist.artIds.indexOf(b.nid)
    return (a_ind - b_ind)
  })

  var ind = serialized_artist_data.findIndex((this_artist: any) => this_artist.id == artist.id)

  serialized_artist_data[ind] = artist
})

export const Artists = {
  getByDiscordID: (d_id: string) => {
    var artist = serialized_artist_data.find((this_artist: any) => this_artist.discordIds.includes(d_id))
    return artist
  },
  getByMusicID: (a_id: string) => {
    var artist = serialized_artist_data.find((this_artist: any) => this_artist.musicIds.includes(a_id))
    return artist
  },
  getByName: (name: string) => {
    var artist = serialized_artist_data.find((this_artist: any) => this_artist.name == name)
    return artist
  },
  getByID: (id: string) => {
    var artist = serialized_artist_data.find((this_artist: any) => this_artist.id == id)
    return artist
  },
  getAllNames: () => {
    return serialized_artist_data.map((this_artist: any) => this_artist.name)
  },
  getAll: () => { return serialized_artist_data }
}

print("Got Artists: ", serialized_artist_data)

let last_artists = []

try {
  last_artists = require("../../artists.json")
} catch(err) {
  print("[ARTIST] last_artists error", err)
}

let current_artists = JSON.parse(JSON.stringify(serialized_artist_data, null, 4))

let no_artist_change = (last_artists.length > 0)
if (no_artist_change) {
  no_artist_change = last_artists.every((last_entry: any, ind: number) => {
    let current_entry = current_artists[ind]
  
    delete last_entry.icon
    delete current_entry.icon
  
    let equal = _.isEqual(last_entry, current_entry)
  
    if (!equal) {
      print("[ARTIST] Nope ", last_entry, current_entry)
    }
  
    return equal
  })
}

if (!no_artist_change) {
  print("[ARTIST] Found changes to artists, pushing to website!")
  fs.writeFile("artists.json", JSON.stringify(serialized_artist_data, null, 4))
  ShoutoutUpdater(serialized_artist_data)
} else {
  print("[ARTIST] No changes to artists so no website push!!!")
}

const { exec, spawn } = require('node:child_process')

export function instanceShoutout(artist: any) {
  var string_artist_data = JSON.stringify(artist)
  // print(string_artist_data)a  
  var base_artist_data = btoa(encodeURIComponent(string_artist_data)) 
  // print(base_artist_data)
  exec(`"P:\\Apps\\Godot\\Godot_v4.2.2-stable_win64.exe" --path P:\\Projects\\PlanetBlutoStreamNetwork\\BluStreamOverlay  res://scenes/shoutout.tscn -shoutout=${base_artist_data}`)
}

export async function shoutout(artist_id: string) {
  var artist = Artists.getByID(artist_id)
  if (artist) {
    // Godot.send_artist(artist)
    instanceShoutout(artist)
    if (artist.fields.includes("Streamer")) {
      try {
        await apiClient.chat.shoutoutUser(process.env.CHANNEL_ID, artist.twitchId)
      } catch(err) {
        print("You Stupid: ", err)
      }
    }
    await twitchAutoMSG(`SHOUTOUT: https://planet-bluto.net/shoutout/${artist.id}/ ${artist.desc}`, 2026)
    return true
  } else {
    return false
  }
}