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
    it(
      "allows only the public landing root",
      () => {
        expect(
          isPublicMarketingPath(
            "/",
          ),
        ).toBe(true);

        expect(
          isPublicMarketingPath(
            "/dashboard",
          ),
        ).toBe(false);

        expect(
          isPublicMarketingPath(
            "/today",
          ),
        ).toBe(false);

        expect(
          isPublicMarketingPath(
            "/products",
          ),
        ).toBe(false);
      },
    );
  },
);
