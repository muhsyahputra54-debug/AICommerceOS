import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TikTokCreatorRefreshView, type TikTokRefreshView } from "./TikTokCreatorRefreshPanel";
function render(view: TikTokRefreshView, consent = false, locale: "id" | "en" = "id") {
  return renderToStaticMarkup(createElement(TikTokCreatorRefreshView, { view, consent, locale,
    onConsent: () => {}, onSubmit: () => {}, onCheck: () => {} }));
}
describe("TikTok access renewal dashboard", () => {
  it("requires unchecked explicit consent by default", () => {
    const html = render("eligible");
    expect(html).toContain('type="checkbox"'); expect(html).not.toContain('checked=""');
    expect(html).toContain('disabled=""'); expect(html).toContain("Saya menyetujui");
  });
  it("enables deliberate submission only with consent", () => {
    expect(render("eligible", true)).toContain('checked=""');
    expect(render("eligible", true)).not.toContain('disabled=""');
  });
  it.each(["disabled", "unavailable", "busy", "succeeded", "reauthorization_required", "recovery_required"] as const)("no submission control in %s", (view) => {
    const html = render(view); expect(html).not.toContain('type="checkbox"');
    expect(html).not.toContain("Perbarui akses TikTok");
  });
  it.each(["id", "en"] as const)("explains uncertainty without retry (%s)", (locale) => {
    const html = render("recovery_required", false, locale);
    expect(html).toContain('role="alert"'); expect(html).not.toContain("<button");
    expect(html).toContain(locale === "id" ? "Jangan ulangi permintaan" : "Do not repeat the request");
  });
  it("availability check is separate from token renewal", () => {
    expect(render("load_error")).toContain("Periksa ketersediaan");
    expect(render("load_error")).not.toContain('type="checkbox"');
  });
});
