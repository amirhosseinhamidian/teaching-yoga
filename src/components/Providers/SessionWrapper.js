/* eslint-disable react/prop-types */
/* eslint-disable react/react-in-jsx-scope */
'use client';
import { SessionProvider } from 'next-auth/react';

export default function SessionWrapper({ children, session }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
