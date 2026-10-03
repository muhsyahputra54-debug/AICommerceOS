export type TikTokRefreshTarget = Readonly<{ connectionId: string; expectedConnectionVersion: number }>;
export type TikTokRefreshAvailability =
  | Readonly<{ status: "disabled" | "unavailable"; target: null }>
  | Readonly<{ status: "eligible"; target: TikTokRefreshTarget }>;
export type TikTokRefreshActionResult = "succeeded" | "reauthorization_required" | "recovery_required";
const API = "/api/ai/publishing-provider-connections/tiktok/refresh";
const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const validTarget = (v: unknown): v is TikTokRefreshTarget => record(v) && Object.keys(v).length === 2 &&
  typeof v.connectionId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.connectionId) &&
  typeof v.expectedConnectionVersion === "number" && Number.isSafeInteger(v.expectedConnectionVersion) &&
  v.expectedConnectionVersion > 0 && v.expectedConnectionVersion < Number.MAX_SAFE_INTEGER;
export function parseTikTokRefreshAvailability(value: unknown): TikTokRefreshAvailability | null {
  if (!record(value) || Object.keys(value).length !== 1 || !record(value.availability)) return null;
  const a = value.availability;
  if (Object.keys(a).length !== 2) return null;
  if ((a.status === "disabled" || a.status === "unavailable") && a.target === null) return { status: a.status, target: null };
  if (a.status === "eligible" && validTarget(a.target)) return { status: "eligible", target: {
    connectionId: a.target.connectionId, expectedConnectionVersion: a.target.expectedConnectionVersion,
  } };
  return null;
}
export async function loadTikTokRefreshAvailability(signal: AbortSignal, fetchImpl: typeof fetch = fetch) {
  try {
    const res = await fetchImpl(API, { method: "GET", cache: "no-store", credentials: "same-origin",
      headers: { Accept: "application/json" }, signal });
    if (!res.ok || signal.aborted) return null;
    const body: unknown = await res.json();
    return signal.aborted ? null : parseTikTokRefreshAvailability(body);
  } catch { return null; }
}
export type TikTokRefreshStorage = Pick<Storage, "getItem" | "setItem">;
export const tikTokRefreshLockKey = (target: TikTokRefreshTarget) => `lakuvo:tiktok-refresh:${target.connectionId}:${target.expectedConnectionVersion}`;
// Fail closed when storage cannot retain an uncertain request across page reloads.
export function isTikTokRefreshBlocked(target: TikTokRefreshTarget, storage: TikTokRefreshStorage): boolean {
  try { return storage.getItem(tikTokRefreshLockKey(target)) !== null; } catch { return true; }
}
export async function submitTikTokRefresh(target: TikTokRefreshTarget, consent: boolean,
  storage: TikTokRefreshStorage, fetchImpl: typeof fetch = fetch): Promise<TikTokRefreshActionResult> {
  if (!validTarget(target) || consent !== true || isTikTokRefreshBlocked(target, storage)) return "recovery_required";
  // Write before sending; retain for this version even after loss, reload, or success.
  try { storage.setItem(tikTokRefreshLockKey(target), "submitted"); }
  catch { return "recovery_required"; }
  try {
    const res = await fetchImpl(API, { method: "POST", cache: "no-store", credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...target, consent: true }) });
    const body: unknown = await res.json();
    if (res.status === 409 && record(body) && Object.keys(body).length === 1 && body.error === "reauthorization_required") return "reauthorization_required";
    if (!res.ok || !record(body) || Object.keys(body).length !== 1 || !record(body.refresh)) return "recovery_required";
    const r = body.refresh;
    if (Object.keys(r).length !== 2 || r.connectionVersion !== target.expectedConnectionVersion + 1 ||
        typeof r.accessTokenExpiresAt !== "string" || !Number.isFinite(Date.parse(r.accessTokenExpiresAt))) return "recovery_required";
    return "succeeded";
  } catch { return "recovery_required"; }
}
