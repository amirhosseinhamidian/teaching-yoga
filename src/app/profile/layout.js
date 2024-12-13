/* eslint-disable react/prop-types */
import React from 'react';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';

async function ProfileLayout({ children }) {
  const session = await getServerSession(authOptions);
  return (
    <div>
      <Header isLogin={session} />
      {children}
      <Footer />
    </div>
  );
}

export default ProfileLayout;
