import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'martyx-industries.fra1.cdn.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fra1.digitaloceanspaces.com',
        port: '',
        pathname: '/martyx-industries/**',
      },
    ],
    // Unoptimized mode - images loaded directly from DO Spaces (no proxy)
    unoptimized: false,
    formats: ['image/webp'],
  },
  env: {
    API_BASE_URL: process.env.API_BASE_URL,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
  },
};

export default nextConfig;
