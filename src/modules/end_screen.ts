import { BluStreamDB, getCurrentStream } from "./blu_stream_db"
import { Godot } from "./godot"

//////////////// STATS

const STAT_GLOBAL_SUM = async (id: string) => {
  let actions = await BluStreamDB.GET("/activity", {
    type: id
  })

  return {count: actions.length}
}

const STAT_LEADERBOARD = async (id: string) => {

}

//////////////// CRITERIA

const END_SCREEN_CRITERIA = {
  // "charge": makeCriteria("stat", "Total Charge", ES_STAT_COUNTER.bind(null, "charge"))
  "chat": Criteria("stat", "Total Chats", STAT_GLOBAL_SUM.bind(null, "chat")),
  "chat_2": Criteria("stat", "Total Chats 2", STAT_GLOBAL_SUM.bind(null, "chat")),
  // "chat_2": Criteria("leaderboard", "Most Chats", STAT_LEADERBOARD.bind(null, "chat"))
}

function Criteria(type: "stat" | "leaderboard", header: string, metaFunc: Function) {
  let obj = {
    type,
    header
  }

  return {metaFunc, obj}
}

//////////////// START FUNCTION

// export async function start_end_screen() {
//   let payload: {id: string, meta: any, header: string}[] = [] // <- This the fucking guy right here...

//   await Object.keys(END_SCREEN_CRITERIA).awaitForEach(async (id: string) => {
//     let criteria_entry = END_SCREEN_CRITERIA[id as keyof typeof END_SCREEN_CRITERIA]
//     let meta = await criteria_entry.metaFunc()

//     let criteria_payload = Object.assign({id, meta}, criteria_entry.obj)

//     payload.push(criteria_payload)
//   })

//   print("End Screen Payload: ", payload)
//   Godot.send_end_screen(payload)
// }

export async function start_end_screen() {
  let streamId = (await getCurrentStream()).id
  let payload = await BluStreamDB.GET(`/stats/${streamId}`)

  print("End Screen Payload: ", payload)
  Godot.send_end_screen(payload)
}