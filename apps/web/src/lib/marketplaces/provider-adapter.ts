import type {
  MarketplaceProviderDefinition,
  MarketplaceProviderId,
} from "./provider-contract";
import type {
  MarketplaceTokenResolver,
} from "./token-manager";

export type MarketplaceConnectorAdapter = Readonly<{
  provider: MarketplaceProviderId;
  definition: MarketplaceProviderDefinition;
  getTokenResolver: () => MarketplaceTokenResolver;
}>;

export function assertMarketplaceConnectorAdapter(
  adapter: MarketplaceConnectorAdapter,
): MarketplaceConnectorAdapter {
  if (
    adapter.provider !==
    adapter.definition.provider
  ) {
    throw new Error(
      "Marketplace connector adapter provider mismatch.",
    );
  }

  return adapter;
}
