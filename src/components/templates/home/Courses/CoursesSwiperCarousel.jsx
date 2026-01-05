/* eslint-disable react/no-unknown-property */
'use client';

import React from 'react';
import PropTypes from 'prop-types';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import CourseCard from '@/components/CourseCards/CourseCard';

const CoursesSwiperCarousel = ({ courses }) => {
  if (!courses?.length) return null;

  return (
    <div dir='rtl' className='relative'>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        slidesPerView={1}
        spaceBetween={16}
        loop
        speed={700}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ clickable: true }}
        navigation
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 3, spaceBetween: 16 },
        }}
        className='rounded-xl'
      >
        {courses.map((c) => (
          <SwiperSlide key={c.id} className='h-auto'>
            <CourseCard course={c} className='h-full min-h-[480px]' />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* استایل ساده برای اینکه دکمه‌ها روی کارت‌ها نیفتن */}
      <style jsx global>{`
        .swiper {
          padding: 8px 44px 40px 44px;
        }
        .swiper-button-prev,
        .swiper-button-next {
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(6px);
        }
        .swiper-button-prev:after,
        .swiper-button-next:after {
          font-size: 14px;
          color: #fff;
          font-weight: 700;
        }
        .swiper-pagination-bullet {
          opacity: 1;
          background: rgba(0, 0, 0, 0.2);
        }
        .swiper-pagination-bullet-active {
          background: var(--accent, #64f4ab);
        }
      `}</style>
    </div>
  );
};

CoursesSwiperCarousel.propTypes = {
  courses: PropTypes.array.isRequired,
};

export default CoursesSwiperCarousel;
