import {
  describe,
  expect,
  it,
} from "vitest";

import {
  blogArticles,
  getBlogArticle,
} from "./articles";

describe(
  "LAKUVO blog articles",
  () => {
    it(
      "ships the ten starter articles",
      () => {
        expect(
          blogArticles,
        ).toHaveLength(
          10,
        );
      },
    );

    it(
      "uses unique slugs",
      () => {
        const slugs =
          blogArticles.map(
            (article) =>
              article.slug,
          );

        expect(
          new Set(
            slugs,
          ).size,
        ).toBe(
          slugs.length,
        );
      },
    );

    it(
      "has publishable article content",
      () => {
        for (
          const article of
          blogArticles
        ) {
          expect(
            article.slug.length,
          ).toBeGreaterThan(
            5,
          );

          expect(
            article.title.length,
          ).toBeGreaterThan(
            10,
          );

          expect(
            article.description.length,
          ).toBeGreaterThan(
            30,
          );

          expect(
            article.sections.length,
          ).toBeGreaterThanOrEqual(
            3,
          );
        }
      },
    );

    it(
      "resolves articles by slug",
      () => {
        const first =
          blogArticles[0];

        expect(
          getBlogArticle(
            first.slug,
          ),
        ).toBe(
          first,
        );

        expect(
          getBlogArticle(
            "not-found",
          ),
        ).toBeNull();
      },
    );
  },
);