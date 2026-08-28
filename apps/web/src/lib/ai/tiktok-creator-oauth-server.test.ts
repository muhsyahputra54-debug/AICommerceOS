import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildTikTokCreatorAuthorizeUrl,
  encryptPublishingProviderToken,
  issueTikTokCreatorOAuthState,
  parsePublishingProviderTokenKeyring,
  parseTikTokCreatorTokenResponse,
  resolveTikTokCreatorOAuthConfig,
  TIKTOK_CREATOR_AUTHORIZE_ENDPOINT,
  TIKTOK_CREATOR_REQUIRED_SCOPE,
  validateTikTokCreatorOAuthState,
} from "./tiktok-creator-oauth-server";

const stateSecret =
  Buffer.alloc(
    32,
    7,
  ).toString(
    "base64",
  );

const tokenKey =
  Buffer.alloc(
    32,
    9,
  ).toString(
    "base64",
  );

const validEnv = {
  TIKTOK_CREATOR_CLIENT_KEY:
    "creator-client-key",
  TIKTOK_CREATOR_CLIENT_SECRET:
    "creator-client-secret",
  TIKTOK_CREATOR_REDIRECT_URI:
    "https://lakuvo.com/api/ai/publishing-provider-connections/tiktok/callback",
  PUBLISHING_PROVIDER_OAUTH_STATE_SECRET:
    stateSecret,
  PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_KEYS:
    JSON.stringify({
      v1: tokenKey,
    }),
  PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_ACTIVE_VERSION:
    "v1",
};

