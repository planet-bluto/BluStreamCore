export interface IProcessEnv {
  CHANNEL_ID: string
  BOT_CHANNEL_ID: string
  TWITCH_CLIENT_ID: string
  TWITCH_CLIENT_SECRET: string
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends IProcessEnv { }
  }
}