/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';

import { parseShopQuery, buildShopQuery } from '@/utils/shopQuery';
import { useShopProductsQuery } from '@/hooks/useShopProductsQuery';

import ProductsActiveChips from './ProductsActiveChips';
import ProductsGrid from './ProductsGrid';
import ProductsFiltersPanel from './ProductsFiltersPanel';
import ProductsMobileFiltersButton from './ProductsMobileFiltersButton';
import Pagination from '@/components/Ui/Pagination/Pagination';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isDark } = useTheme();
  const toast = useMemo(() => createToastHandler(isDark), [isDark]);

  // ✅ query اولیه از URL (ممکنه category=slug داشته باشه)
  const initial = useMemo(() => parseShopQuery(searchParams), [searchParams]);
  const [query, setQuery] = useState(initial);

  // ✅ اگر از هوم اومده باشیم: /shop/products?category=<slug>
  const categorySlug = (searchParams.get('category') || '').trim();

  // ✅ جلوگیری از router.replace زودهنگام تا slug resolve بشه
  const [slugResolved, setSlugResolved] = useState(false);

  // sync state وقتی back/forward شد یا URL تغییر کرد
  useEffect(() => {
    setQuery(parseShopQuery(searchParams));
    // هر بار URL عوض شد، دوباره باید تصمیم بگیریم slug resolve شده یا نه
    setSlugResolved(false);
  }, [searchParams]);

  // ✅ resolve slug -> categoryId (فقط وقتی slug داریم و categoryId نداریم)
  useEffect(() => {
    let ignore = false;

    async function resolveSlug() {
      // اگر slug نداریم یا categoryId داریم، چیزی لازم نیست
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
          { cache: 'no-store' }
        );

        const json = await res.json().catch(() => ({}));
        const catId = json?.data?.id || null;

        if (ignore) return;

        setQuery((p) => ({
          ...p,
          categoryId: catId,
          page: 1,
          sort: catId ? p.sort || 'newest' : 'newest',
        }));

        setSlugResolved(true);
      } catch (e) {
        console.error(e);
        if (!ignore) setSlugResolved(true);
      }
    }

    resolveSlug();
    return () => {
      ignore = true;
    };
    // فقط با تغییر slug یا categoryId لازم است
  }, [categorySlug, query.categoryId]);

  // fetch
  const { loading, items, totalPages, colors, categories } =
    useShopProductsQuery(query, toast);

  // ✅ sync to URL (فقط وقتی واقعاً تغییر کرده + فقط بعد از resolve)
  useEffect(() => {
    if (!slugResolved) return;

    const next = { ...query };
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

  const hasFilters =
    !!query.categoryId ||
    !!query.inStock ||
    (query.minPrice !== '' && query.minPrice != null) ||
    (query.maxPrice !== '' && query.maxPrice != null) ||
    (query.colorIds?.length || 0) > 0 ||
    (query.search || '').trim().length > 0;

  const canPriceSort = !!query.categoryId;

  // handlers
  const setSearch = (val) => setQuery((p) => ({ ...p, search: val, page: 1 }));

  const applyFilters = (nextFilters) => {
    setQuery((p) => ({
      ...p,
      ...nextFilters,
      sort: nextFilters.categoryId
        ? nextFilters.sort || p.sort || 'newest'
        : 'newest',
      page: 1,
      _openFilters: false,
    }));
  };

  const clearFilters = () => {
    setQuery((p) => ({
      ...p,
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
    setQuery((p) => {
      if (type === 'category')
        return { ...p, categoryId: null, sort: 'newest', page: 1 };
      if (type === 'color')
        return {
          ...p,
          colorIds: p.colorIds.filter((x) => x !== value),
          page: 1,
        };
      if (type === 'minPrice') return { ...p, minPrice: '', page: 1 };
      if (type === 'maxPrice') return { ...p, maxPrice: '', page: 1 };
      if (type === 'inStock') return { ...p, inStock: false, page: 1 };
      return p;
    });
  };

  const onChangePage = (page) => setQuery((p) => ({ ...p, page }));

  const onChangeSort = (sort) => {
    setQuery((p) => ({
      ...p,
      sort: p.categoryId ? sort : 'newest',
      page: 1,
    }));
  };

  const openMobileFilters = () =>
    setQuery((p) => ({ ...p, _openFilters: true }));
  const closeMobileFilters = () =>
    setQuery((p) => ({ ...p, _openFilters: false }));

  return (
    <div className='container px-2 py-6 sm:px-4'>
      {/* هدر مینیمال */}
      <div className='mb-4 flex items-center justify-between'>
        <h1 className='text-base font-semibold xs:text-xl'>محصولات فروشگاه</h1>

        {/* فقط موبایل: دکمه باز کردن فیلتر */}
        <div className='md:hidden'>
          <ProductsMobileFiltersButton onClick={openMobileFilters} />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr]'>
        {/* Sidebar (md+) */}
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

        {/* main content */}
        <main>
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
            emptyText='محصولی یافت نشد.'
            onClearFilters={hasFilters ? clearFilters : undefined}
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={query.page}
              onPageChange={onChangePage}
              totalPages={totalPages}
              className='mt-4 shadow-sm'
            />
          )}
        </main>
      </div>

      {/* Drawer (mobile) */}
      <ProductsFiltersPanel
        mode='drawer'
        open={!!query._openFilters}
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
    </div>
  );
}
