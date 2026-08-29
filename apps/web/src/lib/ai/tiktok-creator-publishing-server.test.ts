import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  decryptPublishingProviderToken,
  encryptPublishingProviderToken,
  type PublishingProviderTokenKeyring,
} from "./tiktok-creator-oauth-server";

import {
  queryTikTokCreatorInfo,
} from "./tiktok-creator-publishing-server";

function keyring(): PublishingProviderTokenKeyring {
  const key =
    Buffer.alloc(
      32,
      7,
    );

  return {
    activeVersion:
      "v1",
    keys:
      new Map([
        [
          "v1",
          key,
        ],
      ]),
  };
}

describe(
  "TikTok creator publishing server",
  () => {
    it(
      "decrypts publishing-provider tokens only with matching AAD",
      async () => {
        const ring =
          keyring();

        const ciphertext =
          encryptPublishingProviderToken(
            {
              plaintext:
                "access-token-value",
              provider:
                "tiktok",
              organizationId:
                "organization-1",
              externalAccountId:
                "open-id-1",
              tokenKind:
                "access",
              keyVersion:
                "v1",
              key:
                ring.keys.get(
                  "v1",
                )!,
            },
          );

        expect(
          ciphertext,
        ).not.toBeNull();

        const decrypted =
          await decryptPublishingProviderToken(
            {
              ciphertext:
                ciphertext!,
              organizationId:
                "organization-1",
              externalAccountId:
                "open-id-1",
              tokenKind:
                "access",
              keyVersion:
                "v1",
              keyring:
                ring,
            },
          );

        expect(
          decrypted,
        ).toBe(
          "access-token-value",
        );

        const wrongOrganization =
          await decryptPublishingProviderToken(
            {
              ciphertext:
                ciphertext!,
              organizationId:
                "organization-2",
              externalAccountId:
                "open-id-1",
              tokenKind:
                "access",
              keyVersion:
                "v1",
              keyring:
                ring,
            },
          );

        expect(
          wrongOrganization,
        ).toBeNull();
      },
    );

    it(
      "queries and normalizes TikTok creator info",
      async () => {
        const fetchImpl =
          vi.fn(
            async (
              _input:
                RequestInfo | URL,
              init?: RequestInit,
            ) => {
              expect(
                init?.method,
              ).toBe(
                "POST",
              );

              expect(
                new Headers(
                  init?.headers,
                ).get(
                  "Authorization",
                ),
              ).toBe(
                "Bearer access-token-value",
              );

              return new Response(
                JSON.stringify(
                  {
                    data: {
                      creator_username:
                        "creator_one",
                      creator_nickname:
                        "Creator One",
                      privacy_level_options:
                        [
                          "PUBLIC_TO_EVERYONE",
                          "SELF_ONLY",
                        ],
                      comment_disabled:
                        false,
                      duet_disabled:
                        false,
                      stitch_disabled:
                        true,
                      max_video_post_duration_sec:
                        300,
                    },
                    error: {
                      code:
                        "ok",
                      message:
                        "",
                      log_id:
                        "safe-log-id",
                    },
                  },
                ),
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

        const result =
          await queryTikTokCreatorInfo(
            {
              accessToken:
                "access-token-value",
              endpoint:
                "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
              nowMs:
                Date.parse(
                  "2026-08-29T01:00:00.000Z",
                ),
            },
            fetchImpl,
          );

        expect(
          result,
        ).toEqual(
          {
            ok: true,
            value: {
              checkedAt:
                "2026-08-29T01:00:00.000Z",
              creatorUsername:
                "creator_one",
              creatorNickname:
                "Creator One",
              privacyLevelOptions:
                [
                  "PUBLIC_TO_EVERYONE",
                  "SELF_ONLY",
                ],
              commentDisabled:
                false,
              duetDisabled:
                false,
              stitchDisabled:
                true,
              maxVideoPostDurationSec:
                300,
            },
          },
        );
      },
    );

    it(
      "fails closed on TikTok provider errors",
      async () => {
        const fetchImpl =
          (async () =>
            new Response(
              JSON.stringify(
                {
                  error: {
                    code:
                      "scope_not_authorized",
                  },
                },
              ),
              {
                status: 401,
                headers: {
                  "Content-Type":
                    "application/json",
                },
              },
            )) as typeof fetch;

        const result =
          await queryTikTokCreatorInfo(
            {
              accessToken:
                "access-token-value",
            },
            fetchImpl,
          );

        expect(
          result,
        ).toEqual(
          {
            ok: false,
            code:
              "creator_info_provider_error",
            providerCode:
              "scope_not_authorized",
          },
        );
      },
    );
  },
);