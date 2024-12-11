import { TwitchChannelPointReward } from "../modules/channel_point_rewards";
import { EventSubChannelRedemptionAddEvent } from '@twurple/eventsub-base';
import { ChargePresets } from "../types/charge_presets";
import { ChargeTypeInfo } from "../types/charge_type";
import { BluStreamDB, chargeSpark, getCurrentStream, trackActivity } from "../modules/blu_stream_db";
import { getCurrentTrack, OmniMusic } from "../modules/omni";
import { fulfill, twitchAutoMSG } from "../modules/twitch";

const local_reward_id = "SONG_LIKE"

export const Reward = new TwitchChannelPointReward(local_reward_id,
  {
    title: "Like this Song",
    cost: 1,
    maxRedemptionsPerStream: null,
    maxRedemptionsPerUserPerStream: null,
    userInputRequired: false,
    backgroundColor: ChargeTypeInfo[ChargePresets[local_reward_id].type].color,
    prompt: `Show that you like this song! [+${ChargePresets[local_reward_id].amount} ${ChargePresets[local_reward_id].type.titleCase()} Charge ⚡]`,
    isEnabled: true
  },
  async (event: EventSubChannelRedemptionAddEvent) => {
    let stream = await getCurrentStream()
    let CurrentTrack = getCurrentTrack()

    let queryRes = await BluStreamDB.GET("/activity", {
      chatterId: event.userId,
      streamId: stream.id,
      data: {
        omni_id: CurrentTrack.omni_id
      }
    })

    if (queryRes.length == 0) {
      let res = await trackActivity(event.userId, "song_like", CurrentTrack)

      await chargeSpark(event.userId, ["SONG_LIKE"])
      await twitchAutoMSG(`@${event.userDisplayName} Liked song '${CurrentTrack.title} - ${CurrentTrack.author.name}'`)
      await fulfill(event, false)
    } else {
      await twitchAutoMSG(`@${event.userDisplayName} You can only like a song once per stream!`)
      await fulfill(event, true)
    }
  }
)

// print(Reward)