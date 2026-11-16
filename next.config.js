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
        destination: '/dashboard/syncflow',
        permanent: true,
      },
      {
        source: '/dashboard/tracker',
        destination: '/dashboard/syncflow',
        permanent: true,
      },
      {
        source: '/tracker',
        destination: '/dashboard/syncflow',
        permanent: true,
      },
      {
        source: '/for-employers',
        destination: '/#for-recruiters',
        permanent: false,
      },
      {
        source: '/ai-transparency',
        destination: '/scoring-methodology',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
