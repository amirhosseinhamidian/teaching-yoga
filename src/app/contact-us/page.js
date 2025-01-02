/* eslint-disable no-undef */
import Header from '@/components/Header/Header';
import AboutUs from '@/components/templates/contact-us/AboutUs';
import { getServerSession } from 'next-auth';
import React from 'react';
import { authOptions } from '../api/auth/[...nextauth]/route';
import Footer from '@/components/Footer/Footer';
import FAQs from '@/components/templates/contact-us/FAQs';
import { headers } from 'next/headers';

async function fetchFAQs() {
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
}

const page = async () => {
  const session = await getServerSession(authOptions);
  const faqs = await fetchFAQs();

  return (
    <>
      <Header isLogin={session} />
      <div className='container py-10'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-8'>
          <AboutUs className='self-start' />
          <FAQs data={faqs} className='self-start' />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default page;
