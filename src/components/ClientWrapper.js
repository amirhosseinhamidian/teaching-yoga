'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import FloatingMessageButton from './Ui/FloatingMessageButton/FloatingMessageButton';
import React from 'react';
import { useUiOverlay } from '@/contexts/UiOverlayContext';

// eslint-disable-next-line react/prop-types
const ClientWrapper = ({ children }) => {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/a-panel');
  const { overlayOpen } = useUiOverlay();

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {children}
        {!isAdmin && !overlayOpen && <FloatingMessageButton />}
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientWrapper;
