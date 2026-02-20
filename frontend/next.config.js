/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@intellicampus/shared'],
  // Suppress ESLint errors from blocking the Vercel build
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Proxy any /api/* call to the Express backend.
  // Set BACKEND_URL on Vercel (or any host) to point at your deployed backend.
  // Falls back to localhost:4000 for local development.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
