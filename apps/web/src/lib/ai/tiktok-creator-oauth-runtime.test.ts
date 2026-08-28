import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  exchangeTikTokCreatorAuthorizationCode,
  prepareTikTokCreatorConnectionPersistence,
} from "./tiktok-creator-oauth-runtime";

import {
  parsePublishingProviderTokenKeyring,
} from "./tiktok-creator-oauth-server";

const tokenKey =
  Buffer.alloc(
    32,
    5,
  ).toString(
    "base64",
  );

describe(
  "TikTok creator OAuth runtime",
  () => {
    it(
      "exchanges an authorization code using the Web token contract",
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

              expect(
                init?.headers,
              ).toEqual({
                "Content-Type":
                  "application/x-www-form-urlencoded",
              });

              const body =
                init?.body as
                  URLSearchParams;

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
                  open_id:
                    "creator-open-id",
                  access_token:
                    "access-secret",
                  refresh_token:
                    "refresh-secret",
                  token_type:
                    "Bearer",
                  expires_in:
                    86_400,
                  refresh_expires_in:
                    31_536_000,
                  scope:
                    "user.info.basic,video.publish",
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
          await exchangeTikTokCreatorAuthorizationCode(
            {
              clientKey:
                "creator-client-key",
              clientSecret:
                "creator-client-secret",
              redirectUri:
                "https://lakuvo.com/api/ai/publishing-provider-connections/tiktok/callback",
              code:
                "provider-code",
              tokenEndpoint:
                "https://open.tiktokapis.com/v2/oauth/token/",
            },
            fetchImpl,
          );

        expect(result.ok).toBe(
          true,
        );

        expect(fetchImpl).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "classifies a transport exception as ambiguous and does not retry",
      async () => {
        const fetchImpl =
          vi.fn(
            async () => {
              throw new Error(
                "transport failure",
              );
            },
          );

        const result =
          await exchangeTikTokCreatorAuthorizationCode(
            {
              clientKey:
                "creator-client-key",
              clientSecret:
                "creator-client-secret",
              redirectUri:
                "https://lakuvo.com/api/ai/publishing-provider-connections/tiktok/callback",
              code:
                "provider-code",
              tokenEndpoint:
                "https://open.tiktokapis.com/v2/oauth/token/",
            },
            fetchImpl,
          );

        expect(result).toEqual({
          ok: false,
          code:
            "token_exchange_ambiguous",
        });

        expect(fetchImpl).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "fails closed on non-success token HTTP response",
      async () => {
        const result =
          await exchangeTikTokCreatorAuthorizationCode(
            {
              clientKey:
                "creator-client-key",
              clientSecret:
                "creator-client-secret",
              redirectUri:
                "https://lakuvo.com/api/ai/publishing-provider-connections/tiktok/callback",
              code:
                "provider-code",
              tokenEndpoint:
                "https://open.tiktokapis.com/v2/oauth/token/",
            },
            async () =>
              new Response(
                "{}",
                {
                  status: 400,
                },
              ),
          );

        expect(result).toEqual({
          ok: false,
          code:
            "token_exchange_failed",
        });
      },
    );

    it(
      "prepares encrypted Phase 19 RPC input without plaintext tokens",
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
          prepareTikTokCreatorConnectionPersistence(
            {
              organizationId:
                "org-1",
              userId:
                "user-1",
              token: {
                openId:
                  "creator-open-id",
                accessToken:
                  "access-secret",
                refreshToken:
                  "refresh-secret",
                tokenType:
                  "Bearer",
                accessTokenExpiresInSeconds:
                  3600,
                refreshTokenExpiresInSeconds:
                  7200,
                grantedScopes: [
                  "user.info.basic",
                  "video.publish",
                ],
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
          "tiktok",
        );

        expect(
          prepared.value
            .p_supported_capabilities,
        ).toEqual([
          "publish_image",
          "publish_video",
        ]);

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

    it(
      "does not add publish_text capability to TikTok creator persistence",
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
          prepareTikTokCreatorConnectionPersistence(
            {
              organizationId:
                "org-1",
              userId:
                "user-1",
              token: {
                openId:
                  "creator-open-id",
                accessToken:
                  "access-secret",
                refreshToken:
                  "refresh-secret",
                tokenType:
                  "Bearer",
                accessTokenExpiresInSeconds:
                  3600,
                refreshTokenExpiresInSeconds:
                  7200,
                grantedScopes: [
                  "video.publish",
                ],
              },
              keyring,
            },
          );

        expect(prepared.ok).toBe(
          true,
        );

        if (prepared.ok) {
          expect(
            prepared.value
              .p_supported_capabilities,
          ).not.toContain(
            "publish_text",
          );
        }
      },
    );
  },
);