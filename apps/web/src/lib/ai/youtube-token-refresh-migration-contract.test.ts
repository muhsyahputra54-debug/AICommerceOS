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

const migration =
  readFileSync(
    fileURLToPath(
      new URL(
        "../../../../../database/phase-19.1-youtube-token-refresh-readiness.sql",
        import.meta.url,
      ),
    ),
    "utf8",
  );

describe(
  "YouTube token refresh migration contract",
  () => {
    it(
      "keeps every refresh RPC service-role-only",
      () => {
        expect(migration).toContain(
          "service_role_required",
        );

        expect(migration).toContain(
          "get_publishing_provider_refresh_credentials",
        );

        expect(migration).toContain(
          "rotate_publishing_provider_access_token",
        );

        expect(migration).toContain(
          "mark_publishing_provider_reauthorization_required",
        );

        expect(migration).not.toMatch(
          /to\s+(?:anon|authenticated)\s*;/iu,
        );
      },
    );

    it(
      "uses optimistic version guards and preserves the refresh token",
      () => {
        expect(migration).toContain(
          "p_expected_connection_version",
        );

        expect(migration).toContain(
          "connection_refresh_conflict",
        );

        const rotationBody =
          migration.slice(
            migration.indexOf(
              "create or replace function public.rotate_publishing_provider_access_token",
            ),
            migration.indexOf(
              "create or replace function public.mark_publishing_provider_reauthorization_required",
            ),
          );

        expect(rotationBody).not.toMatch(
          /refresh_token_ciphertext\s*=/u,
        );
      },
    );

    it(
      "remains an unapplied draft with no publication operation",
      () => {
        expect(migration).toContain(
          "DRAFT ONLY. DO NOT APPLY",
        );

        expect(migration).not.toMatch(
          /\b(?:video_upload|publish_video|publication_executor)\b/iu,
        );
      },
    );
  },
);
