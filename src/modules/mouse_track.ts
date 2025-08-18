import { windowManager } from "node-window-manager"
import robot from "robotjs"
import { clamp, lerp, remap } from "./maths"
import { SocketIO } from "./web_server"

let mousePositionX = 0
let mousePositionY = 0

let codeMonitor = false
let prev_raw_yPerc = 0
let curr_yPerc = 0

setInterval(async () => {
  let mouse = robot.getMousePos();

  mousePositionX = mouse.x
	mousePositionY = mouse.y

  let monitor = windowManager.getMonitors()[2]

  let bounds = monitor.getBounds()
  let raw_yPerc = remap(mousePositionY, (bounds.y ?? 0), ((bounds.y ?? 0) + (bounds.height ?? 0)))
  const top_margin = 0.2
  const bottom_margin = 0.2
  let yPerc = clamp(remap(raw_yPerc, top_margin, (1.0 - bottom_margin)), 0.0, 1.0)
  // print(yPerc)
  curr_yPerc = lerp(curr_yPerc, yPerc, 0.05)

  let dist = Math.abs( 1920 - mousePositionX )

		if (mousePositionX >= 1920 && dist > 100 && !codeMonitor) {
			codeMonitor = true
      SocketIO.to("code_monitor").emit("code_monitor", codeMonitor)
			// await obs.call("SetSceneItemEnabled", {sceneName: "CODING", sceneItemId, sceneItemEnabled: true})
			// tween(250, EASE_OUT_QUART, async (x) => {
				
			// })
		}
		if (mousePositionX < 1920 && dist > 100 && codeMonitor) {
			codeMonitor = false
      SocketIO.to("code_monitor").emit("code_monitor", codeMonitor)
			// await obs.call("SetSceneItemEnabled", {sceneName: "CODING", sceneItemId, sceneItemEnabled: false})
		}

    if (curr_yPerc != prev_raw_yPerc) {
      prev_raw_yPerc = curr_yPerc
      SocketIO.to("code_monitor").emit("code_monitor_update", curr_yPerc)
    }
}, (1000 / 60)) // <- monitor refresh rate, har har