import type {
  MarketplaceCapability,
  MarketplaceProviderDefinition,
  MarketplaceProviderId,
} from "./provider-contract";
import type {
  MarketplaceSyncEntity,
} from "./sync-contract";
import type {
  MarketplaceTokenResolver,
} from "./token-manager";

export type MarketplaceSyncReadSupport =
  Readonly<
    Record<
      MarketplaceSyncEntity,
      boolean
    >
  >;

const SYNC_CAPABILITY_BY_ENTITY:
  Readonly<
    Record<
      MarketplaceSyncEntity,
      MarketplaceCapability
    >
  > = Object.freeze({
    shops: "shops.read",
    products: "products.read",
    orders: "orders.read",
    inventory: "inventory.read",
  });

export type MarketplaceConnectorAdapter =
  Readonly<{
    provider:
      MarketplaceProviderId;
    definition:
      MarketplaceProviderDefinition;
    syncReadSupport:
      MarketplaceSyncReadSupport;
    getTokenResolver:
      () => MarketplaceTokenResolver;
  }>;

export function createMarketplaceSyncReadSupport(
  definition:
    MarketplaceProviderDefinition,
): MarketplaceSyncReadSupport {
  return Object.freeze({
    shops:
      definition.capabilities[
        SYNC_CAPABILITY_BY_ENTITY.shops
      ],
    products:
      definition.capabilities[
        SYNC_CAPABILITY_BY_ENTITY.products
      ],
    orders:
      definition.capabilities[
        SYNC_CAPABILITY_BY_ENTITY.orders
      ],
    inventory:
      definition.capabilities[
        SYNC_CAPABILITY_BY_ENTITY.inventory
      ],
  });
}

export function assertMarketplaceConnectorAdapter(
  adapter:
    MarketplaceConnectorAdapter,
): MarketplaceConnectorAdapter {
  if (
    adapter.provider !==
    adapter.definition.provider
  ) {
    throw new Error(
      "Marketplace connector adapter provider mismatch.",
    );
  }

  const expected =
    createMarketplaceSyncReadSupport(
      adapter.definition,
    );

  for (
    const entity of [
      "shops",
      "products",
      "orders",
      "inventory",
    ] as const
  ) {
    if (
      adapter.syncReadSupport[
        entity
      ] !== expected[entity]
    ) {
      throw new Error(
        "Marketplace connector adapter sync capability mismatch.",
      );
    }
  }

  return adapter;
}

export function marketplaceConnectorSupportsSyncEntity(
  adapter:
    MarketplaceConnectorAdapter,
  entity:
    MarketplaceSyncEntity,
) {
  return adapter.syncReadSupport[
    entity
  ];
}