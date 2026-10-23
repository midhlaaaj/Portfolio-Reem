import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const localDb = /(127.0.0.1|localhost)/.test(process.env.DATABASE_URL ?? '');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Inline the (small) CSS into the HTML so it never blocks the first paint on a mobile connection.
  // The local PGlite stand-in takes one connection at a time, so build pages one by one. Neon builds in parallel.
  experimental: {
    inlineCss: true,
    // Admin pages revisited within 30s open instantly from the browser's cache; saves and refreshes invalidate it.
    staleTimes: { dynamic: 30, static: 300 },
    ...(localDb ? { cpus: 1, staticGenerationMaxConcurrency: 1 } : {}),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90],
    // Optimised images are keyed by content, so keep them for a month instead of re-checking every minute.
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/assets/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
      // Admin pages are never cached or indexed.
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};

export default nextConfig;
