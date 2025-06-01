/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import TicketPageContent from '@/components/templates/ticket/TicketPageContent';
import React from 'react';

export async function generateMetadata() {
  return {
    title: 'جزییات تیکت',
    robots: 'noindex, nofollow',
  };
}

async function TicketPage({ params }) {
  const { id } = params;

  return (
    <div className='overflow-x-hidden'>
      <Header />
      <TicketPageContent ticketId={id} />
      <Footer />
    </div>
  );
}

export default TicketPage;
