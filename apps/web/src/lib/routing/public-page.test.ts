import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isPublicMarketingPath,
} from "./public-page";

describe(
  "public marketing routes",
  () => {
    it.each([
      "/",
      "/pricing",
      "/terms",
      "/privacy",
      "/refund-policy",
      "/contact",
    ])(
      "allows public marketing path %s",
      (pathname) => {
        expect(
          isPublicMarketingPath(
            pathname,
          ),
        ).toBe(true);
      },
    );

    it.each([
      "/dashboard",
      "/today",
      "/products",
      "/billing",
      "/settings",
      "/api/billing/checkout",
    ])(
      "keeps protected path %s private",
      (pathname) => {
        expect(
          isPublicMarketingPath(
            pathname,
          ),
        ).toBe(false);
      },
    );

    it.each([
      "/pricing/anything",
      "/terms/anything",
      "/contact/anything",
      "/pricing-old",
    ])(
      "does not implicitly expose descendant or lookalike path %s",
      (pathname) => {
        expect(
          isPublicMarketingPath(
            pathname,
          ),
        ).toBe(false);
      },
    );
  },
);