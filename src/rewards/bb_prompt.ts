import { MessageHelper } from "../modules/messages";
import { fulfill, getUserBadges, getUserColor, twitchAutoMSG } from "../modules/twitch";
import { TwitchChannelPointReward } from "../modules/channel_point_rewards";
import { EventSubChannelRedemptionAddEvent } from '@twurple/eventsub-base';
import { BluBotAI } from "../modules/blubotai";
import { BluStreamDB, chargeSpark } from '../modules/blu_stream_db';
import { ChargeTypeInfo } from "../types/charge_type";
import { ChargePresets } from "../types/charge_presets";

const local_reward_id = "BB_PROMPT" // <INPUT HERE!!

export const Reward = new TwitchChannelPointReward(local_reward_id,
  {
    title: "[  / >] BluBot Prompt",
    cost: 350,
    maxRedemptionsPerStream: null,
    maxRedemptionsPerUserPerStream: null,
    userInputRequired: true,
    backgroundColor: ChargeTypeInfo[ChargePresets[local_reward_id].type].color,
    prompt: `Say something to BluBot and he'll respond to it! [+${ChargePresets[local_reward_id].amount} ${ChargePresets[local_reward_id].type.titleCase()} Charge ⚡]`,
    isEnabled: true
  },
  async (event: EventSubChannelRedemptionAddEvent) => {
    let userColor = await getUserColor(event.userId)
    let res = await BluBotAI.Prompt(event.userDisplayName, userColor, event.input)

    if (res != null) {
      // (event.userId, SparkType.CODEC, SparkCharge.BB_PROMPT)
  
      MessageHelper.add({
        badges: (await getUserBadges(event.userId)),
        header: event.userDisplayName,
        content: event.input,
        platform: "twitch",
        style: {
          header_color: userColor,
          header_format: true,
          border_color: ChargeTypeInfo[ChargePresets[local_reward_id].type].color
        }
      })
  
      await fulfill(event)
      await chargeSpark(event.userId, [local_reward_id])
      // await BluStreamDB.PUT(`/sparks/${event.userId}`, [local_reward_id])
    } else {
      await twitchAutoMSG(`@${event.userDisplayName} something went wrong... (points refunded)`)
      await fulfill(event, true)
    }
  }
)