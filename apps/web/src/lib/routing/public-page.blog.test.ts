import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isPublicMarketingPath,
} from "./public-page";

describe(
  "public blog routing",
  () => {
    it(
      "allows the blog index",
      () => {
        expect(
          isPublicMarketingPath(
            "/blog",
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "allows blog article routes",
      () => {
        expect(
          isPublicMarketingPath(
            "/blog/cara-memulai-usaha-online-dari-nol",
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      "does not allow lookalike paths",
      () => {
        expect(
          isPublicMarketingPath(
            "/blogger",
          ),
        ).toBe(
          false,
        );
      },
    );
  },
);