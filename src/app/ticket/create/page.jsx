import React from 'react';

import Footer from '@/components/Footer/Footer';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

import CreateTicket from '@/components/templates/ticket/CreateTicket';

export async function generateMetadata() {
  return {
    title: 'ایجاد تیکت جدید',

    robots: 'noindex, nofollow',
  };
}

async function TicketCreatePage() {
  return (
    <>
      <HeaderWrapper />

      <CreateTicket />

      <Footer />
    </>
  );
}

export default TicketCreatePage;
