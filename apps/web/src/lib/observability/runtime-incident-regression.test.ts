import {
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import {
  join,
} from "node:path";
import {
  fileURLToPath,
} from "node:url";

import {
  describe,
  expect,
  it,
} from "vitest";

function read(relativePath: string) {
  return readFileSync(
    fileURLToPath(
      new URL(
        relativePath,
        import.meta.url,
      ),
    ),
    "utf8",
  );
}

function collectRouteFiles(
  absoluteDirectory: string,
): string[] {
  const result: string[] = [];

  for (
    const entry of readdirSync(
      absoluteDirectory,
    )
  ) {
    const absolutePath =
      join(
        absoluteDirectory,
        entry,
      );

    const stat =
      statSync(
        absolutePath,
      );

    if (stat.isDirectory()) {
      result.push(
        ...collectRouteFiles(
          absolutePath,
        ),
      );
      continue;
    }

    if (entry === "route.ts") {
      result.push(
        absolutePath,
      );
    }
  }

  return result;
}

const appRoot =
  fileURLToPath(
    new URL(
      "../../app/",
      import.meta.url,
    ),
  );

const apiRoot =
  join(
    appRoot,
    "api",
  );

const aiApiRoot =
  join(
    apiRoot,
    "ai",
  );

const allApiRoutes =
  collectRouteFiles(
    apiRoot,
  );

const aiApiRoutes =
  collectRouteFiles(
    aiApiRoot,
  );

const serverLogger =
  read(
    "./server-logger.ts",
  );

const instrumentation =
  read(
    "../../instrumentation.ts",
  );

const instrumentationClient =
  read(
    "../../instrumentation-client.ts",
  );

const globalError =
  read(
    "../../app/global-error.tsx",
  );

const nextConfig =
  read(
    "../../../next.config.ts",
  );

describe(
  "runtime and incident observability regression",
  () => {
    it(
      "keeps server and browser runtime instrumentation enabled",
      () => {
        expect(instrumentation).toContain(
          "../sentry.server.config",
        );

        expect(instrumentation).toContain(
          "../sentry.edge.config",
        );

        expect(instrumentation).toContain(
          "onRequestError",
        );

        expect(instrumentation).toContain(
          "Sentry.captureRequestError",
        );

        expect(instrumentationClient).toContain(
          "Sentry.init",
        );

        expect(instrumentationClient).toContain(
          "captureRouterTransitionStart",
        );

        expect(globalError).toContain(
          "Sentry.captureException",
        );
      },
    );

    it(
      "keeps structured error and warning logging with bounded redaction",
      () => {
        expect(serverLogger).toContain(
          "logServerError",
        );

        expect(serverLogger).toContain(
          "logServerWarning",
        );

        expect(serverLogger).toContain(
          "redactSensitiveText",
        );

        expect(serverLogger).toContain(
          "SENSITIVE_TEXT_PATTERNS",
        );

        expect(serverLogger).toContain(
          "request_id",
        );
      },
    );

    it(
      "keeps raw API console logging at zero",
      () => {
        for (
          const route of allApiRoutes
        ) {
          const source =
            readFileSync(
              route,
              "utf8",
            );

          expect(
            source,
            route,
          ).not.toMatch(
            /console\.(?:error|warn|log)\(/u,
          );
        }
      },
    );

    it(
      "keeps every AI route request-correlated",
      () => {
        expect(
          aiApiRoutes.length,
        ).toBe(
          23,
        );

        for (
          const route of aiApiRoutes
        ) {
          const source =
            readFileSync(
              route,
              "utf8",
            );

          expect(
            source,
            route,
          ).toMatch(
            /x-request-id|\brequestId\b|\bclientRequestId\b/u,
          );
        }
      },
    );

    it(
      "keeps incident-relevant 5xx and retry surfaces present",
      () => {
        const combined =
          allApiRoutes
            .map(
              (route) =>
                readFileSync(
                  route,
                  "utf8",
                ),
            )
            .join(
              "\n",
            );

        const fiveXxSignals =
          combined.match(
            /status:\s*(?:500|501|502|503|504)/gu,
          ) ?? [];

        const retrySignals =
          combined.match(
            /\b(?:retry|temporary|temporarily|serviceUnavailable|badGateway)\b/giu,
          ) ?? [];

        expect(
          fiveXxSignals.length,
        ).toBeGreaterThan(
          0,
        );

        expect(
          retrySignals.length,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "keeps minimal CSP and existing security headers intact",
      () => {
        expect(nextConfig).toContain(
          "Content-Security-Policy",
        );

        expect(nextConfig).toContain(
          "object-src 'none'",
        );

        expect(nextConfig).toContain(
          "base-uri 'self'",
        );

        expect(nextConfig).toContain(
          "frame-ancestors 'none'",
        );

        expect(nextConfig).toContain(
          "Strict-Transport-Security",
        );

        expect(nextConfig).toContain(
          "X-Content-Type-Options",
        );

        expect(nextConfig).toContain(
          "Referrer-Policy",
        );

        expect(nextConfig).toContain(
          "Permissions-Policy",
        );
      },
    );
  },
);