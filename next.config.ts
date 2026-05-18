import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async redirects() {
    // Dedupe: nav links (/page/<slug>) and home tiles must land on the
    // single dedicated page for each section.
    return [
      { source: "/page/accommodation", destination: "/accommodation", permanent: true },
      { source: "/page/venue", destination: "/event-venue", permanent: true },
      { source: "/page/events", destination: "/events", permanent: true },
      { source: "/booking/stay", destination: "/accommodation", permanent: true },
      { source: "/booking/event-hosting", destination: "/event-venue", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'admin.commons-hub.at', pathname: '/assets/**' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
