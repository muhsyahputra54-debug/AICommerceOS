import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildMemorySuggestionKey,
  cleanMemorySuggestionContent,
  detectMemorySuggestion,
  type MemorySuggestionType,
} from "./memory-suggestion";

describe(
  "cleanMemorySuggestionContent",
  () => {
    it(
      "collapses whitespace",
      () => {
        expect(
          cleanMemorySuggestionContent(
            "  saya   lebih suka   jawaban singkat  ",
          ),
        ).toBe(
          "saya lebih suka jawaban singkat",
        );
      },
    );

    it(
      "removes trailing sentence punctuation",
      () => {
        expect(
          cleanMemorySuggestionContent(
            "target saya adalah tumbuh cepat...!?",
          ),
        ).toBe(
          "target saya adalah tumbuh cepat",
        );
      },
    );

    it(
      "preserves punctuation inside content",
      () => {
        expect(
          cleanMemorySuggestionContent(
            "jawaban singkat, tetapi tetap jelas.",
          ),
        ).toBe(
          "jawaban singkat, tetapi tetap jelas",
        );
      },
    );
  },
);

describe(
  "buildMemorySuggestionKey",
  () => {
    it(
      "preserves the current deterministic key",
      () => {
        expect(
          buildMemorySuggestionKey(
            "preference",
            "saya lebih suka jawaban singkat",
          ),
        ).toBe(
          "confirmed-preference-saya-lebih-suka-jawaban-singkat-11s484g",
        );
      },
    );

    it(
      "uses memory type as part of identity",
      () => {
        const content =
          "saya lebih suka jawaban singkat";

        expect(
          buildMemorySuggestionKey(
            "preference",
            content,
          ),
        ).not.toBe(
          buildMemorySuggestionKey(
            "goal",
            content,
          ),
        );
      },
    );

    it(
      "uses memory fallback when no ASCII slug exists",
      () => {
        expect(
          buildMemorySuggestionKey(
            "preference",
            "ä¸­æ–‡",
          ),
        ).toMatch(
          /^confirmed-preference-memory-[a-z0-9]+$/,
        );
      },
    );

    it(
      "caps final key at 120 characters",
      () => {
        expect(
          buildMemorySuggestionKey(
            "business_context",
            "a".repeat(500),
          ).length,
        ).toBeLessThanOrEqual(
          120,
        );
      },
    );
  },
);

describe(
  "detectMemorySuggestion positive behavior",
  () => {
    const cases: Array<{
      content: string;
      memoryType: MemorySuggestionType;
      expectedContent: string;
    }> = [
      {
        content:
          "saya lebih suka jawaban singkat.",
        memoryType:
          "preference",
        expectedContent:
          "saya lebih suka jawaban singkat",
      },
      {
        content:
          "saya suka jawaban yang langsung ke inti.",
        memoryType:
          "preference",
        expectedContent:
          "saya suka jawaban yang langsung ke inti",
      },
      {
        content:
          "I prefer concise explanations.",
        memoryType:
          "preference",
        expectedContent:
          "I prefer concise explanations",
      },
      {
        content:
          "I like answers with examples.",
        memoryType:
          "preference",
        expectedContent:
          "I like answers with examples",
      },

      {
        content:
          "target saya adalah seratus pesanan per hari.",
        memoryType:
          "goal",
        expectedContent:
          "target saya adalah seratus pesanan per hari",
      },
      {
        content:
          "saya ingin mencapai seribu pelanggan.",
        memoryType:
          "goal",
        expectedContent:
          "saya ingin mencapai seribu pelanggan",
      },
      {
        content:
          "my goal is steady monthly growth.",
        memoryType:
          "goal",
        expectedContent:
          "my goal is steady monthly growth",
      },
      {
        content:
          "I want to achieve stable profitability.",
        memoryType:
          "goal",
        expectedContent:
          "I want to achieve stable profitability",
      },

      {
        content:
          "batasan saya adalah anggaran tetap.",
        memoryType:
          "constraint",
        expectedContent:
          "batasan saya adalah anggaran tetap",
      },
      {
        content:
          "saya hanya bisa mengirim pada hari kerja.",
        memoryType:
          "constraint",
        expectedContent:
          "saya hanya bisa mengirim pada hari kerja",
      },
      {
        content:
          "my constraint is limited warehouse space.",
        memoryType:
          "constraint",
        expectedContent:
          "my constraint is limited warehouse space",
      },
      {
        content:
          "I can only ship on weekdays.",
        memoryType:
          "constraint",
        expectedContent:
          "I can only ship on weekdays",
      },

      {
        content:
          "bisnis saya bergerak di fashion anak.",
        memoryType:
          "business_context",
        expectedContent:
          "bisnis saya bergerak di fashion anak",
      },
      {
        content:
          "kami menjual pakaian wanita.",
        memoryType:
          "business_context",
        expectedContent:
          "kami menjual pakaian wanita",
      },
      {
        content:
          "my business operates in home decor.",
        memoryType:
          "business_context",
        expectedContent:
          "my business operates in home decor",
      },
      {
        content:
          "we sell handmade accessories.",
        memoryType:
          "business_context",
        expectedContent:
          "we sell handmade accessories",
      },
    ];

    it.each(cases)(
      "detects $memoryType: $content",
      ({
        content,
        memoryType,
        expectedContent,
      }) => {
        const result =
          detectMemorySuggestion(
            content,
          );

        expect(result).not.toBeNull();

        expect(
          result?.memoryType,
        ).toBe(
          memoryType,
        );

        expect(
          result?.content,
        ).toBe(
          expectedContent,
        );

        expect(
          result?.memoryKey,
        ).toMatch(
          new RegExp(
            `^confirmed-${memoryType}-`,
          ),
        );
      },
    );
  },
);

