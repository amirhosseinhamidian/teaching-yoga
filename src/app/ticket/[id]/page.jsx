/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import Footer from '@/components/Footer/Footer';
import HeaderWrapper from '@/components/Header/HeaderWrapper';
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
      <HeaderWrapper />
      <TicketPageContent ticketId={id} />
      <Footer />
    </div>
  );
}

export default TicketPage;
