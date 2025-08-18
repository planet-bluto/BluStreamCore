import EventEmitter from "eventemitter3";
import { io } from "socket.io-client";
import { Godot } from "./godot";
import { apiClient, getUserColor, twitchAutoMSG, TwitchMessageSettings } from "./twitch";
import { HelixUser } from "@twurple/api";
import { MessageHelper } from "./messages";
import axios, { AxiosInstance } from "axios";

const ClientIO = io(process.env.DB_HOST)

class BluStreamDBClass extends EventEmitter {
  host: string = process.env.DB_HOST;
  token: string = process.env.DB_TOKEN;
  _axios: AxiosInstance;
  constructor() {
    super();
    this._axios = axios.create({
      baseURL: this.host,
      headers: {
        authorization: `Bearer ${this.token}`
      }
    })
  }
  
  async _base_request(method: ("GET" | "POST" | "PATCH" | "PUT" | "DELETE"), url: string, data: object) {
    let res = await this._axios({ url, method, data })

    return res.data
  }

  async GET(path: string, body: object = {}) {
    return this._base_request("GET", path, body)
  }

  async POST(path: string, body: object = {}) {
    return this._base_request("POST", path, body)
  }

  async PATCH(path: string, body: object = {}) {
    return this._base_request("PATCH", path, body)
  }

  async PUT(path: string, body: object = {}) {
    return this._base_request("PUT", path, body)
  }

  async DELETE(path: string, body: object = {}) {
    return this._base_request("DELETE", path, body)
  }

}

export const BluStreamDB = new BluStreamDBClass()

export async function chargeSpark(chatterId: string, charges: (string | {type: string, amount: number})[]) {
  let stream = await getCurrentStream()
  return BluStreamDB.PUT(`/sparks/${chatterId}`, {
    streamId: stream.id,
    charges
  })
}

export async function trackActivity(chatterId: string, type: string, data: any) {
  let stream = await getCurrentStream()
  print(stream)
  return BluStreamDB.POST(`/activity`, {
    chatterId,
    streamId: stream.id,
    type,
    data
  })
}

export function getCurrentStream() {
  return BluStreamDB.GET(`/stream`)
}

export function trackStreamStart() {
  return BluStreamDB.POST(`/streams`)
}

ClientIO.on("connect", () => {
  print("+ DB Socket")
})

ClientIO.onAny( async (eventName: string, spark, ...args) => {
  if (eventName.startsWith("spark_")) {
    let subEventName = eventName.replace("spark_", "")
    let twitchUser = ((await apiClient.users.getUserById(spark.chatterId)) as HelixUser)

    spark["user"] = { // Might do this on the Database...
      id: twitchUser.id,
      displayName: twitchUser.displayName,
      color: (await getUserColor(twitchUser.id)),
      profilePictureUrl: twitchUser.profilePictureUrl,
    }

    BluStreamDB.emit(subEventName, spark, ...args)

    if (subEventName.startsWith("ex_")) {
      let exEventName = subEventName.replace("ex_", "")
      Godot.send_spark_event(exEventName, spark, ...args)
    }
  }
})

BluStreamDB.on("birth", (spark) => { // Better fucking work...
  if (TwitchMessageSettings.autoMessagesEnabled) { twitchAutoMSG(`@${spark.user.displayName} created a new spark!`) }
  MessageHelper.add({
    header: spark.user.displayName,
    content: "Created a Proto Spark!",
    sound: "$spark_notif.wav",
    style: {
      header_color: spark.user.color,
      border_color: "#98DCFF",
      header_format: true
    }
  })
})

BluStreamDB.on("evolve", (spark) => { // Better fucking work...
  twitchAutoMSG(`@${spark.user.displayName} just evolved their spark to a ${spark.prominent_charge.titleCase()} Spark!`)
  MessageHelper.add({
    header: spark.user.displayName,
    content: `Evolved their spark to a <span style="color: ${spark.color}">${spark.prominent_charge.titleCase()}</span> Spark!`,
    sound: "$spark_notif.wav",
    style: {
      header_color: spark.user.color,
      border_color: "#98DCFF",
      header_format: true
    }
  })
})

BluStreamDB.on("null", (spark) => { // Better fucking work...
  twitchAutoMSG(`@${spark.user.displayName} just nulled their spark...`)
  MessageHelper.add({
    header: spark.user.displayName,
    content: `Nulled their spark...`,
    sound: "$explode.mp3",
    style: {
      header_color: spark.user.color,
      border_color: "#353535",
      header_format: true
    }
  })
})