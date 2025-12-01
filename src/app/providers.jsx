'use client';

import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import VisitLogger from '@/components/modules/VisitorLogger/VisitorLogger';
import ClientSideAOS from '@/components/ClientSideAOS';
import ClientWrapper from '@/components/ClientWrapper';
import { PushLinkOnLogin } from '@/components/PushLinkOnLogin';
import CartBootstrapper from '@/components/Bootstrap/CartBootstrapper';

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <CartBootstrapper />
      <VisitLogger />
      <ClientSideAOS />
      <ClientWrapper>{children}</ClientWrapper>
      <PushLinkOnLogin />
      <Toaster />
    </ThemeProvider>
  );
}
