'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductsHeadAction from '../../components/templates/shop/products/ProductsHeadAction';
import ProductsTable from '../../components/templates/shop/products/ProductsTable';

export default function AdminShopProductsPage() {
  const [searchValue, setSearchValue] = useState('');
  const [search, setSearch] = useState('');
  const router = useRouter();

  return (
    <div className='p-4'>
      <ProductsHeadAction
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={(val) => setSearch(val?.trim() || '')}
        onCreate={() => router.push('/a-panel/shop/products/new')}
      />

      <ProductsTable search={search} />
    </div>
  );
}
