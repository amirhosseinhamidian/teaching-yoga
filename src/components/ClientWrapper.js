/* eslint-disable react/prop-types */
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import React, { Suspense } from 'react';

const ClientWrapper = ({ children }) => {
  const pathname = usePathname();
  const [isPageExiting, setIsPageExiting] = useState(false);

  useEffect(() => {
    setIsPageExiting(false); // وقتی مسیر تغییر می‌کند، حالت صفحه به حالت عادی برمی‌گردد.
  }, [pathname]);

  const handleExitComplete = () => {
    setIsPageExiting(true);
  };

  return (
    <AnimatePresence mode='wait' onExitComplete={handleExitComplete}>
      <Suspense>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 50 }} // ورود از راست
          animate={{ opacity: 1, x: 0 }} // انیمیشن نمایش کامل
          exit={{ opacity: 0, x: -50 }} // انیمیشن خروج صفحه قبلی
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
          }}
          onAnimationComplete={() => {
            if (isPageExiting) {
              // زمانی که انیمیشن خروج تمام شد، صفحه جدید نمایش داده می‌شود.
              setIsPageExiting(false);
            }
          }}
        >
          {children}
        </motion.div>
      </Suspense>
    </AnimatePresence>
  );
};

export default ClientWrapper;
