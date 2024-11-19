import type { NextConfig } from 'next';

const nextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    domains: ['www.flightaware.com', 'via.placeholder.com'],
    unoptimized: true,
  },
  reactStrictMode: true,
/*   env: {
    NEXT_PUBLIC_VERCEL_BUILD_TIME: process.env.VERCEL_BUILD_TIME || "Unknown",
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "Unknown",
  }, */
};

export default nextConfig;