import type {
  MetadataRoute,
} from "next";

export default function robots():
  MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/today",
        "/products",
        "/orders",
        "/customers",
        "/inventory",
        "/suppliers",
        "/marketplaces",
        "/billing",
        "/settings",
        "/analytics",
        "/automations",
        "/login",
        "/signup",
      ],
    },
    sitemap:
      "https://lakuvo.com/sitemap.xml",
    host:
      "https://lakuvo.com",
  };
}