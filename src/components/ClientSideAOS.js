// app/components/ClientSideAOS.js
'use client';

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css'; // Import AOS styles

const ClientSideAOS = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
    });
  }, []);

  return null; // این کامپوننت هیچ چیزی را رندر نمی‌کند، فقط AOS را راه‌اندازی می‌کند
};

export default ClientSideAOS;
