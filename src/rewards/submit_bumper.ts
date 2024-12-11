import { TwitchChannelPointReward } from "../modules/channel_point_rewards";
import { EventSubChannelRedemptionAddEvent } from '@twurple/eventsub-base';
import { ChargePresets } from "../types/charge_presets";
import { ChargeTypeInfo } from "../types/charge_type";
import { getUserColor } from "../modules/twitch";
import { MessageHelper } from "../modules/messages";
import { chargeSpark } from "../modules/blu_stream_db";

const local_reward_id = "SUBMIT_BUMPER"

export const Reward = new TwitchChannelPointReward(local_reward_id,
  {
    title: "Submit a BluBot Bumper",
    cost: 2500,
    maxRedemptionsPerStream: null,
    maxRedemptionsPerUserPerStream: null,
    userInputRequired: true,
    backgroundColor: ChargeTypeInfo[ChargePresets[local_reward_id].type].color,
    prompt: `Banner Ads are square/1:1 (512x512) aspect ratio and only appear when you are in chat. Post a link to the image (so I can view and preferably download the image -_-) [+${ChargePresets[local_reward_id].amount} ${ChargePresets[local_reward_id].type.titleCase()} Charge ⚡]`,
    isEnabled: true
  },
  async (event: EventSubChannelRedemptionAddEvent) => {
    var userColor = await getUserColor(event.userDisplayName)

    MessageHelper.add({
      badges: ["./assets/icons/eye.png"],
      header: event.userDisplayName,
      content: `Requests a Bumper: <span style="color: #ffffff">"${event.input}"</span>!`,
      platform: "twitch",
      style: {
        header_color: userColor,
        border_color: ChargeTypeInfo[ChargePresets[local_reward_id].type].color
      },
      sound: "$blubot_notif"
    })
    // await fulfill(event)
    // Listen for these being fufilled AND THEN give charge, but for now you good with just this :)
    await chargeSpark(event.userId, ["SUBMIT_BUMPER"])
  }
)