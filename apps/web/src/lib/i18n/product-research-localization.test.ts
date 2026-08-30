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

function read(
  relativePath: string,
) {
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

const copySource =
  read(
    "./product-research.ts",
  );

const manager =
  read(
    "../../components/research/ProductResearchManager.tsx",
  );

const detailManager =
  read(
    "../../components/research/ProductResearchDetailManager.tsx",
  );

const aiPanel =
  read(
    "../../components/research/AIProductResearchPanel.tsx",
  );

const listPage =
  read(
    "../../app/research/page.tsx",
  );

const detailPage =
  read(
    "../../app/research/[id]/page.tsx",
  );

const aiRoute =
  read(
    "../../app/api/research/[id]/ai/route.ts",
  );

describe(
  "product research localization",
  () => {
    it(
      "provides Indonesian and English product-research copy",
      () => {
        expect(copySource).toContain(
          'title: "Riset Produk"',
        );

        expect(copySource).toContain(
          'title: "Product Research"',
        );

        expect(copySource).toContain(
          'advisoryNote:',
        );

        expect(copySource).toContain(
          'noCompleted:',
        );

        expect(copySource).toContain(
          'runHint:',
        );
      },
    );

    it(
      "wires research client surfaces to active locale",
      () => {
        for (
          const source of [
            manager,
            detailManager,
            aiPanel,
          ]
        ) {
          expect(source).toContain(
            "useLanguage",
          );

          expect(source).toContain(
            "getProductResearchCopy",
          );
        }
      },
    );

    it(
      "wires research server pages to locale cookie",
      () => {
        for (
          const source of [
            listPage,
            detailPage,
          ]
        ) {
          expect(source).toContain(
            "LOCALE_COOKIE",
          );

          expect(source).toContain(
            "normalizeLocale",
          );

          expect(source).toContain(
            "getProductResearchCopy",
          );
        }
      },
    );

    it(
      "sends locale to product research AI",
      () => {
        expect(aiPanel).toContain(
          "JSON.stringify({",
        );

        expect(aiPanel).toContain(
          "locale,",
        );

        expect(aiRoute).toContain(
          "normalizeLocale(requestBody.locale)",
        );
      },
    );

    it(
      "constrains AI prose to selected output language while preserving recommendation enums",
      () => {
        expect(aiRoute).toContain(
          'locale === "en"',
        );

        expect(aiRoute).toContain(
          '`Return summary, rationale, risks, and next_actions in ${outputLanguage}.`',
        );

        expect(aiRoute).toContain(
          "Keep recommendation enum values exactly as watch, shortlist, approve, or reject.",
        );
      },
    );

    it(
      "has no known hardcoded mixed-language AI-panel leftovers",
      () => {
        for (
          const residual of [
            "AI recommendation bersifat advisory. Apply AI Scores",
            "Belum ada AI analysis yang selesai.",
            "Jalankan AI analysis untuk mengevaluasi candidate ini.",
            "AI Analysis History",
            "No AI analysis history.",
          ]
        ) {
          expect(aiPanel).not.toContain(
            residual,
          );
        }

        expect(aiPanel).toContain(
          "{copy.ai.nextActions}",
        );

        expect(aiPanel).toContain(
          "{copy.ai.advisoryNote}",
        );

        expect(aiPanel).toContain(
          "{copy.ai.noCompleted}",
        );

        expect(aiPanel).toContain(
          "{copy.ai.runHint}",
        );

        expect(aiPanel).toContain(
          "{copy.ai.history}",
        );
      },
    );
  },
);