import request from "sync-request";

class BluStreamDBClass {
  host: string = process.env.DB_HOST;
  token: string = process.env.DB_TOKEN;
  constructor() {}
  
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