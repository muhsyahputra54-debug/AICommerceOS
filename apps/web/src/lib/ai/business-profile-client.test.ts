import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EMPTY_BUSINESS_PROFILE_FORM,
  businessProfileToForm,
  listInputToArray,
  type BusinessProfile,
} from "./business-profile-client";

const POPULATED_PROFILE: BusinessProfile = {
  organization_id:
    "org-1",

  industry:
    "fashion",

  business_type:
    "retail",

  sales_model:
    "b2c",

  primary_market:
    "Indonesia",

  primary_sales_channels: [
    "TikTok Shop",
    "Website",
  ],

  pricing_strategy:
    "competitive",

  primary_goal:
    "grow revenue",

  operational_priorities: [
    "inventory",
    "fulfillment",
  ],

  business_description:
    "Fashion brand",

  created_by:
    "user-1",

  updated_by:
    "user-2",

  created_at:
    "2026-01-01T00:00:00.000Z",

  updated_at:
    "2026-01-02T00:00:00.000Z",
};

describe(
  "listInputToArray",
  () => {
    it(
      "splits comma and newline separated input",
      () => {
        expect(
          listInputToArray(
            "TikTok Shop, Website\nShopee",
          ),
        ).toEqual([
          "TikTok Shop",
          "Website",
          "Shopee",
        ]);
      },
    );

    it(
      "trims entries and removes empty values",
      () => {
        expect(
          listInputToArray(
            "  TikTok Shop  , , Website ,\n   ",
          ),
        ).toEqual([
          "TikTok Shop",
          "Website",
        ]);
      },
    );

    it(
      "removes exact duplicates while preserving first-seen order",
      () => {
        expect(
          listInputToArray(
            "Website,TikTok Shop,Website,Shopee,TikTok Shop",
          ),
        ).toEqual([
          "Website",
          "TikTok Shop",
          "Shopee",
        ]);
      },
    );

    it(
      "keeps case-distinct entries separate",
      () => {
        expect(
          listInputToArray(
            "Website,website,Website",
          ),
        ).toEqual([
          "Website",
          "website",
        ]);
      },
    );

    it(
      "returns an empty array for empty input",
      () => {
        expect(
          listInputToArray(
            " , \n , ",
          ),
        ).toEqual([]);
      },
    );
  },
);

describe(
  "EMPTY_BUSINESS_PROFILE_FORM",
  () => {
    it(
      "contains the current nine empty form fields",
      () => {
        expect(
          EMPTY_BUSINESS_PROFILE_FORM,
        ).toEqual({
          industry:
            "",

          businessType:
            "",

          salesModel:
            "",

          primaryMarket:
            "",

          primarySalesChannels:
            "",

          pricingStrategy:
            "",

          primaryGoal:
            "",

          operationalPriorities:
            "",

          businessDescription:
            "",
        });
      },
    );
  },
);

describe(
  "businessProfileToForm",
  () => {
    it(
      "maps null profile to the empty form",
      () => {
        expect(
          businessProfileToForm(
            null,
          ),
        ).toEqual(
          EMPTY_BUSINESS_PROFILE_FORM,
        );
      },
    );

    it(
      "returns a fresh object for null profile",
      () => {
        expect(
          businessProfileToForm(
            null,
          ),
        ).not.toBe(
          EMPTY_BUSINESS_PROFILE_FORM,
        );
      },
    );

    it(
      "maps populated profile fields to form fields",
      () => {
        expect(
          businessProfileToForm(
            POPULATED_PROFILE,
          ),
        ).toEqual({
          industry:
            "fashion",

          businessType:
            "retail",

          salesModel:
            "b2c",

          primaryMarket:
            "Indonesia",

          primarySalesChannels:
            "TikTok Shop, Website",

          pricingStrategy:
            "competitive",

          primaryGoal:
            "grow revenue",

          operationalPriorities:
            "inventory, fulfillment",

          businessDescription:
            "Fashion brand",
        });
      },
    );

    it(
      "maps nullable scalar fields to empty strings",
      () => {
        const profile: BusinessProfile = {
          ...POPULATED_PROFILE,

          industry:
            null,

          business_type:
            null,

          sales_model:
            null,

          primary_market:
            null,

          pricing_strategy:
            null,

          primary_goal:
            null,

          business_description:
            null,
        };

        expect(
          businessProfileToForm(
            profile,
          ),
        ).toEqual({
          industry:
            "",

          businessType:
            "",

          salesModel:
            "",

          primaryMarket:
            "",

          primarySalesChannels:
            "TikTok Shop, Website",

          pricingStrategy:
            "",

          primaryGoal:
            "",

          operationalPriorities:
            "inventory, fulfillment",

          businessDescription:
            "",
        });
      },
    );

    it(
      "falls back to empty strings when list fields are not arrays at runtime",
      () => {
        const malformed =
          {
            ...POPULATED_PROFILE,

            primary_sales_channels:
              null,

            operational_priorities:
              "inventory",
          } as unknown as BusinessProfile;

        const result =
          businessProfileToForm(
            malformed,
          );

        expect(
          result.primarySalesChannels,
        ).toBe("");

        expect(
          result.operationalPriorities,
        ).toBe("");
      },
    );

    it(
      "does not mutate source list fields",
      () => {
        const channels = [
          "TikTok Shop",
          "Website",
        ];

        const priorities = [
          "inventory",
          "fulfillment",
        ];

        const profile: BusinessProfile = {
          ...POPULATED_PROFILE,

          primary_sales_channels:
            channels,

          operational_priorities:
            priorities,
        };

        businessProfileToForm(
          profile,
        );

        expect(
          channels,
        ).toEqual([
          "TikTok Shop",
          "Website",
        ]);

        expect(
          priorities,
        ).toEqual([
          "inventory",
          "fulfillment",
        ]);
      },
    );
  },
);
