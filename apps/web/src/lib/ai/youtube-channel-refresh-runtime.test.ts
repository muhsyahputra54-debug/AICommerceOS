import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  PublishingProviderTokenKeyring,
} from "./tiktok-creator-oauth-server";

import {
  classifyYouTubeConnectionHealth,
  exchangeYouTubeRefreshToken,
  prepareYouTubeAccessTokenRotation,
} from "./youtube-channel-refresh-runtime";

function keyring(): PublishingProviderTokenKeyring {
  return {
    activeVersion: "v2",
    keys: new Map([
      [
        "v1",
        Buffer.alloc(32, 3),
      ],
      [
        "v2",
        Buffer.alloc(32, 7),
      ],
    ]),
  };
}

describe(
  "YouTube channel refresh runtime",
  () => {
    it(
      "classifies access-token expiry without provider HTTP",
      () => {
        const nowMs =
          Date.parse(
            "2026-08-31T10:00:00.000Z",
          );

        expect(
          classifyYouTubeConnectionHealth({
            accessTokenExpiresAt:
              "2026-08-31T10:30:00.000Z",
            nowMs,
          }),
        ).toBe("healthy");

        expect(
          classifyYouTubeConnectionHealth({
            accessTokenExpiresAt:
              "2026-08-31T10:05:00.000Z",
            nowMs,
          }),
        ).toBe(
          "refresh_recommended",
        );

        expect(
          classifyYouTubeConnectionHealth({
            accessTokenExpiresAt:
              "2026-08-31T10:00:00.000Z",
            nowMs,
          }),
        ).toBe("expired");
      },
    );

    it(
      "uses the refresh-token grant and accepts no replacement refresh token",
      async () => {
        const fetchImpl =
          vi.fn(
            async (
              _input:
                RequestInfo | URL,
              init?: RequestInit,
            ) => {
              const body =
                init?.body as
                  URLSearchParams;

              expect(
                body.get(
                  "grant_type",
                ),
              ).toBe(
                "refresh_token",
              );

              expect(
                body.get(
                  "refresh_token",
                ),
              ).toBe(
                "refresh-value",
              );

              return new Response(
                JSON.stringify({
                  access_token:
                    "new-access-value",
                  expires_in:
                    3600,
                  token_type:
                    "Bearer",
                  scope:
                    "ignored-on-refresh",
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
          ) as typeof fetch;

        await expect(
          exchangeYouTubeRefreshToken(
            {
              clientId:
                "client-id",
              clientSecret:
                "client-secret",
              refreshToken:
                "refresh-value",
              tokenEndpoint:
                "https://oauth2.googleapis.com/token",
            },
            fetchImpl,
          ),
        ).resolves.toEqual({
          ok: true,
          value: {
            accessToken:
              "new-access-value",
            tokenType:
              "Bearer",
            accessTokenExpiresInSeconds:
              3600,
          },
        });
      },
    );

    it(
      "maps invalid_grant to explicit reauthorization",
      async () => {
        const fetchImpl =
          (async () =>
            new Response(
              JSON.stringify({
                error:
                  "invalid_grant",
              }),
              {
                status: 400,
                headers: {
                  "Content-Type":
                    "application/json",
                },
              },
            )) as typeof fetch;

        await expect(
          exchangeYouTubeRefreshToken(
            {
              clientId:
                "client-id",
              clientSecret:
                "client-secret",
              refreshToken:
                "refresh-value",
              tokenEndpoint:
                "https://oauth2.googleapis.com/token",
            },
            fetchImpl,
          ),
        ).resolves.toEqual({
          ok: false,
          code:
            "reauthorization_required",
        });
      },
    );

    it(
      "rotates access ciphertext with the credential's existing key version",
      () => {
        const result =
          prepareYouTubeAccessTokenRotation({
            organizationId:
              "organization-1",
            externalAccountId:
              "channel-1",
            token: {
              accessToken:
                "new-access-value",
              tokenType:
                "Bearer",
              accessTokenExpiresInSeconds:
                3600,
            },
            encryptionKeyVersion:
              "v1",
            keyring:
              keyring(),
            nowMs:
              Date.parse(
                "2026-08-31T10:00:00.000Z",
              ),
          });

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        expect(
          result.value
            .encryptionKeyVersion,
        ).toBe("v1");

        expect(
          result.value
            .accessTokenExpiresAt,
        ).toBe(
          "2026-08-31T11:00:00.000Z",
        );

        expect(
          result.value
            .accessTokenCiphertext,
        ).not.toContain(
          "new-access-value",
        );
      },
    );
  },
);
