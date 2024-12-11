import { TwitchChannelPointReward } from "../modules/channel_point_rewards";
import { EventSubChannelRedemptionAddEvent } from '@twurple/eventsub-base';
import { ChargePresets } from "../types/charge_presets";
import { ChargeTypeInfo } from "../types/charge_type";
import { song_queue_reward } from "../modules/omni";

const local_reward_id = "SONG_REQUEST"

export const Reward = new TwitchChannelPointReward(local_reward_id,
  {
    title: "Request a Song",
    cost: 250,
    maxRedemptionsPerStream: null,
    maxRedemptionsPerUserPerStream: null,
    userInputRequired: true,
    backgroundColor: ChargeTypeInfo[ChargePresets[local_reward_id].type].color,
    prompt: `Request a song link to have a chance of playing during stream (Supports: YouTube, Soundcloud, Bandcamp, Spotify) [+${ChargePresets[local_reward_id].amount} ${ChargePresets[local_reward_id].type.titleCase()} Charge ⚡]`,
    isEnabled: true
  },
  async (event: EventSubChannelRedemptionAddEvent) => {
    await song_queue_reward("queue_track", event)
  }
)