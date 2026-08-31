import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildYouTubeAuthorizeUrl,
  issueYouTubeOAuthState,
  parseYouTubeOAuthTokenResponse,
  resolveYouTubeOAuthConfig,
  validateYouTubeOAuthState,
} from "./youtube-channel-oauth-server";

import {
  YOUTUBE_CHANNEL_IDENTITY_SCOPE,
  YOUTUBE_ENDPOINTS,
  YOUTUBE_REQUIRED_SCOPES,
  YOUTUBE_UPLOAD_SCOPE,
} from "./youtube-channel";

const stateSecret =
  Buffer.alloc(
    32,
    11,
  ).toString(
    "base64",
  );

const tokenKey =
  Buffer.alloc(
    32,
    13,
  ).toString(
    "base64",
  );

const validEnv = {
  YOUTUBE_OAUTH_CLIENT_ID:
    "youtube-client-id",
  YOUTUBE_OAUTH_CLIENT_SECRET:
    "youtube-client-secret",
  YOUTUBE_OAUTH_REDIRECT_URI:
    "https://lakuvo.com/api/ai/publishing-provider-connections/youtube/callback",
  PUBLISHING_PROVIDER_OAUTH_STATE_SECRET:
    stateSecret,
  PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_KEYS:
    JSON.stringify({
      v1:
        tokenKey,
    }),
  PUBLISHING_PROVIDER_TOKEN_ENCRYPTION_ACTIVE_VERSION:
    "v1",
};

describe(
  "YouTube OAuth server foundation",
  () => {
    it(
      "requests only upload plus channel-identity read scope with offline consent",
      () => {
        const value =
          buildYouTubeAuthorizeUrl(
            {
              clientId:
                "youtube-client-id",
              redirectUri:
                validEnv
                  .YOUTUBE_OAUTH_REDIRECT_URI,
              state:
                "youtube-state",
            },
          );

        expect(value).not.toBeNull();

        const url =
          new URL(
            value!,
          );

        expect(
          `${url.origin}${url.pathname}`,
        ).toBe(
          YOUTUBE_ENDPOINTS.authorize,
        );

        expect(
          url.searchParams.get(
            "response_type",
          ),
        ).toBe(
          "code",
        );

        expect(
          url.searchParams.get(
            "access_type",
          ),
        ).toBe(
          "offline",
        );

        expect(
          url.searchParams.get(
            "prompt",
          ),
        ).toBe(
          "consent",
        );

        expect(
          url.searchParams
            .get("scope")
            ?.split(" ")
            .sort(),
        ).toEqual(
          [...YOUTUBE_REQUIRED_SCOPES]
            .sort(),
        );

        expect(
          url.searchParams.get(
            "scope",
          ),
        ).toContain(
          YOUTUBE_UPLOAD_SCOPE,
        );

        expect(
          url.searchParams.get(
            "scope",
          ),
        ).toContain(
          YOUTUBE_CHANNEL_IDENTITY_SCOPE,
        );

        expect(
          url.searchParams.get(
            "scope",
          ),
        ).not.toContain(
          "https://www.googleapis.com/auth/youtube.force-ssl",
        );

        expect(
          url.searchParams.get(
            "scope",
          ),
        ).not.toMatch(
          /(?:^|\s)https:\/\/www\.googleapis\.com\/auth\/youtube(?:\s|$)/,
        );
      },
    );

    it(
      "issues and validates a user-and-organization-bound YouTube state",
      () => {
        const issued =
          issueYouTubeOAuthState(
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

        expect(
          validateYouTubeOAuthState(
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
          ).ok,
        ).toBe(true);
      },
    );

    it(
      "rejects a different callback organization",
      () => {
        const issued =
          issueYouTubeOAuthState(
            {
              initiatingUserId:
                "user-1",
              organizationId:
                "org-1",
              secret:
                stateSecret,
            },
          )!;

        expect(
          validateYouTubeOAuthState(
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
          ),
        ).toEqual({
          ok: false,
          code:
            "state_organization_mismatch",
        });
      },
    );

    it(
      "accepts a narrow Google token response with refresh token",
      () => {
        const result =
          parseYouTubeOAuthTokenResponse(
            {
              access_token:
                "access-secret",
              refresh_token:
                "refresh-secret",
              expires_in:
                3600,
              scope:
                YOUTUBE_REQUIRED_SCOPES.join(
                  " ",
                ),
              token_type:
                "Bearer",
            },
          );

        expect(result.ok).toBe(
          true,
        );
      },
    );

    it(
      "fails closed when channel identity scope is absent",
      () => {
        expect(
          parseYouTubeOAuthTokenResponse(
            {
              access_token:
                "access-secret",
              refresh_token:
                "refresh-secret",
              expires_in:
                3600,
              scope:
                YOUTUBE_UPLOAD_SCOPE,
              token_type:
                "Bearer",
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
      "fails closed when Google grants an unexpected broader scope",
      () => {
        expect(
          parseYouTubeOAuthTokenResponse(
            {
              access_token:
                "access-secret",
              refresh_token:
                "refresh-secret",
              expires_in:
                3600,
              scope:
                `${YOUTUBE_REQUIRED_SCOPES.join(
                  " ",
                )} https://www.googleapis.com/auth/youtube.force-ssl`,
              token_type:
                "Bearer",
            },
          ),
        ).toEqual({
          ok: false,
          code:
            "unexpected_scope_granted",
        });
      },
    );

    it(
      "requires a refresh token instead of persisting a non-refreshable connection",
      () => {
        expect(
          parseYouTubeOAuthTokenResponse(
            {
              access_token:
                "access-secret",
              expires_in:
                3600,
              scope:
                YOUTUBE_REQUIRED_SCOPES.join(
                  " ",
                ),
              token_type:
                "Bearer",
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
      "resolves dedicated YouTube OAuth config with shared publishing key material",
      () => {
        const config =
          resolveYouTubeOAuthConfig(
            validEnv,
          );

        expect(config).not.toBeNull();

        expect(
          config?.clientId,
        ).toBe(
          "youtube-client-id",
        );

        expect(
          config?.tokenKeyring
            .activeVersion,
        ).toBe(
          "v1",
        );
      },
    );
  },
);
