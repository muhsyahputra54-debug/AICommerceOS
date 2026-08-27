import { describe, expect, it } from "vitest";

import {
  assessPublishingProviderCompatibility,
  classifyPublishingProviderRetryDisposition,
  parsePublishingProviderConnection,
  type PublishingProviderConnection,
} from "./publishing-provider-connection";

const connection: PublishingProviderConnection = {
  version: 1,
  id: "connection-1",
  organizationId: "organization-1",
  provider: "example-provider",
  externalAccountId: "external-account-1",
  authorizationStatus: "authorized",
  grantedScopes: ["content.publish", "profile.read"],
  supportedCapabilities: ["publish_image", "publish_text"],
  credentialReference: {
    kind: "publishing_provider_oauth",
    storage: "server_encrypted",
    referenceId: "credential-reference-1",
    expiresAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
  },
  revokedAt: null,
};

describe("parsePublishingProviderConnection", () => {
  it("accepts a provider-neutral publishing connection and normalizes lists", () => {
    const result = parsePublishingProviderConnection({
      ...connection,
      grantedScopes: ["profile.read", "content.publish", "profile.read"],
      supportedCapabilities: [
        "publish_text",
        "publish_image",
        "publish_text",
      ],
    });

    expect(result).toEqual({
      ok: true,
      value: {
        ...connection,
        grantedScopes: ["content.publish", "profile.read"],
        supportedCapabilities: ["publish_image", "publish_text"],
      },
    });
  });

  it("rejects raw provider secret material", () => {
    expect(
      parsePublishingProviderConnection({
        ...connection,
        access_token: "must-never-enter-the-domain-contract",
      }),
    ).toEqual({
      ok: false,
      code: "secret_material_forbidden",
    });
  });

  it("rejects seller credential references", () => {
    expect(
      parsePublishingProviderConnection({
        ...connection,
        credentialReference: {
          ...connection.credentialReference,
          kind: "marketplace_seller_oauth",
        },
      }),
    ).toEqual({
      ok: false,
      code: "invalid_credential_reference",
    });
  });

  it("requires revoked connections to carry a revoked timestamp", () => {
    expect(
      parsePublishingProviderConnection({
        ...connection,
        authorizationStatus: "revoked",
      }),
    ).toEqual({
      ok: false,
      code: "invalid_revocation_state",
    });
  });
});

describe("assessPublishingProviderCompatibility", () => {
  it("passes only when provider, capability, authorization, and scopes match", () => {
    expect(
      assessPublishingProviderCompatibility({
        connection,
        provider: "example-provider",
        requiredCapability: "publish_text",
        requiredScopes: ["content.publish"],
      }),
    ).toEqual({
      compatible: true,
      missingScopes: [],
    });
  });

  it("fails closed when the required capability is absent", () => {
    expect(
      assessPublishingProviderCompatibility({
        connection,
        provider: "example-provider",
        requiredCapability: "publish_video",
        requiredScopes: ["content.publish"],
      }),
    ).toEqual({
      compatible: false,
      code: "unsupported_capability",
      missingScopes: [],
    });
  });

  it("reports missing scopes deterministically", () => {
    expect(
      assessPublishingProviderCompatibility({
        connection,
        provider: "example-provider",
        requiredCapability: "publish_text",
        requiredScopes: ["video.publish", "content.publish", "video.publish"],
      }),
    ).toEqual({
      compatible: false,
      code: "missing_scopes",
      missingScopes: ["video.publish"],
    });
  });

  it("rejects revoked publishing connections", () => {
    expect(
      assessPublishingProviderCompatibility({
        connection: {
          ...connection,
          authorizationStatus: "revoked",
          revokedAt: "2026-08-27T12:00:00.000Z",
        },
        provider: "example-provider",
        requiredCapability: "publish_text",
        requiredScopes: [],
      }),
    ).toEqual({
      compatible: false,
      code: "provider_connection_revoked",
      missingScopes: [],
    });
  });
});

describe("classifyPublishingProviderRetryDisposition", () => {
  it("requires reconciliation after an ambiguous submission", () => {
    expect(
      classifyPublishingProviderRetryDisposition({
        status: "failed_retryable",
        providerRequestId: null,
        providerPublicationId: null,
        errorCode: "transport_timeout",
        submissionAmbiguous: true,
      }),
    ).toBe("reconcile_before_retry");
  });

  it("allows retry only for an unambiguous retryable failure", () => {
    expect(
      classifyPublishingProviderRetryDisposition({
        status: "failed_retryable",
        providerRequestId: null,
        providerPublicationId: null,
        errorCode: "rate_limited",
        submissionAmbiguous: false,
      }),
    ).toBe("safe_to_retry");
  });

  it("does not retry a successful publication", () => {
    expect(
      classifyPublishingProviderRetryDisposition({
        status: "succeeded",
        providerRequestId: "request-1",
        providerPublicationId: "publication-1",
        errorCode: null,
        submissionAmbiguous: false,
      }),
    ).toBe("do_not_retry");
  });
});
