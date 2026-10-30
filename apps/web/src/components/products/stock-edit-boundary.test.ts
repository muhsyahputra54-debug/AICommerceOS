import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const componentsDir = join(process.cwd(), "src", "components", "products");

const forms = [
  { file: "EditProductForm.tsx", table: "products", requiresProductFilter: false },
  { file: "EditProductVariantForm.tsx", table: "product_variants", requiresProductFilter: true },
] as const;

for (const { file, table, requiresProductFilter } of forms) {
  describe(`${file} inventory editing boundary`, () => {
    const source = readFileSync(join(componentsDir, file), "utf8");
    const updateStart = source.indexOf(`.from("${table}")`);
    const updateSection = updateStart >= 0 ? source.slice(updateStart) : "";
    const updatePayload = /\.update\(\{([\s\S]*?)\}\)/.exec(updateSection)?.[1];

    it("does not send stock in the metadata update", () => {
      expect(updateStart).toBeGreaterThanOrEqual(0);
      expect(updatePayload).toBeDefined();
      expect(updatePayload).not.toMatch(/\bstock\s*:/);
      expect(updatePayload).not.toMatch(/(?:^|,)\s*stock\s*(?:,|$)/m);
    });

    it("does not read or validate stock on form submit", () => {
      expect(source).not.toMatch(/formData\.get\(["']stock["']\)/);
      expect(source).not.toMatch(/Number\.isInteger\(stock\)/);
    });

    it("renders the stock input as read-only and excludes it from FormData", () => {
      const stockInput = [...source.matchAll(/<Input\b([\s\S]*?)\/>/g)]
        .map((match) => match[1])
        .find((props) => /\bid=["']stock["']/.test(props));
      expect(stockInput).toBeDefined();
      expect(stockInput).toMatch(/\breadOnly\b/);
      expect(stockInput).not.toMatch(/\bname=["']stock["']/);
    });

    it("keeps organization-scoped metadata updates", () => {
      expect(updateSection).toMatch(/\.eq\(\s*["']organization_id["']/);
      if (requiresProductFilter) {
        expect(updateSection).toMatch(/\.eq\(\s*["']product_id["']/);
      }
    });
  });
}
