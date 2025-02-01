/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import { ThemeProvider } from '@/contexts/ThemeContext';
import './globals.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import prismadb from '@/libs/prismadb';
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import VisitLogger from '@/components/modules/VisitorLogger/VisitorLogger';

export async function generateMetadata() {
  const seoSettings = await prismadb.seoSetting.findMany({
    where: { page: 'general' },
  });

  const seoData = seoSettings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  return {
    title: seoData.siteTitle || 'سمانه یوگا',
    description:
      seoData.metaDescription || 'آموزش حرفه‌ای یوگا و مدیتیشن برای تمام سطوح.',
    keywords: (seoData.keywords || '')
      .split(' ، ')
      .map((keyword) => keyword.replace(/^"|"$/g, ' ')),
    robots: seoData?.robotsTag || 'noindex, nofollow',
    icons: {
      icon: '/favicon.ico',
    },
    openGraph: {
      siteName: seoData.ogSiteName || 'سمانه یوگا',
      title: seoData.ogTitle || 'سمانه یوگا',
      images: [
        {
          url: seoData.ogImage || '/images/hero.png',
          width: 1200,
          height: 630,
          alt: seoData.ogImageAlt || 'لوگوی سمانه یوگا',
        },
      ],
      description:
        seoData.ogDescription || 'آموزش حرفه‌ای یوگا و مدیتیشن برای تمام سطوح.',
      url: seoData.ogUrl || process.env.NEXT_PUBLIC_API_BASE_URL,
      type: 'website',
      local: 'fa_IR',
    },
    alternates: {
      canonical: seoData?.canonicalTag || 'https://samaneyoga.ir',
    },
  };
}

// بارگذاری کامپوننت ClientSideAOS فقط در سمت کلاینت
const ClientSideAOS = dynamic(() => import('@/components/ClientSideAOS'), {
  ssr: false, // غیرفعال کردن رندر در سمت سرور
});
const ClientWrapper = dynamic(() => import('@/components/ClientWrapper'), {
  ssr: false,
});

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  let user = null;

  if (session?.user?.userId) {
    try {
      const rawUser = await prismadb.user.findUnique({
        where: { id: session.user.userId },
        include: {
          questions: true,
          comments: true,
          courses: true,
          carts: {
            include: {
              cartCourses: {
                include: {
                  course: {
                    select: {
                      id: true,
                      title: true,
                      cover: true,
                      shortAddress: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // پردازش داده‌های سبد خرید
      user = {
        ...rawUser,
        carts: (rawUser.carts || []).map((cart) => {
          // استخراج فقط دوره‌ها از cartCourses
          const courses = cart.cartCourses.map(
            (cartCourse) => cartCourse.course,
          );

          const uniqueCourses = Array.from(
            new Map(courses.map((course) => [course.id, course])).values(),
          );

          return {
            ...cart,
            uniqueCourses, // اضافه کردن لیست دوره‌های یکتا
          };
        }),
      };
    } catch (error) {
      console.error('Error fetching user data:', error.message);
      user = null; // مقدار پیش‌فرض در صورت بروز خطا
    }
  }

  return (
    <ThemeProvider>
      <AuthProvider initialUser={user}>
        <html lang='fa' dir='rtl'>
          <body
            className={`flex flex-col bg-background-light font-main text-text-light antialiased dark:bg-background-dark dark:text-text-dark`}
          >
            <VisitLogger />
            <ClientSideAOS />
            <ClientWrapper>{children}</ClientWrapper>
            <Toaster />
          </body>
        </html>
      </AuthProvider>
    </ThemeProvider>
  );
}
