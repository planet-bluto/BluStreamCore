import { TwitchChannelPointReward } from "../modules/channel_point_rewards";
import { EventSubChannelRedemptionAddEvent } from "@twurple/eventsub-base";
import { twitchAutoMSG } from "../modules/twitch";
import { MessageHelper } from "../modules/messages";
import { BluBotAI } from "../modules/blubotai";

export const PingReward = new TwitchChannelPointReward("PING",
  {
    title: "📡 PING!",
    cost: 1,
    maxRedemptionsPerStream: null,
    maxRedemptionsPerUserPerStream: null,
    userInputRequired: false,
    backgroundColor: "#024aca",
    prompt: `Simple Ping [+${0} Charge ⚡]`,
    isEnabled: true
  },
  (event: EventSubChannelRedemptionAddEvent) => {
    BluBotAI.Ping(event.userDisplayName)
    twitchAutoMSG("Pong! (from Channel Point Reward)")
    MessageHelper.add({
      header: "Ping!",
      content: `Ping from ${event.userDisplayName}!`,
      badges: ["https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4e1.png"],
      style: {
        header_color: "#ffffff",
        border_color: "#ffe737",
        flashing: true
      }
    })
  }
)