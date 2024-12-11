import EventEmitter from "eventemitter3";
import { Godot } from "./godot";
import { getUserColor, TwitchEvents } from "./twitch";
import axios, { AxiosInstance } from "axios";

const TaskManager = require("task-manager")
const Queue = new TaskManager()

const BBCode = require("bbcode-parser-sax");
const bbcode_parse = BBCode.parse

const telemetry = true

////////////////////////////////////////////////////////////////////////////////////////////////////////

function blutoFormat(str: string) {
  str = str.toUpperCase()
  str = ">" + str
  str = str.replaceAll(" ", "_")
  // str = str + "..."
  return str
}

function bbcodeToString(bbcode: string) {
  var final: string[] = []

  var res = bbcode_parse(bbcode)
  res.forEach((elem: any) => {
    if (elem.type == "text") {
      final.push(elem.text)
    }
  })

  return final.join("")
}

////////////////////////////////////////////////////////////////////////////////////////////////////////

const SHOCK_VALUES = {
  "BIT": 2000,
  "SUB": 30,
  "VIEW": 100,
  "HYPE_TRAIN": 3
}

function isShocking(value: number, type: string) {
  return (value >= SHOCK_VALUES[type as keyof typeof SHOCK_VALUES])
}

////////////////////////////////////////////////////////////////////////////////////////////////////////

