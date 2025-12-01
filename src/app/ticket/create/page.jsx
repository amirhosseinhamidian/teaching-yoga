import Footer from '@/components/Footer/Footer';
import HeaderWrapper from '@/components/Header/HeaderWrapper';
import CreateTicket from '@/components/templates/ticket/CreateTicket';
import React from 'react';

export async function generateMetadata() {
  return {
    title: 'ایجاد تیکت جدید',
    robots: 'noindex, nofollow',
  };
}

async function TicketCreatePage() {
  return (
    <div>
      <HeaderWrapper />
      <CreateTicket />
      <Footer />
    </div>
  );
}

export default TicketCreatePage;
