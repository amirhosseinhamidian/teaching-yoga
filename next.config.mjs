/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
  },
  images: {
    unoptimized: true,
    domains: [
      'samane-yoga.storage.c2.liara.site',
      'beta.samaneyoga.ir',
      'trustseal.enamad.ir',
      'lh3.googleusercontent.com',
      'static.postex.ir',
      'localhost',
    ],
  },

  // ✅ برای کاهش مصرف RAM در next build (روی ۱ گیگ خیلی مهم)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,

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
      {
        source: '/images/:path*',
        destination: '/local-videos/images/:path*',
      },
      {
        source: '/videos/:path*',
        destination: '/local-videos/videos/:path*',
      },
      {
        source: '/podcast/:path*',
        destination: '/local-videos/podcast/:path*',
      },
    ];
  },
};

export default nextConfig;
