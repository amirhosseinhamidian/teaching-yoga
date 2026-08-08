'use client';

import React, { useState } from 'react';

import PropTypes from 'prop-types';

import { AnimatePresence, motion } from 'framer-motion';

import SiteCard from '@/components/SiteUi/Card/SiteCard';

const CourseFAQList = ({ faqs, className = '' }) => {
  const [openFaqId, setOpenFaqId] = useState(faqs?.[0]?.id ?? null);

  const handleToggle = (faqId) => {
    setOpenFaqId((currentId) =>
      String(currentId) === String(faqId) ? null : faqId
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {faqs.map((faq, index) => {
        const isOpen = String(openFaqId) === String(faq.id);

        const buttonId = `faq-button-${faq.id}`;

        const contentId = `faq-content-${faq.id}`;

        return (
          <SiteCard
            key={faq.id}
            as='article'
            variant={isOpen ? 'secondary' : 'soft'}
            padding='none'
            radius='md'
            className={`transition-all duration-300 ${
              isOpen
                ? 'shadow-[0_16px_40px_rgba(38,145,125,0.08)]'
                : 'hover:border-secondary/20'
            }`}
          >
            {/* Question */}
            <button
              id={buttonId}
              type='button'
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => handleToggle(faq.id)}
              className='flex w-full items-center justify-between gap-4 px-4 py-5 text-right sm:px-5'
            >
              <span className='flex min-w-0 items-center gap-3'>
                {/* Number */}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-faNa text-xs font-black transition-all duration-300 ${
                    isOpen
                      ? 'bg-secondary text-white shadow-[0_8px_20px_rgba(38,145,125,0.20)]'
                      : 'bg-secondary/10 text-secondary'
                  }`}
                >
                  {(index + 1).toLocaleString('fa-IR', {
                    minimumIntegerDigits: 2,
                    useGrouping: false,
                  })}
                </span>

                {/* Question text */}
                <span
                  className={`min-w-0 text-sm font-bold leading-7 transition-colors duration-300 sm:text-base ${
                    isOpen
                      ? 'text-secondary'
                      : 'text-text-light dark:text-text-dark'
                  }`}
                >
                  {faq.question}
                </span>
              </span>

              {/* Plus / Close */}
              <span
                aria-hidden='true'
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
                  isOpen
                    ? 'rotate-45 border-secondary bg-secondary text-white'
                    : 'border-black/10 bg-surface-light text-text-light dark:border-white/10 dark:bg-surface-dark dark:text-text-dark'
                }`}
              >
                <span className='absolute h-[2px] w-4 rounded-full bg-current' />

                <span className='absolute h-4 w-[2px] rounded-full bg-current' />
              </span>
            </button>

            {/* Answer */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={contentId}
                  role='region'
                  aria-labelledby={buttonId}
                  initial={{
                    height: 0,
                    opacity: 0,
                  }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                  }}
                  transition={{
                    height: {
                      duration: 0.32,

                      ease: [0.4, 0, 0.2, 1],
                    },

                    opacity: {
                      duration: 0.2,
                    },
                  }}
                  className='overflow-hidden'
                >
                  <div className='px-4 pb-5 sm:px-5'>
                    <div className='mr-12 border-r-2 border-secondary/20 pr-4 sm:pr-5'>
                      <p className='whitespace-pre-line text-sm leading-8 text-subtext-light sm:leading-9 dark:text-subtext-dark'>
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SiteCard>
        );
      })}
    </div>
  );
};

CourseFAQList.propTypes = {
  faqs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,

      question: PropTypes.string.isRequired,

      answer: PropTypes.string.isRequired,
    })
  ).isRequired,

  className: PropTypes.string,
};

export default CourseFAQList;
