/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // Unoptimized mode - images loaded directly from DO Spaces (no Next.js proxy)
    // This prevents high CPU/egress costs on DO App Platform
    unoptimized: true,
  },
  env: {
    API_BASE_URL: process.env.API_BASE_URL,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
  },
};

export default nextConfig;
