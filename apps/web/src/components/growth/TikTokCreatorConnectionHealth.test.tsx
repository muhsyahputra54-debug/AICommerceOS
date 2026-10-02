import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TikTokCreatorConnectionHealthView, type TikTokHealthView } from "./TikTokCreatorConnectionHealth";
import type { Locale } from "@/lib/i18n/config";
import type { TikTokConnectionMetadataStatus } from "@/lib/ai/tiktok-creator-connection-health";

function render(view: TikTokHealthView, locale: Locale = "id") {
  return renderToStaticMarkup(createElement(TikTokCreatorConnectionHealthView, {
    view, locale, onRefresh: () => {},
  }));
}
function loaded(status: TikTokConnectionMetadataStatus): TikTokHealthView {
  return { kind: "loaded", health: {
    status, checkedAt: "2026-10-02T12:00:00.000Z", expiresAt: "2026-10-03T12:00:00.000Z",
    providerVerified: false, credentialVerified: false,
  } };
}

describe("TikTok connection health dashboard markup", () => {
  it.each(["id", "en"] as const)("shows unverified metadata and check time (%s)", (locale) => {
    const html = render(loaded("metadata_ready_unverified"), locale);
    expect(html).toContain(locale === "id" ? "belum diperiksa ke TikTok" : "has not been checked with TikTok");
    expect(html).toContain('role="status"');
    expect(html).toContain('dateTime="2026-10-02T12:00:00.000Z"');
    expect(html).toContain("UTC");
    expect(html).not.toContain("emerald");
    expect(html).not.toContain("href=");
  });

  it("warns about expired access and points to reconnection", () => {
    const html = render(loaded("access_token_expired"));
    expect(html).toContain("Akses kedaluwarsa");
    expect(html).toContain("Hubungkan ulang");
    expect(html).toContain("text-amber-700");
  });

  it("disables checking while loading", () => {
    const html = render({ kind: "loading" });
    expect(html).toContain("Memeriksa metadata koneksi");
    expect(html).toContain('disabled=""');
    expect(html).not.toContain("<time");
  });

  it("offers a check button and accessible error without claiming disconnection", () => {
    const html = render({ kind: "load_error" });
    expect(html).toContain('role="alert"');
    expect(html).toContain("Periksa ulang koneksi");
    expect(html).not.toContain("Belum terhubung");
    expect(html).not.toContain('disabled=""');
  });

  it("shows missing expiry without an expiry timestamp", () => {
    const view = loaded("expiry_unknown");
    if (view.kind !== "loaded") throw new Error("Invalid fixture");
    const html = render({ ...view, health: { ...view.health, expiresAt: null } });
    expect(html).toContain("Masa berlaku belum diketahui");
    expect(html).not.toContain("Akses berlaku hingga");
  });
});
