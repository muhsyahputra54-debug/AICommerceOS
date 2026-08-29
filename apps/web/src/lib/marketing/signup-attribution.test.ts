import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildMarketingSignupHref,
  normalizeMarketingSignupSource,
  TIKTOK_EARLY_ACCESS_SIGNUP_SOURCE,
} from "./signup-attribution";

describe(
  "marketing signup attribution",
  () => {
    it(
      "builds the TikTok Early Access signup URL",
      () => {
        expect(
          buildMarketingSignupHref(
            TIKTOK_EARLY_ACCESS_SIGNUP_SOURCE,
          ),
        ).toBe(
          "/signup?source=tiktok_early_access",
        );
      },
    );

    it(
      "accepts only the known TikTok Early Access source",
      () => {
        expect(
          normalizeMarketingSignupSource(
            "tiktok_early_access",
          ),
        ).toBe(
          "tiktok_early_access",
        );

        expect(
          normalizeMarketingSignupSource(
            "unknown_campaign",
          ),
        ).toBeNull();

        expect(
          normalizeMarketingSignupSource(
            null,
          ),
        ).toBeNull();
      },
    );
  },
);