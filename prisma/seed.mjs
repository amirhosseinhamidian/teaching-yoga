// prisma/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.podcast.create({
    data: {
      title: 'پادکست با سمانه',
      slug: 'ba-samaneh',
      description:
        'پادکستی در حوزه سلامت روان، مدیتیشن و یوگا با هدف آگاهی‌بخشی و آرام‌سازی ذهن و بدن.',
      logoUrl:
        'https://samane-yoga.storage.c2.liara.space/podcast/podcast-logo.jpg',
      bannerUrl:
        'https://samane-yoga.storage.c2.liara.space/podcast/podcast-banner.jpg',
      metaTitle: 'پادکست با سمانه | مدیتیشن و سلامت روان',
      metaDescription:
        'با پادکست با سمانه به دنیای آرامش، مدیتیشن و آگاهی روان خوش آمدید.',
      keywords: 'پادکست, مدیتیشن, یوگا, سلامت روان, ذهن آگاهی',
      hostName: 'سمانه زینالی',
      language: 'fa',
      genre: 'سلامت و سبک زندگی',
      websiteUrl: 'https://samaneyoga.ir',
      email: 'info@samaneyoga.ir',
    },
  });
}

main().finally(() => prisma.$disconnect());
