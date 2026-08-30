import {
  getMarketplaceProviderDefinition,
  normalizeMarketplaceProvider,
} from "./provider-registry";
import {
  getMarketplaceTokenResolver,
} from "./token-manager";
import {
  assertMarketplaceConnectorAdapter,
  type MarketplaceConnectorAdapter,
} from "./provider-adapter";
import type {
  MarketplaceProviderId,
} from "./provider-contract";

function buildAdapter(
  provider: MarketplaceProviderId,
): MarketplaceConnectorAdapter {
  const definition =
    getMarketplaceProviderDefinition(provider);

  if (!definition) {
    throw new Error(
      "Marketplace connector definition unavailable.",
    );
  }

  return assertMarketplaceConnectorAdapter({
    provider,
    definition,
    getTokenResolver: () =>
      getMarketplaceTokenResolver(provider),
  });
}

const ADAPTERS: Readonly<
  Record<
    MarketplaceProviderId,
    MarketplaceConnectorAdapter
  >
> = Object.freeze({
  tiktok_shop:
    buildAdapter("tiktok_shop"),
  shopee:
    buildAdapter("shopee"),
});

export function getMarketplaceConnectorAdapter(
  provider: string,
): MarketplaceConnectorAdapter | null {
  const normalized =
    normalizeMarketplaceProvider(provider);

  return normalized
    ? ADAPTERS[normalized]
    : null;
}

export function requireMarketplaceConnectorAdapter(
  provider: string,
): MarketplaceConnectorAdapter {
  const adapter =
    getMarketplaceConnectorAdapter(provider);

  if (!adapter) {
    throw new Error(
      "Marketplace connector adapter unavailable.",
    );
  }

  return adapter;
}

export function getRegisteredMarketplaceConnectorAdapters(): readonly MarketplaceConnectorAdapter[] {
  return Object.freeze([
    ADAPTERS.tiktok_shop,
    ADAPTERS.shopee,
  ]);
}
