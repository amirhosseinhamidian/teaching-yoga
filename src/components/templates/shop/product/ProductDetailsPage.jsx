'use client';

import React, { useEffect, useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import Image from 'next/image';
import Link from 'next/link';

import { useRouter } from 'next/navigation';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';
import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';

import DetailsTable from './DetailsTable';

import { useTheme } from '@/contexts/ThemeContext';

import { createToastHandler } from '@/utils/toastHandler';

import { useShopCartActions } from '@/hooks/shopCart/useShopCartActions';

import { useShopCart } from '@/hooks/shopCart/useShopCart';

import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineHome,
  HiOutlineInformationCircle,
  HiOutlineMinus,
  HiOutlinePhoto,
  HiOutlinePlus,
  HiOutlineShieldCheck,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
  HiOutlineSparkles,
  HiOutlineSwatch,
  HiOutlineTrash,
  HiOutlineTruck,
} from 'react-icons/hi2';

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function clampQty(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.floor(number));
}

function formatToman(value) {
  const number = Number(value || 0);

  return number > 0 ? number.toLocaleString('fa-IR') : '—';
}

function calcDiscountPercent(compareAt, price) {
  const compare = Number(compareAt || 0);

  const currentPrice = Number(price || 0);

  if (!(compare > 0 && currentPrice >= 0 && compare > currentPrice)) {
    return 0;
  }

  return Math.round(((compare - currentPrice) / compare) * 100);
}

/*
|--------------------------------------------------------------------------
| Gallery
|--------------------------------------------------------------------------
*/

