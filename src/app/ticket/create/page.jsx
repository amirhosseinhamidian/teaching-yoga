import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import CreateTicket from '@/components/templates/ticket/CreateTicket';
import { getServerSession } from 'next-auth';
import React from 'react';

async function TicketCreatePage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <Header isLogin={session} />
      <CreateTicket />
      <Footer />
    </div>
  );
}

export default TicketCreatePage;
