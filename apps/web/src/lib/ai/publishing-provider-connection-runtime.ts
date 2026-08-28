import {
  parsePublishingProviderConnection,
} from "./publishing-provider-connection";

type SuccessValue<T> =
  T extends {
    ok: true;
    value: infer TValue;
  }
    ? TValue
    : never;

export type PublishingProviderConnectionSafeRecord =
  SuccessValue<
    ReturnType<typeof parsePublishingProviderConnection>
  >;

const PHASE19_SAFE_ROW_KEYS =
  new Set([
    "id",
    "organization_id",
    "provider",
    "external_account_id",
    "authorization_status",
    "granted_scopes",
    "supported_capabilities",
    "credential_reference_id",
    "credential_expires_at",
    "credential_updated_at",
    "revoked_at",
    "version",
    "updated_at",
  ]);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isExactPhase19SafeRow(
  value: unknown,
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  const keys =
    Object.keys(value);

  return (
    keys.length === PHASE19_SAFE_ROW_KEYS.size &&
    keys.every(
      (key) =>
        PHASE19_SAFE_ROW_KEYS.has(key),
    )
  );
}

function mapPhase19SafeRowToDomain(
  row: unknown,
): unknown {
  if (!isExactPhase19SafeRow(row)) {
    return null;
  }

  return {
    version:
      1,

    id:
      row.id,

    organizationId:
      row.organization_id,

    provider:
      row.provider,

    externalAccountId:
      row.external_account_id,

    authorizationStatus:
      row.authorization_status,

    grantedScopes:
      row.granted_scopes,

    supportedCapabilities:
      row.supported_capabilities,

    credentialReference: {
      kind:
        "publishing_provider_oauth",

      storage:
        "server_encrypted",

      referenceId:
        row.credential_reference_id,

      expiresAt:
        row.credential_expires_at,

      updatedAt:
        row.credential_updated_at,
    },

    revokedAt:
      row.revoked_at,
  };
}

export function projectPublishingProviderConnectionList(
  value: unknown,
): PublishingProviderConnectionSafeRecord[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const connections:
    PublishingProviderConnectionSafeRecord[] = [];

  for (const row of value) {
    const mapped =
      mapPhase19SafeRowToDomain(
        row,
      );

    if (!mapped) {
      return null;
    }

    const parsed =
      parsePublishingProviderConnection(
        mapped,
      );

    if (!parsed.ok) {
      return null;
    }

    connections.push(
      parsed.value,
    );
  }

  return connections;
}