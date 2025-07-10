/* eslint-disable react/prop-types */
'use client';
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import VisitLogger from '@/components/modules/VisitorLogger/VisitorLogger';
import ClientSideAOS from '@/components/ClientSideAOS';
import ClientWrapper from '@/components/ClientWrapper';

export function AppProviders({ children, user }) {
  return (
    <ThemeProvider>
      <AuthProvider initialUser={user}>
        <VisitLogger />
        <ClientSideAOS />
        <ClientWrapper>{children}</ClientWrapper>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
