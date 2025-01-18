/* eslint-disable react/prop-types */
import React from 'react';
import Sidebar from './components/modules/Sidebar/Sidebar';
import Header from './components/modules/Header/Header';
import { NotificationProvider } from '@/contexts/NotificationContext';

export const metadata = {
  title: 'پنل مدیریت',
};

export default function AdminLayout({ children }) {
  return (
    <NotificationProvider>
      <div className='flex'>
        <div className='hidden xl:block'>
          <Sidebar />
        </div>
        <div className='w-full'>
          <Header />
          <div className='p-4 lg:p-6'>{children}</div>
        </div>
      </div>
    </NotificationProvider>
  );
}
