export type MemorySuggestionType =
  | "preference"
  | "goal"
  | "constraint"
  | "business_context";

export type MemorySuggestionCandidate = {
  memoryType: MemorySuggestionType;
  memoryKey: string;
  content: string;
};

export type PendingMemorySuggestion =
  MemorySuggestionCandidate & {
    sourceConversationId: string;
  };

const EXPLICIT_MEMORY_COMMAND_PATTERN =
  /^(?:tolong\s+ingat\b|ingat\s+(?:bahwa|ini)\b|please\s+remember\b|remember\s+(?:that|this)\b|tolong\s+lupakan\b|lupakan\b|please\s+forget\b|forget\b)/i;

const TRANSIENT_MEMORY_PATTERN =
  /\b(?:untuk\s+jawaban\s+ini\s+saja|kali\s+ini\s+saja|untuk\s+sekarang|sementara\s+saja|for\s+this\s+answer\s+only|just\s+this\s+time|for\s+now)\b/i;

const MEMORY_SUGGESTION_PATTERNS: Array<{
  memoryType: MemorySuggestionType;
  pattern: RegExp;
}> = [
  {
    memoryType:
      "preference",
    pattern:
      /\bsaya\s+lebih\s+suka\s+[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "preference",
    pattern:
      /\bsaya\s+suka\s+jawaban\s+[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "preference",
    pattern:
      /\bi\s+prefer\s+[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "preference",
    pattern:
      /\bi\s+like\s+(?:answers|responses)\s+[^,.!?\n]{3,300}/i,
  },

  {
    memoryType:
      "goal",
    pattern:
      /\b(?:target|tujuan)\s+saya\s+(?:(?:adalah|ialah)\s+)?[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "goal",
    pattern:
      /\bsaya\s+ingin\s+mencapai\s+[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "goal",
    pattern:
      /\bmy\s+(?:goal|target)\s+is\s+[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "goal",
    pattern:
      /\bi\s+want\s+to\s+achieve\s+[^,.!?\n]{3,300}/i,
  },

  {
    memoryType:
      "constraint",
    pattern:
      /\bbatasan\s+saya\s+(?:(?:adalah|ialah)\s+)?[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "constraint",
    pattern:
      /\bsaya\s+hanya\s+bisa\s+[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "constraint",
    pattern:
      /\bmy\s+constraint\s+is\s+[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "constraint",
    pattern:
      /\bi\s+can\s+only\s+[^,.!?\n]{3,300}/i,
  },

  {
    memoryType:
      "business_context",
    pattern:
      /\b(?:bisnis|usaha)\s+saya\s+bergerak\s+di\s+[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "business_context",
    pattern:
      /\bkami\s+menjual\s+[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "business_context",
    pattern:
      /\bmy\s+business\s+(?:is\s+in|operates\s+in)\s+[^,.!?\n]{3,300}/i,
  },
  {
    memoryType:
      "business_context",
    pattern:
      /\bwe\s+sell\s+[^,.!?\n]{3,300}/i,
  },
];

export function cleanMemorySuggestionContent(
  value: string,
) {
  return value
    .replace(
      /\s+/g,
      " ",
    )
    .replace(
      /[,.!?]+$/,
      "",
    )
    .trim();
}

export function buildMemorySuggestionKey(
  memoryType: MemorySuggestionType,
  content: string,
) {
  let hash =
    2166136261;

  for (
    let index = 0;
    index < content.length;
    index += 1
  ) {
    hash ^=
      content.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }

  const slug =
    content
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        64,
      ) ||
    "memory";

  return [
    "confirmed",
    memoryType,
    slug,
    (
      hash >>> 0
    ).toString(36),
  ]
    .join("-")
    .slice(
      0,
      120,
    );
}

export function detectMemorySuggestion(
  rawContent: string,
): MemorySuggestionCandidate | null {
  const content =
    rawContent.trim();

  if (
    !content ||
    content.length > 2000 ||
    EXPLICIT_MEMORY_COMMAND_PATTERN.test(
      content,
    ) ||
    TRANSIENT_MEMORY_PATTERN.test(
      content,
    )
  ) {
    return null;
  }

  for (
    const candidatePattern
    of MEMORY_SUGGESTION_PATTERNS
  ) {
    const match =
      content.match(
        candidatePattern.pattern,
      );

    if (!match?.[0]) {
      continue;
    }

    const candidateContent =
      cleanMemorySuggestionContent(
        match[0],
      );

    if (
      candidateContent.length < 8
    ) {
      continue;
    }

    return {
      memoryType:
        candidatePattern.memoryType,

      memoryKey:
        buildMemorySuggestionKey(
          candidatePattern.memoryType,
          candidateContent,
        ),

      content:
        candidateContent,
    };
  }

  return null;
}
