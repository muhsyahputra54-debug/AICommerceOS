import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PROACTIVE_INSIGHT_CODES,
  isProactiveInsight,
  type ProactiveInsight,
  type ProactiveInsightCode,
  type ProactiveInsightsResponse,
} from "./proactive-insight-client";

const VALID_CASES = [
  [
    "catalog_readiness",
    "high",
  ],
  [
    "catalog_readiness",
    "medium",
  ],
  [
    "competitor_threshold_alert",
    "high",
  ],
  [
    "competitor_threshold_alert",
    "medium",
  ],
  [
    "no_orders",
    "high",
  ],
  [
    "no_orders",
    "medium",
  ],
  [
    "price_monitoring_no_observations",
    "high",
  ],
  [
    "price_monitoring_no_observations",
    "medium",
  ],
] as const;

describe(
  "proactive insight client contract",
  () => {
    it(
      "keeps the exact supported insight code list",
      () => {
        expect(
          PROACTIVE_INSIGHT_CODES,
        ).toEqual([
          "catalog_readiness",
          "competitor_threshold_alert",
          "no_orders",
          "price_monitoring_no_observations",
        ]);
      },
    );

    it.each(
      VALID_CASES,
    )(
      "accepts %s with %s severity",
      (
        code,
        severity,
      ) => {
        const typedCode:
          ProactiveInsightCode =
            code;

        const insight:
          ProactiveInsight = {
            code:
              typedCode,

            severity,

            source:
              "deterministic_rule_engine",
          };

        expect(
          isProactiveInsight(
            insight,
          ),
        ).toBe(true);
      },
    );

    it(
      "keeps API response insights untrusted",
      () => {
        const response:
          ProactiveInsightsResponse = {
            insights:
              "not validated yet",
          };

        expect(
          response.insights,
        ).toBe(
          "not validated yet",
        );
      },
    );

    it(
      "rejects null",
      () => {
        expect(
          isProactiveInsight(
            null,
          ),
        ).toBe(false);
      },
    );

    it(
      "rejects primitive values",
      () => {
        const values = [
          undefined,
          "",
          "catalog_readiness",
          1,
          true,
        ];

        for (
          const value
          of values
        ) {
          expect(
            isProactiveInsight(
              value,
            ),
          ).toBe(false);
        }
      },
    );

    it(
      "rejects arrays",
      () => {
        expect(
          isProactiveInsight(
            [],
          ),
        ).toBe(false);
      },
    );

    it(
      "rejects objects without code",
      () => {
        expect(
          isProactiveInsight({
            severity:
              "high",

            source:
              "deterministic_rule_engine",
          }),
        ).toBe(false);
      },
    );

    it(
      "rejects unknown, case-changed, and whitespace-padded codes",
      () => {
        const codes = [
          "unknown",
          "CATALOG_READINESS",
          " catalog_readiness",
          "catalog_readiness ",
        ];

        for (
          const code
          of codes
        ) {
          expect(
            isProactiveInsight({
              code,

              severity:
                "high",

              source:
                "deterministic_rule_engine",
            }),
          ).toBe(false);
        }
      },
    );

    it(
      "rejects missing or invalid severity",
      () => {
        const severities = [
          undefined,
          null,
          "low",
          "HIGH",
          " high",
        ];

        for (
          const severity
          of severities
        ) {
          expect(
            isProactiveInsight({
              code:
                "catalog_readiness",

              severity,

              source:
                "deterministic_rule_engine",
            }),
          ).toBe(false);
        }
      },
    );

    it(
      "rejects missing or invalid source",
      () => {
        const sources = [
          undefined,
          null,
          "rule_engine",
          "DETERMINISTIC_RULE_ENGINE",
          " deterministic_rule_engine",
        ];

        for (
          const source
          of sources
        ) {
          expect(
            isProactiveInsight({
              code:
                "catalog_readiness",

              severity:
                "high",

              source,
            }),
          ).toBe(false);
        }
      },
    );

    it(
      "accepts additional payload fields",
      () => {
        expect(
          isProactiveInsight({
            code:
              "no_orders",

            severity:
              "medium",

            source:
              "deterministic_rule_engine",

            title:
              "extra",

            arbitrary:
              {
                nested:
                  true,
              },
          }),
        ).toBe(true);
      },
    );
  },
);
