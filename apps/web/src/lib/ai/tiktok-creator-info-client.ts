import { parseTikTokCreatorInfoApiResponse } from "./tiktok-creator-direct-post-ui";
import { parseTikTokCreatorInfoFailure, type TikTokCreatorInfoFailure } from "./tiktok-creator-info-error";
import type { TikTokCreatorInfoSnapshot } from "./tiktok-creator-publishing";

export async function loadTikTokCreatorInfo(
  fetchImpl: typeof fetch = fetch,
): Promise<Readonly<{ ok: true; value: TikTokCreatorInfoSnapshot }> | Readonly<{ ok: false; failure: TikTokCreatorInfoFailure }>> {
  let response: Response;
  try {
    response = await fetchImpl("/api/ai/publishing-provider-connections/tiktok/creator-info", {
      method: "GET", cache: "no-store", credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
  } catch {
    return { ok: false, failure: { code: "creator_info_request_failed" } };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, failure: response.ok
      ? { code: "creator_info_response_invalid" }
      : parseTikTokCreatorInfoFailure(null, response.status) };
  }
  if (!response.ok) {
    return { ok: false, failure: parseTikTokCreatorInfoFailure(body, response.status) };
  }
  const parsed = parseTikTokCreatorInfoApiResponse(body);
  return parsed.ok ? parsed : { ok: false, failure: { code: "creator_info_response_invalid" } };
}
