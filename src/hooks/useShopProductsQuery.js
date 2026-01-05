/* eslint-disable no-undef */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function stableQueryKey(query) {
  const q = query || {};
  const colorIds = Array.isArray(q.colorIds)
    ? q.colorIds
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0)
        .sort((a, b) => a - b)
    : [];

  const normalized = {
    search: String(q.search || '').trim(),
    categoryId: q.categoryId ? Number(q.categoryId) : null,
    colorIds, // sorted
    minPrice: q.minPrice === '' || q.minPrice == null ? '' : String(q.minPrice),
    maxPrice: q.maxPrice === '' || q.maxPrice == null ? '' : String(q.maxPrice),
    inStock: !!q.inStock,
    sort: q.sort || 'newest',
    page: Math.max(1, Number(q.page || 1)),
    pageSize: Math.min(100, Math.max(1, Number(q.pageSize || 20))),
  };

  return JSON.stringify(normalized);
}

export function useShopProductsQuery(query, toast) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1); // ✅ اضافه شد

  const [colors, setColors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [metaLoading, setMetaLoading] = useState(false);

  // ✅ toast را ref کن تا dependency نشود
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // ✅ کلید پایدار
  const queryKey = useMemo(() => stableQueryKey(query), [query]);

  // ✅ جلوگیری از race و درخواست‌های همزمان
  const abortRef = useRef(null);
  const reqSeqRef = useRef(0);

  const fetchMeta = useCallback(async () => {
    try {
      setMetaLoading(true);

      const [cRes, catRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shop/colors`, {
          cache: 'no-store',
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shop/categories`, {
          cache: 'no-store',
        }),
      ]);

      const [cData, catData] = await Promise.all([
        cRes.json().catch(() => ({})),
        catRes.json().catch(() => ({})),
      ]);

      if (cRes.ok) setColors(Array.isArray(cData) ? cData : cData.items || []);
      if (catRes.ok)
        setCategories(Array.isArray(catData) ? catData : catData.items || []);
    } catch (e) {
      // متا اگر نیاد هم صفحه محصولات کار می‌کنه
    } finally {
      setMetaLoading(false);
    }
  }, []);

  // ✅ فقط queryKey dependency
  const fetchProducts = useCallback(async () => {
    const mySeq = ++reqSeqRef.current;

    // درخواست قبلی را لغو کن
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);

      // ✅ مهم: به جای query از queryKey استفاده می‌کنیم (همیشه جدید و پایدار)
      const q = JSON.parse(queryKey);

      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shop/products`
      );

      if (q.search) url.searchParams.set('search', q.search);
      if (q.categoryId)
        url.searchParams.set('categoryId', String(q.categoryId));
      if (Array.isArray(q.colorIds) && q.colorIds.length)
        url.searchParams.set('colorIds', q.colorIds.join(','));

      if (q.minPrice !== '')
        url.searchParams.set('minPrice', String(q.minPrice));
      if (q.maxPrice !== '')
        url.searchParams.set('maxPrice', String(q.maxPrice));

      if (q.inStock) url.searchParams.set('inStock', 'true');

      // sort rule
      if (q.categoryId && q.sort && q.sort !== 'newest') {
        url.searchParams.set('sort', q.sort);
      } else {
        url.searchParams.set('sort', 'newest');
      }

      url.searchParams.set('page', String(q.page || 1));
      url.searchParams.set('pageSize', String(q.pageSize || 20));

      const res = await fetch(url.toString(), {
        cache: 'no-store',
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));

      // اگر درخواست جدیدتری زده شده، این پاسخ را ignore کن
      if (mySeq !== reqSeqRef.current) return;

      if (!res.ok) {
        toastRef.current?.showErrorToast?.(
          data?.error || 'خطا در دریافت محصولات'
        );
        setItems([]);
        setTotal(0);
        setTotalPages(1); // ✅ reset
        return;
      }

      setItems(Array.isArray(data.items) ? data.items : []);
      const t = Number(data.total || 0);
      setTotal(t);

      // ✅ از API بخون؛ اگر نبود خودمون حساب کنیم
      const apiTotalPages = Number(data.totalPages || 0);
      const computed = Math.max(1, Math.ceil(t / (q.pageSize || 20)));
      setTotalPages(apiTotalPages > 0 ? apiTotalPages : computed);
    } catch (e) {
      if (e?.name === 'AbortError') return;

      // فقط اگر این آخرین درخواست است error بده و state رو خالی کن
      if (mySeq === reqSeqRef.current) {
        toastRef.current?.showErrorToast?.('خطا در دریافت محصولات');
        setItems([]);
        setTotal(0);
        setTotalPages(1); // ✅ reset
      }
    } finally {
      if (mySeq === reqSeqRef.current) setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchProducts();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchProducts]);

  return {
    loading,
    items,
    total,
    totalPages, // ✅ اضافه شد
    colors,
    categories,
    metaLoading,
    refetch: fetchProducts,
  };
}
