/* eslint-disable react/prop-types */
import React from 'react';
import Footer from '@/components/Footer/Footer';
import prismadb from '@/libs/prismadb';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

export async function generateMetadata() {
  const seoSettings = await prismadb.seoSetting.findMany({
    where: { page: '/profile' },
  });

  const seoData = seoSettings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  return {
    title: seoData.siteTitle || 'پروفایل',
    robots: seoData?.robotsTag || 'noindex, nofollow',
  };
}

async function ProfileLayout({ children }) {
  return (
    <div>
      <HeaderWrapper />
      {children}
      <Footer />
    </div>
  );
}

export default ProfileLayout;
