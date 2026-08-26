import type {
  MetadataRoute,
} from "next";

const baseUrl =
  "https://lakuvo.com";

export default function sitemap():
  MetadataRoute.Sitemap {
  return [
    {
      url: `${baseUrl}/`,
    },
    {
      url: `${baseUrl}/pricing`,
    },
    {
      url: `${baseUrl}/terms`,
    },
    {
      url: `${baseUrl}/privacy`,
    },
    {
      url: `${baseUrl}/refund-policy`,
    },
    {
      url: `${baseUrl}/contact`,
    },
  ];
}