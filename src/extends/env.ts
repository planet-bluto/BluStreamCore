export interface IProcessEnv {
  CHANNEL_ID: string;
  BOT_CHANNEL_ID: string;

  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;

  WEB_PORT: string;
  OVERLAY_PORT: string;
  OMNI_PORT: string;

  NOTION_SECRET: string;
  NEKOWEB_KEY: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends IProcessEnv { }
  }
}