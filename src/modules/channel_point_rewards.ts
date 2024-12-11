import { LocalStorage } from "node-localstorage";
let localStorage = new LocalStorage('./persist/channel_points');

import { apiClient } from "./twitch";
import { HelixCustomReward, HelixCreateCustomRewardData } from "@twurple/api";

let CUSTOM_REWARDS: {[index: string]: TwitchChannelPointReward} = {}

export class TwitchChannelPointReward {
  code: string;
  rewardData: HelixCreateCustomRewardData = {
    title: "",
    cost: 0
  };
  execute: Function = (() => {});

  constructor(thisCode: string, thisRewardData: HelixCreateCustomRewardData, thisExecute: Function) {
    this.code = thisCode
    this.rewardData = thisRewardData
    this.execute = thisExecute
    
    CUSTOM_REWARDS[this.code] = this

    if (!Object.keys(localStorage).includes(this.code)) {
      localStorage.setItem(this.code, "null")
    }
  }
}

import { twitchListener } from "./twitch"
import { EventSubChannelRedemptionAddEvent } from '@twurple/eventsub-base';
twitchListener.start() 

twitchListener.onChannelRedemptionAdd(process.env.CHANNEL_ID, async (event: EventSubChannelRedemptionAddEvent) => {
  let rewardCodes = Object.keys(CUSTOM_REWARDS)
  let rewardCode = rewardCodes.find(code => (localStorage.getItem(code) == event.rewardId))

  if (rewardCode) {
    let reward = CUSTOM_REWARDS[rewardCode]

    reward.execute(event)
  } else {
    print("- wtf is this reward: ", event)
  }
})



// Delete Missing Rewards ?

apiClient.channelPoints.getCustomRewards(process.env.CHANNEL_ID, true).then(async rewards => {
  let rewardIDs: (string | null)[] = Object.keys(CUSTOM_REWARDS).map(code => {let id = localStorage.getItem(code); return (id == "null" ? null : id)})

  await rewards.awaitForEach(async (reward: HelixCustomReward) => {
    if (!rewardIDs.includes(reward.id)) {
      await apiClient.channelPoints.deleteCustomReward(process.env.CHANNEL_ID, reward.id)
    }
  })

  customRewardCheck()
})



// Create / Update Rewards ?

async function customRewardCheck() {
  // let RewardsDB = await DB.fetch("rewards")

  await Object.keys(CUSTOM_REWARDS).awaitForEach(async (rewardCode: string) => {
    let {rewardData} = CUSTOM_REWARDS[rewardCode]

    async function makeReward() {
      let responseObj = await apiClient.channelPoints.createCustomReward(process.env.CHANNEL_ID, rewardData)
      localStorage.setItem(rewardCode, responseObj.id)
      print(`- '${rewardData.title}' (${rewardCode}) reward was missing, so we made it...`)
    }

    let rewardID = localStorage.getItem(rewardCode)
    if (rewardID == null) {
      await makeReward()
    } else {
      let rewardObj;

      try {
        rewardObj = await apiClient.channelPoints.getCustomRewardById(process.env.CHANNEL_ID, rewardID)
        if (rewardObj) { rewardObj = await apiClient.channelPoints.updateCustomReward(process.env.CHANNEL_ID, rewardObj.id, rewardData) }
      } catch (err) {
        rewardObj = null
        await makeReward()
      }
    }
  })

  print("+ Rewards checked?")
}



// Import Rewards
// General
import "../rewards/ping" // comment this one out yeah yehah eyaheyh
// Charges
import "../rewards/charge"
// BluBot
import "../rewards/bb_prompt"
import "../rewards/bb_say"
// Popups
import "../rewards/popup_roulette"
import "../rewards/popup_ad"
// Song
import "../rewards/song_like"
import "../rewards/song_request"
import "../rewards/song_now"
// Submit Assets
import "../rewards/submit_bumper"