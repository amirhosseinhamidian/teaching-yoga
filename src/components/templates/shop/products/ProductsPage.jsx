/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineShoppingBag,
} from 'react-icons/hi2';

import { useTheme } from '@/contexts/ThemeContext';

import { createToastHandler } from '@/utils/toastHandler';

import { parseShopQuery, buildShopQuery } from '@/utils/shopQuery';

import { useShopProductsQuery } from '@/hooks/useShopProductsQuery';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import ProductsActiveChips from './ProductsActiveChips';
import ProductsGrid from './ProductsGrid';
import ProductsFiltersPanel from './ProductsFiltersPanel';
import ProductsMobileFiltersButton from './ProductsMobileFiltersButton';
import PageIntro from '@/components/SiteUi/PageIntro/PageIntro';

export default function ProductsPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const { isDark } = useTheme();

  const toast = useMemo(() => createToastHandler(isDark), [isDark]);

  /*
  |--------------------------------------------------------------------------
  | Query
  |--------------------------------------------------------------------------
  */

  const initial = useMemo(() => parseShopQuery(searchParams), [searchParams]);

  const [query, setQuery] = useState(initial);

  const categorySlug = (searchParams.get('category') || '').trim();

  const [slugResolved, setSlugResolved] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | URL → State
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setQuery(parseShopQuery(searchParams));

    setSlugResolved(false);
  }, [searchParams]);

  /*
  |--------------------------------------------------------------------------
  | Resolve category slug
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let ignore = false;

    async function resolveSlug() {
      if (!categorySlug || query.categoryId) {
        setSlugResolved(true);

        return;
      }

      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';

        const res = await fetch(
          `${base}/api/shop/categories/resolve?slug=${encodeURIComponent(
            categorySlug
          )}`,
          {
            cache: 'no-store',
          }
        );

        const json = await res.json().catch(() => ({}));

        const catId = json?.data?.id || null;

        if (ignore) {
          return;
        }

        setQuery((prev) => ({
          ...prev,

          categoryId: catId,

          page: 1,

          sort: catId ? prev.sort || 'newest' : 'newest',
        }));

        setSlugResolved(true);
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setSlugResolved(true);
        }
      }
    }

    resolveSlug();

    return () => {
      ignore = true;
    };
  }, [categorySlug, query.categoryId]);

  /*
  |--------------------------------------------------------------------------
  | Products
  |--------------------------------------------------------------------------
  */

  const { loading, items, totalPages, colors, categories } =
    useShopProductsQuery(query, toast);

  /*
  |--------------------------------------------------------------------------
  | State → URL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!slugResolved) {
      return;
    }

    const next = {
      ...query,
    };

    const qs = buildShopQuery(next);

    const currentQs = searchParams?.toString?.() || '';

    if (qs !== currentQs) {
      router.replace(`/shop/products?${qs}`);
    }
  }, [
    slugResolved,
    query.search,
    query.categoryId,
    query.inStock,
    query.minPrice,
    query.maxPrice,
    query.sort,
    query.page,
    query.pageSize,
    (query.colorIds || []).join(','),
    router,
    searchParams,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Derived
  |--------------------------------------------------------------------------
  */

  const hasFilters =
    Boolean(query.categoryId) ||
    Boolean(query.inStock) ||
    (query.minPrice !== '' && query.minPrice != null) ||
    (query.maxPrice !== '' && query.maxPrice != null) ||
    (query.colorIds?.length || 0) > 0 ||
    (query.search || '').trim().length > 0;

  const canPriceSort = Boolean(query.categoryId);

  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const setSearch = (value) =>
    setQuery((prev) => ({
      ...prev,

      search: value,

      page: 1,
    }));

  const applyFilters = (nextFilters) => {
    setQuery((prev) => ({
      ...prev,

      ...nextFilters,

      sort: nextFilters.categoryId
        ? nextFilters.sort || prev.sort || 'newest'
        : 'newest',

      page: 1,

      _openFilters: false,
    }));
  };

  const clearFilters = () => {
    setQuery((prev) => ({
      ...prev,

      search: '',

      categoryId: null,

      colorIds: [],

      minPrice: '',

      maxPrice: '',

      inStock: false,

      sort: 'newest',

      page: 1,

      _openFilters: false,
    }));
  };

  const removeChip = (type, value) => {
    setQuery((prev) => {
      if (type === 'category') {
        return {
          ...prev,

          categoryId: null,

          sort: 'newest',

          page: 1,
        };
      }

      if (type === 'color') {
        return {
          ...prev,

          colorIds: prev.colorIds.filter((item) => item !== value),

          page: 1,
        };
      }

      if (type === 'minPrice') {
        return {
          ...prev,

          minPrice: '',

          page: 1,
        };
      }

      if (type === 'maxPrice') {
        return {
          ...prev,

          maxPrice: '',

          page: 1,
        };
      }

      if (type === 'inStock') {
        return {
          ...prev,

          inStock: false,

          page: 1,
        };
      }

      return prev;
    });
  };

  const onChangePage = (page) =>
    setQuery((prev) => ({
      ...prev,
      page,
    }));

  const onChangeSort = (sort) => {
    setQuery((prev) => ({
      ...prev,

      sort: prev.categoryId ? sort : 'newest',

      page: 1,
    }));
  };

  const openMobileFilters = () =>
    setQuery((prev) => ({
      ...prev,

      _openFilters: true,
    }));

  const closeMobileFilters = () =>
    setQuery((prev) => ({
      ...prev,

      _openFilters: false,
    }));

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

      <div className='container relative z-10 mx-auto px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:pb-24'>
        {/* =========================
            Hero
        ========================== */}
        <PageIntro
          eyebrow='فروشگاه سمانه یوگا'
          title='ابزارهایی برای یک تمرین'
          highlight='آرام‌تر و آگاهانه‌تر'
          description='محصولات موردنیاز یوگا، مدیتیشن و تمرین‌های روزمره را ببین و بر اساس نیازت انتخاب کن.'
          visualIcon={HiOutlineShoppingBag}
          floatingLabels={[
            {
              text: 'انتخاب آگاهانه',
            },
            {
              text: 'مناسب مسیر تمرین شما',
              variant: 'yellow',
            },
          ]}
          variant='compact'
        />

        {/* =========================
            Toolbar Mobile
        ========================== */}
        <div className='mt-5 flex items-center justify-between gap-3 md:hidden'>
          <div>
            <p className='text-sm font-black text-text-light dark:text-text-dark'>
              محصولات
            </p>

            <p className='mt-0.5 text-[10px] text-subtext-light dark:text-subtext-dark'>
              جستجو، فیلتر و مرتب‌سازی
            </p>
          </div>

          <ProductsMobileFiltersButton onClick={openMobileFilters} />
        </div>

        {/* =========================
            Layout
        ========================== */}
        <div className='mt-5 grid grid-cols-1 items-start gap-5 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] xl:gap-6'>
          {/* Sidebar */}
          <aside className='hidden md:block'>
            <ProductsFiltersPanel
              mode='sidebar'
              query={query}
              categories={categories}
              colors={colors}
              canPriceSort={canPriceSort}
              searchValue={query.search}
              sortValue={canPriceSort ? query.sort : 'newest'}
              onSortChange={onChangeSort}
              onApply={applyFilters}
              onClear={clearFilters}
            />
          </aside>

          {/* Products */}
          <section className='min-w-0'>
            <SiteCard
              variant='glass'
              padding='none'
              radius='lg'
              className='mb-4 flex items-center justify-between gap-3 px-4 py-3'
            >
              <div className='flex min-w-0 items-center gap-2'>
                <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
                  <HiOutlineShoppingBag size={18} />
                </span>

                <div className='min-w-0'>
                  <h2 className='text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                    محصولات فروشگاه
                  </h2>

                  <p className='mt-0.5 text-[10px] text-subtext-light dark:text-subtext-dark'>
                    {loading
                      ? 'در حال دریافت محصولات...'
                      : hasFilters
                        ? 'نتایج مطابق فیلترهای انتخاب‌شده'
                        : 'همه محصولات'}
                  </p>
                </div>
              </div>

              {hasFilters && (
                <button
                  type='button'
                  onClick={clearFilters}
                  className='hidden text-[10px] font-bold text-secondary transition-opacity hover:opacity-70 sm:block'
                >
                  حذف همه فیلترها
                </button>
              )}
            </SiteCard>

            <ProductsActiveChips
              query={query}
              categories={categories}
              colors={colors}
              onRemove={removeChip}
              onClearAll={clearFilters}
            />

            <ProductsGrid
              items={items}
              loading={loading}
              emptyText='محصولی با این مشخصات پیدا نشد.'
              onClearFilters={hasFilters ? clearFilters : undefined}
            />

            {/* =====================
                Pagination
            ====================== */}
            {totalPages > 1 && (
              <SiteCard
                variant='glass'
                padding='none'
                radius='md'
                className='mt-7 flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row'
              >
                <SiteButton
                  type='button'
                  variant='outline'
                  size='sm'
                  startIcon={HiOutlineArrowRight}
                  disabled={query.page <= 1}
                  onClick={() => onChangePage(query.page - 1)}
                >
                  قبلی
                </SiteButton>

                <div className='text-center'>
                  <p className='font-faNa text-xs font-black text-text-light dark:text-text-dark'>
                    صفحه {query.page.toLocaleString('fa-IR')} از{' '}
                    {totalPages.toLocaleString('fa-IR')}
                  </p>

                  <div className='mx-auto mt-2 h-1 w-24 overflow-hidden rounded-full bg-secondary/10'>
                    <div
                      className='h-full rounded-full bg-secondary transition-all duration-300'
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, (query.page / totalPages) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <SiteButton
                  type='button'
                  variant='outline'
                  size='sm'
                  endIcon={HiOutlineArrowLeft}
                  disabled={query.page >= totalPages}
                  onClick={() => onChangePage(query.page + 1)}
                >
                  بعدی
                </SiteButton>
              </SiteCard>
            )}
          </section>
        </div>
      </div>

      {/* =========================
          Mobile Drawer
      ========================== */}
      <ProductsFiltersPanel
        mode='drawer'
        open={Boolean(query._openFilters)}
        onClose={closeMobileFilters}
        query={query}
        categories={categories}
        colors={colors}
        canPriceSort={canPriceSort}
        onSearchChange={setSearch}
        searchValue={query.search}
        sortValue={canPriceSort ? query.sort : 'newest'}
        onSortChange={onChangeSort}
        onApply={applyFilters}
        onClear={clearFilters}
      />
    </main>
  );
}
