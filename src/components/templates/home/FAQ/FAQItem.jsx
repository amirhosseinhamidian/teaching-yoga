'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';

const FAQItem = ({ faq, isOpen, onToggle, index = 0 }) => {
  const contentId = `faq-content-${faq.id}`;
  const buttonId = `faq-button-${faq.id}`;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 24,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.07, 0.35),
        ease: 'easeOut',
      }}
      className={`group overflow-hidden rounded-[22px] border transition-all duration-300 ${
        isOpen
          ? 'border-secondary/30 bg-secondary/5 shadow-[0_18px_45px_rgba(38,145,125,0.09)] dark:bg-secondary/10'
          : 'border-black/5 bg-background-light/65 hover:border-secondary/20 dark:border-white/10 dark:bg-background-dark/45'
      }`}
    >
      <h3>
        <button
          id={buttonId}
          type='button'
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={onToggle}
          className='flex w-full items-center justify-between gap-4 px-4 py-5 text-right sm:px-6 sm:py-6'
        >
          <span className='flex min-w-0 items-center gap-3 sm:gap-4'>
            <span
              className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl font-faNa text-xs font-black transition-all duration-300 sm:h-10 sm:min-w-10 ${
                isOpen
                  ? 'bg-secondary text-white shadow-[0_10px_24px_rgba(38,145,125,0.22)]'
                  : 'bg-secondary/10 text-secondary'
              }`}
            >
              {String(index + 1).padStart(2, '0')}
            </span>

            <span
              className={`text-sm font-bold leading-7 transition-colors duration-300 sm:text-base sm:leading-8 ${
                isOpen
                  ? 'text-secondary'
                  : 'text-text-light dark:text-text-dark'
              }`}
            >
              {faq.question}
            </span>
          </span>

          <span
            aria-hidden='true'
            className={`relative flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
              isOpen
                ? 'rotate-180 border-secondary bg-secondary text-white'
                : 'border-black/10 bg-surface-light text-text-light group-hover:border-secondary/30 group-hover:text-secondary dark:border-white/10 dark:bg-surface-dark dark:text-text-dark'
            }`}
          >
            <span className='absolute h-[2px] w-4 rounded-full bg-current' />

            <span
              className={`absolute h-4 w-[2px] rounded-full bg-current transition-transform duration-300 ${
                isOpen ? 'scale-y-0' : 'scale-y-100'
              }`}
            />
          </span>
        </button>
      </h3>

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
                duration: 0.35,
                ease: [0.4, 0, 0.2, 1],
              },
              opacity: {
                duration: 0.25,
              },
            }}
            className='overflow-hidden'
          >
            <div className='px-4 pb-5 sm:px-6 sm:pb-6'>
              <div className='mr-12 border-r-2 border-secondary/20 pr-4 sm:mr-14 sm:pr-5'>
                <p className='whitespace-pre-line text-sm leading-8 text-subtext-light sm:leading-9 dark:text-subtext-dark'>
                  {faq.answer}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

FAQItem.propTypes = {
  faq: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    question: PropTypes.string.isRequired,
    answer: PropTypes.string.isRequired,
  }).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  index: PropTypes.number,
};

export default FAQItem;