describe(
  "TikTok creator OAuth server foundation",
  () => {
    it(
      "builds the Web Login Kit authorization URL without seller identity fields",
      () => {
        const url =
          buildTikTokCreatorAuthorizeUrl(
            {
              clientKey:
                "creator-client-key",
              redirectUri:
                validEnv.TIKTOK_CREATOR_REDIRECT_URI,
              state:
                "creator-state",
            },
          );

        expect(url).not.toBeNull();

        const parsed =
          new URL(
            url!,
          );

        expect(
          `${parsed.origin}${parsed.pathname}`,
        ).toBe(
          TIKTOK_CREATOR_AUTHORIZE_ENDPOINT,
        );

        expect(
          parsed.searchParams.get(
            "client_key",
          ),
        ).toBe(
          "creator-client-key",
        );

        expect(
          parsed.searchParams.get(
            "response_type",
          ),
        ).toBe(
          "code",
        );

        expect(
          parsed.searchParams
            .get("scope")
            ?.split(","),
        ).toContain(
          TIKTOK_CREATOR_REQUIRED_SCOPE,
        );

        expect(
          parsed.searchParams.get(
            "state",
          ),
        ).toBe(
          "creator-state",
        );
      },
    );

    it(
      "issues and validates a user-and-organization-bound state envelope",
      () => {
        const issued =
          issueTikTokCreatorOAuthState(
            {
              initiatingUserId:
                "user-1",
              organizationId:
                "org-1",
              secret:
                stateSecret,
              nowMs:
                1_800_000_000_000,
            },
          );

        expect(issued).not.toBeNull();

        const validated =
          validateTikTokCreatorOAuthState(
            {
              cookieValue:
                issued!.cookieValue,
              returnedState:
                issued!.state,
              currentUserId:
                "user-1",
              currentOrganizationId:
                "org-1",
              secret:
                stateSecret,
              nowMs:
                1_800_000_100_000,
            },
          );

        expect(
          validated.ok,
        ).toBe(true);
      },
    );

    it(
      "rejects a modified signed state cookie",
      () => {
        const issued =
          issueTikTokCreatorOAuthState(
            {
              initiatingUserId:
                "user-1",
              organizationId:
                "org-1",
              secret:
                stateSecret,
            },
          )!;

        const parts =
          issued.cookieValue.split(
            ".",
          );

        const modified =
          `${parts[0]}A.${parts[1]}`;

        expect(
          validateTikTokCreatorOAuthState(
            {
              cookieValue:
                modified,
              returnedState:
                issued.state,
              currentUserId:
                "user-1",
              currentOrganizationId:
                "org-1",
              secret:
                stateSecret,
            },
          ).ok,
        ).toBe(false);
      },
    );

    it(
      "rejects provider state mismatch",
      () => {
        const issued =
          issueTikTokCreatorOAuthState(
            {
              initiatingUserId:
                "user-1",
              organizationId:
                "org-1",
              secret:
                stateSecret,
            },
          )!;

        const result =
          validateTikTokCreatorOAuthState(
            {
              cookieValue:
                issued.cookieValue,
              returnedState:
                "different-state",
              currentUserId:
                "user-1",
              currentOrganizationId:
                "org-1",
              secret:
                stateSecret,
            },
          );

        expect(result).toEqual({
          ok: false,
          code: "state_mismatch",
        });
      },
    );

    it(
      "rejects a different callback user",
      () => {
        const issued =
          issueTikTokCreatorOAuthState(
            {
              initiatingUserId:
                "user-1",
              organizationId:
                "org-1",
              secret:
                stateSecret,
            },
          )!;

        const result =
          validateTikTokCreatorOAuthState(
            {
              cookieValue:
                issued.cookieValue,
              returnedState:
                issued.state,
              currentUserId:
                "user-2",
              currentOrganizationId:
                "org-1",
              secret:
                stateSecret,
            },
          );

        expect(result).toEqual({
          ok: false,
          code: "state_user_mismatch",
        });
      },
    );

    it(
      "rejects a different callback organization",
      () => {
        const issued =
          issueTikTokCreatorOAuthState(
            {
              initiatingUserId:
                "user-1",
              organizationId:
                "org-1",
              secret:
                stateSecret,
            },
          )!;

        const result =
          validateTikTokCreatorOAuthState(
            {
              cookieValue:
                issued.cookieValue,
              returnedState:
                issued.state,
              currentUserId:
                "user-1",
              currentOrganizationId:
                "org-2",
              secret:
                stateSecret,
            },
          );

        expect(result).toEqual({
          ok: false,
          code:
            "state_organization_mismatch",
        });
      },
    );

    it(
      "rejects an expired OAuth state",
      () => {
        const issued =
          issueTikTokCreatorOAuthState(
            {
              initiatingUserId:
                "user-1",
              organizationId:
                "org-1",
              secret:
                stateSecret,
              nowMs:
                1_800_000_000_000,
            },
          )!;

        const result =
          validateTikTokCreatorOAuthState(
            {
              cookieValue:
                issued.cookieValue,
              returnedState:
                issued.state,
              currentUserId:
                "user-1",
              currentOrganizationId:
                "org-1",
              secret:
                stateSecret,
              nowMs:
                1_800_000_700_000,
            },
          );

        expect(result).toEqual({
          ok: false,
          code: "state_expired",
        });
      },
    );

    it(
      "accepts a valid TikTok token response only with video.publish",
      () => {
        const result =
          parseTikTokCreatorTokenResponse(
            {
              open_id:
                "creator-open-id",
              access_token:
                "access-secret",
              refresh_token:
                "refresh-secret",
              token_type:
                "Bearer",
              expires_in:
                86_400,
              refresh_expires_in:
                31_536_000,
              scope:
                "user.info.basic,video.publish",
            },
          );

        expect(result.ok).toBe(
          true,
        );

        if (result.ok) {
          expect(
            result.value.grantedScopes,
          ).toContain(
            "video.publish",
          );
        }
      },
    );

    it(
      "fails closed when video.publish was not granted",
      () => {
        expect(
          parseTikTokCreatorTokenResponse(
            {
              open_id:
                "creator-open-id",
              access_token:
                "access-secret",
              refresh_token:
                "refresh-secret",
              token_type:
                "Bearer",
              expires_in:
                86_400,
              refresh_expires_in:
                31_536_000,
              scope:
                "user.info.basic",
            },
          ),
        ).toEqual({
          ok: false,
          code:
            "required_scope_missing",
        });
      },
    );

    it(
      "rejects an invalid token type",
      () => {
        expect(
          parseTikTokCreatorTokenResponse(
            {
              open_id:
                "creator-open-id",
              access_token:
                "access-secret",
              refresh_token:
                "refresh-secret",
              token_type:
                "MAC",
              expires_in:
                86_400,
              refresh_expires_in:
                31_536_000,
              scope:
                "video.publish",
            },
          ),
        ).toEqual({
          ok: false,
          code:
            "token_response_invalid",
        });
      },
    );

    it(
      "parses a versioned 32-byte provider token keyring",
      () => {
        const keyring =
          parsePublishingProviderTokenKeyring(
            JSON.stringify({
              v1: tokenKey,
            }),
            "v1",
          );

        expect(
          keyring?.activeVersion,
        ).toBe(
          "v1",
        );

        expect(
          keyring?.keys.get(
            "v1",
          )?.length,
        ).toBe(
          32,
        );
      },
    );

    it(
      "rejects provider token keys that are not 32 bytes",
      () => {
        expect(
          parsePublishingProviderTokenKeyring(
            JSON.stringify({
              v1:
                Buffer.alloc(
                  16,
                  1,
                ).toString(
                  "base64",
                ),
            }),
            "v1",
          ),
        ).toBeNull();
      },
    );

    it(
      "encrypts provider tokens without exposing plaintext",
      () => {
        const keyring =
          parsePublishingProviderTokenKeyring(
            JSON.stringify({
              v1: tokenKey,
            }),
            "v1",
          )!;

        const encrypted =
          encryptPublishingProviderToken(
            {
              plaintext:
                "super-secret-access-token",
              provider:
                "tiktok",
              organizationId:
                "org-1",
              externalAccountId:
                "creator-open-id",
              tokenKind:
                "access",
              keyVersion:
                keyring.activeVersion,
              key:
                keyring.keys.get(
                  keyring.activeVersion,
                )!,
            },
          );

        expect(encrypted).not.toBeNull();
        expect(
          encrypted?.startsWith(
            "ppc1.v1.",
          ),
        ).toBe(true);
        expect(
          encrypted,
        ).not.toContain(
          "super-secret-access-token",
        );
      },
    );

    it(
      "resolves dedicated creator OAuth and provider-token configuration",
      () => {
        const config =
          resolveTikTokCreatorOAuthConfig(
            validEnv,
          );

        expect(config).not.toBeNull();

        expect(
          config?.clientKey,
        ).toBe(
          "creator-client-key",
        );

        expect(
          config?.tokenKeyring.activeVersion,
        ).toBe(
          "v1",
        );
      },
    );

    it(
      "does not fall back to seller credential configuration",
      () => {
        const config =
          resolveTikTokCreatorOAuthConfig(
            {
              MARKETPLACE_TOKEN_ENCRYPTION_KEY:
                tokenKey,
            },
          );

        expect(config).toBeNull();
      },
    );
  },
);