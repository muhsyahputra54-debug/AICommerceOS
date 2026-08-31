import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  parsePublishingProviderTokenKeyring,
} from "./tiktok-creator-oauth-server";

import {
  exchangeYouTubeAuthorizationCode,
  prepareYouTubeConnectionPersistence,
  resolveYouTubeChannelIdentity,
} from "./youtube-channel-oauth-runtime";

import {
  YOUTUBE_ENDPOINTS,
  YOUTUBE_REQUIRED_SCOPES,
} from "./youtube-channel";

const tokenKey =
  Buffer.alloc(
    32,
    17,
  ).toString(
    "base64",
  );

describe(
  "YouTube OAuth runtime",
  () => {
    it(
      "exchanges one authorization code using the Google web-server contract",
      async () => {
        const fetchImpl =
          vi.fn(
            async (
              _input:
                string | URL | Request,
              init?:
                RequestInit,
            ) => {
              expect(
                init?.method,
              ).toBe(
                "POST",
              );

              const body =
                init?.body as
                  URLSearchParams;

              expect(
                body.get(
                  "client_id",
                ),
              ).toBe(
                "youtube-client-id",
              );

              expect(
                body.get(
                  "grant_type",
                ),
              ).toBe(
                "authorization_code",
              );

              expect(
                body.get(
                  "code",
                ),
              ).toBe(
                "provider-code",
              );

              return new Response(
                JSON.stringify({
                  access_token:
                    "access-secret",
                  refresh_token:
                    "refresh-secret",
                  expires_in:
                    3600,
                  scope:
                    YOUTUBE_REQUIRED_SCOPES.join(
                      " ",
                    ),
                  token_type:
                    "Bearer",
                }),
                {
                  status: 200,
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                },
              );
            },
          );

        const result =
          await exchangeYouTubeAuthorizationCode(
            {
              clientId:
                "youtube-client-id",
              clientSecret:
                "youtube-client-secret",
              redirectUri:
                "https://lakuvo.com/api/ai/publishing-provider-connections/youtube/callback",
              code:
                "provider-code",
              tokenEndpoint:
                YOUTUBE_ENDPOINTS.token,
            },
            fetchImpl,
          );

        expect(result.ok).toBe(
          true,
        );

        expect(
          fetchImpl,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "does not retry an ambiguous authorization-code exchange",
      async () => {
        const fetchImpl =
          vi.fn(
            async () => {
              throw new Error(
                "transport failure",
              );
            },
          );

        expect(
          await exchangeYouTubeAuthorizationCode(
            {
              clientId:
                "youtube-client-id",
              clientSecret:
                "youtube-client-secret",
              redirectUri:
                "https://lakuvo.com/api/ai/publishing-provider-connections/youtube/callback",
              code:
                "provider-code",
              tokenEndpoint:
                YOUTUBE_ENDPOINTS.token,
            },
            fetchImpl,
          ),
        ).toEqual({
          ok: false,
          code:
            "token_exchange_ambiguous",
        });

        expect(
          fetchImpl,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "resolves exactly one authenticated YouTube channel identity",
      async () => {
        const fetchImpl =
          vi.fn(
            async (
              input:
                string | URL | Request,
              init?:
                RequestInit,
            ) => {
              const url =
                new URL(
                  String(input),
                );

              expect(
                url.searchParams.get(
                  "part",
                ),
              ).toBe(
                "id",
              );

              expect(
                url.searchParams.get(
                  "mine",
                ),
              ).toBe(
                "true",
              );

              expect(
                init?.headers,
              ).toMatchObject({
                Authorization:
                  "Bearer access-secret",
              });

              return new Response(
                JSON.stringify({
                  items: [
                    {
                      id:
                        "UC-channel-1",
                    },
                  ],
                }),
                {
                  status: 200,
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                },
              );
            },
          );

        expect(
          await resolveYouTubeChannelIdentity(
            {
              accessToken:
                "access-secret",
              channelsEndpoint:
                YOUTUBE_ENDPOINTS.channels,
            },
            fetchImpl,
          ),
        ).toEqual({
          ok: true,
          value: {
            channelId:
              "UC-channel-1",
          },
        });
      },
    );

    it(
      "fails closed when channel identity is ambiguous",
      async () => {
        expect(
          await resolveYouTubeChannelIdentity(
            {
              accessToken:
                "access-secret",
              channelsEndpoint:
                YOUTUBE_ENDPOINTS.channels,
            },
            async () =>
              new Response(
                JSON.stringify({
                  items: [
                    {
                      id:
                        "UC-channel-1",
                    },
                    {
                      id:
                        "UC-channel-2",
                    },
                  ],
                }),
                {
                  status: 200,
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                },
              ),
          ),
        ).toEqual({
          ok: false,
          code:
            "channel_identity_ambiguous",
        });
      },
    );

    it(
      "prepares encrypted provider-neutral RPC input without plaintext credentials",
      () => {
        const keyring =
          parsePublishingProviderTokenKeyring(
            JSON.stringify({
              v1:
                tokenKey,
            }),
            "v1",
          )!;

        const prepared =
          prepareYouTubeConnectionPersistence(
            {
              organizationId:
                "org-1",
              userId:
                "user-1",
              channelId:
                "UC-channel-1",
              token: {
                accessToken:
                  "access-secret",
                refreshToken:
                  "refresh-secret",
                tokenType:
                  "Bearer",
                accessTokenExpiresInSeconds:
                  3600,
                grantedScopes:
                  YOUTUBE_REQUIRED_SCOPES,
              },
              keyring,
              nowMs:
                1_800_000_000_000,
            },
          );

        expect(prepared.ok).toBe(
          true,
        );

        if (!prepared.ok) {
          return;
        }

        expect(
          prepared.value.p_provider,
        ).toBe(
          "youtube",
        );

        expect(
          prepared.value
            .p_external_account_id,
        ).toBe(
          "UC-channel-1",
        );

        expect(
          prepared.value
            .p_supported_capabilities,
        ).toEqual([
          "publish_video",
        ]);

        expect(
          prepared.value
            .p_refresh_token_expires_at,
        ).toBeNull();

        const serialized =
          JSON.stringify(
            prepared.value,
          );

        expect(
          serialized,
        ).not.toContain(
          "access-secret",
        );

        expect(
          serialized,
        ).not.toContain(
          "refresh-secret",
        );
      },
    );
  },
);
