import type { NextConfig } from "next";
// Trigger Server Restart for Phase 27C.3

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

  // Docker: standalone output for minimal container image
  output: 'standalone',

  // Next.js 16: Acknowledge that webpack config is intentional
  // (Payload CMS 2.x requires webpack — see TC-1.2)
  turbopack: {},

  // ═══════════════════════════════════════════════════════════════════════
  // WEBPACK FORCED (TC-1.2 FIX)
  // 
  // Payload CMS 2.x has package.json exports incompatible with Turbopack.
  // Adding webpack config forces Next.js to use webpack instead of Turbopack.
  // Trade-off: Slower dev/build, but CMS functional.
  // ═══════════════════════════════════════════════════════════════════════
  webpack: (config, { isServer }) => {
    // Exclude Sharp from webpack bundling (binary files)
    if (isServer) {
      config.externals.push('sharp')
    }

    // Handle node: protocol imports (Node 16+ syntax)
    config.resolve = config.resolve || {}
    config.resolve.fallback = config.resolve.fallback || {}

    if (!isServer) {
      // Client-side: provide empty fallbacks
      Object.assign(config.resolve.fallback, {
        crypto: false,
        fs: false,
        path: false,
        stream: false,
      })
    }

    return config;
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CANONICAL ROUTE REDIRECTS
  // 
  // ALL routes redirect to /desktop (Single Desktop Architecture)
  // Apps are opened via ?app= query params
  // ═══════════════════════════════════════════════════════════════════════
  async redirects() {
    const commonRedirects = [
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

      // ─────────────────────────────────────────────────────────────────
      // AUTH ROUTE NORMALIZATION (P0 - FIX LOGIN)
      // ─────────────────────────────────────────────────────────────────

      // Legacy /login -> /en/login (Default)
      {
        source: '/login',
        destination: '/en/login',
        permanent: false, // 302 for now to allow future changes, change to 301 later
      },
      // /auth/login -> /en/login
      {
        source: '/auth/login',
        destination: '/en/login',
        permanent: true,
      },
      // /en/auth/login -> /en/login
      {
        source: '/en/auth/login',
        destination: '/en/login',
        permanent: true,
      },
      // /th/auth/login -> /th/login
      {
        source: '/th/auth/login',
        destination: '/th/login',
        permanent: true,
      },
    ];

    // ─────────────────────────────────────────────────────────────────
    // TRUST CENTER DOMAIN MIGRATION → synapsegovernance.com
    // TC-1.2: Redirect old Trust Center paths to new dedicated domain
    // ─────────────────────────────────────────────────────────────────

    // Prevent redirect loop: If we are ON the governance project, DO NOT redirect to ourselves.
    // We detect this via the API URL or Server URL set in Vercel Env Vars.
    const isGovernanceProject = process.env.NEXT_PUBLIC_API_URL === 'https://www.synapsegovernance.com';

    if (isGovernanceProject) {
      return commonRedirects;
    }

    // Otherwise (on apicoredata.com), redirect Trust Center paths to the new domain
    return [
      ...commonRedirects,
      // Trust home pages
      {
        source: '/en/trust',
        destination: 'https://www.synapsegovernance.com/en/trust',
        permanent: true,
      },
      {
        source: '/th/trust',
        destination: 'https://www.synapsegovernance.com/th/trust',
        permanent: true,
      },
      // Trust subpages
      {
        source: '/en/trust/:slug*',
        destination: 'https://www.synapsegovernance.com/en/trust/:slug*',
        permanent: true,
      },
      {
        source: '/th/trust/:slug*',
        destination: 'https://www.synapsegovernance.com/th/trust/:slug*',
        permanent: true,
      },
      // Legacy paths
      {
        source: '/trust',
        destination: 'https://www.synapsegovernance.com/en/trust', // Default to EN
        permanent: true,
      },
      {
        source: '/governance',
        destination: 'https://www.synapsegovernance.com/en/trust',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

