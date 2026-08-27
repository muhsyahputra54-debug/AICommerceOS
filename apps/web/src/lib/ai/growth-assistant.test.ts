import {
  describe,
  expect,
  it,
} from "vitest";

import {
  GROWTH_ASSISTANT_TASK_IDS,
  GROWTH_ASSISTANT_TASKS,
  buildGrowthAssistantPrompt,
} from "./growth-assistant";

describe(
  "LAKUVO Growth Assistant V1 contract",
  () => {
    it(
      "exposes six unique growth tasks",
      () => {
        expect(
          GROWTH_ASSISTANT_TASK_IDS,
        ).toHaveLength(6);

        expect(
          new Set(
            GROWTH_ASSISTANT_TASK_IDS,
          ).size,
        ).toBe(6);

        expect(
          GROWTH_ASSISTANT_TASKS.map(
            (task) => task.id,
          ),
        ).toEqual(
          GROWTH_ASSISTANT_TASK_IDS,
        );
      },
    );

    it(
      "locks advisory-only safety boundaries into every task",
      () => {
        for (
          const taskId
          of GROWTH_ASSISTANT_TASK_IDS
        ) {
          const prompt =
            buildGrowthAssistantPrompt({
              taskId,
              objective:
                "Naikkan penjualan produk utama.",
              locale: "id",
            });

          expect(prompt).toContain(
            "Use only the verified business context",
          );

          expect(prompt).toContain(
            "Do not publish or schedule content.",
          );

          expect(prompt).toContain(
            "Do not create advertisements or spend advertising budget.",
          );

          expect(prompt).toContain(
            "Do not change product names, prices, product status, inventory, orders, suppliers, or billing.",
          );

          expect(prompt).toContain(
            "Do not create, confirm, or execute controlled actions.",
          );

          expect(prompt).toContain(
            "instead of guessing",
          );
        }
      },
    );

    it(
      "keeps the user brief bounded and normalized",
      () => {
        const prompt =
          buildGrowthAssistantPrompt({
            taskId:
              "content-ideas",
            objective:
              `  Fokus   Instagram   ${"x".repeat(3000)}  `,
            locale: "id",
          });

        expect(prompt).toContain(
          "Brief tambahan pengguna: Fokus Instagram",
        );

        expect(
          prompt.length,
        ).toBeLessThan(4000);
      },
    );

    it(
      "supports an English response contract",
      () => {
        const prompt =
          buildGrowthAssistantPrompt({
            taskId:
              "seven-day-plan",
            objective: "",
            locale: "en",
          });

        expect(prompt).toContain(
          "Respond in English.",
        );

        expect(prompt).toContain(
          "No additional user brief was provided.",
        );
      },
    );
  },
);