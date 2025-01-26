/* eslint-disable no-undef */
import Header from '@/components/Header/Header';
import AboutUs from '@/components/templates/contact-us/AboutUs';
import { getServerSession } from 'next-auth';
import React from 'react';
import { authOptions } from '../api/auth/[...nextauth]/route';
import Footer from '@/components/Footer/Footer';
import FAQs from '@/components/templates/contact-us/FAQs';
import { headers } from 'next/headers';

export async function generateMetadata({ params }) {
  const { shortAddress } = params;
  // درخواست برای اطلاعات سئو
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/contact-us`,
    {
      method: 'GET',
      headers: headers(),
    },
  );

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: 'ارتباط با ما | سمانه یوگا',
    description:
      'برای ارتباط با تیم سمانه یوگا، سوالات متداول، مشاهده لینک شبکه‌های اجتماعی و ایمیل با ما در ارتباط باشید. ما در زمینه آموزش یوگا و مدیتیشن همراه شما هستیم.',
    robots: 'index, follow',
    canonical: `https://samaneyoga.ir/contact-us`,
  };

  if (!res.ok) {
    console.error('Failed to fetch SEO data for the course.');
    return defaultSeoData;
  }

  const result = await res.json();

  if (!result.success || !result.data) {
    return defaultSeoData;
  }

  const seoData = result.data;

  return {
    title: seoData?.siteTitle || defaultSeoData.title,
    description: seoData?.metaDescription || defaultSeoData.description,
    keywords: seoData?.keywords || '',
    robots: seoData?.robotsTag || defaultSeoData.robots,
    canonical: seoData?.canonicalTag || defaultSeoData.canonical,
    openGraph: {
      title: seoData?.ogTitle || '',
      description: seoData?.ogDescription || '',
      url: seoData.ogUrl || `https://samaneyoga.ir/courses/${shortAddress}`,
      images: [
        {
          url: seoData?.ogImage || '',
          alt: seoData?.ogImageAlt || '',
        },
      ],
    },
  };
}

async function fetchFAQs() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faqs?category=GENERAL`,
      {
        method: 'GET',
        headers: headers(),
        next: {
          revalidate: 86400, // 1 day
        },
      },
    );
    if (!response.ok) {
      throw new Error('Failed to fetch FAQs');
    }
    const faqs = await response.json();
    return faqs;
  } catch (error) {
    console.error(error);
  }
}

const fetchAboutUsData = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/site-info`,
      {
        method: 'GET',
        headers: headers(),
        next: {
          revalidate: 86400, // 1 day
        },
      },
    );
    if (!res.ok) {
      throw new Error('Error to fetch footer data!');
    }
    return await res.json();
  } catch (error) {
    console.error(error);
  }
};

const page = async () => {
  const session = await getServerSession(authOptions);
  const faqs = await fetchFAQs();
  const aboutUs = await fetchAboutUsData();

  return (
    <>
      <Header isLogin={session} />
      <div className='container py-10'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-8'>
          <AboutUs data={aboutUs} className='self-start' />
          <FAQs data={faqs} className='self-start' />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default page;
