export const PUBLISHING_PROVIDER_CONNECTION_VERSION = 1 as const;

export const PUBLISHING_CONTENT_CAPABILITIES = [
  "publish_text",
  "publish_image",
  "publish_video",
] as const;

export type PublishingContentCapability =
  (typeof PUBLISHING_CONTENT_CAPABILITIES)[number];

export const PUBLISHING_PROVIDER_AUTHORIZATION_STATUSES = [
  "authorized",
  "reauthorization_required",
  "revoked",
] as const;

export type PublishingProviderAuthorizationStatus =
  (typeof PUBLISHING_PROVIDER_AUTHORIZATION_STATUSES)[number];

export type PublishingCredentialReferenceMetadata = Readonly<{
  kind: "publishing_provider_oauth";
  storage: "server_encrypted";
  referenceId: string;
  expiresAt: string | null;
  updatedAt: string;
}>;

export type PublishingProviderConnection = Readonly<{
  version: typeof PUBLISHING_PROVIDER_CONNECTION_VERSION;
  id: string;
  organizationId: string;
  provider: string;
  externalAccountId: string;
  authorizationStatus: PublishingProviderAuthorizationStatus;
  grantedScopes: readonly string[];
  supportedCapabilities: readonly PublishingContentCapability[];
  credentialReference: PublishingCredentialReferenceMetadata;
  revokedAt: string | null;
}>;

export type PublishingProviderConnectionValidationErrorCode =
  | "invalid_object"
  | "secret_material_forbidden"
  | "invalid_version"
  | "invalid_identity"
  | "invalid_provider"
  | "invalid_authorization_status"
  | "invalid_scopes"
  | "invalid_capabilities"
  | "invalid_credential_reference"
  | "invalid_revocation_state";

export type PublishingProviderConnectionValidationResult =
  | Readonly<{
      ok: true;
      value: PublishingProviderConnection;
    }>
  | Readonly<{
      ok: false;
      code: PublishingProviderConnectionValidationErrorCode;
    }>;

export type PublishingProviderCompatibilityFailureCode =
  | "provider_connection_revoked"
  | "provider_reauthorization_required"
  | "provider_mismatch"
  | "unsupported_capability"
  | "missing_scopes";

export type PublishingProviderCompatibilityResult =
  | Readonly<{
      compatible: true;
      missingScopes: readonly [];
    }>
  | Readonly<{
      compatible: false;
      code: PublishingProviderCompatibilityFailureCode;
      missingScopes: readonly string[];
    }>;

export type PublishingProviderPreflightResult =
  | Readonly<{
      ok: true;
      checkedAt: string;
      provider: string;
      externalAccountId: string;
      providerSubjectSnapshot: string;
    }>
  | Readonly<{
      ok: false;
      checkedAt: string;
      provider: string;
      code: string;
      retryable: boolean;
    }>;

export const PUBLISHING_PROVIDER_EXECUTION_STATUSES = [
  "submitted",
  "processing",
  "succeeded",
  "failed_retryable",
  "failed_terminal",
  "reconciliation_required",
] as const;

export type PublishingProviderExecutionStatus =
  (typeof PUBLISHING_PROVIDER_EXECUTION_STATUSES)[number];

export type PublishingProviderExecutionResult = Readonly<{
  status: PublishingProviderExecutionStatus;
  providerRequestId: string | null;
  providerPublicationId: string | null;
  errorCode: string | null;
  submissionAmbiguous: boolean;
}>;

export type PublishingProviderRetryDisposition =
  | "safe_to_retry"
  | "do_not_retry"
  | "reconcile_before_retry";

const SENSITIVE_FIELD_NAMES = new Set([
  "access_token",
  "accesstoken",
  "refresh_token",
  "refreshtoken",
  "client_secret",
  "clientsecret",
  "provider_secret",
  "providersecret",
]);

