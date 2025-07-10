'use client';
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import CourseCard from '@/components/CourseCards/CourseCard';

const CoursesGridCarousel = ({ courses, interval = 4000 }) => {
  const containerRef = useRef(null);
  const [itemsPerView, setItemsPerView] = useState(1);
  const reverseCourses = [...courses].reverse();
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) setItemsPerView(3);
      else if (width >= 640) setItemsPerView(2);
      else setItemsPerView(1);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const scrollNext = () => {
      const container = containerRef.current;
      if (!container) return;

      const cardWidth = container.offsetWidth / itemsPerView;

      if (container.scrollLeft <= 0) {
        // وقتی به ابتدا رسید، برگرد به انتها
        container.scrollTo({ left: container.scrollWidth, behavior: 'auto' });
      } else {
        // ← حرکت به چپ واقعی در rtl با کاهش scrollLeft
        container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      }
    };

    const timer = setInterval(scrollNext, interval);
    return () => clearInterval(timer);
  }, [itemsPerView, interval]);

  return (
    <div className='relative w-full overflow-hidden'>
      <div
        ref={containerRef}
        className='hide-scrollbar flex snap-x snap-mandatory flex-row-reverse gap-4 overflow-x-auto scroll-smooth px-6 py-2'
      >
        {reverseCourses.map((course) => (
          <div
            key={course.id}
            className='w-full shrink-0 snap-start sm:w-1/2 lg:w-1/3'
          >
            <CourseCard course={course} className='h-full' />
          </div>
        ))}
      </div>
    </div>
  );
};

CoursesGridCarousel.propTypes = {
  courses: PropTypes.array.isRequired,
  interval: PropTypes.number,
};

export default CoursesGridCarousel;
