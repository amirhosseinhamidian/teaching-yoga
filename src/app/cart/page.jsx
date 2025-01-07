import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { getServerSession } from 'next-auth';
import React from 'react';
import { authOptions } from '../api/auth/[...nextauth]/route';
import CartMain from '@/components/templates/cart/CartMain';

export default async function CartPage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <Header isLogin={session} />
      <CartMain />
      <Footer />
    </>
  );
}
