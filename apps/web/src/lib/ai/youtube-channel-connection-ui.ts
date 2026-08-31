import type {
  PublishingProviderConnection,
} from "./publishing-provider-connection";

import {
  YOUTUBE_CHANNEL_PROVIDER,
  YOUTUBE_REQUIRED_SCOPES,
} from "./youtube-channel";

export type YouTubeChannelConnectionUiState =
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

function isYouTubeConnection(
  connection: PublishingProviderConnection,
): boolean {
  return (
    connection.provider
      .trim()
      .toLowerCase() ===
    YOUTUBE_CHANNEL_PROVIDER
  );
}

export function projectYouTubeChannelConnectionUiState(
  connections:
    readonly PublishingProviderConnection[],
): YouTubeChannelConnectionUiState {
  const matching =
    connections.filter(
      isYouTubeConnection,
    );

  if (matching.length === 0) {
    return {
      kind:
        "disconnected",
    };
  }

  if (matching.length !== 1) {
    return {
      kind:
        "ambiguous",
    };
  }

  const connection =
    matching[0];

  if (
    connection.authorizationStatus ===
    "revoked"
  ) {
    return {
      kind:
        "revoked",
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
      kind:
        "not_authorized",
      externalAccountId:
        connection.externalAccountId,
    };
  }

  const grantedScopes =
    new Set(
      connection.grantedScopes,
    );

  const missingScopes =
    YOUTUBE_REQUIRED_SCOPES.filter(
      (scope) =>
        !grantedScopes.has(
          scope,
        ),
    );

  if (missingScopes.length > 0) {
    return {
      kind:
        "scope_missing",
      externalAccountId:
        connection.externalAccountId,
      missingScopes,
    };
  }

  return {
    kind:
      "connected",
    externalAccountId:
      connection.externalAccountId,
    grantedScopes:
      [...connection.grantedScopes]
        .sort(),
  };
}
