/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://images.unsplash.com https://ui-avatars.com https://*.supabase.co;
  frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://*.sentry.io https://o*.ingest.sentry.io;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`;

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",  value: "off" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options",          value: "DENY" },
  { key: "X-Content-Type-Options",   value: "nosniff" },
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key:   "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim(),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps in CI/production only
  silent:          true,
  hideSourceMaps:  true,
  disableLogger:   true,
  // Automatically instrument Next.js data fetching methods and API routes
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware:      true,
});
