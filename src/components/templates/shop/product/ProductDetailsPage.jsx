// components/templates/shop/product/ProductDetailsPage.jsx
'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/Ui/Button/Button';
import DetailsTable from './DetailsTable';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import { useShopCartActions } from '@/hooks/shopCart/useShopCartActions';
import { useShopCart } from '@/hooks/shopCart/useShopCart';
import { TiMinus, TiPlus, TiTrash } from 'react-icons/ti';

function clampQty(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function formatToman(v) {
  const n = Number(v || 0);
  return n > 0 ? n.toLocaleString('fa-IR') : '—';
}

function calcDiscountPercent(compareAt, price) {
  const c = Number(compareAt || 0);
  const p = Number(price || 0);
  if (!(c > 0 && p >= 0 && c > p)) return 0;
  return Math.round(((c - p) / c) * 100);
}

function ProductGallery({ title, coverImage, images = [] }) {
  const list = useMemo(() => {
    const arr = [];
    if (coverImage) arr.push(coverImage);
    if (Array.isArray(images)) {
      for (const img of images) if (img && !arr.includes(img)) arr.push(img);
    }
    return arr;
  }, [coverImage, images]);

  const [active, setActive] = useState(list[0] || null);

  return (
    <div className='space-y-3'>
      <div className='relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-foreground-light dark:bg-foreground-dark'>
        {active ? (
          <Image
            src={active}
            alt={title}
            fill
            className='object-cover'
            priority
          />
        ) : (
          <div className='flex h-full items-center justify-center text-xs text-subtext-light dark:text-subtext-dark'>
            بدون تصویر
          </div>
        )}
      </div>

      {list.length > 1 && (
        <div className='custom-scrollbar flex gap-2 overflow-x-auto pb-1'>
          {list.map((src) => (
            <button
              key={src}
              type='button'
              onClick={() => setActive(src)}
              className={`relative h-16 w-20 flex-none overflow-hidden rounded-xl border transition ${
                src === active
                  ? 'border-2 border-accent'
                  : 'border-foreground-light dark:border-foreground-dark'
              }`}
              title='تصویر'
            >
              <Image src={src} alt={title} fill className='object-cover' />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

ProductGallery.propTypes = {
  title: PropTypes.string.isRequired,
  coverImage: PropTypes.string,
  images: PropTypes.array,
};

function DetailsJson({ details }) {
  if (!details) return null;

  if (typeof details === 'string') {
    return (
      <pre className='whitespace-pre-wrap break-words rounded-2xl bg-foreground-light p-4 text-xs dark:bg-foreground-dark'>
        {details}
      </pre>
    );
  }

  return (
    <pre className='whitespace-pre-wrap break-words rounded-2xl bg-foreground-light p-4 text-xs dark:bg-foreground-dark'>
      {JSON.stringify(details, null, 2)}
    </pre>
  );
}

DetailsJson.propTypes = {
  details: PropTypes.any,
};

function ColorPicker({ colors, value, onChange }) {
  const list = Array.isArray(colors) ? colors : [];
  if (!list.length) return null;

  return (
    <div className='mt-5'>
      <div className='mb-2 text-sm font-semibold'>انتخاب رنگ</div>
      <div className='flex flex-wrap gap-2'>
        {list.map((c) => {
          const active = value === c.id;
          return (
            <button
              key={c.id}
              type='button'
              onClick={() => onChange?.(c.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                active
                  ? 'border-2 border-accent'
                  : 'border-foreground-light bg-surface-light dark:border-foreground-dark dark:bg-surface-dark'
              }`}
              title={c.name}
            >
              <span
                className='h-4 w-4 rounded-full border'
                style={{ backgroundColor: c.hex }}
              />
              <span>{c.name}</span>
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

function SizePicker({ sizes, value, onChange }) {
  const list = Array.isArray(sizes) ? sizes : [];
  if (!list.length) return null;

  return (
    <div className='mt-5'>
      <div className='mb-2 text-sm font-semibold'>انتخاب سایز</div>
      <div className='flex flex-wrap gap-2'>
        {list.map((s) => {
          const active = value === s.id;
          return (
            <button
              key={s.id}
              type='button'
              onClick={() => onChange?.(s.id)}
              className={`rounded-xl border px-3 py-2 text-xs transition ${
                active
                  ? 'border-2 border-accent'
                  : 'border-foreground-light bg-surface-light dark:border-foreground-dark dark:bg-surface-dark'
              }`}
              title={s.name}
            >
              <span className='font-faNa font-bold'>{s.name}</span>
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

export default function ProductDetailsPage({ product }) {
  const { isDark } = useTheme();
  const toast = useMemo(() => createToastHandler(isDark), [isDark]);
  const { items: shopItems, loading: shopLoading } = useShopCart();
  const { addShopItem, updateShopItemQty, removeShopItem } =
    useShopCartActions();

  const price = Number(product.price || 0);
  const compareAt =
    product.compareAt != null ? Number(product.compareAt) : null;
  const hasDiscount = compareAt != null && compareAt > price;
  const discountPercent = useMemo(
    () => (hasDiscount ? calcDiscountPercent(compareAt, price) : 0),
    [hasDiscount, compareAt, price]
  );

  const isOut = (product.stock ?? 0) <= 0;

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

    const res = await addShopItem({
      productId: product.id,
      colorId: selectedColorId,
      sizeId: selectedSizeId,
      qty: 1,
    });

    if (res?.meta?.requestStatus === 'fulfilled') {
      toast.showSuccessToast?.('به سبد خرید اضافه شد.');
    } else {
      toast.showErrorToast?.(res?.payload || 'خطا در افزودن به سبد خرید');
    }
  };

  const handleIncrease = async () => {
    if (!currentItem) return;

    // چک موجودی
    if ((product.stock ?? 0) > 0 && inCartQty + 1 > (product.stock ?? 0)) {
      toast.showErrorToast?.(`موجودی کافی نیست. موجودی فعلی: ${product.stock}`);
      return;
    }

    const res = await updateShopItemQty({
      itemId: currentItem.id,
      qty: inCartQty + 1,
    });

    if (res?.meta?.requestStatus !== 'fulfilled') {
      toast.showErrorToast?.(res?.payload || 'خطا در افزایش تعداد');
    }
  };

  const handleDecrease = async () => {
    if (!currentItem) return;

    if (inCartQty <= 1) {
      const res = await removeShopItem({ itemId: currentItem.id });
      if (res?.meta?.requestStatus !== 'fulfilled') {
        toast.showErrorToast?.(res?.payload || 'خطا در حذف آیتم');
      }
      return;
    }

    const res = await updateShopItemQty({
      itemId: currentItem.id,
      qty: inCartQty - 1,
    });

    if (res?.meta?.requestStatus !== 'fulfilled') {
      toast.showErrorToast?.(res?.payload || 'خطا در کاهش تعداد');
    }
  };

  const currentItem = useMemo(() => {
    if (!Array.isArray(shopItems) || shopItems.length === 0) return null;

    return (
      shopItems.find((it) => {
        if (Number(it.productId) !== Number(product.id)) return false;

        const itColor = it.colorId ?? null;
        const itSize = it.sizeId ?? null;

        const selColor = selectedColorId ?? null;
        const selSize = selectedSizeId ?? null;

        return itColor === selColor && itSize === selSize;
      }) || null
    );
  }, [shopItems, product.id, selectedColorId, selectedSizeId]);

  const inCartQty = clampQty(currentItem?.qty);

  const canInteract = !isOut && !shopLoading;

  return (
    <div className='container py-6'>
      {/* breadcrumb */}
      <div className='mb-4 text-xs text-subtext-light dark:text-subtext-dark'>
        <Link href='/shop/products' className='hover:underline'>
          محصولات
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-text-light dark:text-text-dark'>
          {product.title}
        </span>
      </div>

      {/* TOP: همان حالت قبلی (دو ستون) - فقط جلوگیری از stretch */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start'>
        {/* gallery */}
        <ProductGallery
          title={product.title}
          coverImage={product.coverImage}
          images={product.images}
        />

        {/* info (قیمت + رنگ + دکمه‌ها داخل همین باکس) */}
        <div className='rounded-2xl border border-foreground-light bg-surface-light p-4 dark:border-foreground-dark dark:bg-surface-dark'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <h1 className='text-base font-semibold xs:text-xl'>
              {product.title}
            </h1>

            {product.category?.title && (
              <span className='rounded-full bg-foreground-light px-3 py-1 text-xs dark:bg-foreground-dark'>
                {product.category.title}
              </span>
            )}
          </div>

          <div className='mt-3 flex items-center gap-2'>
            {isOut ? (
              <span className='rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white sm:text-sm md:text-base xl:text-lg'>
                ناموجود
              </span>
            ) : (
              <span className='rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700'>
                موجود
              </span>
            )}
          </div>

          {!isOut && (
            <div className='mt-4 space-y-1'>
              {hasDiscount && (
                <div className='flex flex-wrap-reverse items-center justify-between gap-2'>
                  <div className='flex items-baseline gap-1'>
                    <span className='text-sm text-subtext-light line-through dark:text-subtext-dark'>
                      {formatToman(compareAt)}
                    </span>
                    <span className='text-2xs text-subtext-light dark:text-subtext-dark'>
                      تومان
                    </span>
                  </div>

                  {discountPercent > 0 && (
                    <span className='rounded-lg bg-red px-2 py-1 font-faNa text-xs font-bold text-white md:text-sm'>
                      {discountPercent}٪ تخفیف
                    </span>
                  )}
                </div>
              )}

              <div className='flex items-baseline gap-1'>
                <span className='font-faNa text-xl font-bold md:text-2xl'>
                  {formatToman(price)}
                </span>
                <span className='text-xs'>تومان</span>
              </div>
            </div>
          )}

          <ColorPicker
            colors={availableColors}
            value={selectedColorId}
            onChange={setSelectedColorId}
          />

          <SizePicker
            sizes={availableSizes}
            value={selectedSizeId}
            onChange={setSelectedSizeId}
          />

          {/* actions */}
          <div className='mt-6 flex flex-col justify-between gap-2 xs:flex-row xs:items-center'>
            {inCartQty > 0 ? (
              <>
                {/* کنترل تعداد */}
                <div className='flex items-center justify-between gap-2 rounded-xl border border-foreground-light bg-surface-light px-3 py-2 dark:border-foreground-dark dark:bg-surface-dark'>
                  <Button
                    className='flex h-9 w-9 items-center justify-center !px-0 text-base'
                    shadow
                    disabled={!canInteract}
                    onClick={handleIncrease}
                    title='افزایش'
                  >
                    <TiPlus size={20} />
                  </Button>

                  <span className='min-w-10 text-center font-faNa text-base font-bold'>
                    {inCartQty.toLocaleString('fa-IR')}
                  </span>

                  <Button
                    className='flex h-9 w-9 items-center justify-center !px-0 text-base'
                    shadow
                    disabled={!canInteract}
                    onClick={handleDecrease}
                    title={inCartQty <= 1 ? 'حذف از سبد' : 'کاهش'}
                  >
                    {inCartQty <= 1 ? (
                      <TiTrash size={24} />
                    ) : (
                      <TiMinus size={20} />
                    )}
                  </Button>
                </div>

                {/* رفتن به سبد خرید */}
                <Link href='/cart' className='xs:w-auto'>
                  <Button
                    shadow
                    className='w-full text-xs font-semibold sm:text-sm'
                    disabled={shopLoading}
                  >
                    رفتن به سبد خرید
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  shadow
                  className='text-xs font-semibold xs:flex-1 sm:text-sm'
                  disabled={isOut || shopLoading}
                  onClick={handleAddToCart}
                >
                  {isOut
                    ? 'ناموجود'
                    : shopLoading
                      ? 'در حال انجام...'
                      : 'افزودن به سبد خرید'}
                </Button>

                <Button
                  className='text-xs'
                  onClick={() => window.history.back()}
                >
                  بازگشت
                </Button>
              </>
            )}
          </div>
          <ul className='mt-6 list-disc pr-4'>
            <li className='text-2xs text-subtext-light dark:text-subtext-dark'>
              شما می‌توانید تا ۷ روز بعد از دریافت کالا، در صورت وجود مشکل،
              درخواست مرجوعی ثبت کنید.
            </li>
          </ul>
        </div>
      </div>

      {/* BOTTOM: توضیحات و جزئیات کنار هم (مثل قبل) */}
      <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start'>
        <section className='rounded-2xl border border-foreground-light bg-surface-light p-4 dark:border-foreground-dark dark:bg-surface-dark'>
          <h2 className='mb-2 text-sm font-semibold'>توضیحات</h2>
          {product.description ? (
            <p className='whitespace-pre-wrap text-sm leading-7'>
              {product.description}
            </p>
          ) : (
            <p className='text-sm text-subtext-light dark:text-subtext-dark'>
              توضیحی برای این محصول ثبت نشده است.
            </p>
          )}
        </section>

        <DetailsTable
          details={product.details}
          weightGram={product.weightGram}
        />
      </div>
    </div>
  );
}

ProductDetailsPage.propTypes = {
  product: PropTypes.object.isRequired,
};
