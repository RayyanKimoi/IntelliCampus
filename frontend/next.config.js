/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@intellicampus/shared'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
