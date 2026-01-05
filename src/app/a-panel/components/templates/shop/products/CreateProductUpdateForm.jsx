/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Input from '@/components/Ui/Input/Input';
import TextArea from '@/components/Ui/TextArea/TextArea';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import Button from '@/components/Ui/Button/Button';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { ImSpinner2 } from 'react-icons/im';
import { FaCircleCheck } from 'react-icons/fa6';
import { IoIosCloseCircle } from 'react-icons/io';
import { IoClose } from 'react-icons/io5';

import ImagePickerSingle from './ImagePickerSingle';
import ImagePickerMultiple from './ImagePickerMultiple';
import ProductColorsSection from './ProductColorsSection';
import ProductSizesSection from './ProductSizesSection.jsx';

function normalizeSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isMeaningfulSlug(s) {
  return /[a-z0-9\u0600-\u06FF]/i.test(String(s || ''));
}

function safeNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function CreateProductUpdateForm({ productToUpdate }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  // ---- states
  const [title, setTitle] = useState(productToUpdate?.title || '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [slug, setSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState(''); // '', 'loading', 'valid', 'invalid'
  const [slugError, setSlugError] = useState('');
  const [slugDebounceTimer, setSlugDebounceTimer] = useState(null);
  const [description, setDescription] = useState(
    productToUpdate?.description || ''
  );

  const [isActive, setIsActive] = useState(productToUpdate?.isActive ?? true);

  const [price, setPrice] = useState(
    productToUpdate?.price != null ? String(productToUpdate.price) : ''
  );
  const [compareAt, setCompareAt] = useState(
    productToUpdate?.compareAt != null ? String(productToUpdate.compareAt) : ''
  );

  const [stock, setStock] = useState(
    productToUpdate?.stock != null ? String(productToUpdate.stock) : '0'
  );

  const [weightGram, setWeightGram] = useState(
    productToUpdate?.weightGram != null
      ? String(productToUpdate.weightGram)
      : ''
  );

  // ✅ NEW: package box type id
  const [packageBoxTypeId, setPackageBoxTypeId] = useState(() => {
    const v = productToUpdate?.packageBoxTypeId;
    return v != null ? Number(v) : undefined; // undefined => "انتخاب نشده"
  });

  const [coverImage, setCoverImage] = useState(() => {
    if (productToUpdate?.coverImage) return productToUpdate.coverImage;
    return '';
  });
  const [images, setImages] = useState(productToUpdate?.images || []);

  // category
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(
    productToUpdate?.categoryId != null
      ? Number(productToUpdate.categoryId)
      : undefined
  );

  const categoryOptions = useMemo(() => {
    return categories.map((c) => ({ label: c.title, value: c.id }));
  }, [categories]);

  // ✅ NEW: postex boxes options
  const [boxes, setBoxes] = useState([]);
  const [boxesLoading, setBoxesLoading] = useState(false);

  const boxOptions = useMemo(() => {
    // label خوش‌خوان: "جعبه سایز 2 (10*15*20)"
    return (boxes || []).map((b) => ({
      label: b.boxTypeName,
      value: b.id,
    }));
  }, [boxes]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [details, setDetails] = useState(() => {
    const d = productToUpdate?.details;
    if (Array.isArray(d)) return d;
    return [];
  });

  const [colors, setColors] = useState(() => {
    const list = productToUpdate?.colors;
    if (!Array.isArray(list)) return [];
    return list
      .filter((c) => c && c.id)
      .map((c) => ({
        id: Number(c.id),
        name: String(c.name || ''),
        hex: String(c.hex || '#000000'),
      }));
  });

  const [sizes, setSizes] = useState(() => {
    const list = productToUpdate?.sizes;
    if (!Array.isArray(list)) return [];
    return list
      .filter((s) => s && s.id)
      .map((s) => ({
        id: Number(s.id),
        name: String(s.name || ''),
        slug: String(s.slug || ''),
      }));
  });

  // ---- fetch categories
  useEffect(() => {
    (async () => {
      try {
        setCategoriesLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/categories`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (!res.ok) {
          setCategories([]);
          return;
        }
        const list = Array.isArray(data) ? data : data?.items || [];
        setCategories(list);
      } catch (e) {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  // ✅ NEW: fetch postex boxes for dropdown
  useEffect(() => {
    (async () => {
      try {
        setBoxesLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/postex/boxes`,
          { cache: 'no-store' }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success) {
          setBoxes([]);
          return;
        }
        setBoxes(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        setBoxes([]);
      } finally {
        setBoxesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (productToUpdate?.id) return;
    if (slugTouched) return;
    if (!title?.trim()) return;

    const s = normalizeSlug(title);

    setSlug(s);
    setSlugInput(s);

    if (slugDebounceTimer) clearTimeout(slugDebounceTimer);
    const t = setTimeout(() => validateSlug(s), 1000);
    setSlugDebounceTimer(t);
  }, [title, slugTouched]);

  useEffect(() => {
    if (!productToUpdate?.id) return;

    const savedSlug = String(productToUpdate.slug || '');
    setSlugInput(savedSlug);
    setSlug(savedSlug);

    setSlugStatus(savedSlug.length >= 3 ? 'valid' : '');
    setSlugError('');

    if (slugDebounceTimer) {
      clearTimeout(slugDebounceTimer);
      setSlugDebounceTimer(null);
    }
    setSlugTouched(true);

    // ✅ NEW: ensure packageBoxTypeId is set for edit
    if (productToUpdate?.packageBoxTypeId != null) {
      setPackageBoxTypeId(Number(productToUpdate.packageBoxTypeId));
    }
  }, [productToUpdate?.id]);

  // ---- helpers
  const validate = () => {
    const next = {};

    if (!title.trim()) next.title = 'عنوان محصول الزامی است.';

    if (!slug.trim() || slug.length < 3)
      next.slug = 'اسلاگ باید حداقل ۳ کاراکتر باشد.';
    if (slugStatus === 'invalid') next.slug = slugError || 'اسلاگ معتبر نیست.';
    if (slugStatus === 'loading')
      next.slug = 'لطفاً تا پایان بررسی اسلاگ صبر کنید.';

    const p = safeNumber(price, NaN);
    if (!Number.isFinite(p) || p <= 0)
      next.price = 'قیمت باید عددی معتبر و بزرگتر از صفر باشد.';

    if (compareAt !== '' && compareAt != null) {
      const c = safeNumber(compareAt, NaN);
      if (!Number.isFinite(c) || c < 0)
        next.compareAt = 'قیمت قبل تخفیف معتبر نیست.';
    }

    const st = safeNumber(stock, NaN);
    if (!Number.isFinite(st) || st < 0) next.stock = 'موجودی معتبر نیست.';

    if (weightGram !== '' && weightGram != null) {
      const w = safeNumber(weightGram, NaN);
      if (!Number.isFinite(w) || w < 0) next.weightGram = 'وزن معتبر نیست.';
    }

    // بسته‌بندی اجباری نیست (اما پیشنهاد میشه)
    // اگر خواستی اجباری بشه این ۲ خط رو فعال کن:
    // if (packageBoxTypeId == null) next.packageBoxTypeId = 'نوع بسته‌بندی را انتخاب کنید.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  async function validateSlug(nextSlug) {
    const s = normalizeSlug(nextSlug);

    if (!s || s.length < 3) {
      setSlugStatus('invalid');
      setSlugError('اسلاگ باید حداقل ۳ کاراکتر باشد.');
      return false;
    }

    if (!/^[a-z0-9\u0600-\u06FF-]+$/i.test(s)) {
      setSlugStatus('invalid');
      setSlugError(
        'اسلاگ فقط می‌تواند شامل حروف فارسی/انگلیسی، اعداد و "-" باشد.'
      );
      return false;
    }

    setSlugStatus('loading');
    setSlugError('');

    try {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/products/validate-slug`
      );
      url.searchParams.set('slug', s);
      if (productToUpdate?.id)
        url.searchParams.set('excludeId', String(productToUpdate.id));

      const res = await fetch(url.toString(), { cache: 'no-store' });
      const data = await res.json();

      if (data?.isValid) {
        setSlugStatus('valid');
        setSlugError('');
        return true;
      } else {
        setSlugStatus('invalid');
        setSlugError(data?.message || 'این اسلاگ قابل استفاده نیست.');
        return false;
      }
    } catch (e) {
      setSlugStatus('invalid');
      setSlugError('خطا در بررسی اسلاگ');
      return false;
    }
  }

  const flushSlugValidation = async () => {
    if (slugDebounceTimer) {
      clearTimeout(slugDebounceTimer);
      setSlugDebounceTimer(null);
    }
    return await validateSlug(slug);
  };

  const handleSlugInputChange = (val) => {
    setSlugTouched(true);

    setSlugInput(val);
    const next = normalizeSlug(val);
    setSlug(next);

    if (slugDebounceTimer) clearTimeout(slugDebounceTimer);

    const t = setTimeout(() => {
      validateSlug(next);
    }, 1000);

    setSlugDebounceTimer(t);
  };

  const addDetailRow = () => setDetails((p) => [...p, { key: '', value: '' }]);

  const updateDetailRow = (idx, field, value) => {
    setDetails((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const removeDetailRow = (idx) => {
    setDetails((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (slugStatus === 'loading') {
      toast.showErrorToast('لطفاً چند لحظه صبر کنید تا بررسی اسلاگ تمام شود.');
      return;
    }

    if (slugStatus !== 'valid') {
      const ok = await flushSlugValidation();
      if (!ok) {
        toast.showErrorToast('اسلاگ معتبر نیست. لطفاً اصلاح کنید.');
        return;
      }
    }

    const finalSlug = normalizeSlug(slug || title);

    if (!finalSlug || finalSlug.length < 3 || !isMeaningfulSlug(finalSlug)) {
      toast.showErrorToast('اسلاگ معتبر نیست. لطفاً یک اسلاگ مناسب وارد کنید.');
      return;
    }

    if (!validate()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید.');
      return;
    }

    setLoading(true);

    const normalizedDetails = details
      .map((x) => ({
        key: String(x.key || '').trim(),
        value: String(x.value || '').trim(),
      }))
      .filter((x) => x.key && x.value);

    const payload = {
      title: title.trim(),
      slug: finalSlug,
      description: description?.trim() ? description : null,
      isActive: !!isActive,
      price: safeNumber(price, 0),
      compareAt: compareAt === '' ? null : safeNumber(compareAt, null),
      stock: safeNumber(stock, 0),
      weightGram: weightGram === '' ? null : safeNumber(weightGram, null),
      coverImage,
      images,
      colorIds: colors.map((c) => c.id),
      sizeIds: sizes.map((s) => s.id),
      categoryId: categoryId ?? null,
      details: normalizedDetails,

      // ✅ NEW
      packageBoxTypeId:
        packageBoxTypeId == null ? null : Number(packageBoxTypeId),
    };

    try {
      let res;

      if (productToUpdate?.id) {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/products/${productToUpdate.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
      } else {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/products`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.showErrorToast(data?.error || 'خطا در ثبت اطلاعات محصول');
        return;
      }

      toast.showSuccessToast(
        productToUpdate?.id
          ? 'محصول با موفقیت بروزرسانی شد'
          : 'محصول با موفقیت ساخته شد'
      );

      router.replace('/a-panel/shop/products');
    } catch (e) {
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* head */}
      <div className='flex items-center justify-between'>
        <h1 className='text-base font-semibold xs:text-xl'>
          {productToUpdate ? 'ویرایش محصول' : 'ثبت محصول جدید'}
        </h1>
        <Button onClick={handleSubmit} shadow isLoading={loading}>
          {productToUpdate ? 'به روزرسانی' : 'ثبت محصول'}
        </Button>
      </div>

      {/* form */}
      <div className='my-10 grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <Input
          label='عنوان'
          placeholder='عنوان محصول را وارد کنید'
          value={title}
          onChange={setTitle}
          errorMessage={errors.title}
          className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
        />

        <div className='relative'>
          <Input
            label='اسلاگ'
            placeholder='مثال: yoga-mat'
            value={slugInput}
            onChange={handleSlugInputChange}
            errorMessage={slugError || errors.slug}
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />

          {slugStatus === 'loading' && (
            <ImSpinner2
              size={20}
              className='absolute left-2 top-11 animate-spin text-subtext-light dark:text-subtext-dark'
            />
          )}
          {slugStatus === 'valid' && (
            <FaCircleCheck
              size={20}
              className='text-green-light dark:text-green-dark absolute left-2 top-11'
            />
          )}
          {slugStatus === 'invalid' && slug.length >= 1 && (
            <IoIosCloseCircle
              size={20}
              className='absolute left-2 top-11 text-red'
            />
          )}
        </div>

        <DropDown
          label='دسته‌بندی (اختیاری)'
          options={categoryOptions}
          placeholder={
            categoriesLoading
              ? 'در حال دریافت دسته‌بندی‌ها...'
              : 'انتخاب دسته‌بندی'
          }
          value={categoryId ?? undefined}
          onChange={(val) => setCategoryId(val ? Number(val) : undefined)}
          fullWidth
          className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
          optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
        />

        <Input
          label='موجودی'
          placeholder='مثلاً 10'
          value={stock}
          onChange={setStock}
          errorMessage={errors.stock}
          className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
        />

        <Input
          label='قیمت'
          placeholder='قیمت را وارد کنید'
          value={price}
          onChange={setPrice}
          errorMessage={errors.price}
          thousandSeparator={true}
          className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
        />

        <Input
          label='قیمت قبل تخفیف (اختیاری)'
          placeholder='در صورت نیاز وارد کنید'
          value={compareAt}
          onChange={setCompareAt}
          errorMessage={errors.compareAt}
          thousandSeparator={true}
          className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
        />

        <Input
          label='وزن (گرم)'
          placeholder='مثلاً 800'
          value={weightGram}
          onChange={setWeightGram}
          errorMessage={errors.weightGram}
          className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
        />

        {/* ✅ NEW: Box type dropdown */}
        <DropDown
          label='نوع بسته‌بندی (Postex)'
          options={boxOptions}
          placeholder={
            boxesLoading
              ? 'در حال دریافت لیست بسته‌بندی...'
              : 'انتخاب بسته‌بندی'
          }
          value={packageBoxTypeId ?? undefined}
          onChange={(val) => setPackageBoxTypeId(val ? Number(val) : undefined)}
          fullWidth
          className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
          optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
        />
        {errors.packageBoxTypeId && (
          <div className='-mt-4 text-xs text-red'>
            {errors.packageBoxTypeId}
          </div>
        )}

        <div className='col-span-1 flex flex-col items-center gap-6 sm:col-span-2 sm:flex-row'>
          <ProductColorsSection value={colors} onChange={setColors} />
          <ProductSizesSection value={sizes} onChange={setSizes} />
        </div>

        <div className='col-span-1 sm:col-span-2'>
          <TextArea
            label='توضیحات (اختیاری)'
            placeholder='توضیحات محصول را وارد کنید'
            value={description}
            onChange={setDescription}
            className='bg-surface-light text-sm placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark'
          />
        </div>

        <div className='col-span-1 sm:col-span-2'>
          <h2 className='mb-3 text-sm font-semibold xs:text-base'>
            جزئیات محصول
          </h2>

          <div className='space-y-3'>
            {details.length === 0 ? (
              <p className='text-xs text-subtext-light dark:text-subtext-dark'>
                هنوز جزئیاتی اضافه نشده است.
              </p>
            ) : (
              details.map((row, idx) => (
                <div
                  key={idx}
                  className='grid grid-cols-1 gap-3 sm:grid-cols-2'
                >
                  <Input
                    label='کلید'
                    placeholder='مثال: جنس'
                    value={row.key}
                    onChange={(v) => updateDetailRow(idx, 'key', v)}
                    className='bg-surface-light text-sm text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
                  />
                  <div className='relative'>
                    <Input
                      label='مقدار'
                      placeholder='مثال: چرم'
                      value={row.value}
                      onChange={(v) => updateDetailRow(idx, 'value', v)}
                      className='bg-surface-light text-sm text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
                    />
                    <button
                      type='button'
                      onClick={() => removeDetailRow(idx)}
                      className='absolute left-2 top-11 text-red hover:opacity-80'
                      title='حذف'
                    >
                      <IoClose size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}

            <Button shadow className='w-fit text-xs' onClick={addDetailRow}>
              افزودن جزئیات جدید
            </Button>
          </div>
        </div>

        {/* Images */}
        <div className='col-span-1 sm:col-span-2'>
          <h2 className='mb-3 text-sm font-semibold xs:text-base'>
            تصاویر محصول
          </h2>
          <div className='flex flex-col gap-6 md:flex-row'>
            <ImagePickerSingle
              title='کاور محصول'
              value={coverImage}
              onChange={setCoverImage}
              folderPath={`images/shop_products/${title || 'untitled'}/cover`}
              required
              canUpload={!!title?.trim()}
              blockedMessage='ابتدا عنوان محصول را وارد کنید.'
              previewSize={96}
            />

            <ImagePickerMultiple
              title='گالری تصاویر'
              values={images}
              onChange={setImages}
              folderPath={`images/shop_products/${title || 'untitled'}/gallery`}
              canUpload={!!title?.trim()}
              blockedMessage='ابتدا عنوان محصول را وارد کنید.'
            />
          </div>
        </div>

        <Checkbox
          label='محصول فعال باشد؟'
          checked={!!isActive}
          onChange={setIsActive}
          className='mt-4'
          labelClass='text-xs xs:text-sm lg:text-base'
        />
      </div>
    </div>
  );
}

CreateProductUpdateForm.propTypes = {
  productToUpdate: PropTypes.object,
};

export default CreateProductUpdateForm;
