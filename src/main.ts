// Environment
import 'dotenv/config'



// Extends
import "./extends/env"
import "./extends/print"
import "./extends/unique"
import "./extends/array"
import "./lib/arrayLib.js"
import "./extends/string"
import "./lib/stringLib.js"



// Modules
import "./modules/blu_stream_db" // BluStreamDB hookup & processing
import "./modules/artists" // Artists and Shoutouts hookup & processing
import "./modules/twitch" // Twitch API related hookup & processing
import "./modules/messages" // Chat Browser SRC hookup & porcessing
import "./modules/obs" // OBS Web Socket hookup & processing
import "./modules/channel_point_rewards" // Channel Point Reward Setup
import "./modules/control_panel" // Web Control Panel hookup & processing
import "./modules/godot" // Godot Overlay hookup & processing
import "./modules/omni" // Omni hookup & processing
import "./modules/discord" // Discord Client hookup & processing
import "./modules/hourglass" // Hourglass hookup & processing
import "./modules/blubotai" // Hourglass hookup & processing
import "./modules/end_screen" // Hourglass hookup & processing
import "./modules/mouse_track" // Mouse Tracking for monitor transitions
import "./modules/tracking" // Head Tracking from Phone, lmao

import { startWebServer } from './modules/web_server' // HTTP & WS Server configuration


startWebServer()

print("[MAIN] Starting Soon...")

import './test'