const CAPABILITY_SET = new Set<string>(PUBLISHING_CONTENT_CAPABILITIES);
const AUTHORIZATION_STATUS_SET = new Set<string>(
  PUBLISHING_PROVIDER_AUTHORIZATION_STATUSES,
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasSecretMaterial(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasSecretMaterial);
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(([key, nested]) => {
    const normalizedKey = key.toLowerCase();

    return SENSITIVE_FIELD_NAMES.has(normalizedKey) || hasSecretMaterial(nested);
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDateTime(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function normalizeStringList(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) {
    return null;
  }

  return [...new Set(value.map((item) => item.trim()))].sort();
}

function normalizeCapabilities(
  value: unknown,
): readonly PublishingContentCapability[] | null {
  const normalized = normalizeStringList(value);

  if (!normalized || !normalized.every((item) => CAPABILITY_SET.has(item))) {
    return null;
  }

  return normalized as readonly PublishingContentCapability[];
}

function parseCredentialReference(
  value: unknown,
): PublishingCredentialReferenceMetadata | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.kind !== "publishing_provider_oauth" ||
    value.storage !== "server_encrypted" ||
    !isNonEmptyString(value.referenceId) ||
    !(value.expiresAt === null || isIsoDateTime(value.expiresAt)) ||
    !isIsoDateTime(value.updatedAt)
  ) {
    return null;
  }

  return {
    kind: "publishing_provider_oauth",
    storage: "server_encrypted",
    referenceId: value.referenceId.trim(),
    expiresAt: value.expiresAt,
    updatedAt: value.updatedAt,
  };
}

export function parsePublishingProviderConnection(
  value: unknown,
): PublishingProviderConnectionValidationResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      code: "invalid_object",
    };
  }

  if (hasSecretMaterial(value)) {
    return {
      ok: false,
      code: "secret_material_forbidden",
    };
  }

  if (value.version !== PUBLISHING_PROVIDER_CONNECTION_VERSION) {
    return {
      ok: false,
      code: "invalid_version",
    };
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.organizationId) ||
    !isNonEmptyString(value.externalAccountId)
  ) {
    return {
      ok: false,
      code: "invalid_identity",
    };
  }

  if (
    !isNonEmptyString(value.provider) ||
    !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(value.provider)
  ) {
    return {
      ok: false,
      code: "invalid_provider",
    };
  }

  if (
    !isNonEmptyString(value.authorizationStatus) ||
    !AUTHORIZATION_STATUS_SET.has(value.authorizationStatus)
  ) {
    return {
      ok: false,
      code: "invalid_authorization_status",
    };
  }

  const authorizationStatus =
    value.authorizationStatus as PublishingProviderAuthorizationStatus;

  const grantedScopes = normalizeStringList(value.grantedScopes);

  if (!grantedScopes) {
    return {
      ok: false,
      code: "invalid_scopes",
    };
  }

  const supportedCapabilities = normalizeCapabilities(
    value.supportedCapabilities,
  );

  if (!supportedCapabilities) {
    return {
      ok: false,
      code: "invalid_capabilities",
    };
  }

  const credentialReference = parseCredentialReference(
    value.credentialReference,
  );

  if (!credentialReference) {
    return {
      ok: false,
      code: "invalid_credential_reference",
    };
  }

  const revokedAt =
    value.revokedAt === null || isIsoDateTime(value.revokedAt)
      ? value.revokedAt
      : undefined;

  if (
    revokedAt === undefined ||
    (value.authorizationStatus === "revoked" && revokedAt === null) ||
    (value.authorizationStatus !== "revoked" && revokedAt !== null)
  ) {
    return {
      ok: false,
      code: "invalid_revocation_state",
    };
  }

  return {
    ok: true,
    value: {
      version: PUBLISHING_PROVIDER_CONNECTION_VERSION,
      id: value.id.trim(),
      organizationId: value.organizationId.trim(),
      provider: value.provider,
      externalAccountId: value.externalAccountId.trim(),
      authorizationStatus,
      grantedScopes,
      supportedCapabilities,
      credentialReference,
      revokedAt,
    },
  };
}

export function assessPublishingProviderCompatibility(input: Readonly<{
  connection: PublishingProviderConnection;
  provider: string;
  requiredCapability: PublishingContentCapability;
  requiredScopes: readonly string[];
}>): PublishingProviderCompatibilityResult {
  if (input.connection.authorizationStatus === "revoked") {
    return {
      compatible: false,
      code: "provider_connection_revoked",
      missingScopes: [],
    };
  }

  if (input.connection.authorizationStatus === "reauthorization_required") {
    return {
      compatible: false,
      code: "provider_reauthorization_required",
      missingScopes: [],
    };
  }

  if (input.connection.provider !== input.provider) {
    return {
      compatible: false,
      code: "provider_mismatch",
      missingScopes: [],
    };
  }

  if (
    !input.connection.supportedCapabilities.includes(input.requiredCapability)
  ) {
    return {
      compatible: false,
      code: "unsupported_capability",
      missingScopes: [],
    };
  }

  const grantedScopes = new Set(input.connection.grantedScopes);
  const missingScopes = [...new Set(input.requiredScopes)]
    .filter((scope) => !grantedScopes.has(scope))
    .sort();

  if (missingScopes.length > 0) {
    return {
      compatible: false,
      code: "missing_scopes",
      missingScopes,
    };
  }

  return {
    compatible: true,
    missingScopes: [],
  };
}

export function classifyPublishingProviderRetryDisposition(
  result: PublishingProviderExecutionResult,
): PublishingProviderRetryDisposition {
  if (result.submissionAmbiguous) {
    return "reconcile_before_retry";
  }

  if (
    result.status === "submitted" ||
    result.status === "processing" ||
    result.status === "reconciliation_required"
  ) {
    return "reconcile_before_retry";
  }

  if (result.status === "failed_retryable") {
    return "safe_to_retry";
  }

  return "do_not_retry";
}
