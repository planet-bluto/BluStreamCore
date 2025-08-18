import { TwitchChannelPointReward } from "../modules/channel_point_rewards";
import { EventSubChannelRedemptionAddEvent } from '@twurple/eventsub-base';
import { ChargePresets } from "../types/charge_presets";
import { ChargeTypeInfo } from "../types/charge_type";
import { BluStreamDB, chargeSpark } from "../modules/blu_stream_db";
import { fulfill, twitchAutoMSG } from "../modules/twitch";
import { Godot } from "../modules/godot";

const local_reward_id = "POPUP_AD"

export const Reward = new TwitchChannelPointReward(local_reward_id,
  {
    title: "Spawn Your Popup AD",
    cost: 350,
    maxRedemptionsPerStream: null,
    maxRedemptionsPerUserPerStream: null,
    userInputRequired: false,
    backgroundColor: ChargeTypeInfo[ChargePresets[local_reward_id].type].color,
    prompt: `Spawn a Popup AD on my desktop to... distract me from my work... [+${ChargePresets[local_reward_id].amount} ${ChargePresets[local_reward_id].type.titleCase()} Charge ⚡]`,
    isEnabled: true
  },
  async (event: EventSubChannelRedemptionAddEvent) => {
    let chatter = await BluStreamDB.GET(`/chatters/${event.userId}`)

    if (chatter && chatter.popup) {
      await Godot.spawnPopup(chatter.popup)
      await chargeSpark(event.userId, [local_reward_id])
      await fulfill(event)
    } else {
      await twitchAutoMSG(`@${event.userDisplayName} You don't have a Popup AD set, use the Popup Roulette reward to get one! (points refunded)`)
      await fulfill(event, true)
    }
  }
)

// print(Reward)