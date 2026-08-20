import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MAX_MEMORY_CONTENT_LENGTH,
  buildMemoryKey,
  findMatchingMemories,
  findPreviousUserMessage,
  getExplicitMemoryCommand,
  inferMemoryType,
  isReferenceMemoryValue,
  normalizeMemorySearchText,
  type MemoryCandidate,
} from "./memory-contract";

describe("getExplicitMemoryCommand", () => {
  it("parses Indonesian remember commands", () => {
    expect(
      getExplicitMemoryCommand(
        "Tolong ingat bahwa saya suka jawaban singkat.",
      ),
    ).toEqual({
      action: "remember",
      language: "id",
      value:
        "saya suka jawaban singkat",
    });
  });

  it("parses Indonesian remember-this references", () => {
    expect(
      getExplicitMemoryCommand(
        "ingat ini!",
      ),
    ).toEqual({
      action: "remember",
      language: "id",
      value: "ini",
    });
  });

  it("parses English remember commands", () => {
    expect(
      getExplicitMemoryCommand(
        "Please remember that I prefer concise answers.",
      ),
    ).toEqual({
      action: "remember",
      language: "en",
      value:
        "I prefer concise answers",
    });
  });

  it("parses English remember-this references", () => {
    expect(
      getExplicitMemoryCommand(
        "remember this!",
      ),
    ).toEqual({
      action: "remember",
      language: "en",
      value: "this",
    });
  });

  it("parses Indonesian forget commands", () => {
    expect(
      getExplicitMemoryCommand(
        "tolong lupakan tujuan lama saya.",
      ),
    ).toEqual({
      action: "forget",
      language: "id",
      value:
        "tujuan lama saya",
    });
  });

  it("parses English forget commands", () => {
    expect(
      getExplicitMemoryCommand(
        "please forget my old goal.",
      ),
    ).toEqual({
      action: "forget",
      language: "en",
      value: "my old goal",
    });
  });

  it("normalizes spaces and trailing punctuation in command values", () => {
    expect(
      getExplicitMemoryCommand(
        "tolong ingat bahwa   target saya 100 order !!!",
      ),
    ).toEqual({
      action: "remember",
      language: "id",
      value:
        "target saya 100 order",
    });
  });

  it.each([
    "",
    "catat ini",
    "save this",
    "restore memory",
  ])(
    "does not treat unsupported text as explicit memory commands",
    (value) => {
      expect(
        getExplicitMemoryCommand(
          value,
        ),
      ).toBeNull();
    },
  );
});

describe("normalizeMemorySearchText", () => {
  it("normalizes case, diacritics, punctuation, and whitespace", () => {
    expect(
      normalizeMemorySearchText(
        "  Café — Déjà   Vu! ",
      ),
    ).toBe(
      "cafe deja vu",
    );
  });
});

describe("inferMemoryType", () => {
  it.each([
    [
      "Saya lebih suka jawaban singkat",
      "preference",
    ],
    [
      "target saya ingin mencapai 100 order",
      "goal",
    ],
    [
      "jangan gunakan jargon teknis",
      "constraint",
    ],
    [
      "toko saya menjual sepatu",
      "business_context",
    ],
  ] as const)(
    "classifies %s as %s",
    (
      content,
      expected,
    ) => {
      expect(
        inferMemoryType(
          content,
        ),
      ).toBe(expected);
    },
  );
});

describe("buildMemoryKey", () => {
  it("creates deterministic keys from normalized content", () => {
    const first =
      buildMemoryKey(
        "business_context",
        "Café Shop",
      );

    const second =
      buildMemoryKey(
        "business_context",
        "cafe   shop",
      );

    expect(first).toBe(second);

    expect(
      first.startsWith(
        "business_context.cafe-shop.",
      ),
    ).toBe(true);

    expect(
      first.length,
    ).toBeLessThanOrEqual(120);
  });

  it("includes memory type in key identity", () => {
    expect(
      buildMemoryKey(
        "goal",
        "100 orders",
      ),
    ).not.toBe(
      buildMemoryKey(
        "constraint",
        "100 orders",
      ),
    );
  });
});

describe("findPreviousUserMessage", () => {
  it("finds the previous user message before the latest command", () => {
    expect(
      findPreviousUserMessage([
        {
          role: "user",
          content:
            "Saya suka jawaban sederhana",
        },
        {
          role: "assistant",
          content: "Baik.",
        },
        {
          role: "user",
          content: "ingat ini",
        },
      ]),
    ).toBe(
      "Saya suka jawaban sederhana",
    );
  });

  it("returns null when there is no earlier user message", () => {
    expect(
      findPreviousUserMessage([
        {
          role: "user",
          content: "ingat ini",
        },
      ]),
    ).toBeNull();
  });
});

describe("isReferenceMemoryValue", () => {
  it.each([
    "ini",
    "INI!",
    "this",
    " this. ",
  ])(
    "recognizes reference value %s",
    (value) => {
      expect(
        isReferenceMemoryValue(
          value,
        ),
      ).toBe(true);
    },
  );

  it.each([
    "itu",
    "this preference",
    "memory ini",
  ])(
    "rejects non-reference value %s",
    (value) => {
      expect(
        isReferenceMemoryValue(
          value,
        ),
      ).toBe(false);
    },
  );
});

describe("findMatchingMemories", () => {
  const memories:
    MemoryCandidate[] = [
      {
        id: "memory-1",
        memory_type:
          "preference",
        memory_key:
          "preference.bahasa-jawaban.example",
        content:
          "Bahasa jawaban Indonesia",
      },
      {
        id: "memory-2",
        memory_type:
          "goal",
        memory_key:
          "goal.revenue.example",
        content:
          "Target revenue bulanan",
      },
      {
        id: "memory-3",
        memory_type:
          "constraint",
        memory_key:
          "constraint.jargon.example",
        content:
          "Jangan gunakan jargon teknis",
      },
    ];

  it("matches canonicalized aliases and content tokens", () => {
    expect(
      findMatchingMemories(
        memories,
        "preferensi bahasa",
      ).map(
        (memory) =>
          memory.id,
      ),
    ).toEqual([
      "memory-1",
    ]);
  });

  it("requires every meaningful query token to match", () => {
    expect(
      findMatchingMemories(
        memories,
        "tujuan revenue",
      ).map(
        (memory) =>
          memory.id,
      ),
    ).toEqual([
      "memory-2",
    ]);

    expect(
      findMatchingMemories(
        memories,
        "tujuan revenue tahunan",
      ),
    ).toEqual([]);
  });

  it("returns no match when query contains only stop words", () => {
    expect(
      findMatchingMemories(
        memories,
        "tolong tentang saya",
      ),
    ).toEqual([]);
  });
});

describe("memory limits", () => {
  it("keeps the existing 2000-character memory limit", () => {
    expect(
      MAX_MEMORY_CONTENT_LENGTH,
    ).toBe(2000);
  });
});
