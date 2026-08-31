import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";

const REQUIRED_ENVIRONMENT_KEYS = [
  "PUBLISHING_PROVIDER_OAUTH_STATE_SECRET",
  "PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_KEYS",
  "PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_ACTIVE_VERSION",
  "YOUTUBE_OAUTH_CLIENT_ID",
  "YOUTUBE_OAUTH_CLIENT_SECRET",
  "YOUTUBE_OAUTH_REDIRECT_URI",
] as const;

describe(
  "YouTube production environment contract",
  () => {
    const template =
      readFileSync(
        new URL(
          "../../../production.env.example",
          import.meta.url,
        ),
        "utf8",
      );

    it(
      "lists every required key exactly once without a value",
      () => {
        for (
          const key of
          REQUIRED_ENVIRONMENT_KEYS
        ) {
          const matches =
            template.match(
              new RegExp(
                `^${key}=$`,
                "gm",
              ),
            ) ?? [];

          expect(
            matches,
          ).toHaveLength(
            1,
          );
        }
      },
    );
  },
);