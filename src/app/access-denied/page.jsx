import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { getServerSession } from 'next-auth';
import React from 'react';
import { authOptions } from '../api/auth/[...nextauth]/route';
import AccessDeniedView from '@/components/templates/access-denied/AccessDeniedView';

async function AccessDeniedPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <Header isLogin={session} />
      <AccessDeniedView />
      <Footer />
    </div>
  );
}

export default AccessDeniedPage;
