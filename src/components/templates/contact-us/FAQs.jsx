'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';

import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineQuestionMarkCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const FAQItem = ({ faq, index, isOpen, onToggle }) => {
  const buttonId = `contact-faq-button-${faq.id}`;
  const contentId = `contact-faq-content-${faq.id}`;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.06, 0.3),
      }}
      className={`group overflow-hidden rounded-[22px] border transition-all duration-300 ${
        isOpen
          ? 'border-secondary/30 bg-secondary/5 shadow-[0_18px_45px_rgba(38,145,125,0.09)] dark:bg-secondary/10'
          : 'border-black/5 bg-background-light/60 hover:border-secondary/20 dark:border-white/10 dark:bg-background-dark/45'
      }`}
    >
      <h3>
        <button
          id={buttonId}
          type='button'
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={onToggle}
          className='flex w-full items-center justify-between gap-4 px-4 py-5 text-right sm:px-5 sm:py-6'
        >
          <span className='flex min-w-0 items-center gap-3'>
            <span
              className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl font-faNa text-xs font-black transition-all duration-300 ${
                isOpen
                  ? 'bg-secondary text-white'
                  : 'bg-secondary/10 text-secondary'
              }`}
            >
              {(index + 1).toLocaleString('fa-IR', {
                minimumIntegerDigits: 2,
                useGrouping: false,
              })}
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
                duration: 0.23,
              },
            }}
            className='overflow-hidden'
          >
            <div className='px-4 pb-5 sm:px-5 sm:pb-6'>
              <div className='mr-12 border-r-2 border-secondary/20 pr-4 sm:mr-12 sm:pr-5'>
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
  index: PropTypes.number.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

const FAQs = ({ data = [], className = '' }) => {
  const safeFAQs = Array.isArray(data) ? data : [];

  const [openId, setOpenId] = useState(safeFAQs[0]?.id ?? null);

  const handleToggle = (faqId) => {
    setOpenId((currentId) => (currentId === faqId ? null : faqId));
  };

  return (
    <section
      className={`relative overflow-hidden rounded-[30px] border border-black/5 bg-surface-light/70 p-5 shadow-[0_24px_75px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-7 lg:p-8 dark:border-white/10 dark:bg-surface-dark/65 dark:shadow-[0_28px_85px_rgba(0,0,0,0.26)] ${className}`}
    >
      <div
        aria-hidden='true'
        className='absolute inset-x-14 top-0 h-px bg-gradient-to-r from-transparent via-secondary/55 to-transparent'
      />

      <div
        aria-hidden='true'
        className='absolute -left-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
      />

      <div className='relative z-10'>
        <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary'>
          <HiOutlineSparkles size={17} />

          <span>پاسخ سؤالات رایج</span>
        </div>

        <div className='mb-7 flex items-start gap-4'>
          <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineQuestionMarkCircle size={26} />
          </span>

          <div>
            <h2 className='text-2xl font-black leading-10 text-text-light sm:text-3xl dark:text-text-dark'>
              سؤالات متداول
            </h2>

            <p className='mt-2 text-sm leading-7 text-subtext-light dark:text-subtext-dark'>
              پاسخ سؤالات رایج درباره دوره‌ها، تمرین‌ها و نحوه استفاده از سامانه
              را اینجا ببین.
            </p>
          </div>
        </div>

        {safeFAQs.length > 0 ? (
          <div className='space-y-3'>
            {safeFAQs.map((faq, index) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                index={index}
                isOpen={openId === faq.id}
                onToggle={() => handleToggle(faq.id)}
              />
            ))}
          </div>
        ) : (
          <div className='rounded-[24px] border border-black/5 bg-background-light/50 p-7 text-center dark:border-white/10 dark:bg-background-dark/40'>
            <span className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
              <HiOutlineChatBubbleLeftRight size={28} />
            </span>

            <h3 className='mt-4 text-base font-black text-text-light dark:text-text-dark'>
              هنوز سؤالی برای نمایش ثبت نشده است
            </h3>

            <p className='mt-2 text-sm leading-7 text-subtext-light dark:text-subtext-dark'>
              برای دریافت راهنمایی می‌توانی از راه‌های ارتباطی این صفحه استفاده
              کنی.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

FAQs.propTypes = {
  data: PropTypes.array,
  className: PropTypes.string,
};

export default FAQs;
