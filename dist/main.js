"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Environment
require("dotenv/config");
// Extends
require("./extends/env");
require("./extends/print");
require("./extends/unique");
require("./extends/array");
require("./lib/arrayLib.js");
require("./extends/string");
require("./lib/stringLib.js");
// Modules
require("./modules/blu_stream_db"); // BluStreamDB hookup & processing
require("./modules/artists"); // Artists and Shoutouts hookup & processing
require("./modules/twitch"); // Twitch API related hookup & processing
require("./modules/messages"); // Chat Browser SRC hookup & porcessing
require("./modules/obs"); // OBS Web Socket hookup & processing
require("./modules/channel_point_rewards"); // Channel Point Reward Setup
require("./modules/control_panel"); // Web Control Panel hookup & processing
require("./modules/godot"); // Godot Overlay hookup & processing
require("./modules/omni"); // Omni hookup & processing
require("./modules/discord"); // Discord Client hookup & processing
require("./modules/hourglass"); // Hourglass hookup & processing
require("./modules/blubotai"); // Hourglass hookup & processing
const web_server_1 = require("./modules/web_server"); // HTTP & WS Server configuration
(0, web_server_1.startWebServer)();
print("[MAIN] Starting Soon...");
require("./test");
