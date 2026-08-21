import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseActionCenterListQuery,
} from "./action-center-api";

describe(
  "parseActionCenterListQuery",
  () => {
    it(
      "uses safe defaults",
      () => {
        expect(
          parseActionCenterListQuery(
            new URLSearchParams(),
          ),
        ).toEqual({
          ok: true,

          value: {
            limit: 50,
            offset: 0,
            status: null,
          },
        });
      },
    );

    it(
      "accepts explicit pagination",
      () => {
        expect(
          parseActionCenterListQuery(
            new URLSearchParams(
              "limit=25&offset=50",
            ),
          ),
        ).toEqual({
          ok: true,

          value: {
            limit: 25,
            offset: 50,
            status: null,
          },
        });
      },
    );

    it.each([
      "proposed",
      "confirmed",
      "executing",
      "executed",
      "stale",
      "failed",
      "cancelled",
    ])(
      "accepts status %s",
      (
        status,
      ) => {
        expect(
          parseActionCenterListQuery(
            new URLSearchParams({
              status,
            }),
          ),
        ).toEqual({
          ok: true,

          value: {
            limit: 50,
            offset: 0,
            status,
          },
        });
      },
    );

    it(
      "rejects unsupported status",
      () => {
        expect(
          parseActionCenterListQuery(
            new URLSearchParams(
              "status=unknown",
            ),
          ),
        ).toEqual({
          ok: false,

          error:
            "Status controlled action tidak didukung.",
        });
      },
    );

    it.each([
      "0",
      "101",
      "-1",
      "1.5",
      "abc",
    ])(
      "rejects invalid limit %s",
      (
        limit,
      ) => {
        expect(
          parseActionCenterListQuery(
            new URLSearchParams({
              limit,
            }),
          ).ok,
        ).toBe(
          false,
        );
      },
    );

    it.each([
      "-1",
      "10001",
      "1.5",
      "abc",
    ])(
      "rejects invalid offset %s",
      (
        offset,
      ) => {
        expect(
          parseActionCenterListQuery(
            new URLSearchParams({
              offset,
            }),
          ).ok,
        ).toBe(
          false,
        );
      },
    );

    it(
      "rejects unsupported query keys",
      () => {
        expect(
          parseActionCenterListQuery(
            new URLSearchParams(
              "limit=10&organizationId=abc",
            ),
          ),
        ).toEqual({
          ok: false,

          error:
            "Query parameter tidak didukung: organizationId.",
        });
      },
    );

    it.each([
      "limit=10&limit=20",
      "offset=0&offset=10",
      "status=proposed&status=failed",
    ])(
      "rejects duplicate parameters: %s",
      (
        query,
      ) => {
        expect(
          parseActionCenterListQuery(
            new URLSearchParams(
              query,
            ),
          ).ok,
        ).toBe(
          false,
        );
      },
    );
  },
);
