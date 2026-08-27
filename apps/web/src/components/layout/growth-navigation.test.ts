import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isNavigationItemActive,
  navigationSections,
} from "./navigation";

import {
  getDictionary,
} from "@/lib/i18n/dictionaries";

describe(
  "Growth Assistant shared navigation",
  () => {
    const section =
      navigationSections.find(
        (candidate) =>
          candidate.key ===
          "aiAutomation",
      );

    const growthItem =
      section?.items.find(
        (item) =>
          item.key ===
          "growthAssistant",
      );

    it(
      "discovers Growth Assistant from the shared AI & Automation section",
      () => {
        expect(section).toBeDefined();

        expect(growthItem).toBeDefined();

        expect(
          growthItem?.href,
        ).toBe(
          "/growth",
        );
      },
    );

    it(
      "provides labels in both supported dictionaries",
      () => {
        expect(
          getDictionary("id")
            .navigation
            .items
            .growthAssistant,
        ).toBe(
          "Growth Assistant",
        );

        expect(
          getDictionary("en")
            .navigation
            .items
            .growthAssistant,
        ).toBe(
          "Growth Assistant",
        );
      },
    );

    it(
      "marks the Growth Assistant route active without activating unrelated routes",
      () => {
        if (!growthItem) {
          throw new Error(
            "Growth Assistant navigation item missing.",
          );
        }

        expect(
          isNavigationItemActive(
            "/growth",
            growthItem,
          ),
        ).toBe(true);

        expect(
          isNavigationItemActive(
            "/growth/history",
            growthItem,
          ),
        ).toBe(true);

        expect(
          isNavigationItemActive(
            "/ai",
            growthItem,
          ),
        ).toBe(false);
      },
    );
  },
);