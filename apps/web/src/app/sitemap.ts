import type {
  MetadataRoute,
} from "next";

import {
  blogArticles,
} from "@/lib/blog/articles";

const baseUrl =
  "https://lakuvo.com";

export default function sitemap():
  MetadataRoute.Sitemap {
  const staticPages:
    MetadataRoute.Sitemap =
    [
      {
        url:
          `${baseUrl}/`,
      },
      {
        url:
          `${baseUrl}/pricing`,
      },
      {
        url:
          `${baseUrl}/terms`,
      },
      {
        url:
          `${baseUrl}/privacy`,
      },
      {
        url:
          `${baseUrl}/refund-policy`,
      },
      {
        url:
          `${baseUrl}/contact`,
      },
      {
        url:
          `${baseUrl}/blog`,
      },
    ];

  const articlePages:
    MetadataRoute.Sitemap =
    blogArticles.map(
      (article) => ({
        url:
          `${baseUrl}/blog/${article.slug}`,
        lastModified:
          article.updatedAt,
      }),
    );

  return [
    ...staticPages,
    ...articlePages,
  ];
}