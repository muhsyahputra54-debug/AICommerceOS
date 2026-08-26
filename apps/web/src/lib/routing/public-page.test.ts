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
      "/robots.txt",
      "/sitemap.xml",
      "/google26f071f25ac7bb17.html",
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
      "/robots.txt/anything",
      "/robots.txt-old",
      "/sitemap.xml/anything",
      "/sitemap.xml-old",
      "/google26f071f25ac7bb17.html/anything",
      "/google26f071f25ac7bb18.html",
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