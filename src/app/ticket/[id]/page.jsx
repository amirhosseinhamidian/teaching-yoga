/* eslint-disable react/prop-types */

import React from 'react';

import Footer from '@/components/Footer/Footer';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

import TicketPageContent from '@/components/templates/ticket/TicketPageContent';

export async function generateMetadata() {
  return {
    title: 'جزییات تیکت',

    robots: 'noindex, nofollow',
  };
}

async function TicketPage({ params }) {
  const { id } = params;

  return (
    <>
      <HeaderWrapper />

      <TicketPageContent ticketId={id} />

      <Footer />
    </>
  );
}

export default TicketPage;
