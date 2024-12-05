import EventEmitter from "eventemitter3";
import request from "sync-request";
import { io } from "socket.io-client";
import { Godot } from "./godot";
import { apiClient, getUserColor, twitchAutoMSG } from "./twitch";
import { HelixUser } from "@twurple/api";
import { MessageHelper } from "./messages";

const ClientIO = io(process.env.DB_HOST)

class BluStreamDBClass extends EventEmitter {
  host: string = process.env.DB_HOST;
  token: string = process.env.DB_TOKEN;
  constructor() {
    super();
  }
  
  async _base_request(method: ("GET" | "POST" | "PATCH" | "PUT" | "DELETE"), path: string, body: object) {
    let res = await request(method, (this.host+path), {
      json: body,
      headers: {
        authorization: `Bearer ${this.token}`
      }
    })

    let resBody = JSON.parse((await res.getBody()).toString())

    return resBody
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

export function chargeSpark(chatterId: string, charges: (string | {type: string, amount: number})[]) {
  return BluStreamDB.PUT(`/sparks/${chatterId}`, charges)
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
      color: (await getUserColor(twitchUser.displayName)),
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
  twitchAutoMSG(`@${spark.user.displayName} Birthed new spark!`)
  MessageHelper.add({
    header: spark.user.displayName,
    content: "Birthed a Proto Spark!",
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