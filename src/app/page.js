import React from 'react';
import Footer from '@/components/Footer/Footer';
import Hero from '@/components/templates/home/Hero';
import BenefitsSection from '@/components/templates/home/Benefits/BenefitsSection';
import CoursesSection from '@/components/templates/home/Courses/CoursesSection';
import ArticlesSection from '@/components/templates/home/Articles/ArticlesSection';
import Newsletter from '@/components/templates/home/Newsletter/Newsletter';
import HeaderWrapper from '@/components/Header/HeaderWrapper';
import ProductsSection from '@/components/templates/home/Products/ProductsSection';
import { getShopEnabled } from '@/utils/server/shopGuard';

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
        <ArticlesSection />
        <Newsletter />
      </div>
      <Footer />
    </div>
  );
}
