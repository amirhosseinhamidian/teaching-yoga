/* eslint-disable react/prop-types */
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import FloatingMessageButton from './Ui/FloatingMessageButton/FloatingMessageButton';

const ClientWrapper = ({ children }) => {
  const pathname = usePathname(); // دریافت مسیر فعلی
  const isAdmin = pathname.startsWith('/a-panel');

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={pathname} // تغییر صفحه باعث اجرای انیمیشن می‌شود
        initial={{ opacity: 0, x: 50 }} // ورود از راست
        animate={{ opacity: 1, x: 0 }} // نمایش کامل
        exit={{ opacity: 0, x: -50 }} // خروج به چپ
        transition={{ duration: 0.5, ease: 'easeInOut' }} // تنظیم سرعت انیمیشن
      >
        {children}
        {!isAdmin && <FloatingMessageButton />}
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientWrapper;
