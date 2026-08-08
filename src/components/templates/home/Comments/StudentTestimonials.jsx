/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BsQuote } from 'react-icons/bs';

const StudentTestimonials = () => {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch('/api/comments/home');

        if (!res.ok) return;

        const data = await res.json();

        setComments(data.comments || []);
      } catch (error) {
        console.error('HOME_COMMENTS_ERROR', error);
      }
    };

    fetchComments();
  }, []);

  if (!comments.length) return null;

  return (
    <section className='relative overflow-hidden py-6 sm:py-8'>
      {/* glow background */}
      <div className='pointer-events-none absolute left-0 top-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl' />

      <div className='container relative'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='mx-auto mb-14 max-w-3xl text-center'
        >
          <h2 className='text-3xl font-black leading-[1.6] text-text-light sm:text-4xl lg:text-5xl dark:text-text-dark'>
            آرامش را از زبان
            <span className='relative mx-2 inline-block text-secondary'>
              هنرجوهای ما
              <span className='bg-yellow/70 absolute -bottom-1 right-0 h-1 w-full rounded-full' />
              <svg
                aria-hidden='true'
                viewBox='0 0 170 18'
                preserveAspectRatio='none'
                className='text-yellow pointer-events-none absolute -bottom-1 right-0 h-3 w-full'
              >
                <path
                  d='M4 12C36 4 68 16 101 9C126 4 147 5 166 9'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='4'
                  strokeLinecap='round'
                  opacity='0.75'
                />
              </svg>
            </span>
            بشنوید
          </h2>

          <p className='mt-5 text-sm leading-8 text-gray-500 sm:text-base dark:text-gray-400'>
            تجربه کسانی که با تمرین یوگا و مدیتیشن، مسیر آرامش و آگاهی بیشتری را
            شروع کرده‌اند.
          </p>
        </motion.div>

        {/* Cards */}
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{
                opacity: 0,
                y: 40,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              className='group relative rounded-3xl border border-white/20 bg-white/60 p-6 shadow-xl backdrop-blur-xl transition hover:-translate-y-2 dark:border-white/10 dark:bg-white/5'
            >
              {/* Quote */}
              <div className='absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                <BsQuote size={25} />
              </div>

              {/* User */}
              <div className='mb-5 flex items-center gap-3'>
                <div className='relative h-14 w-14 overflow-hidden rounded-full border-2 border-secondary/30'>
                  <Image
                    src={comment.user.avatar || '/images/default-profile.png'}
                    alt={comment.user.name}
                    fill
                    className='object-cover'
                  />
                </div>

                <div>
                  <h3 className='font-bold text-text-light dark:text-text-dark'>
                    {comment.user.name}
                  </h3>

                  {comment.course?.title && (
                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                      {comment.course.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Text */}
              <p className='relative z-10 text-sm leading-8 text-gray-600 dark:text-gray-300'>
                {comment.content}
              </p>

              {/* bottom decoration */}
              <div className='mt-6 h-px w-full bg-gradient-to-r from-transparent via-secondary/30 to-transparent' />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudentTestimonials;
