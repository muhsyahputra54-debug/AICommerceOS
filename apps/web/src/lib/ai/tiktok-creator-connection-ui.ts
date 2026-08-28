import type {
  PublishingProviderConnection,
} from "./publishing-provider-connection";

export const TIKTOK_CREATOR_REQUIRED_SCOPES =
  [
    "user.info.basic",
    "video.publish",
  ] as const;

export type TikTokCreatorConnectionUiState =
  | Readonly<{
      kind: "disconnected";
    }>
  | Readonly<{
      kind: "connected";
      externalAccountId: string;
      grantedScopes: readonly string[];
    }>
  | Readonly<{
      kind: "scope_missing";
      externalAccountId: string;
      missingScopes: readonly string[];
    }>
  | Readonly<{
      kind: "reauthorization_required";
      externalAccountId: string;
    }>
  | Readonly<{
      kind: "revoked";
      externalAccountId: string;
    }>
  | Readonly<{
      kind: "not_authorized";
      externalAccountId: string;
    }>
  | Readonly<{
      kind: "ambiguous";
    }>;

function isTikTokConnection(
  connection: PublishingProviderConnection,
): boolean {
  return (
    connection.provider
      .trim()
      .toLowerCase() ===
    "tiktok"
  );
}

export function projectTikTokCreatorConnectionUiState(
  connections: readonly PublishingProviderConnection[],
): TikTokCreatorConnectionUiState {
  const matching =
    connections.filter(
      isTikTokConnection,
    );

  if (matching.length === 0) {
    return {
      kind: "disconnected",
    };
  }

  if (matching.length !== 1) {
    return {
      kind: "ambiguous",
    };
  }

  const connection =
    matching[0];

  if (
    connection.authorizationStatus ===
    "revoked"
  ) {
    return {
      kind: "revoked",
      externalAccountId:
        connection.externalAccountId,
    };
  }

  if (
    connection.authorizationStatus ===
    "reauthorization_required"
  ) {
    return {
      kind:
        "reauthorization_required",
      externalAccountId:
        connection.externalAccountId,
    };
  }

  if (
    connection.authorizationStatus !==
    "authorized"
  ) {
    return {
      kind: "not_authorized",
      externalAccountId:
        connection.externalAccountId,
    };
  }

  const grantedScopes =
    new Set(
      connection.grantedScopes,
    );

  const missingScopes =
    TIKTOK_CREATOR_REQUIRED_SCOPES.filter(
      (scope) =>
        !grantedScopes.has(
          scope,
        ),
    );

  if (missingScopes.length > 0) {
    return {
      kind: "scope_missing",
      externalAccountId:
        connection.externalAccountId,
      missingScopes,
    };
  }

  return {
    kind: "connected",
    externalAccountId:
      connection.externalAccountId,
    grantedScopes:
      [...connection.grantedScopes]
        .sort(),
  };
}