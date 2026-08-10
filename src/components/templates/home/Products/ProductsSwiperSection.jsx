// src/components/templates/home/Products/ProductsSwiperSection.jsx

/* eslint-disable react/no-unknown-property */

'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

import ProductCard from '../../shop/products/ProductCard';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteIconButton from '@/components/SiteUi/Button/SiteIconButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineArrowLeft,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const categoryContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const categoryItemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: 'easeOut',
    },
  },
};

const ProductsSwiperSection = ({ categories, products }) => {
  const [swiperInstance, setSwiperInstance] = useState(null);

  const normalizedCategories = useMemo(() => {
    return Array.isArray(categories)
      ? categories.filter(
          (category) => category?.id && category?.title && category?.slug
        )
      : [];
  }, [categories]);

  const normalizedProducts = useMemo(() => {
    return Array.isArray(products)
      ? products.filter((product) => product?.id)
      : [];
  }, [products]);

  const hasProducts = normalizedProducts.length > 0;
  const canAutoplay = normalizedProducts.length > 1;
  const canLoop = normalizedProducts.length > 4;

  const handlePreviousSlide = () => {
    swiperInstance?.slidePrev();
  };

  const handleNextSlide = () => {
    swiperInstance?.slideNext();
  };

  return (
    <div className='w-full'>
      <div className='mb-7 flex flex-col gap-5 sm:mb-9 lg:flex-row lg:items-center lg:justify-between'>
        <motion.div
          variants={categoryContainerVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, amount: 0.2 }}
          className='scrollbar-hidden flex max-w-full items-center gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible lg:pb-0'
        >
          <motion.div variants={categoryItemVariants}>
            <SiteButton
              href='/shop/products'
              variant='primary'
              size='sm'
              startIcon={HiOutlineSparkles}
            >
              همه محصولات
            </SiteButton>
          </motion.div>

          {normalizedCategories.map((category) => (
            <motion.div key={category.id} variants={categoryItemVariants}>
              <SiteButton
                href={`/shop/products?category=${encodeURIComponent(
                  category.slug
                )}`}
                variant='outline'
                size='sm'
                title={category.title}
              >
                {category.title}
              </SiteButton>
            </motion.div>
          ))}
        </motion.div>

        {hasProducts && normalizedProducts.length > 1 && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className='hidden shrink-0 items-center gap-2 lg:flex'
          >
            <SiteIconButton
              icon={HiOutlineChevronRight}
              ariaLabel='محصول قبلی'
              variant='secondary'
              size='md'
              onClick={handlePreviousSlide}
              disabled={!swiperInstance}
            />
            <SiteIconButton
              icon={HiOutlineChevronLeft}
              ariaLabel='محصول بعدی'
              variant='secondary'
              size='md'
              onClick={handleNextSlide}
              disabled={!swiperInstance}
            />
          </motion.div>
        )}
      </div>

      {hasProducts ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          dir='rtl'
          className='products-swiper-wrapper relative'
        >
          <Swiper
            modules={[Pagination, Autoplay]}
            onSwiper={setSwiperInstance}
            slidesPerView={1.08}
            spaceBetween={14}
            loop={canLoop}
            speed={750}
            grabCursor
            watchOverflow
            observer
            observeParents
            autoplay={
              canAutoplay
                ? {
                    delay: 3400,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
                : false
            }
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            breakpoints={{
              480: { slidesPerView: 1.35, spaceBetween: 16 },
              640: { slidesPerView: 2, spaceBetween: 18 },
              768: { slidesPerView: 2.35, spaceBetween: 18 },
              1024: { slidesPerView: 3, spaceBetween: 20 },
              1280: { slidesPerView: 4, spaceBetween: 22 },
            }}
            className='products-swiper'
          >
            {normalizedProducts.map((product, index) => (
              <SwiperSlide key={product.id} className='h-auto py-3'>
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{
                    duration: 0.45,
                    delay: Math.min(index * 0.06, 0.3),
                    ease: 'easeOut',
                  }}
                  whileHover={{ y: -7 }}
                  className='product-slide-card relative h-full rounded-[26px] transition-shadow duration-300'
                >
                  <div
                    aria-hidden='true'
                    className='product-slide-glow pointer-events-none absolute -inset-px -z-10 rounded-[27px] bg-gradient-to-br from-secondary/30 via-transparent to-primary/20 opacity-0 blur-sm transition-opacity duration-300'
                  />
                  <ProductCard product={product} />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div
            aria-hidden='true'
            className='pointer-events-none absolute bottom-10 right-0 top-3 z-10 hidden w-10 bg-gradient-to-l from-surface-light/90 to-transparent sm:block dark:from-surface-dark/80'
          />
          <div
            aria-hidden='true'
            className='pointer-events-none absolute bottom-10 left-0 top-3 z-10 hidden w-10 bg-gradient-to-r from-surface-light/90 to-transparent sm:block dark:from-surface-dark/80'
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <SiteCard
            variant='soft'
            padding='lg'
            radius='lg'
            className='border-dashed py-12 text-center'
          >
            <div
              aria-hidden='true'
              className='absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[75px]'
            />

            <div className='relative z-10 mx-auto flex max-w-md flex-col items-center'>
              <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                <HiOutlineShoppingBag size={32} />
              </div>

              <h3 className='text-lg font-black text-text-light sm:text-xl dark:text-text-dark'>
                محصولی برای نمایش وجود ندارد
              </h3>

              <p className='mt-2 text-sm leading-7 text-subtext-light dark:text-subtext-dark'>
                به‌زودی محصولات جدید یوگا و مدیتیشن به فروشگاه اضافه می‌شوند.
              </p>

              <SiteButton
                href='/shop/products'
                variant='primary'
                size='md'
                endIcon={HiOutlineArrowLeft}
                className='mt-5'
              >
                ورود به فروشگاه
              </SiteButton>
            </div>
          </SiteCard>
        </motion.div>
      )}

      <style jsx global>{`
        .products-swiper {
          overflow: visible;
          padding: 2px 4px 48px;
        }

        .products-swiper .swiper-wrapper {
          align-items: stretch;
        }

        .products-swiper .swiper-slide {
          display: flex;
          height: auto;
        }

        .products-swiper .swiper-slide > div {
          width: 100%;
        }

        .products-swiper .swiper-pagination {
          bottom: 4px !important;
        }

        .products-swiper .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: rgba(38, 145, 125, 0.28);
          opacity: 1;
          transition: all 0.3s ease;
        }

        .products-swiper .swiper-pagination-bullet-active {
          width: 24px;
          border-radius: 999px;
          background: rgb(38 145 125);
        }

        .product-slide-card:hover .product-slide-glow {
          opacity: 1;
        }

        .scrollbar-hidden {
          scrollbar-width: none;
        }

        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

ProductsSwiperSection.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.object),
  products: PropTypes.arrayOf(PropTypes.object),
};

ProductsSwiperSection.defaultProps = {
  categories: [],
  products: [],
};

export default ProductsSwiperSection;
