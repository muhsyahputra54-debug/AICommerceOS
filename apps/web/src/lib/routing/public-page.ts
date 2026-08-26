const publicMarketingPaths =
  new Set([
    "/",
    "/pricing",
    "/terms",
    "/privacy",
    "/refund-policy",
    "/contact",
  ]);

export function isPublicMarketingPath(
  pathname: string,
) {
  return publicMarketingPaths.has(
    pathname,
  );
}
