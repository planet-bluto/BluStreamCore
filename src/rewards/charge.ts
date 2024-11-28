import { TwitchChannelPointReward } from "../modules/channel_point_rewards";
import { EventSubChannelRedemptionAddEvent } from "@twurple/eventsub-base";

export const ChargeReward = new TwitchChannelPointReward("CHARGE",
  {
    title: "⚡ CHARGE!",
    cost: 1,
    maxRedemptionsPerStream: null,
    maxRedemptionsPerUserPerStream: 1,
    userInputRequired: false,
    backgroundColor: "#024aca",
    // prompt: `Free charge for tuning in! [+${SparkCharge.CHARGE} Bolta Charge ⚡]`,
    prompt: `Free charge for tuning in! [+${150} Bolta Charge ⚡]`,
    isEnabled: true
  },
  (event: EventSubChannelRedemptionAddEvent) => {
    // ...
  }
)