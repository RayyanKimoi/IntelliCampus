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
    // Only proxy to backend when BACKEND_URL is explicitly set.
    // Without it (e.g. Vercel demo deploy), all /api/* requests are handled
    // by Next.js route handlers in src/app/api/.
    if (!process.env.BACKEND_URL) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
