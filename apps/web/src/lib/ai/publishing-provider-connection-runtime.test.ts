import {
  describe,
  expect,
  it,
} from "vitest";

import {
  projectPublishingProviderConnectionList,
} from "./publishing-provider-connection-runtime";

const phase19SafeRow = {
  id:
    "11111111-1111-4111-8111-111111111111",
  organization_id:
    "22222222-2222-4222-8222-222222222222",
  provider:
    "tiktok",
  external_account_id:
    "creator-open-id-123",
  authorization_status:
    "authorized",
  granted_scopes: [
    "video.publish",
  ],
  supported_capabilities: [
    "publish_video",
  ],
  credential_reference_id:
    "33333333-3333-4333-8333-333333333333",
  credential_expires_at:
    "2026-08-29T00:00:00.000Z",
  credential_updated_at:
    "2026-08-28T00:00:00.000Z",
  revoked_at:
    null,
  version:
    7,
  updated_at:
    "2026-08-28T00:00:00.000Z",
};

describe(
  "publishing provider connection safe-read runtime",
  () => {
    it(
      "maps the exact Phase 19 RPC row into the F2A domain contract",
      () => {
        const projected =
          projectPublishingProviderConnectionList(
            [
              phase19SafeRow,
            ],
          );

        expect(projected).toEqual([
          {
            version:
              1,
            id:
              phase19SafeRow.id,
            organizationId:
              phase19SafeRow.organization_id,
            provider:
              "tiktok",
            externalAccountId:
              phase19SafeRow.external_account_id,
            authorizationStatus:
              "authorized",
            grantedScopes: [
              "video.publish",
            ],
            supportedCapabilities: [
              "publish_video",
            ],
            credentialReference: {
              kind:
                "publishing_provider_oauth",
              storage:
                "server_encrypted",
              referenceId:
                phase19SafeRow.credential_reference_id,
              expiresAt:
                phase19SafeRow.credential_expires_at,
              updatedAt:
                phase19SafeRow.credential_updated_at,
            },
            revokedAt:
              null,
          },
        ]);
      },
    );

    it(
      "keeps database row version separate from domain contract version",
      () => {
        const projected =
          projectPublishingProviderConnectionList(
            [
              {
                ...phase19SafeRow,
                version:
                  99,
              },
            ],
          );

        expect(
          projected?.[0]?.version,
        ).toBe(1);
      },
    );

    it(
      "accepts an empty safe-read result",
      () => {
        expect(
          projectPublishingProviderConnectionList(
            [],
          ),
        ).toEqual([]);
      },
    );

    it(
      "fails closed for a non-array RPC payload",
      () => {
        expect(
          projectPublishingProviderConnectionList(
            null,
          ),
        ).toBeNull();
      },
    );

    it(
      "fails closed when any mapped row violates the provider contract",
      () => {
        expect(
          projectPublishingProviderConnectionList(
            [
              phase19SafeRow,
              {
                ...phase19SafeRow,
                provider:
                  "TikTok",
              },
            ],
          ),
        ).toBeNull();
      },
    );

    it(
      "fails closed if the RPC row contains an unexpected secret field",
      () => {
        expect(
          projectPublishingProviderConnectionList(
            [
              {
                ...phase19SafeRow,
                access_token_ciphertext:
                  "must-never-be-returned",
              },
            ],
          ),
        ).toBeNull();
      },
    );

    it(
      "does not require or project credential ciphertext",
      () => {
        const projected =
          projectPublishingProviderConnectionList(
            [
              phase19SafeRow,
            ],
          );

        expect(projected).not.toBeNull();

        const serialized =
          JSON.stringify(
            projected,
          );

        expect(
          serialized,
        ).not.toContain(
          "access_token_ciphertext",
        );

        expect(
          serialized,
        ).not.toContain(
          "refresh_token_ciphertext",
        );
      },
    );
  },
);