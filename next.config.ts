import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'admin.commons-hub.at', pathname: '/assets/**' },
      { protocol: 'https', hostname: 'zjddaiekqxxdejpcdbbp.supabase.co' },
      { protocol: 'https', hostname: 'api.commons-hub.at' },
      { protocol: 'http',  hostname: 'api.commons-hub.at' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
