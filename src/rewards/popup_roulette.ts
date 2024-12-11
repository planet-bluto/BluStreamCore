import { TwitchChannelPointReward } from "../modules/channel_point_rewards";
import { EventSubChannelRedemptionAddEvent } from '@twurple/eventsub-base';
import { ChargePresets } from "../types/charge_presets";
import { ChargeTypeInfo } from "../types/charge_type";
import { Godot } from "../modules/godot";
import { fulfill, twitchAutoMSG } from "../modules/twitch";
import { BluStreamDB, chargeSpark } from "../modules/blu_stream_db";

const local_reward_id = "POPUP_ROULETTE"

export const Reward = new TwitchChannelPointReward(local_reward_id,
  {
    title: "Popup AD Roulette",
    cost: 500,
    maxRedemptionsPerStream: null,
    maxRedemptionsPerUserPerStream: null,
    userInputRequired: false,
    backgroundColor: ChargeTypeInfo[ChargePresets[local_reward_id].type].color,
    prompt: `Roll for a random Popup AD to appear on my desktop to... distract me from my work... [+${ChargePresets[local_reward_id].amount} ${ChargePresets[local_reward_id].type.titleCase()} Charge ⚡]`,
    isEnabled: true
  },
  async (event: EventSubChannelRedemptionAddEvent) => {
    var result = await Godot.spawnPopup()

    if (result != false) {
      print("Popup Success! ", result)
      await fulfill(event)
      await chargeSpark(event.userId, [local_reward_id])
      // await BluStreamDB.PUT(`/sparks/${event.userId}`, [local_reward_id])
      await BluStreamDB.PUT(`/chatters/${event.userId}`, { popup: result })

      await twitchAutoMSG(`@${event.userDisplayName} Popup AD Set to '${result}'!`)
    } else {
      print("Popup Failed...")

      await twitchAutoMSG(`@${event.userDisplayName} something went wrong... (points refunded)`)
      await fulfill(event, true)
    }
  }
)

// print(Reward)