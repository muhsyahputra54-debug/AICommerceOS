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

const nextConfigSource =
  readFileSync(
    fileURLToPath(
      new URL(
        "../../../next.config.ts",
        import.meta.url,
      ),
    ),
    "utf8",
  );

describe(
  "security headers",
  () => {
    it(
      "enforces the minimal CSP hardening layer",
      () => {
        expect(nextConfigSource).toContain(
          'key: "Content-Security-Policy"',
        );

        expect(nextConfigSource).toContain(
          "object-src 'none'",
        );

        expect(nextConfigSource).toContain(
          "base-uri 'self'",
        );

        expect(nextConfigSource).toContain(
          "frame-ancestors 'none'",
        );

        expect(nextConfigSource).toContain(
          'key: "X-Frame-Options"',
        );

        expect(nextConfigSource).toContain(
          'value: "DENY"',
        );
      },
    );

    it(
      "does not prematurely constrain browser script style or connection origins",
      () => {
        expect(nextConfigSource).not.toContain(
          "script-src",
        );

        expect(nextConfigSource).not.toContain(
          "style-src",
        );

        expect(nextConfigSource).not.toContain(
          "connect-src",
        );

        expect(nextConfigSource).not.toContain(
          "img-src",
        );

        expect(nextConfigSource).not.toContain(
          "font-src",
        );

        expect(nextConfigSource).not.toContain(
          "media-src",
        );
      },
    );
  },
);