describe(
  "detectMemorySuggestion suppression behavior",
  () => {
    it(
      "ignores empty content",
      () => {
        expect(
          detectMemorySuggestion("   "),
        ).toBeNull();
      },
    );

    it(
      "ignores content longer than 2000 characters",
      () => {
        expect(
          detectMemorySuggestion(
            `saya lebih suka ${"a".repeat(
              2000,
            )}`,
          ),
        ).toBeNull();
      },
    );

    it(
      "suppresses explicit Indonesian remember commands",
      () => {
        expect(
          detectMemorySuggestion(
            "tolong ingat bahwa saya lebih suka jawaban singkat",
          ),
        ).toBeNull();
      },
    );

    it(
      "suppresses explicit English remember commands",
      () => {
        expect(
          detectMemorySuggestion(
            "remember that I prefer concise answers",
          ),
        ).toBeNull();
      },
    );

    it(
      "suppresses explicit forget commands",
      () => {
        expect(
          detectMemorySuggestion(
            "tolong lupakan saya lebih suka jawaban singkat",
          ),
        ).toBeNull();
      },
    );

    it(
      "suppresses Indonesian transient instructions",
      () => {
        expect(
          detectMemorySuggestion(
            "saya lebih suka jawaban singkat untuk sekarang",
          ),
        ).toBeNull();
      },
    );

    it(
      "suppresses English transient instructions",
      () => {
        expect(
          detectMemorySuggestion(
            "I prefer concise answers for now",
          ),
        ).toBeNull();
      },
    );
  },
);

describe(
  "detectMemorySuggestion matching semantics",
  () => {
    it(
      "captures only the matching phrase before punctuation",
      () => {
        expect(
          detectMemorySuggestion(
            "catatan: saya lebih suka jawaban singkat, tetapi detail.",
          )?.content,
        ).toBe(
          "saya lebih suka jawaban singkat",
        );
      },
    );

    it(
      "matches case-insensitively",
      () => {
        expect(
          detectMemorySuggestion(
            "SAYA LEBIH SUKA JAWABAN SINGKAT.",
          )?.memoryType,
        ).toBe(
          "preference",
        );
      },
    );

    it(
      "preserves pattern priority over phrase position",
      () => {
        const result =
          detectMemorySuggestion(
            "target saya adalah tumbuh cepat. saya lebih suka jawaban singkat.",
          );

        expect(
          result?.memoryType,
        ).toBe(
          "preference",
        );

        expect(
          result?.content,
        ).toBe(
          "saya lebih suka jawaban singkat",
        );
      },
    );
  },
);
