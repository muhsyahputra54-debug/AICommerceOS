import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseMessages,
  parseProactiveInsightCode,
} from "./chat-contract";

describe("parseMessages", () => {
  it("trims valid message content", () => {
    expect(
      parseMessages([
        {
          role: "assistant",
          content: "  Halo  ",
        },
        {
          role: "user",
          content: "  Bantu saya  ",
        },
      ]),
    ).toEqual([
      {
        role: "assistant",
        content: "Halo",
      },
      {
        role: "user",
        content: "Bantu saya",
      },
    ]);
  });

  it.each([
    undefined,
    null,
    {},
    "message",
    [],
  ])(
    "rejects invalid or empty message collections",
    (value) => {
      expect(
        parseMessages(value),
      ).toBeNull();
    },
  );

  it("accepts exactly 20 messages", () => {
    const messages =
      Array.from(
        {
          length: 20,
        },
        () => ({
          role: "user" as const,
          content: "x",
        }),
      );

    expect(
      parseMessages(messages),
    ).toHaveLength(20);
  });

  it("rejects more than 20 messages", () => {
    const messages =
      Array.from(
        {
          length: 21,
        },
        () => ({
          role: "user" as const,
          content: "x",
        }),
      );

    expect(
      parseMessages(messages),
    ).toBeNull();
  });

  it("rejects unsupported roles", () => {
    expect(
      parseMessages([
        {
          role: "system",
          content: "hidden",
        },
        {
          role: "user",
          content: "hello",
        },
      ]),
    ).toBeNull();
  });

  it.each([
    "",
    "   ",
    123,
    null,
  ])(
    "rejects invalid message content",
    (content) => {
      expect(
        parseMessages([
          {
            role: "user",
            content,
          },
        ]),
      ).toBeNull();
    },
  );

  it("accepts a 4000 character message", () => {
    const result =
      parseMessages([
        {
          role: "user",
          content: "x".repeat(4000),
        },
      ]);

    expect(result).not.toBeNull();

    expect(
      result?.[0]?.content,
    ).toHaveLength(4000);
  });

  it("rejects a message longer than 4000 characters", () => {
    expect(
      parseMessages([
        {
          role: "user",
          content: "x".repeat(4001),
        },
      ]),
    ).toBeNull();
  });

  it("accepts exactly 20000 total characters", () => {
    const messages =
      Array.from(
        {
          length: 5,
        },
        () => ({
          role: "user" as const,
          content: "x".repeat(4000),
        }),
      );

    expect(
      parseMessages(messages),
    ).toHaveLength(5);
  });

  it("rejects more than 20000 total characters", () => {
    const messages =
      Array.from(
        {
          length: 6,
        },
        () => ({
          role: "user" as const,
          content: "x".repeat(3500),
        }),
      );

    expect(
      parseMessages(messages),
    ).toBeNull();
  });

  it("requires the final message to be from the user", () => {
    expect(
      parseMessages([
        {
          role: "user",
          content: "hello",
        },
        {
          role: "assistant",
          content: "hi",
        },
      ]),
    ).toBeNull();
  });

  it("does not require role alternation", () => {
    expect(
      parseMessages([
        {
          role: "user",
          content: "one",
        },
        {
          role: "user",
          content: "two",
        },
      ]),
    ).toEqual([
      {
        role: "user",
        content: "one",
      },
      {
        role: "user",
        content: "two",
      },
    ]);
  });
});

describe("parseProactiveInsightCode", () => {
  it.each([
    "catalog_readiness",
    "competitor_threshold_alert",
    "no_orders",
    "price_monitoring_no_observations",
  ])(
    "accepts supported insight code %s",
    (code) => {
      expect(
        parseProactiveInsightCode(
          code,
        ),
      ).toBe(code);
    },
  );

  it.each([
    undefined,
    null,
    123,
    "",
    "unknown",
    " catalog_readiness ",
  ])(
    "rejects unsupported proactive insight values",
    (value) => {
      expect(
        parseProactiveInsightCode(
          value,
        ),
      ).toBeNull();
    },
  );
});
