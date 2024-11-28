import { WebSocketServer } from 'ws'
import { OmniMusicClass } from './omni'
import { StreamHelper } from './obs'

const wss = new WebSocketServer({port: Number(process.env.OVERLAY_PORT)})

////////////////////////////////////////////////////////////////////////////////////////////////////////

function wss_send(data: string) {
  wss.clients.forEach(client => {
    client.send(data)
  })
}

function _get_ws_msg(type: string, ...args: any[]) {
  return JSON.stringify({ type, args })
}

function WssSend(type: string, ...args: any[]) {
  wss_send(_get_ws_msg(type, ...args))
}

////////////////////////////////////////////////////////////////////////////////////////////////////////

const EventEmitter = require('node:events')

class GodotClass extends EventEmitter {
  constructor() {
    super()
    this.connected
    this.AD_REQUESTS = []
    this.POPUP_REQUESTS = []
    this.clients = []
  }

  async send_friend( friend: any ) {
    WssSend("shoutout", friend)
  }

  async send_chat(...args: any[]) {
    WssSend("chat", ...args)
  }

  async send_active_chat(userId: string, idx: (number | null) = null) {
    if (idx == null) {
      WssSend("active_chat", userId)
    } else {
      print("sending to idx: ", idx)
      
      this.clients[idx].send(_get_ws_msg("active_chat", userId))
    }
  }

  async send_end_screen(payload: any) {
    WssSend("end_screen_start", payload)
  }

  async send_spark_event(type: any, spark: { user: { id: any; displayName: any; profilePictureUrl: any } }, ...extras: any[]) {
    spark.user = {
      id: spark.user.id,
      displayName: spark.user.displayName,
      profilePictureUrl: spark.user.profilePictureUrl,
    }

    WssSend("spark_event", type, spark, ...extras)
  }

  async send_hourglass(type: string, ...args: any[]) {
    WssSend("hourglass_"+type, ...args)
  }

  async send_blubot(payload: any) {
    WssSend("blubot_sentences", payload)
    // await somehow
  }

  send_voice_event(type: any, speaker: any) {
    WssSend("voice_event", type, speaker)
  }

  send_voice_join_event(speakers: any, idx: string | number | null = null) {
    if (idx == null) {
      WssSend("voice_join_event", speakers)
    } else {
      print("sending to idx: ", idx)
      this.clients[idx].send(_get_ws_msg("voice_join_event", speakers))
    }
  }

  send_voice_left_event() {
    WssSend("voice_left_event")
  }

  send_omni_event(type: any, event: any) {
    WssSend("omni_event", type, event)
  }

  getAdInfo() {
    var request_ind = this.AD_REQUESTS.length
    WssSend("current_ad_request", request_ind)
  
    var promise = new Promise((res, rej) => {
      this.AD_REQUESTS.push(res)
    })
  
  
    return promise
  }
  
  getAdInfoFromID( AD_ID: any ) {
    var request_ind = this.AD_REQUESTS.length
    WssSend("ad_request", request_ind, AD_ID)
  
    var promise = new Promise((res, rej) => {
      this.AD_REQUESTS.push(res)
    })
  
    return promise
  }

  spawnPopup(POPUP_ID = null) {
    var request_ind = this.POPUP_REQUESTS.length
    WssSend("spawn_popup", request_ind, POPUP_ID)

    var promise = new Promise((res, rej) => {
      this.POPUP_REQUESTS.push(res)
    })

    return promise
  }

  getPopups() {
    var request_ind = this.POPUP_REQUESTS.length
    WssSend("get_popups", request_ind)

    var promise = new Promise((res, rej) => {
      this.POPUP_REQUESTS.push(res)
    })

    return promise
  }
}

export const Godot = new GodotClass()

////////////////////////////////////////////////////////////////////////////////////////////////////////

wss.on('connection', function connection(ws) {
  let idx = Godot.clients.length
  Godot.clients.push(ws)

  print("+ Godot Socket")
  Godot.connected = true
  Godot.emit("connected", idx)

  const This_OmniMusic = new OmniMusicClass()
  This_OmniMusic._socket.onAny(Godot.send_omni_event)

  ws.on("message", unparsed_msg => {
    let msg = JSON.parse(String(unparsed_msg))
    
    switch (msg.type) {
      case 'debug':
        var sub_msg = msg.args[0]

        var number = (sub_msg.number != null ? Number(sub_msg.number) : 0)
        var content = (sub_msg.content == "" ? null : sub_msg.content)

        Godot.emit("debug", sub_msg.type, sub_msg.user, content, number)
      break;
      case 'ad_response':
        Godot.AD_REQUESTS[msg.args[0]](msg.args[1])
      break;
      case 'popup_response':
        Godot.POPUP_REQUESTS[msg.args[0]](msg.args[1])
      break;
      case 'shoutout_start':
        Godot.emit("shoutout_start", msg.args[0])
      break;
      case 'shoutout_end':
        Godot.emit("shoutout_end", msg.args[0])
      break;
      case 'RED_BUTTON':
        Godot.emit("red_button")
      break;
    }
  })
})

////////////////////////////////////////////////////////////////////////////////////////////////////////

Godot.on("shoutout_start", (friend: any) => {
  StreamHelper.shoutoutVisible = true
})

Godot.on("shoutout_end", (friend: any) => {
  StreamHelper.shoutoutVisible = false
})