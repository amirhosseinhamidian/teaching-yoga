import React from 'react';
import Footer from '@/components/Footer/Footer';
import Hero from '@/components/templates/home/Hero';
import BenefitsSection from '@/components/templates/home/Benefits/BenefitsSection';
import CoursesSection from '@/components/templates/home/Courses/CoursesSection';
import ArticlesSection from '@/components/templates/home/Articles/ArticlesSection';
import HeaderWrapper from '@/components/Header/HeaderWrapper';
import ProductsSection from '@/components/templates/home/Products/ProductsSection';
import { getShopEnabled } from '@/utils/server/shopGuard';
import TeachingMethodSection from '@/components/templates/home/TeachingMethod/TeachingMethodSection';
import StudentTestimonials from '@/components/templates/home/Comments/StudentTestimonials';
import LearningJourney from '@/components/templates/home/LearningJourney/LearningJourney';
import FAQSection from '@/components/templates/home/FAQ/FAQSection';
import FinalCTASection from '@/components/templates/home/FinalCTA/FinalCTASection';

export default async function Home() {
  const canSeeShop = await getShopEnabled();
  return (
    <div>
      <HeaderWrapper />
      <div className='flex flex-col gap-6 overflow-hidden'>
        <Hero />
        <CoursesSection />
        {canSeeShop && <ProductsSection />}
        <BenefitsSection />
        <TeachingMethodSection />
        <StudentTestimonials />
        <LearningJourney />
        <ArticlesSection />
        <FAQSection />
        <FinalCTASection />
      </div>
      <Footer />
    </div>
  );
}
