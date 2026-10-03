import { describe, expect, it, vi } from "vitest";
import { isTikTokRefreshBlocked, loadTikTokRefreshAvailability, parseTikTokRefreshAvailability,
  submitTikTokRefresh, tikTokRefreshLockKey } from "./tiktok-creator-refresh-client";
const target = { connectionId: "11111111-1111-4111-8111-111111111111", expectedConnectionVersion: 7 };
const eligible = { availability: { status: "eligible", target } };
const response = { refresh: { connectionVersion: 8, accessTokenExpiresAt: "2026-10-04T15:00:00Z" } };
const transport = (body: unknown, status = 200) => vi.fn<typeof fetch>(async () => Response.json(body, { status }));
function storage() { const values = new Map<string, string>(); return {
  getItem: vi.fn((key: string) => values.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
}; }
describe("TikTok refresh client", () => {
  it("reads availability with GET only", async () => {
    const f = transport(eligible);
    expect(await loadTikTokRefreshAvailability(new AbortController().signal, f)).toEqual(eligible.availability);
    expect(f).toHaveBeenCalledOnce(); expect(f.mock.calls[0][1]).toMatchObject({ method: "GET", cache: "no-store", credentials: "same-origin" });
  });
  it.each(["disabled", "unavailable"])("parses %s without target", (status) => {
    expect(parseTikTokRefreshAvailability({ availability: { status, target: null } })).toEqual({ status, target: null });
  });
  it.each([{}, { ...eligible, secret: "private" }, { availability: { status: "eligible", target: null } },
    { availability: { status: "disabled", target } }, { availability: { status: "eligible", target: { ...target, ciphertext: "private" } } },
    { availability: { status: "eligible", target: { ...target, expectedConnectionVersion: "7" } } }])("rejects invalid or secret-bearing availability %j", (body) => {
    expect(parseTikTokRefreshAvailability(body)).toBeNull();
  });
  it("does not retain aborted availability", async () => {
    const c = new AbortController(); c.abort();
    expect(await loadTikTokRefreshAvailability(c.signal, transport(eligible))).toBeNull();
  });
  it("requires explicit consent before writing/sending", async () => {
    const s = storage(), f = transport(response);
    expect(await submitTikTokRefresh(target, false, s, f)).toBe("recovery_required");
    expect(f).not.toHaveBeenCalled(); expect(s.setItem).not.toHaveBeenCalled();
  });
  it("records ownership before one POST and retains lock across reload", async () => {
    const s = storage();
    const f = vi.fn<typeof fetch>(async (_url, init) => {
      expect(s.getItem(tikTokRefreshLockKey(target))).toBe("submitted");
      expect(init).toMatchObject({ method: "POST", credentials: "same-origin", cache: "no-store" });
      expect(JSON.parse(init!.body as string)).toEqual({ ...target, consent: true });
      return Response.json(response);
    });
    expect(await submitTikTokRefresh(target, true, s, f)).toBe("succeeded");
    expect(await submitTikTokRefresh(target, true, s, f)).toBe("recovery_required");
    expect(f).toHaveBeenCalledOnce();
    expect(isTikTokRefreshBlocked(target, s)).toBe(true);
    expect(isTikTokRefreshBlocked({ ...target, expectedConnectionVersion: 8 }, s)).toBe(false);
  });
  it("prevents concurrent calls for the same version", async () => {
    const s = storage(), f = transport(response);
    expect(await Promise.all([submitTikTokRefresh(target, true, s, f), submitTikTokRefresh(target, true, s, f)]))
      .toEqual(["succeeded", "recovery_required"]);
    expect(f).toHaveBeenCalledOnce();
  });
  it.each(["read", "write"])("fails closed when storage %s fails", async (kind) => {
    const s = storage(), f = transport(response);
    if (kind === "read") s.getItem.mockImplementation(() => { throw new Error("storage denied"); });
    else s.setItem.mockImplementation(() => { throw new Error("storage denied"); });
    expect(await submitTikTokRefresh(target, true, s, f)).toBe("recovery_required"); expect(f).not.toHaveBeenCalled();
  });
  it.each([{ body: { error: "reauthorization_required" }, status: 409, expected: "reauthorization_required" },
    { body: { error: "refresh_disabled" }, status: 403, expected: "recovery_required" },
    { body: response, status: 503, expected: "recovery_required" },
    { body: { refresh: { ...response.refresh, connectionVersion: 9 } }, status: 200, expected: "recovery_required" },
    { body: { refresh: { ...response.refresh, accessToken: "private" } }, status: 200, expected: "recovery_required" }])("never replays uncertain/rejected/malformed results %j", async ({ body, status, expected }) => {
    const s = storage(), f = transport(body, status);
    expect(await submitTikTokRefresh(target, true, s, f)).toBe(expected);
    expect(await submitTikTokRefresh(target, true, s, f)).toBe("recovery_required"); expect(f).toHaveBeenCalledOnce();
  });
  it("network failure retains recovery lock without retry", async () => {
    const s = storage(), f = vi.fn<typeof fetch>(async () => { throw new Error("private-token"); });
    expect(await submitTikTokRefresh(target, true, s, f)).toBe("recovery_required");
    expect(isTikTokRefreshBlocked(target, s)).toBe(true); expect(f).toHaveBeenCalledOnce();
  });
});
