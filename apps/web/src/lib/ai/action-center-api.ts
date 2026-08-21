import type {
  ControlledActionApiRecord,
} from "./controlled-action-api";

export const ACTION_CENTER_LIST_STATUSES = [
  "proposed",
  "confirmed",
  "executing",
  "executed",
  "stale",
  "failed",
  "cancelled",
] as const satisfies
  readonly ControlledActionApiRecord["status"][];

export type ActionCenterListStatus =
  (typeof ACTION_CENTER_LIST_STATUSES)[number];

export type ActionCenterListQuery = {
  limit: number;
  offset: number;
  status:
    ActionCenterListStatus | null;
};

export type ActionCenterListQueryParseResult =
  | {
      ok: true;
      value:
        ActionCenterListQuery;
    }
  | {
      ok: false;
      error: string;
    };

const ALLOWED_QUERY_KEYS =
  new Set([
    "limit",
    "offset",
    "status",
  ]);

function parseIntegerParameter(
  value: string | null,
  {
    defaultValue,
    min,
    max,
    field,
  }: {
    defaultValue: number;
    min: number;
    max: number;
    field: string;
  },
):
  | {
      ok: true;
      value: number;
    }
  | {
      ok: false;
      error: string;
    } {
  if (value === null) {
    return {
      ok: true,
      value:
        defaultValue,
    };
  }

  if (
    !/^[0-9]+$/.test(
      value,
    )
  ) {
    return {
      ok: false,
      error:
        `${field} harus berupa integer.`,
    };
  }

  const parsed =
    Number(value);

  if (
    !Number.isSafeInteger(
      parsed,
    ) ||
    parsed < min ||
    parsed > max
  ) {
    return {
      ok: false,
      error:
        `${field} harus antara ${min} dan ${max}.`,
    };
  }

  return {
    ok: true,
    value:
      parsed,
  };
}

export function parseActionCenterListQuery(
  searchParams: URLSearchParams,
): ActionCenterListQueryParseResult {
  for (
    const key of
      searchParams.keys()
  ) {
    if (
      !ALLOWED_QUERY_KEYS.has(
        key,
      )
    ) {
      return {
        ok: false,
        error:
          `Query parameter tidak didukung: ${key}.`,
      };
    }
  }

  for (
    const key of [
      "limit",
      "offset",
      "status",
    ] as const
  ) {
    if (
      searchParams.getAll(
        key,
      ).length > 1
    ) {
      return {
        ok: false,
        error:
          `Query parameter ${key} tidak boleh duplikat.`,
      };
    }
  }

  const limit =
    parseIntegerParameter(
      searchParams.get(
        "limit",
      ),
      {
        defaultValue:
          50,

        min:
          1,

        max:
          100,

        field:
          "limit",
      },
    );

  if (!limit.ok) {
    return limit;
  }

  const offset =
    parseIntegerParameter(
      searchParams.get(
        "offset",
      ),
      {
        defaultValue:
          0,

        min:
          0,

        max:
          10000,

        field:
          "offset",
      },
    );

  if (!offset.ok) {
    return offset;
  }

  const rawStatus =
    searchParams.get(
      "status",
    );

  let status:
    ActionCenterListStatus | null =
      null;

  if (rawStatus !== null) {
    if (
      !(
        ACTION_CENTER_LIST_STATUSES as
          readonly string[]
      ).includes(
        rawStatus,
      )
    ) {
      return {
        ok: false,
        error:
          "Status controlled action tidak didukung.",
      };
    }

    status =
      rawStatus as
        ActionCenterListStatus;
  }

  return {
    ok: true,

    value: {
      limit:
        limit.value,

      offset:
        offset.value,

      status,
    },
  };
}
