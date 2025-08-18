import { TwitchChannelPointReward } from "../modules/channel_point_rewards";
import { EventSubChannelRedemptionAddEvent } from '@twurple/eventsub-base';
import { ChargePresets } from "../types/charge_presets";
import { ChargeTypeInfo } from "../types/charge_type";
import { BluBotAI } from "../modules/blubotai";
import { MessageHelper } from "../modules/messages";

const local_reward_id = "BB_SAY"

export const Reward = new TwitchChannelPointReward(local_reward_id,
  {
    title: "[  / >] BluBot Say (TTS)",
    cost: 150,
    maxRedemptionsPerStream: null,
    maxRedemptionsPerUserPerStream: null,
    userInputRequired: true,
    backgroundColor: ChargeTypeInfo[ChargePresets[local_reward_id].type].color,
    prompt: `Make BluBot say something for all to hear! [+${ChargePresets[local_reward_id].amount} ${ChargePresets[local_reward_id].type.titleCase()} Charge ⚡]`,
    isEnabled: true
  },
  async (event: EventSubChannelRedemptionAddEvent) => {
    // await BluBotAI.Say(`${event.userDisplayName} says "${event.input}"`)
    await BluBotAI.Say(event.input)

    MessageHelper.add({
      badges: ["./assets/icons/blubot.png"],
      header: "[  / >] BLU_BOT",
      content: `${event.userDisplayName} says "${event.input}"`,
      platform: "twitch",
      style: {
        header_color: "#8CD612",
        header_format: false
      }
    })
  }
)