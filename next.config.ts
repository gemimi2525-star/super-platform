import type { NextConfig } from "next";

/**
 * APICOREDATA OS — Next.js Configuration
 * 
 * PHASE 8.0: OS Single-Desktop Restructure
 * 
 * All legacy routes redirect to the canonical /desktop route.
 */

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,

  // ═══════════════════════════════════════════════════════════════════════
  // CANONICAL ROUTE REDIRECTS
  // 
  // ALL routes redirect to /desktop (Single Desktop Architecture)
  // Apps are opened via ?app= query params
  // ═══════════════════════════════════════════════════════════════════════
  async redirects() {
    return [
      // ─────────────────────────────────────────────────────────────────
      // ROOT ROUTES → /desktop
      // ─────────────────────────────────────────────────────────────────

      // /en/v2 → /en/desktop
      {
        source: '/en/v2',
        destination: '/en/desktop',
        permanent: true,
      },
      // /th/v2 → /th/desktop
      {
        source: '/th/v2',
        destination: '/th/desktop',
        permanent: true,
      },
      // /en/home → /en/desktop
      {
        source: '/en/home',
        destination: '/en/desktop',
        permanent: true,
      },
      // /th/home → /th/desktop
      {
        source: '/th/home',
        destination: '/th/desktop',
        permanent: true,
      },

      // ─────────────────────────────────────────────────────────────────
      // APP ROUTES → /desktop?app=...
      // ─────────────────────────────────────────────────────────────────

      // Users
      {
        source: '/en/v2/users',
        destination: '/en/desktop?app=users',
        permanent: true,
      },
      {
        source: '/th/v2/users',
        destination: '/th/desktop?app=users',
        permanent: true,
      },

      // Organizations
      {
        source: '/en/v2/orgs',
        destination: '/en/desktop?app=orgs',
        permanent: true,
      },
      {
        source: '/th/v2/orgs',
        destination: '/th/desktop?app=orgs',
        permanent: true,
      },

      // Audit Logs
      {
        source: '/en/v2/audit-logs',
        destination: '/en/desktop?app=audit-logs',
        permanent: true,
      },
      {
        source: '/th/v2/audit-logs',
        destination: '/th/desktop?app=audit-logs',
        permanent: true,
      },

      // Settings
      {
        source: '/en/v2/settings',
        destination: '/en/desktop?app=settings',
        permanent: true,
      },
      {
        source: '/th/v2/settings',
        destination: '/th/desktop?app=settings',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

