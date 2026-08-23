import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isNavigationChildActive,
  isNavigationItemActive,
  navigationSections,
  settingsNavigationItem,
} from "./navigation";

function getSection(
  key:
    | "main"
    | "aiAutomation"
    | "operations"
    | "analytics",
) {
  const section =
    navigationSections.find(
      (candidate) =>
        candidate.key === key,
    );

  if (!section) {
    throw new Error(
      `Missing navigation section: ${key}`,
    );
  }

  return section;
}

describe(
  "LAKUVO shared navigation contract",
  () => {
    it(
      "keeps the locked sidebar section order",
      () => {
        expect(
          navigationSections.map(
            (section) =>
              section.key,
          ),
        ).toEqual([
          "main",
          "aiAutomation",
          "operations",
          "analytics",
        ]);
      },
    );

    it(
      "keeps the locked menu composition",
      () => {
        expect(
          getSection(
            "main",
          ).items.map(
            (item) => item.key,
          ),
        ).toEqual([
          "today",
          "dashboard",
        ]);

        expect(
          getSection(
            "aiAutomation",
          ).items.map(
            (item) => item.key,
          ),
        ).toEqual([
          "lakuvoAi",
        ]);

        expect(
          getSection(
            "operations",
          ).items.map(
            (item) => item.key,
          ),
        ).toEqual([
          "products",
          "marketplaces",
          "productResearch",
          "orders",
          "customers",
          "suppliers",
        ]);

        expect(
          getSection(
            "analytics",
          ).items.map(
            (item) => item.key,
          ),
        ).toEqual([
          "analytics",
        ]);
      },
    );

    it(
      "keeps settings outside the primary sections",
      () => {
        expect(
          settingsNavigationItem,
        ).toMatchObject({
          key: "settings",
          href: "/settings",
        });

        expect(
          navigationSections.some(
            (section) =>
              section.items.some(
                (item) =>
                  item.key ===
                  "settings",
              ),
          ),
        ).toBe(false);
      },
    );

    it(
      "matches the dashboard route",
      () => {
        const dashboard =
          getSection(
            "main",
          ).items.find(
            (item) =>
              item.key ===
              "dashboard",
          );

        expect(
          dashboard,
        ).toBeDefined();

        expect(
          isNavigationItemActive(
            "/dashboard",
            dashboard!,
          ),
        ).toBe(true);

        expect(
          isNavigationItemActive(
            "/",
            dashboard!,
          ),
        ).toBe(false);

        expect(
          isNavigationItemActive(
            "/products",
            dashboard!,
          ),
        ).toBe(false);
      },
    );

    it(
      "keeps parent and child active states deterministic",
      () => {
        const ai =
          getSection(
            "aiAutomation",
          ).items[0];

        const assistant =
          ai.children?.find(
            (child) =>
              child.key ===
              "aiAssistant",
          );

        const actionCenter =
          ai.children?.find(
            (child) =>
              child.key ===
              "aiActionCenter",
          );

        expect(
          isNavigationItemActive(
            "/ai/action-center",
            ai,
          ),
        ).toBe(true);

        expect(
          isNavigationItemActive(
            "/agents/example",
            ai,
          ),
        ).toBe(true);

        expect(
          isNavigationChildActive(
            "/ai/action-center",
            ai,
            assistant!,
          ),
        ).toBe(false);

        expect(
          isNavigationChildActive(
            "/ai/action-center",
            ai,
            actionCenter!,
          ),
        ).toBe(true);
      },
    );
  },
);
