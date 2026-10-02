"use client";

import { useEffect, useState } from "react";
import { loadTikTokConnectionHealth, tikTokConnectionHealthCopy } from "@/lib/ai/tiktok-creator-connection-health-client";
import type { TikTokConnectionMetadataHealth } from "@/lib/ai/tiktok-creator-connection-health";
import type { Locale } from "@/lib/i18n/config";

export type TikTokHealthView =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "load_error" }>
  | Readonly<{ kind: "loaded"; health: TikTokConnectionMetadataHealth }>;

export function TikTokCreatorConnectionHealthView({ view, locale, onRefresh }: Readonly<{
  view: TikTokHealthView; locale: Locale; onRefresh: () => void;
}>) {
  const isId = locale === "id";
  const copy = view.kind === "loaded" ? tikTokConnectionHealthCopy(view.health.status, isId) : null;
  const title = copy?.title ?? (view.kind === "loading"
    ? (isId ? "Memeriksa metadata koneksi..." : "Checking connection metadata...")
    : (isId ? "Kesehatan koneksi belum dapat dimuat" : "Connection health could not be loaded"));
  const detail = copy?.detail ?? (view.kind === "load_error"
    ? (isId ? "Coba periksa ulang. Jika tetap gagal, minta pengelola memeriksa akses Anda." : "Check again. If it still fails, ask an administrator to check your access.")
    : null);
  const warning = copy?.warning || view.kind === "load_error";
  const dateFormat = new Intl.DateTimeFormat(isId ? "id-ID" : "en-GB", {
    dateStyle: "medium", timeStyle: "short", timeZone: "UTC",
  });

  return (
    <div className="mt-4 rounded-xl border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold">{isId ? "Kesehatan koneksi" : "Connection health"}</h3>
      <div role={view.kind === "load_error" ? "alert" : "status"} aria-live="polite" aria-atomic="true" className="mt-2">
        <p className={warning ? "text-sm font-medium text-amber-700 dark:text-amber-400" : "text-sm font-medium"}>{title}</p>
        {detail ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p> : null}
        {view.kind === "loaded" ? (
          <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div><dt className="inline">{isId ? "Diperiksa" : "Checked"}: </dt><dd className="inline"><time dateTime={view.health.checkedAt}>{dateFormat.format(new Date(view.health.checkedAt))} UTC</time></dd></div>
            {view.health.expiresAt ? <div><dt className="inline">{isId ? "Akses berlaku hingga" : "Access expires"}: </dt><dd className="inline"><time dateTime={view.health.expiresAt}>{dateFormat.format(new Date(view.health.expiresAt))} UTC</time></dd></div> : null}
          </dl>
        ) : null}
      </div>
      <button type="button" onClick={onRefresh} disabled={view.kind === "loading"}
        className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:cursor-wait disabled:opacity-60">
        {isId ? "Periksa ulang koneksi" : "Check connection again"}
      </button>
    </div>
  );
}

export default function TikTokCreatorConnectionHealth({ locale }: Readonly<{ locale: Locale }>) {
  const [view, setView] = useState<TikTokHealthView>({ kind: "loading" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const health = await loadTikTokConnectionHealth(controller.signal);
      if (!controller.signal.aborted) setView(health ? { kind: "loaded", health } : { kind: "load_error" });
    }
    void load();
    return () => controller.abort();
  }, [revision]);

  function refresh() {
    setView({ kind: "loading" });
    setRevision((value) => value + 1);
  }
  return <TikTokCreatorConnectionHealthView view={view} locale={locale} onRefresh={refresh} />;
}
