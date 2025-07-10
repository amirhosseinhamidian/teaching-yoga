import React from 'react';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import Hero from '@/components/templates/home/Hero';
import BenefitsSection from '@/components/templates/home/Benefits/BenefitsSection';
import CoursesSection from '@/components/templates/home/Courses/CoursesSection';
import ArticlesSection from '@/components/templates/home/Articles/ArticlesSection';
import Newsletter from '@/components/templates/home/Newsletter/Newsletter';

export default async function Home() {
  return (
    <div>
      <Header />
      <div className='flex flex-col gap-6 overflow-hidden'>
        <Hero />
        <CoursesSection />
        <BenefitsSection />
        <ArticlesSection />
        <Newsletter />
      </div>
      <Footer />
    </div>
  );
}
