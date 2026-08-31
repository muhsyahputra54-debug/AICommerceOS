import {
  readFileSync,
} from "node:fs";
import {
  fileURLToPath,
} from "node:url";

import {
  describe,
  expect,
  it,
} from "vitest";

const route =
  readFileSync(
    fileURLToPath(
      new URL(
        "../../app/api/ai/publishing-provider-connections/youtube/health/route.ts",
        import.meta.url,
      ),
    ),
    "utf8",
  );

describe(
  "YouTube connection health route contract",
  () => {
    it(
      "keeps GET read-only and POST explicit",
      () => {
        const getStart =
          route.indexOf(
            "export async function GET",
          );

        const postStart =
          route.indexOf(
            "export async function POST",
          );

        expect(getStart).toBeGreaterThan(-1);
        expect(postStart).toBeGreaterThan(getStart);

        const getBody =
          route.slice(
            getStart,
            postStart,
          );

        const postBody =
          route.slice(
            postStart,
          );

        expect(getBody).not.toContain(
          "exchangeYouTubeRefreshToken(",
        );

        expect(getBody).not.toContain(
          "rotate_publishing_provider_access_token",
        );

        expect(postBody).toContain(
          "exchangeYouTubeRefreshToken(",
        );

        expect(postBody).toContain(
          "rotate_publishing_provider_access_token",
        );
      },
    );

    it(
      "never serializes credential material",
      () => {
        expect(route).not.toContain(
          '"refreshToken":',
        );

        expect(route).not.toContain(
          '"refreshTokenCiphertext":',
        );

        expect(route).not.toContain(
          '"accessTokenCiphertext":',
        );
      },
    );
  },
);
