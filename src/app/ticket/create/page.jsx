import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
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
      <Header />
      <CreateTicket />
      <Footer />
    </div>
  );
}

export default TicketCreatePage;
