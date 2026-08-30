import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";

const ROUTE_FILES = [
  "../../app/api/ai/controlled-actions/[id]/route.ts",
  "../../app/api/ai/controlled-publications/[id]/confirm/route.ts",
  "../../app/api/ai/controlled-publications/[id]/route.ts",
  "../../app/api/ai/controlled-publications/route.ts",
  "../../app/api/ai/publishing-provider-connections/route.ts",
  "../../app/api/ai/today/daily-brief/route.ts",
] as const;

describe(
  "F8A1 AI request correlation completion",
  () => {
    it(
      "correlates all six non-TikTok gap routes with structured failure logs",
      () => {
        for (
          const routeFile
          of ROUTE_FILES
        ) {
          const source =
            readFileSync(
              new URL(
                routeFile,
                import.meta.url,
              ),
              "utf8",
            );

          expect(
            source,
          ).toContain(
            'request.headers.get(',
          );

          expect(
            source,
          ).toContain(
            '"x-request-id"',
          );

          expect(
            source,
          ).toContain(
            "logServerError({",
          );

          const logCalls =
            source.match(
              /logServerError\(\{[\s\S]*?\}\);/gu,
            ) ?? [];

          expect(
            logCalls.length,
          ).toBeGreaterThan(
            0,
          );

          for (
            const logCall
            of logCalls
          ) {
            expect(
              logCall,
            ).toContain(
              "requestId,",
            );

            expect(
              logCall,
            ).not.toMatch(
              /\b(?:organizationId|userId|actionId|publicationId|idempotencyKey|content|credential|token|secret)\b/u,
            );
          }
        }
      },
    );
  },
);