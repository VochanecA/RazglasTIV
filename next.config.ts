// Import the necessary Next.js types
import { NextConfig } from 'next';
import { Configuration } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: 'standalone',
  // Enable if you need to serve audio files
  webpack: (config: Configuration) => {
    config.module?.rules?.push({
      test: /\.(mp3)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name][ext]',
      },
    });
    return config;
  },
};

export default nextConfig;
