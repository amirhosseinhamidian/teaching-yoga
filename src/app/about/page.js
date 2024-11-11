import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';

const page = async () => {
  const session = await getServerSession(authOptions);
  return (
    <>
      <Header isLogin={session} />
      <div>About page</div>
      <Footer />
    </>
  );
};

export default page;
