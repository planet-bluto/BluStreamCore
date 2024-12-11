import { TwitchChannelPointReward } from "../modules/channel_point_rewards";
import { EventSubChannelRedemptionAddEvent } from '@twurple/eventsub-base';
import { ChargePresets } from "../types/charge_presets";
import { ChargeTypeInfo } from "../types/charge_type";
import { song_queue_reward } from "../modules/omni";

const local_reward_id = "SONG_NOW"

export const Reward = new TwitchChannelPointReward(local_reward_id,
  {
    title: "Play Song Next",
    cost: 750,
    maxRedemptionsPerStream: null,
    maxRedemptionsPerUserPerStream: null,
    userInputRequired: true,
    backgroundColor: ChargeTypeInfo[ChargePresets[local_reward_id].type].color,
    prompt: `Play a song link next after the current playing song! These are first come, first serve, so ACT FAST!! (Supports: YouTube, Soundcloud, Bandcamp, Spotify) [+${ChargePresets[local_reward_id].amount} ${ChargePresets[local_reward_id].type.titleCase()} Charge ⚡]`,
    isEnabled: true
  },
  async (event: EventSubChannelRedemptionAddEvent) => {
    await song_queue_reward("play_track_next", event)
  }
)