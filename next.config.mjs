/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['samane-yoga.storage.c2.liara.space', 'trustseal.enamad.ir'],
  },
  webpack(config) {
    config.resolve.extensions.push('.mjs');
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/admin/seo/sitemap',
      },
      {
        source: '/robots.txt',
        destination: '/api/admin/seo/sitemap/robots',
      },
    ];
  },
};

export default nextConfig;