function ProductGallery({ title, coverImage, images = [] }) {
  const list = useMemo(() => {
    const result = [];

    if (coverImage) {
      result.push(coverImage);
    }

    if (Array.isArray(images)) {
      images.forEach((image) => {
        if (image && !result.includes(image)) {
          result.push(image);
        }
      });
    }

    return result;
  }, [coverImage, images]);

  const [active, setActive] = useState(list[0] || null);

  const [activeImageError, setActiveImageError] = useState(false);

  useEffect(() => {
    setActive(list[0] || null);

    setActiveImageError(false);
  }, [list]);

  const selectImage = (src) => {
    setActive(src);
    setActiveImageError(false);
  };

  return (
    <SiteCard
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className='relative overflow-hidden p-3 sm:p-4'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
      />

      <div className='relative z-10'>
        {/* Main image */}
        <div className='relative aspect-square w-full overflow-hidden rounded-[24px] border border-black/5 bg-background-light/65 sm:rounded-[28px] dark:border-white/10 dark:bg-background-dark/45'>
          {active && !activeImageError ? (
            <>
              {/* Soft image background */}
              <Image
                src={active}
                alt=''
                fill
                aria-hidden='true'
                sizes='(max-width: 1024px) 100vw, 50vw'
                className='scale-110 object-cover opacity-[0.09] blur-2xl dark:opacity-[0.12]'
              />

              {/* Actual product image */}
              <Image
                src={active}
                alt={title || 'تصویر محصول'}
                fill
                priority
                sizes='(max-width: 640px) 95vw, (max-width: 1024px) 50vw, 600px'
                className='object-contain p-4 transition-transform duration-500 hover:scale-[1.02] sm:p-6 lg:p-8'
                onError={() => setActiveImageError(true)}
              />
            </>
          ) : (
            <div className='to-yellow/10 absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-secondary/10 via-transparent'>
              <span className='flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary/10 text-secondary'>
                <HiOutlinePhoto size={30} />
              </span>

              <span className='text-xs font-bold text-subtext-light dark:text-subtext-dark'>
                تصویری برای محصول ثبت نشده است
              </span>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {list.length > 1 && (
          <div className='custom-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1'>
            {list.map((src, index) => {
              const selected = src === active;

              return (
                <button
                  key={`${src}-${index}`}
                  type='button'
                  onClick={() => selectImage(src)}
                  aria-pressed={selected}
                  className={`relative aspect-square w-[74px] flex-none overflow-hidden rounded-2xl border bg-background-light/60 transition-all duration-200 sm:w-[82px] dark:bg-background-dark/40 ${
                    selected
                      ? 'border-secondary ring-2 ring-secondary/15'
                      : 'border-black/5 hover:border-secondary/25 dark:border-white/10'
                  }`}
                >
                  <Image
                    src={src}
                    alt={`${title} - تصویر ${index + 1}`}
                    fill
                    sizes='82px'
                    className='object-contain p-1.5'
                  />

                  {selected && (
                    <span className='absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-white shadow-md'>
                      <HiOutlineCheck size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </SiteCard>
  );
}

ProductGallery.propTypes = {
  title: PropTypes.string.isRequired,

  coverImage: PropTypes.string,

  images: PropTypes.array,
};

/*
|--------------------------------------------------------------------------
| Color Picker
|--------------------------------------------------------------------------
*/

function ColorPicker({ colors, value, onChange }) {
  const list = Array.isArray(colors) ? colors : [];

  if (!list.length) {
    return null;
  }

  return (
    <div className='mt-6'>
      <div className='mb-3 flex items-center gap-2'>
        <HiOutlineSwatch size={18} className='text-secondary' />

        <h3 className='text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
          انتخاب رنگ
        </h3>
      </div>

      <div className='flex flex-wrap gap-2'>
        {list.map((color) => {
          const active = value === color.id;

          return (
            <button
              key={color.id}
              type='button'
              aria-pressed={active}
              onClick={() => onChange?.(color.id)}
              title={color.name}
              className={`relative flex min-h-10 items-center gap-2 rounded-xl border px-3 text-[11px] font-bold transition-all duration-200 sm:text-xs ${
                active
                  ? 'border-secondary bg-secondary/10 text-secondary ring-2 ring-secondary/10'
                  : 'border-black/5 bg-background-light/50 text-text-light hover:border-secondary/25 dark:border-white/10 dark:bg-background-dark/35 dark:text-text-dark'
              }`}
            >
              <span
                className='h-4 w-4 rounded-full border border-black/10 shadow-sm'
                style={{
                  backgroundColor: color.hex,
                }}
              />

              <span>{color.name}</span>

              {active && <HiOutlineCheck size={14} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

ColorPicker.propTypes = {
  colors: PropTypes.array,

  value: PropTypes.number,

  onChange: PropTypes.func,
};

/*
|--------------------------------------------------------------------------
| Size Picker
|--------------------------------------------------------------------------
*/

function SizePicker({ sizes, value, onChange }) {
  const list = Array.isArray(sizes) ? sizes : [];

  if (!list.length) {
    return null;
  }

  return (
    <div className='mt-6'>
      <h3 className='mb-3 text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
        انتخاب سایز
      </h3>

      <div className='flex flex-wrap gap-2'>
        {list.map((size) => {
          const active = value === size.id;

          return (
            <button
              key={size.id}
              type='button'
              aria-pressed={active}
              onClick={() => onChange?.(size.id)}
              className={`min-h-10 min-w-12 rounded-xl border px-3 font-faNa text-xs font-black transition-all duration-200 ${
                active
                  ? 'border-secondary bg-secondary text-white shadow-[0_8px_22px_rgba(38,145,125,0.18)]'
                  : 'border-black/5 bg-background-light/50 text-text-light hover:border-secondary/25 hover:text-secondary dark:border-white/10 dark:bg-background-dark/35 dark:text-text-dark'
              }`}
            >
              {size.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

SizePicker.propTypes = {
  sizes: PropTypes.array,

  value: PropTypes.number,

  onChange: PropTypes.func,
};

/*
|--------------------------------------------------------------------------
| Product Details Page
|--------------------------------------------------------------------------
*/

export default function ProductDetailsPage({ product }) {
  const router = useRouter();

  const { isDark } = useTheme();

  const toast = useMemo(() => createToastHandler(isDark), [isDark]);

  const {
    items: shopItems,

    loading: shopLoading,
  } = useShopCart();

  const { addShopItem, updateShopItemQty, removeShopItem } =
    useShopCartActions();

  /*
  |--------------------------------------------------------------------------
  | Price
  |--------------------------------------------------------------------------
  */

  const price = Number(product.price || 0);

  const compareAt =
    product.compareAt != null ? Number(product.compareAt) : null;

  const hasDiscount = compareAt != null && compareAt > price;

  const discountPercent = useMemo(
    () => (hasDiscount ? calcDiscountPercent(compareAt, price) : 0),
    [hasDiscount, compareAt, price]
  );

  const isOut = (product.stock ?? 0) <= 0;

  /*
  |--------------------------------------------------------------------------
  | Variants
  |--------------------------------------------------------------------------
  */

  const availableColors = Array.isArray(product.colors) ? product.colors : [];

  const [selectedColorId, setSelectedColorId] = useState(
    availableColors[0]?.id ?? null
  );

  const availableSizes = Array.isArray(product.sizes) ? product.sizes : [];

  const [selectedSizeId, setSelectedSizeId] = useState(
    availableSizes[0]?.id ?? null
  );

  const needColor = availableColors.length > 0;

  const needSize = availableSizes.length > 0;

  /*
  |--------------------------------------------------------------------------
  | Current cart item
  |--------------------------------------------------------------------------
  */

  const currentItem = useMemo(() => {
    if (!Array.isArray(shopItems) || shopItems.length === 0) {
      return null;
    }

    return (
      shopItems.find((item) => {
        if (Number(item.productId) !== Number(product.id)) {
          return false;
        }

        const itemColor = item.colorId ?? null;

        const itemSize = item.sizeId ?? null;

        const selectedColor = selectedColorId ?? null;

        const selectedSize = selectedSizeId ?? null;

        return itemColor === selectedColor && itemSize === selectedSize;
      }) || null
    );
  }, [shopItems, product.id, selectedColorId, selectedSizeId]);

  const inCartQty = clampQty(currentItem?.qty);

  const canInteract = !isOut && !shopLoading;

  /*
  |--------------------------------------------------------------------------
  | Cart actions
  |--------------------------------------------------------------------------
  */

  const handleAddToCart = async () => {
    if (isOut) {
      toast.showErrorToast?.('این محصول ناموجود است.');

      return;
    }

    if (needColor && !selectedColorId) {
      toast.showErrorToast?.('لطفاً رنگ را انتخاب کنید.');

      return;
    }

    if (needSize && !selectedSizeId) {
      toast.showErrorToast?.('لطفاً سایز را انتخاب کنید.');

      return;
    }

    const response = await addShopItem({
      productId: product.id,

      colorId: selectedColorId,

      sizeId: selectedSizeId,

      qty: 1,
    });

    if (response?.meta?.requestStatus === 'fulfilled') {
      toast.showSuccessToast?.('به سبد خرید اضافه شد.');
    } else {
      toast.showErrorToast?.(response?.payload || 'خطا در افزودن به سبد خرید');
    }
  };

  const handleIncrease = async () => {
    if (!currentItem) {
      return;
    }

    if ((product.stock ?? 0) > 0 && inCartQty + 1 > (product.stock ?? 0)) {
      toast.showErrorToast?.(`موجودی کافی نیست. موجودی فعلی: ${product.stock}`);

      return;
    }

    const response = await updateShopItemQty({
      itemId: currentItem.id,

      qty: inCartQty + 1,
    });

    if (response?.meta?.requestStatus !== 'fulfilled') {
      toast.showErrorToast?.(response?.payload || 'خطا در افزایش تعداد');
    }
  };

  const handleDecrease = async () => {
    if (!currentItem) {
      return;
    }

    if (inCartQty <= 1) {
      const response = await removeShopItem({
        itemId: currentItem.id,
      });

      if (response?.meta?.requestStatus !== 'fulfilled') {
        toast.showErrorToast?.(response?.payload || 'خطا در حذف آیتم');
      }

      return;
    }

    const response = await updateShopItemQty({
      itemId: currentItem.id,

      qty: inCartQty - 1,
    });

    if (response?.meta?.requestStatus !== 'fulfilled') {
      toast.showErrorToast?.(response?.payload || 'خطا در کاهش تعداد');
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main
      dir='rtl'
      className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
    >
      <PageBackground />

      <div className='container relative z-10 mx-auto px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-6 lg:pb-24'>
        {/* =========================
            Breadcrumb
        ========================== */}
        <nav
          aria-label='مسیر صفحه'
          className='mb-4 flex flex-wrap items-center gap-2 text-[10px] font-medium text-subtext-light sm:mb-5 sm:text-xs dark:text-subtext-dark'
        >
          <Link
            href='/'
            className='flex items-center gap-1.5 transition-colors hover:text-secondary'
          >
            <HiOutlineHome size={14} />
            خانه
          </Link>

          <span className='opacity-40'>/</span>

          <Link
            href='/shop/products'
            className='transition-colors hover:text-secondary'
          >
            محصولات
          </Link>

          <span className='opacity-40'>/</span>

          <span className='max-w-[190px] truncate font-bold text-text-light sm:max-w-sm dark:text-text-dark'>
            {product.title}
          </span>
        </nav>

        {/* =========================
            Top
        ========================== */}
        <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-6 xl:gap-8'>
          {/* Gallery */}
          <ProductGallery
            title={product.title}
            coverImage={product.coverImage}
            images={product.images}
          />

          {/* =====================
              Buy Box
          ====================== */}
          <SiteCard
            as='section'
            variant='glass'
            padding='none'
            radius='lg'
            topLine
            className='relative overflow-hidden p-5 sm:p-6 lg:sticky lg:top-24'
          >
            <div
              aria-hidden='true'
              className='pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
            />

            <div
              aria-hidden='true'
              className='bg-yellow/10 pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full blur-[90px]'
            />

            <div className='relative z-10'>
              {/* Category */}
              {product.category?.title && (
                <SiteBadge variant='secondary' size='sm'>
                  <span className='flex items-center gap-1.5'>
                    <HiOutlineSparkles size={14} />

                    {product.category.title}
                  </span>
                </SiteBadge>
              )}

              {/* Title */}
              <h1 className='mt-3 text-xl font-black leading-9 text-text-light sm:text-2xl sm:leading-10 lg:text-[28px] dark:text-text-dark'>
                {product.title}
              </h1>

              {/* Stock */}
              <div className='mt-4 flex flex-wrap items-center gap-2'>
                {isOut ? (
                  <span className='inline-flex min-h-9 items-center gap-2 rounded-xl bg-black/70 px-3 text-[11px] font-bold text-white'>
                    <HiOutlineShoppingBag size={15} />
                    ناموجود
                  </span>
                ) : (
                  <span className='inline-flex min-h-9 items-center gap-2 rounded-xl border border-secondary/15 bg-secondary/10 px-3 text-[11px] font-bold text-secondary'>
                    <HiOutlineCheckCircle size={16} />
                    موجود و قابل سفارش
                  </span>
                )}

                {hasDiscount && discountPercent > 0 && (
                  <span className='inline-flex min-h-9 items-center rounded-xl bg-red px-3 font-faNa text-[11px] font-black text-white'>
                    ٪{discountPercent.toLocaleString('fa-IR')} تخفیف
                  </span>
                )}
              </div>

              {/* Price */}
              {!isOut && (
                <div className='mt-5 rounded-[20px] border border-black/5 bg-background-light/55 p-4 dark:border-white/10 dark:bg-background-dark/35'>
                  {hasDiscount && (
                    <div className='mb-1 flex items-center gap-1.5 text-subtext-light dark:text-subtext-dark'>
                      <span className='font-faNa text-xs line-through'>
                        {formatToman(compareAt)}
                      </span>

                      <span className='text-[10px]'>تومان</span>
                    </div>
                  )}

                  <div className='flex items-baseline gap-1.5'>
                    <strong className='font-faNa text-2xl font-black sm:text-3xl'>
                      {formatToman(price)}
                    </strong>

                    <span className='text-xs font-medium text-subtext-light dark:text-subtext-dark'>
                      تومان
                    </span>
                  </div>
                </div>
              )}

              {/* Color */}
              <ColorPicker
                colors={availableColors}
                value={selectedColorId}
                onChange={setSelectedColorId}
              />

              {/* Size */}
              <SizePicker
                sizes={availableSizes}
                value={selectedSizeId}
                onChange={setSelectedSizeId}
              />

              <div className='my-6 h-px bg-black/5 dark:bg-white/10' />

              {/* =====================
                  Cart actions
              ====================== */}
              {inCartQty > 0 ? (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between gap-4 rounded-[20px] border border-secondary/15 bg-secondary/5 p-3 dark:bg-secondary/10'>
                    <div>
                      <p className='text-[10px] font-bold text-secondary'>
                        در سبد خرید
                      </p>

                      <p className='mt-0.5 text-xs font-black text-text-light dark:text-text-dark'>
                        تعداد انتخاب‌شده
                      </p>
                    </div>

                    <div className='flex items-center gap-2 rounded-2xl border border-black/5 bg-surface-light/80 p-1.5 shadow-sm dark:border-white/10 dark:bg-surface-dark/75'>
                      <button
                        type='button'
                        disabled={!canInteract}
                        onClick={handleIncrease}
                        aria-label='افزایش تعداد'
                        className='flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40'
                      >
                        <HiOutlinePlus size={18} />
                      </button>

                      <span className='min-w-8 text-center font-faNa text-sm font-black text-text-light dark:text-text-dark'>
                        {inCartQty.toLocaleString('fa-IR')}
                      </span>

                      <button
                        type='button'
                        disabled={!canInteract}
                        onClick={handleDecrease}
                        aria-label={
                          inCartQty <= 1 ? 'حذف از سبد خرید' : 'کاهش تعداد'
                        }
                        className='flex h-9 w-9 items-center justify-center rounded-xl border border-black/5 bg-background-light text-text-light transition-all hover:border-secondary/25 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-background-dark dark:text-text-dark'
                      >
                        {inCartQty <= 1 ? (
                          <HiOutlineTrash size={18} />
                        ) : (
                          <HiOutlineMinus size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <SiteButton
                    href='/cart'
                    variant='primary'
                    size='lg'
                    startIcon={HiOutlineShoppingCart}
                    endIcon={HiOutlineArrowLeft}
                    className='w-full'
                  >
                    رفتن به سبد خرید
                  </SiteButton>
                </div>
              ) : (
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <SiteButton
                    type='button'
                    variant='primary'
                    size='lg'
                    startIcon={HiOutlineShoppingCart}
                    disabled={isOut || shopLoading}
                    onClick={handleAddToCart}
                    className='w-full sm:flex-1'
                  >
                    {isOut
                      ? 'ناموجود'
                      : shopLoading
                        ? 'در حال انجام...'
                        : 'افزودن به سبد خرید'}
                  </SiteButton>

                  <SiteButton
                    type='button'
                    variant='outline'
                    size='lg'
                    startIcon={HiOutlineArrowRight}
                    onClick={() => router.back()}
                    className='w-full sm:w-auto'
                  >
                    بازگشت
                  </SiteButton>
                </div>
              )}

              {/* =====================
                  Trust notes
              ====================== */}
              <div className='mt-5 grid gap-2'>
                <div className='flex items-start gap-3 rounded-2xl bg-background-light/45 p-3 dark:bg-background-dark/30'>
                  <HiOutlineArrowPath
                    size={19}
                    className='mt-0.5 shrink-0 text-secondary'
                  />

                  <p className='text-[10px] leading-6 text-subtext-light sm:text-[11px] dark:text-subtext-dark'>
                    تا ۷ روز پس از دریافت کالا، در صورت وجود مشکل می‌توانید
                    درخواست مرجوعی ثبت کنید.
                  </p>
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <div className='flex items-center gap-2 rounded-2xl bg-background-light/45 p-3 dark:bg-background-dark/30'>
                    <HiOutlineShieldCheck
                      size={18}
                      className='shrink-0 text-secondary'
                    />

                    <span className='text-[10px] font-bold text-subtext-light dark:text-subtext-dark'>
                      خرید امن
                    </span>
                  </div>

                  <div className='flex items-center gap-2 rounded-2xl bg-background-light/45 p-3 dark:bg-background-dark/30'>
                    <HiOutlineTruck
                      size={18}
                      className='shrink-0 text-secondary'
                    />

                    <span className='text-[10px] font-bold text-subtext-light dark:text-subtext-dark'>
                      ارسال سفارش
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SiteCard>
        </div>

        {/* =========================
            Description + Details
        ========================== */}
        <div className='mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]'>
          {/* Description */}
          <SiteCard
            as='section'
            variant='glass'
            padding='none'
            radius='lg'
            topLine
            className='relative overflow-hidden p-5 sm:p-6 lg:p-7'
          >
            <div
              aria-hidden='true'
              className='pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-secondary/[0.07] blur-[85px]'
            />

            <div className='relative z-10'>
              <div className='mb-5 flex items-center gap-3 border-b border-black/5 pb-4 dark:border-white/10'>
                <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                  <HiOutlineInformationCircle size={21} />
                </span>

                <div>
                  <p className='text-[10px] font-bold text-secondary'>
                    معرفی محصول
                  </p>

                  <h2 className='mt-0.5 text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                    توضیحات
                  </h2>
                </div>
              </div>

              {product.description ? (
                <p className='whitespace-pre-wrap text-sm leading-8 text-subtext-light sm:text-[15px] sm:leading-9 dark:text-subtext-dark'>
                  {product.description}
                </p>
              ) : (
                <div className='flex min-h-[150px] flex-col items-center justify-center text-center'>
                  <HiOutlineInformationCircle
                    size={30}
                    className='text-secondary/40'
                  />

                  <p className='mt-3 text-xs text-subtext-light dark:text-subtext-dark'>
                    توضیحی برای این محصول ثبت نشده است.
                  </p>
                </div>
              )}
            </div>
          </SiteCard>

          <DetailsTable
            details={product.details}
            weightGram={product.weightGram}
          />
        </div>
      </div>
    </main>
  );
}

ProductDetailsPage.propTypes = {
  product: PropTypes.object.isRequired,
};
