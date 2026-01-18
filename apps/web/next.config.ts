import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Disable strict mode that causes double renders
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable watch polling which might trigger continuous rebuilds
      config.watchOptions = {
        ...config.watchOptions,
        poll: false,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
