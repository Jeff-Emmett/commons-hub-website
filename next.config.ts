import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Images are served by Directus. Allow whichever instance this build points at
// (staging uses its own), in addition to production.
const directusAssets = (() => {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://admin.commons-hub.at");
    return {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/assets/**",
    };
  } catch {
    return null;
  }
})();

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
      { source: "/page/about", destination: "/about", permanent: true },
      { source: "/booking/stay", destination: "/accommodation", permanent: true },
      { source: "/booking/event-hosting", destination: "/event-venue", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'admin.commons-hub.at', pathname: '/assets/**' },
      { protocol: 'http',  hostname: 'localhost' },
      ...(directusAssets ? [directusAssets] : []),
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 2678400,
  },
};

export default withNextIntl(nextConfig);
