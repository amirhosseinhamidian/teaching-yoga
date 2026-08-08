// src/components/templates/home/Products/ProductsSwiperSection.jsx

/* eslint-disable react/no-unknown-property */

'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

import { motion } from 'framer-motion';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

import ProductCard from '../../shop/products/ProductCard';

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
          viewport={{
            once: true,
            amount: 0.2,
          }}
          className='scrollbar-hidden flex max-w-full items-center gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible lg:pb-0'
        >
          <motion.div variants={categoryItemVariants}>
            <Link
              href='/shop/products'
              className='flex h-10 shrink-0 items-center gap-2 rounded-full border border-secondary/25 bg-secondary px-4 text-xs font-bold text-white shadow-[0_8px_22px_rgba(38,145,125,0.18)] transition-all duration-300 hover:-translate-y-0.5'
            >
              <HiOutlineSparkles size={16} />

              <span>همه محصولات</span>
            </Link>
          </motion.div>

          {normalizedCategories.map((category) => (
            <motion.div key={category.id} variants={categoryItemVariants}>
              <Link
                href={`/shop/products?category=${encodeURIComponent(
                  category.slug
                )}`}
                title={category.title}
                className='flex h-10 shrink-0 items-center rounded-full border border-black/5 bg-background-light/75 px-4 text-xs font-bold text-subtext-light transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/25 hover:bg-secondary/10 hover:text-secondary dark:border-white/10 dark:bg-background-dark/60 dark:text-subtext-dark dark:hover:border-secondary/30 dark:hover:bg-secondary/10 dark:hover:text-secondary'
              >
                {category.title}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {hasProducts && normalizedProducts.length > 1 && (
          <motion.div
            initial={{
              opacity: 0,
              x: -12,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.4,
            }}
            className='hidden shrink-0 items-center gap-2 lg:flex'
          >
            <button
              type='button'
              onClick={handlePreviousSlide}
              disabled={!swiperInstance}
              aria-label='محصول قبلی'
              className='group flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-background-light/80 text-text-light shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/30 hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-background-dark/70 dark:text-text-dark dark:hover:border-secondary/40 dark:hover:bg-secondary dark:hover:text-white'
            >
              <HiOutlineChevronRight
                size={22}
                className='transition-transform duration-300 group-hover:translate-x-0.5'
              />
            </button>

            <button
              type='button'
              onClick={handleNextSlide}
              disabled={!swiperInstance}
              aria-label='محصول بعدی'
              className='group flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-background-light/80 text-text-light shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/30 hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-background-dark/70 dark:text-text-dark dark:hover:border-secondary/40 dark:hover:bg-secondary dark:hover:text-white'
            >
              <HiOutlineChevronLeft
                size={22}
                className='transition-transform duration-300 group-hover:-translate-x-0.5'
              />
            </button>
          </motion.div>
        )}
      </div>

      {hasProducts ? (
        <motion.div
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
            amount: 0.12,
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
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
              480: {
                slidesPerView: 1.35,
                spaceBetween: 16,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 18,
              },
              768: {
                slidesPerView: 2.35,
                spaceBetween: 18,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 22,
              },
            }}
            className='products-swiper'
          >
            {normalizedProducts.map((product, index) => (
              <SwiperSlide key={product.id} className='h-auto py-3'>
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 22,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.12,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: Math.min(index * 0.06, 0.3),
                    ease: 'easeOut',
                  }}
                  whileHover={{
                    y: -7,
                  }}
                  className='product-slide-card relative h-full rounded-[26px] transition-shadow duration-300'
                >
                  <div
                    aria-hidden='true'
                    className='to-yellow/20 pointer-events-none absolute -inset-px -z-10 rounded-[27px] bg-gradient-to-br from-secondary/30 via-transparent opacity-0 blur-sm transition-opacity duration-300'
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
          initial={{
            opacity: 0,
            scale: 0.98,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.45,
          }}
          className='relative overflow-hidden rounded-[28px] border border-dashed border-secondary/25 bg-background-light/60 px-5 py-12 text-center dark:bg-background-dark/45'
        >
          <div
            aria-hidden='true'
            className='absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[70px]'
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

            <Link
              href='/shop/products'
              className='group mt-5 flex h-11 items-center gap-2 rounded-xl bg-secondary px-5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1'
            >
              <span>ورود به فروشگاه</span>

              <HiOutlineArrowLeft
                size={18}
                className='transition-transform duration-300 group-hover:-translate-x-1'
              />
            </Link>
          </div>
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
          width: 7px;
          height: 7px;
          margin: 0 4px !important;
          background: rgba(100, 116, 139, 0.35);
          opacity: 1;
          transition:
            width 250ms ease,
            background-color 250ms ease,
            transform 250ms ease;
        }

        .products-swiper .swiper-pagination-bullet-active {
          width: 24px;
          border-radius: 9999px;
          background: #64f4ab;
        }

        .product-slide-card:hover > div:first-child {
          opacity: 1;
        }

        .product-slide-card:hover {
          filter: drop-shadow(0 20px 28px rgba(15, 23, 42, 0.11));
        }

        .dark .product-slide-card:hover {
          filter: drop-shadow(0 22px 32px rgba(0, 0, 0, 0.3));
        }

        .scrollbar-hidden {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .products-swiper .swiper-wrapper {
            transition-duration: 0ms !important;
          }

          .product-slide-card {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};

ProductsSwiperSection.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
    })
  ),
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    })
  ),
};

ProductsSwiperSection.defaultProps = {
  categories: [],
  products: [],
};

export default ProductsSwiperSection;
