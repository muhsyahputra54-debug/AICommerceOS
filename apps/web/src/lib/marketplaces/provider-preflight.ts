import type {
  MarketplaceProviderDefinition,
  MarketplaceProviderId,
} from "./provider-contract";
import {
  getMarketplaceConnectorAdapter,
} from "./provider-adapter-registry";
import {
  marketplaceConnectorSupportsSyncEntity,
  type MarketplaceConnectorAdapter,
} from "./provider-adapter";
import {
  resolveMarketplaceProviderIdentity,
} from "./provider-identity";
import type {
  MarketplaceSyncEntity,
  MarketplaceSyncErrorCode,
} from "./sync-contract";

export type MarketplaceSyncPreflight =
  Readonly<{
    provider: MarketplaceProviderId;
    entity: MarketplaceSyncEntity;
    definition:
      MarketplaceProviderDefinition;
    adapter:
      MarketplaceConnectorAdapter;
  }>;

export class MarketplaceSyncPreflightError
  extends Error {
  readonly code:
    Extract<
      MarketplaceSyncErrorCode,
      "unsupported"
    > = "unsupported";

  constructor(message: string) {
    super(message);
    this.name =
      "MarketplaceSyncPreflightError";
  }
}

export function requireMarketplaceSyncPreflight(
  provider: string,
  entity: MarketplaceSyncEntity,
): MarketplaceSyncPreflight {
  const identity =
    resolveMarketplaceProviderIdentity(
      provider,
    );

  if (!identity) {
    throw new MarketplaceSyncPreflightError(
      "Marketplace sync provider is unsupported.",
    );
  }

  const adapter =
    getMarketplaceConnectorAdapter(
      identity.provider,
    );

  if (
    !adapter ||
    adapter.provider !== identity.provider ||
    adapter.definition.provider !==
      identity.provider
  ) {
    throw new Error(
      "Marketplace sync provider adapter identity mismatch.",
    );
  }

  if (
    !marketplaceConnectorSupportsSyncEntity(
      adapter,
      entity,
    )
  ) {
    throw new MarketplaceSyncPreflightError(
      "Marketplace sync entity is unsupported by provider.",
    );
  }

  return Object.freeze({
    provider:
      identity.provider,
    entity,
    definition:
      identity.definition,
    adapter,
  });
}

export function isMarketplaceSyncPreflightError(
  error: unknown,
): error is MarketplaceSyncPreflightError {
  return (
    error instanceof
      MarketplaceSyncPreflightError
  );
}