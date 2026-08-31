import type {
  PublishingContentCapability,
} from "./publishing-provider-connection";

export const YOUTUBE_CHANNEL_PROVIDER =
  "youtube" as const;

export const YOUTUBE_UPLOAD_SCOPE =
  "https://www.googleapis.com/auth/youtube.upload" as const;

export const YOUTUBE_CHANNEL_IDENTITY_SCOPE =
  "https://www.googleapis.com/auth/youtube.readonly" as const;

export const YOUTUBE_REQUIRED_SCOPES =
  [
    YOUTUBE_UPLOAD_SCOPE,
    YOUTUBE_CHANNEL_IDENTITY_SCOPE,
  ] as const;

export const YOUTUBE_SUPPORTED_CAPABILITIES =
  [
    "publish_video",
  ] as const satisfies
    readonly PublishingContentCapability[];

export const YOUTUBE_ENDPOINTS = {
  authorize:
    "https://accounts.google.com/o/oauth2/v2/auth",
  token:
    "https://oauth2.googleapis.com/token",
  channels:
    "https://www.googleapis.com/youtube/v3/channels",
} as const;
