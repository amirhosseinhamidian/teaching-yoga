/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import CreateProductUpdateForm from '@/app/a-panel/components/templates/shop/products/CreateProductUpdateForm';

export default function UpdateProductPage() {
  const params = useParams();
  const id = params?.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/products/${id}`,
          { cache: 'no-store' }
        );
        const data = await res.json();

        if (!res.ok) {
          toast.showErrorToast(data?.error || 'خطا در دریافت اطلاعات محصول');
          setProduct(null);
          return;
        }
        setProduct(data.product);
      } catch (e) {
        toast.showErrorToast('خطا در ارتباط با سرور');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className='p-4 text-sm text-gray-600'>در حال دریافت اطلاعات...</div>
    );
  }

  if (!product) {
    return <div className='text-red-600 p-4 text-sm'>محصول پیدا نشد.</div>;
  }

  return (
    <div className='p-4'>
      <CreateProductUpdateForm productToUpdate={product} />
    </div>
  );
}
