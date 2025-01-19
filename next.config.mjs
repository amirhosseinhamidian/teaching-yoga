/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['samane-yoga.storage.c2.liara.space', 'trustseal.enamad.ir'],
  },
  webpack(config) {
    // اضافه کردن پشتیبانی از فایل‌های mjs
    config.resolve.extensions.push('.mjs');

    // پیکربندی برای بارگذاری صحیح Hls.js
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
        source: '/(.*)', // اعمال تنظیمات روی تمام صفحات
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
