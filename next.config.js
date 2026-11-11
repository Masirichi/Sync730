/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: '/candidate/crawler',
        destination: '/dashboard/crawler',
        permanent: false,
      },
      {
        source: '/candidate/tracker',
        destination: '/dashboard/tracker',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
