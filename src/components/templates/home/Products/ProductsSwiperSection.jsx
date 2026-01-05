/* eslint-disable react/no-unknown-property */
'use client';

import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ProductCard from '../../shop/products/ProductCard';

const ProductsSwiperSection = ({ categories, products }) => {
  return (
    <div className='w-full'>
      {/* کتگوری‌ها فقط لینک */}
      <div className='mb-5 flex flex-wrap items-center justify-center gap-2'>
        {(categories || []).map((c) => (
          <Link
            key={c.id}
            href={`/shop/products?category=${encodeURIComponent(c.slug)}`}
            className='rounded-full bg-black/5 px-3 py-1 text-xs text-subtext-light transition hover:bg-black/10 dark:bg-white/10 dark:text-subtext-dark dark:hover:bg-white/20'
            title={c.title}
          >
            {c.title}
          </Link>
        ))}
      </div>

      {/* کاروسل محصولات */}
      {!!products?.length && (
        <div dir='rtl' className='relative'>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            slidesPerView={1}
            spaceBetween={16}
            loop
            speed={700}
            autoplay={{
              delay: 3200,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{ clickable: true }}
            navigation
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 3, spaceBetween: 16 },
              1024: { slidesPerView: 4, spaceBetween: 16 },
            }}
            className='rounded-xl'
          >
            {products.map((p) => (
              <SwiperSlide key={p.id} className='h-auto'>
                <ProductCard product={p} />
              </SwiperSlide>
            ))}
          </Swiper>

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
      )}
    </div>
  );
};

ProductsSwiperSection.propTypes = {
  categories: PropTypes.array.isRequired, // parent categories
  products: PropTypes.array.isRequired, // last ten products
};

export default ProductsSwiperSection;
