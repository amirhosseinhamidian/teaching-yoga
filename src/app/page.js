import React from 'react';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import Hero from '@/components/templates/home/Hero';
import BenefitsSection from '@/components/templates/home/Benefits/BenefitsSection';
import CoursesSection from '@/components/templates/home/Courses/CoursesSection';
import ArticlesSection from '@/components/templates/home/Articles/ArticlesSection';
import Newsletter from '@/components/templates/home/Newsletter/Newsletter';

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <div>
      <Header isLogin={session} />
      <div className='flex flex-col gap-6 overflow-hidden'>
        <Hero />
        <BenefitsSection />
        <CoursesSection />
        <ArticlesSection />
        <Newsletter />
      </div>
      <Footer />
    </div>
  );
}
