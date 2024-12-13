import React from 'react';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <div>
      <Header isLogin={session} />
      Home
      <Footer />
    </div>
  );
}
