import type {
  AssistantMessage,
} from "./chat-contract";

export type MemoryType =
  | "preference"
  | "goal"
  | "constraint"
  | "business_context";

export type ExplicitMemoryCommand = {
  action:
    | "remember"
    | "forget";

  language:
    | "id"
    | "en";

  value: string;
};

export type MemoryCandidate = {
  id: string;
  memory_type: string;
  memory_key: string;
  content: string;
};

export const MAX_MEMORY_CONTENT_LENGTH =
  2000;

const MEMORY_COMMAND_STOP_WORDS =
  new Set([
    "aku",
    "anda",
    "bahwa",
    "dan",
    "dari",
    "dengan",
    "ini",
    "itu",
    "memori",
    "memory",
    "milik",
    "saya",
    "tentang",
    "tolong",
    "untuk",
    "yang",
    "a",
    "about",
    "an",
    "and",
    "i",
    "me",
    "my",
    "of",
    "please",
    "that",
    "the",
    "this",
    "to",
  ]);

function cleanMemoryCommandValue(
  value: string,
) {
  return value
    .replace(
      /^[\s:,-]+/,
      "",
    )
    .replace(
      /[.!?]+$/,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

export function getExplicitMemoryCommand(
  content: string,
): ExplicitMemoryCommand | null {
  const normalized =
    content.trim();

  const indonesianRememberPatterns = [
    /^tolong\s+ingat(?:lah)?(?:\s+bahwa)?\s+(.+)$/i,
    /^ingat(?:lah)?\s+bahwa\s+(.+)$/i,
    /^ingat(?:lah)?\s+(ini)[.!?]*$/i,
  ];

  for (
    const pattern of
      indonesianRememberPatterns
  ) {
    const match =
      normalized.match(pattern);

    if (match?.[1]) {
      const value =
        cleanMemoryCommandValue(
          match[1],
        );

      if (value) {
        return {
          action:
            "remember",
          language:
            "id",
          value,
        };
      }
    }
  }

  const englishRememberPatterns = [
    /^please\s+remember(?:\s+that)?\s+(.+)$/i,
    /^remember\s+that\s+(.+)$/i,
    /^remember\s+(this)[.!?]*$/i,
  ];

  for (
    const pattern of
      englishRememberPatterns
  ) {
    const match =
      normalized.match(pattern);

    if (match?.[1]) {
      const value =
        cleanMemoryCommandValue(
          match[1],
        );

      if (value) {
        return {
          action:
            "remember",
          language:
            "en",
          value,
        };
      }
    }
  }

  const indonesianForget =
    normalized.match(
      /^(?:tolong\s+)?lupakan(?:lah)?\s+(.+)$/i,
    );

  if (
    indonesianForget?.[1]
  ) {
    const value =
      cleanMemoryCommandValue(
        indonesianForget[1],
      );

    if (value) {
      return {
        action:
          "forget",
        language:
          "id",
        value,
      };
    }
  }

  const englishForget =
    normalized.match(
      /^(?:please\s+)?forget\s+(.+)$/i,
    );

  if (
    englishForget?.[1]
  ) {
    const value =
      cleanMemoryCommandValue(
        englishForget[1],
      );

    if (value) {
      return {
        action:
          "forget",
        language:
          "en",
        value,
      };
    }
  }

  return null;
}

export function normalizeMemorySearchText(
  value: string,
) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function canonicalMemoryToken(
  token: string,
) {
  const aliases:
    Record<string, string> = {
      batas:
        "constraint",
      batasan:
        "constraint",
      constraint:
        "constraint",
      goal:
        "goal",
      kendala:
        "constraint",
      preference:
        "preference",
      preferensi:
        "preference",
      target:
        "goal",
      tujuan:
        "goal",
    };

  return (
    aliases[token] ??
    token
  );
}

function getMemorySearchTokens(
  value: string,
) {
  const tokens =
    normalizeMemorySearchText(
      value,
    )
      .split(" ")
      .map(
        canonicalMemoryToken,
      )
      .filter(
        (token) =>
          token.length >= 2 &&
          !MEMORY_COMMAND_STOP_WORDS.has(
            token,
          ),
      );

  return [
    ...new Set(tokens),
  ];
}

export function inferMemoryType(
  content: string,
): MemoryType {
  const normalized =
    normalizeMemorySearchText(
      content,
    );

  if (
    /\b(preference|preferensi|lebih suka|saya suka|i prefer|i like|gaya jawaban|bahasa jawaban)\b/.test(
      normalized,
    )
  ) {
    return "preference";
  }

  if (
    /\b(goal|tujuan|target|ingin mencapai|mau mencapai|want to achieve)\b/.test(
      normalized,
    )
  ) {
    return "goal";
  }

  if (
    /\b(constraint|batas|batasan|jangan|harus|maksimal|minimal|tidak boleh|must|never|maximum|minimum)\b/.test(
      normalized,
    )
  ) {
    return "constraint";
  }

  return "business_context";
}

function memoryHash(
  value: string,
) {
  let hash =
    2166136261;

  for (
    let index = 0;
    index < value.length;
    index++
  ) {
    hash =
      Math.imul(
        hash ^
          value.charCodeAt(
            index,
          ),
        16777619,
      );
  }

  return (
    hash >>> 0
  )
    .toString(16)
    .padStart(
      8,
      "0",
    );
}

export function buildMemoryKey(
  memoryType: MemoryType,
  content: string,
) {
  const normalized =
    normalizeMemorySearchText(
      content,
    );

  const slug =
    normalized
      .replace(
        /\s+/g,
        "-",
      )
      .slice(
        0,
        72,
      ) ||
    "memory";

  const hash =
    memoryHash(
      `${memoryType}:${normalized}`,
    );

  return (
    `${memoryType}.${slug}.${hash}`
  ).slice(
    0,
    120,
  );
}

export function findPreviousUserMessage(
  messages: AssistantMessage[],
) {
  for (
    let index =
      messages.length - 2;
    index >= 0;
    index--
  ) {
    if (
      messages[index].role ===
        "user" &&
      messages[index].content
        .trim()
    ) {
      return messages[
        index
      ].content.trim();
    }
  }

  return null;
}

export function isReferenceMemoryValue(
  value: string,
) {
  const normalized =
    normalizeMemorySearchText(
      value,
    );

  return (
    normalized === "ini" ||
    normalized === "this"
  );
}

export function findMatchingMemories(
  memories:
    MemoryCandidate[],
  query: string,
) {
  const queryTokens =
    getMemorySearchTokens(
      query,
    );

  if (
    queryTokens.length === 0
  ) {
    return [];
  }

  return memories.filter(
    (memory) => {
      const searchable =
        normalizeMemorySearchText(
          [
            memory.memory_type,
            memory.memory_key,
            memory.content,
          ].join(" "),
        );

      const searchableTokens =
        new Set(
          searchable
            .split(" ")
            .map(
              canonicalMemoryToken,
            ),
        );

      return queryTokens.every(
        (token) =>
          searchableTokens.has(
            token,
          ),
      );
    },
  );
}