class BluBotAIClass extends EventEmitter {
  host: string = process.env.BLUBOT_HOST;
  token: string = process.env.BLUBOT_TOKEN;
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
    try {
      let res = await this._axios({url, method, data })
      
      return res.data
    } catch(err) {
      return err
    }
  }

  async _prompt(payload: any) {
    return Queue.add(async () => {
      payload["context"] = "stream"
      let response = await this._base_request("POST", "/", payload)
      if (response instanceof Error) {
        print("DIE DIE DIE DIE DIE DIE DIE DIE DIE DIE DIE DIE DIE DIE DIE DIE")
        return null
      }
  
      if (payload["replying"] != null) {
        if (payload["replyingColor"] == null) { payload["replyingColor"] = "#ffe737" }
        payload["replyingUnformmatted"] = bbcodeToString(payload["replying"])
  
        payload["replyingBits"] = bbcode_parse(payload["replying"])
      }
      
      payload["sentences"] = response
  
      Godot.send_blubot(payload)
      this.emit("output", response)
  
      return response
    })
  }

  async Say(content: string) {
    Godot.send_blubot({sentences: [{mood: "NEUTRAL", content}]})
  }
  
  async Ping(user: string) {
    var res;
  
    res = await this._prompt({
      content: `'${user}' just pinged you to check if you are currently online (used for testing)`,
      replying: `${blutoFormat(user)}: ping!`,
      replyingColor: "#98DCFF"
    })
    
    if (telemetry) { print("\n\nPING EVENT:\n", res) }
    return res
  }
  
  async Prompt(user: string, userColor: string, content: string | null = null) {
    var res;
  
    if (content == "") { content = null }
    res = await this._prompt({
      content: `'${user}' says` + (content ? `: "${content}"` : " ...nothing") + " in chat",
      replying: `[color=${userColor}]${blutoFormat(user)}[/color]: ${(content ? content : "...")}`,
      replyingColor: "#98DCFF"
    })
    
    if (telemetry) { print("\n\nPROMPT EVENT:\n", res) }
    return res
  }
  
  async Sub(user: string, tier: number | null = null, content : number | null = null) {
    var res;
    res = await this._prompt({
      content: `'${user}' just ` + (tier ? ` re-subscribed at a tier ${tier}` : "subscribed") + (content ? ` and says "${content}"` : "!"),
      replying: `${blutoFormat(user)} just ` + (tier ? ` re-subscribed at a tier ${tier}` : "subscribed") + (content ? ` and says "${content}"` : "!")
    })
  
    if (telemetry) { print("\n\nSUB EVENT:\n", res) }
    return res
  }
  
  async Bit(user : string, bit_count: number = 0, content: string | null = null) {
    var res;
    res = await this._prompt({
      content: `${(isShocking(bit_count, "BIT") ? "[NICE] " : "")}'${user}' just gave ${bit_count} bits` + (content ? ` and says: "${content}"` : "!"),
      replying: `${blutoFormat(user)} just gave ${bit_count} bits` + (content ? ` and says: "${content}"` : "!")
    })
  
    if (telemetry) { print("\n\nBIT EVENT:\n", res) }
    return res
  }
  
  async Raid(user: string, viewer_count: number) {
    var res;
    res = await this._prompt({
      content: `${(isShocking(viewer_count, "VIEW") ? "[NICE] " : "")}'${user}' just raided the chat with ${viewer_count} viewers!`,
      replying: `${blutoFormat(user)} just raided the chat with ${viewer_count} viewers!`,
    })
  
    if (telemetry) { print("\n\nRAID EVENT:\n", res) }
    return res
  }
  
  async GiftSub(user: string, sub_count: number) {
    var res;
  
    if (!isShocking(sub_count, "SUB")) {
      res = await this._prompt({
        content: `'${user}' just gifted ${sub_count} subs to the chat!` + (sub_count > 20 ? " That's a huge amount of subs!!" : ""),
        replying: `${blutoFormat(user)} just gifted ${sub_count} subs to the chat!`
      })
    } else {
      res = await this._prompt({
        content: `[NICE] '${user}' just gifted a shocking amount of subs to the chat!! ${sub_count} subs to be specific! (Your EMOTION is "SHOCK")`,
        replying: `${blutoFormat(user)} just gifted ${sub_count} subs to the chat!!!`
      })
    }
  
    if (telemetry) { print("\n\nGIFT SUB EVENT:\n", res) }
    return res
  }
  
  async HypeTrain(end_level = null) {
    var res;
    if (!end_level) {
      res = await this._prompt({
        content: `A Hype Train has just started!`,
        replying: `A Hype Train has just started!`,
      })
    } else {
      res = await this._prompt({
        content: `${(isShocking(end_level, "HYPE_TRAIN") ? "[NICE] " : "")}A Hype Train has just ended with a level ${end_level}!`,
        replying: `A Hype Train has just ended with a level ${end_level}!`,
      })
    }
  
    if (telemetry) { print("\n\nHYPE TRAIN EVENT:\n", res) }
    return res
  }
  
  async Shoutout(alias: string) {
    var res;
    res = await this._prompt({
      content: `[NICE] Give a shoutout to a friend of the stream: ${alias}! (They make music and art)`
    })
  
    if (telemetry) { print("\n\nSHOUTOUT EVENT:\n", res) }
    return res
  }
  
  async AdWarning() {
    var res;
    res = await this._prompt({
      content: `Tell the audience that ads are about to begin in 5 seconds`,
      replying: `Ads are about to begin in [wave]5 seconds!![/wave]`
    })
  
    if (telemetry) { print("\n\nAD WARNING EVENT:\n", res) }
    return res
  }
}

export const BluBotAI = new BluBotAIClass()


////////////////////////////////////////////////////////////////////////////////////////////////////////

TwitchEvents.on("prompt", async (user, content) => {
  let userColor = await getUserColor(user)
  BluBotAI.Prompt(user, userColor, content)
})

// Sub Event
TwitchEvents.on("sub", async (user, months, content) => {
  BluBotAI.Sub(user, months, content)
})

// Gift Sub Event
TwitchEvents.on("giftsub", async (user, amount) => {
  BluBotAI.GiftSub(user, amount)
})

// Raid Event
TwitchEvents.on("raid", async (user, viewers) => {
  BluBotAI.Raid(user, viewers)
})

// Bit Event
TwitchEvents.on("bit", async (user, amount, content) => {
  BluBotAI.Bit(user, amount, content)
})

// Hype Train Event
TwitchEvents.on("hypetrain", async (level) => {
  BluBotAI.HypeTrain((level == 0 ? null : level))
})

// Shoutout Event
TwitchEvents.on("shoutout", async (alias) => {
  BluBotAI.Shoutout(alias)
})

TwitchEvents.on("ad_5_sec_warn", async () => {
  BluBotAI.AdWarning()
})