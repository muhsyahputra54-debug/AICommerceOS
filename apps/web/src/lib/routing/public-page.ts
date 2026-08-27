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
    "/blog",
  ]);

export function isPublicMarketingPath(
  pathname: string,
) {
  if (
    publicMarketingPaths.has(
      pathname,
    )
  ) {
    return true;
  }

  return pathname.startsWith(
    "/blog/",
  );
}