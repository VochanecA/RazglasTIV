import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    domains: ['www.flightaware.com', 'via.placeholder.com'],
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;