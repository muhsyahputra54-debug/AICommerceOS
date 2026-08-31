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
  projectYouTubeChannelConnectionUiState,
} from "./youtube-channel-connection-ui";

import {
  YOUTUBE_REQUIRED_SCOPES,
  YOUTUBE_UPLOAD_SCOPE,
} from "./youtube-channel";

const BASE_CONNECTION:
  PublishingProviderConnection = {
  version:
    PUBLISHING_PROVIDER_CONNECTION_VERSION,
  id:
    "connection-youtube-1",
  organizationId:
    "organization-1",
  provider:
    "youtube",
  externalAccountId:
    "UC-channel-1",
  authorizationStatus:
    "authorized",
  grantedScopes:
    YOUTUBE_REQUIRED_SCOPES,
  supportedCapabilities: [
    "publish_video",
  ],
  credentialReference: {
    kind:
      "publishing_provider_oauth",
    storage:
      "server_encrypted",
    referenceId:
      "credential-reference-youtube-1",
    expiresAt:
      "2026-09-01T00:00:00.000Z",
    updatedAt:
      "2026-08-31T00:00:00.000Z",
  },
  revokedAt:
    null,
};

describe(
  "YouTube channel connection UI projection",
  () => {
    it(
      "returns disconnected when YouTube is absent",
      () => {
        expect(
          projectYouTubeChannelConnectionUiState(
            [],
          ),
        ).toEqual({
          kind:
            "disconnected",
        });
      },
    );

    it(
      "returns connected only with the exact required scopes",
      () => {
        expect(
          projectYouTubeChannelConnectionUiState(
            [BASE_CONNECTION],
          ),
        ).toEqual({
          kind:
            "connected",
          externalAccountId:
            "UC-channel-1",
          grantedScopes:
            [...YOUTUBE_REQUIRED_SCOPES]
              .sort(),
        });
      },
    );

    it(
      "fails closed when channel identity scope is missing",
      () => {
        expect(
          projectYouTubeChannelConnectionUiState(
            [
              {
                ...BASE_CONNECTION,
                grantedScopes: [
                  YOUTUBE_UPLOAD_SCOPE,
                ],
              },
            ],
          ),
        ).toMatchObject({
          kind:
            "scope_missing",
          externalAccountId:
            "UC-channel-1",
        });
      },
    );

    it(
      "requires reauthorization when provider state says so",
      () => {
        expect(
          projectYouTubeChannelConnectionUiState(
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
            "UC-channel-1",
        });
      },
    );

    it(
      "fails closed for multiple YouTube identities",
      () => {
        expect(
          projectYouTubeChannelConnectionUiState(
            [
              BASE_CONNECTION,
              {
                ...BASE_CONNECTION,
                id:
                  "connection-youtube-2",
                externalAccountId:
                  "UC-channel-2",
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
