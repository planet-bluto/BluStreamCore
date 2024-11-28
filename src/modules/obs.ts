import { exec } from 'child_process';
import { OBSWebSocket } from 'obs-websocket-js';
const obs = new OBSWebSocket()

class StreamHelperClass {
  _shoutoutVisible: boolean = false;

  constructor() {}

  get shoutoutVisible() { return this._shoutoutVisible }
  set shoutoutVisible(value: boolean) {
    this._shoutoutVisible = value
    obs.call("SetSceneItemEnabled", {sceneName: "Main (Root)", sceneItemId: 36, sceneItemEnabled: this._shoutoutVisible})
  }

  async start() {
    print("> Pretend I started stream just now...")

    exec(`"P:\\Documents\\streamies\\!bats\\starting_soon.bat`)
  
    // Turn off all active outputs
    var outputRes = await obs.call("GetOutputList")
    await outputRes.outputs.awaitForEach(async (output: { outputActive: boolean; outputName: string; }) => {
      if (output.outputActive) {
        await obs.call("StopOutput", {outputName: output.outputName})
      }
    })
  
    // Switch to right profile and collection
    await obs.call("SetCurrentProfile", {profileName: "LIVE"})
    await obs.call("SetCurrentSceneCollection", {sceneCollectionName: "LIVE"})
  
    // Turn on render delay!!
    var filterRes = await obs.call("GetSourceFilterList", {sourceName: "Main (Delayed)"})
    await filterRes.filters.awaitForEach(async (filter: { filterName: string }) => {
      if (filter.filterName.includes("Render Delay")) {
        obs.call("SetSourceFilterEnabled", {
          sourceName: "Main (Delayed)",
          filterName: filter.filterName,
          filterEnabled: true
        })
      }
    })
  
    // Switch to Starting Soon Scene...
    await obs.call("SetCurrentProgramScene", {sceneName: "Starting Soon"})
  
    // Post social messages?...
    // Discord
    // BlueSky- not Twitter tho... (elon pls kys)
  
    // Discord Streamer Mode
  
    // Actually start the stream
    // await obs.call("StartStream")
  }

  async stop() {
    print("> Pretend I stopped stream just now...")

    // Turn off all active outputs
    var outputRes = await obs.call("GetOutputList")
    await outputRes.outputs.awaitForEach(async (output: { outputActive: boolean; outputName: string; }) => {
      if (output.outputActive) {
        await obs.call("StopOutput", {outputName: output.outputName})
      }
    })
  
    // Turn on virtual cam
    // await obs.call("StartVirtualCam")
  
    // Switch to right profile and collection
    await obs.call("SetCurrentProfile", {profileName: "discord_LIVE"})
    // await obs.call("SetCurrentSceneCollection", {sceneCollectionName: "LIVE"})
  
    // Turn OFF render delay
    var filterRes = await obs.call("GetSourceFilterList", {sourceName: "Main (Delayed)"})
    await filterRes.filters.awaitForEach(async (filter: { filterName: string }) => {
      if (filter.filterName.includes("Render Delay")) {
        obs.call("SetSourceFilterEnabled", {
          sourceName: "Main (Delayed)",
          filterName: filter.filterName,
          filterEnabled: false
        })
      }
    })
  
    // Switch to Starting Soon Scene...
    await obs.call("SetCurrentProgramScene", {sceneName: "Main - Default"})
  
    // Post social messages?...
    // Discord
    // Twitter (elon pls kys)
  
    // Actually stop the stream
    // await obs.call("StopStream")
  }

  async transition(sceneName: string) {
    await obs.call("SetCurrentPreviewScene", {sceneName})
  }

  async zoom(zoomBounds: { x: number; y: number; w: number; h: number; }) {
    await obs.call("SetSceneItemTransform", {sceneName: "Main - Focus WHATEVER", sceneItemId: 2, sceneItemTransform: {
      positionX: zoomBounds.x,
      positionY: zoomBounds.y,
      boundsWidth: zoomBounds.w,
      boundsHeight: zoomBounds.h,
    }})

    await obs.call("SetCurrentPreviewScene", {sceneName: "Main - Focus WHATEVER"})
    await obs.call("TriggerStudioModeTransition")
  }

  async zoom_preset(preset: string) {
    await obs.call("SetCurrentPreviewScene", {sceneName: `Main - Focus ${preset}`})
    await obs.call("TriggerStudioModeTransition")
  }
}

export const StreamHelper = new StreamHelperClass()

function tryConnectOBS() {
  obs.connect().then(() => {
    print("+ OBS Socket")
  }).catch(err => {
    print("Fuck You OBS, Retrying in 10 seconds...", err)
    setTimeout(tryConnectOBS, 10000)
  })
}

tryConnectOBS()