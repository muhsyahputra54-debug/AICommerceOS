import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PUBLISHING_PROVIDER_CONNECTION_VERSION,
  type PublishingProviderConnection,
} from "./publishing-provider-connection";

import {
  projectTikTokCreatorConnectionUiState,
} from "./tiktok-creator-connection-ui";

const BASE_CONNECTION:
  PublishingProviderConnection = {
    version:
      PUBLISHING_PROVIDER_CONNECTION_VERSION,
    id:
      "connection-1",
    organizationId:
      "organization-1",
    provider:
      "tiktok",
    externalAccountId:
      "tiktok-open-id",
    authorizationStatus:
      "authorized",
    grantedScopes: [
      "user.info.basic",
      "video.publish",
    ],
    supportedCapabilities: [],
    credentialReference: {
      kind:
        "publishing_provider_oauth",
      storage:
        "server_encrypted",
      referenceId:
        "credential-reference-1",
      expiresAt:
        null,
      updatedAt:
        "2026-08-28T00:00:00.000Z",
    },
    revokedAt:
      null,
  };

describe(
  "TikTok creator connection UI projection",
  () => {
    it(
      "returns disconnected when TikTok is absent",
      () => {
        expect(
          projectTikTokCreatorConnectionUiState(
            [],
          ),
        ).toEqual({
          kind:
            "disconnected",
        });
      },
    );

    it(
      "returns connected only for authorized required scopes",
      () => {
        expect(
          projectTikTokCreatorConnectionUiState(
            [BASE_CONNECTION],
          ),
        ).toEqual({
          kind:
            "connected",
          externalAccountId:
            "tiktok-open-id",
          grantedScopes: [
            "user.info.basic",
            "video.publish",
          ],
        });
      },
    );

    it(
      "fails closed when video.publish is missing",
      () => {
        expect(
          projectTikTokCreatorConnectionUiState(
            [
              {
                ...BASE_CONNECTION,
                grantedScopes: [
                  "user.info.basic",
                ],
              },
            ],
          ),
        ).toEqual({
          kind:
            "scope_missing",
          externalAccountId:
            "tiktok-open-id",
          missingScopes: [
            "video.publish",
          ],
        });
      },
    );

    it(
      "requires reauthorization when provider says so",
      () => {
        expect(
          projectTikTokCreatorConnectionUiState(
            [
              {
                ...BASE_CONNECTION,
                authorizationStatus:
                  "reauthorization_required",
              },
            ],
          ),
        ).toEqual({
          kind:
            "reauthorization_required",
          externalAccountId:
            "tiktok-open-id",
        });
      },
    );

    it(
      "shows revoked state without treating it as connected",
      () => {
        expect(
          projectTikTokCreatorConnectionUiState(
            [
              {
                ...BASE_CONNECTION,
                authorizationStatus:
                  "revoked",
                revokedAt:
                  "2026-08-28T01:00:00.000Z",
              },
            ],
          ),
        ).toEqual({
          kind:
            "revoked",
          externalAccountId:
            "tiktok-open-id",
        });
      },
    );

    it(
      "fails closed for multiple TikTok identities",
      () => {
        expect(
          projectTikTokCreatorConnectionUiState(
            [
              BASE_CONNECTION,
              {
                ...BASE_CONNECTION,
                id:
                  "connection-2",
                externalAccountId:
                  "tiktok-open-id-2",
              },
            ],
          ),
        ).toEqual({
          kind:
            "ambiguous",
        });
      },
    );
  },
);