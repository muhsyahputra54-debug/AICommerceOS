const publicMarketingPaths =
  new Set([
    "/",
    "/pricing",
    "/terms",
    "/privacy",
    "/refund-policy",
    "/contact",
    "/robots.txt",
    "/sitemap.xml",
    "/google26f071f25ac7bb17.html",
  ]);

export function isPublicMarketingPath(
  pathname: string,
) {
  return publicMarketingPaths.has(
    pathname,
  );
}
