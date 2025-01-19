/* eslint-disable react/prop-types */
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import TicketPageContent from '@/components/templates/ticket/TicketPageContent';
import { getServerSession } from 'next-auth';
import React from 'react';

async function TicketPage({ params }) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  return (
    <div>
      <Header isLogin={session} />
      <TicketPageContent ticketId={id} />
      <Footer />
    </div>
  );
}

export default TicketPage;
