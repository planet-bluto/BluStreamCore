import { chargeSpark } from "../modules/blu_stream_db";
import { TwitchChannelPointReward } from "../modules/channel_point_rewards";
import { EventSubChannelRedemptionAddEvent } from "@twurple/eventsub-base";

export const ChargeReward = new TwitchChannelPointReward("CHARGE",
  {
    title: "⚡ CHARGE!",
    cost: 1,
    maxRedemptionsPerStream: null,
    maxRedemptionsPerUserPerStream: 1,
    // maxRedemptionsPerUserPerStream: null,
    userInputRequired: false,
    backgroundColor: "#024aca",
    // prompt: `Free charge for tuning in! [+${SparkCharge.CHARGE} Bolta Charge ⚡]`,
    prompt: `Free charge for tuning in! [+${150} Bolta Charge ⚡]`,
    isEnabled: false
  },
  async (event: EventSubChannelRedemptionAddEvent) => {
    let {spark} = await chargeSpark(event.userId, ["CHARGE"])

    print(spark)
  }
)