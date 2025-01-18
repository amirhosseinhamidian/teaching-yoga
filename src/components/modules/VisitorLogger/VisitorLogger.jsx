'use client';

import { logVisit } from '@/utils/logVisit';
import { useEffect } from 'react';

export default function VisitLogger() {
  useEffect(() => {
    logVisit();
  }, []);

  return null;
}
