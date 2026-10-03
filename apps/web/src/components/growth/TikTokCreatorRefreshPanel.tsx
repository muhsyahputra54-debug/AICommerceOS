"use client";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { isTikTokRefreshBlocked, loadTikTokRefreshAvailability, submitTikTokRefresh,
  type TikTokRefreshAvailability, type TikTokRefreshActionResult } from "@/lib/ai/tiktok-creator-refresh-client";
export type TikTokRefreshView = "loading" | "load_error" | "disabled" | "unavailable" | "eligible" | "busy" | TikTokRefreshActionResult;
export function TikTokCreatorRefreshView({ view, consent, locale, onConsent, onSubmit, onCheck }: Readonly<{
  view: TikTokRefreshView; consent: boolean; locale: Locale; onConsent: (value: boolean) => void;
  onSubmit: () => void; onCheck: () => void;
}>) {
  const id = locale === "id";
  const message: Record<TikTokRefreshView, string> = {
    loading: id ? "Memeriksa ketersediaan pembaruan akses..." : "Checking access renewal availability...",
    load_error: id ? "Ketersediaan pembaruan akses belum dapat dimuat." : "Access renewal availability could not be loaded.",
    disabled: id ? "Pembaruan akses belum tersedia. Hubungkan ulang bila akses kedaluwarsa." : "Access renewal is unavailable. Reconnect if access expires.",
    unavailable: id ? "Pembaruan akses belum diperlukan atau koneksi perlu diperiksa." : "Access renewal is not needed yet or the connection needs review.",
    eligible: id ? "Akses kedaluwarsa atau segera kedaluwarsa. Anda dapat meminta pembaruan akses." : "Access has expired or expires soon. You can request access renewal.",
    busy: id ? "Memperbarui akses TikTok. Tunggu hasilnya." : "Renewing TikTok access. Please wait for the result.",
    succeeded: id ? "Akses berhasil diperbarui. Periksa ulang kesehatan koneksi." : "Access renewed. Check connection health again.",
    reauthorization_required: id ? "TikTok meminta otorisasi ulang. Gunakan Hubungkan ulang TikTok." : "TikTok requires reauthorization. Use Reconnect TikTok.",
    recovery_required: id ? "Hasil pembaruan belum dapat dipastikan. Jangan ulangi permintaan; hubungkan ulang atau minta pengelola memeriksa koneksi." : "The renewal result cannot be confirmed. Do not repeat the request; reconnect or ask an administrator to review the connection.",
  };
  return <div className="mt-3 rounded-xl border p-4">
    <h3 className="text-sm font-semibold">{id ? "Pembaruan akses TikTok" : "TikTok access renewal"}</h3>
    <p role={view === "load_error" || view === "recovery_required" ? "alert" : "status"} aria-live="polite" className="mt-2 text-xs leading-5 text-muted-foreground">{message[view]}</p>
    {view === "eligible" ? <>
      <label className="mt-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={consent} onChange={(e) => onConsent(e.target.checked)} />
        {id ? "Saya menyetujui pembaruan akses akun TikTok ini." : "I approve renewing access for this TikTok account."}</label>
      <button type="button" onClick={onSubmit} disabled={!consent} className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">{id ? "Perbarui akses TikTok" : "Renew TikTok access"}</button>
    </> : null}
    {view === "load_error" || view === "unavailable" ? <button type="button" onClick={onCheck} className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold">{id ? "Periksa ketersediaan" : "Check availability"}</button> : null}
  </div>;
}
export default function TikTokCreatorRefreshPanel({ locale }: Readonly<{ locale: Locale }>) {
  const [view, setView] = useState<TikTokRefreshView>("loading");
  const [availability, setAvailability] = useState<TikTokRefreshAvailability | null>(null);
  const [consent, setConsent] = useState(false);
  const [revision, setRevision] = useState(0);
  const locked = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void loadTikTokRefreshAvailability(controller.signal).then((value) => {
      if (controller.signal.aborted) return;
      setAvailability(value); setConsent(false);
      if (!value) { setView("load_error"); return; }
      if (value.status === "eligible") {
        let blocked = true;
        try { blocked = isTikTokRefreshBlocked(value.target, window.sessionStorage); } catch { /* Fail closed. */ }
        setView(blocked ? "recovery_required" : "eligible");
      } else setView(value.status);
    });
    return () => controller.abort();
  }, [revision]);
  async function submit() {
    if (locked.current || view !== "eligible" || !consent || availability?.status !== "eligible") return;
    locked.current = true; setView("busy"); setConsent(false);
    let result: TikTokRefreshActionResult = "recovery_required";
    try { result = await submitTikTokRefresh(availability.target, true, window.sessionStorage); } catch { /* Never replay. */ }
    if (mounted.current) setView(result);
  }
  function check() { if (locked.current) return; setView("loading"); setRevision((n) => n + 1); }
  return <TikTokCreatorRefreshView view={view} consent={consent} locale={locale} onConsent={setConsent} onSubmit={() => { void submit(); }} onCheck={check} />;
}
