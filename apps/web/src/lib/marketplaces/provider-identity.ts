import type {
  MarketplaceProviderDefinition,
  MarketplaceProviderId,
} from "./provider-contract";
import {
  getMarketplaceProviderDefinition,
  normalizeMarketplaceProvider,
} from "./provider-registry";

export type MarketplaceProviderIdentity =
  Readonly<{
    provider: MarketplaceProviderId;
    definition:
      MarketplaceProviderDefinition;
  }>;

export function resolveMarketplaceProviderIdentity(
  provider: string,
): MarketplaceProviderIdentity | null {
  const providerId =
    normalizeMarketplaceProvider(
      provider,
    );

  if (!providerId) {
    return null;
  }

  const definition =
    getMarketplaceProviderDefinition(
      providerId,
    );

  if (
    !definition ||
    definition.provider !== providerId
  ) {
    throw new Error(
      "Marketplace provider registry identity mismatch.",
    );
  }

  return Object.freeze({
    provider: providerId,
    definition,
  });
}

export function requireMarketplaceProviderIdentity(
  provider: string,
): MarketplaceProviderIdentity {
  const identity =
    resolveMarketplaceProviderIdentity(
      provider,
    );

  if (!identity) {
    throw new Error(
      "Marketplace provider identity unavailable.",
    );
  }

  return identity;
}

export function marketplaceProviderIs(
  provider: string,
  expectedProvider:
    MarketplaceProviderId,
): boolean {
  return (
    normalizeMarketplaceProvider(
      provider,
    ) === expectedProvider
  );
}