import type { NextConfig } from "next";

const baseSecurityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const productionSecurityHeaders =
  process.env.NODE_ENV === "production"
    ? [
        ...baseSecurityHeaders,
        {
          key: "Strict-Transport-Security",
          value:
            "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : baseSecurityHeaders;

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers:
          productionSecurityHeaders,
      },
    ];
  },
};

export default nextConfig;
