/* eslint-disable no-undef */
'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import PageIntro from '@/components/SiteUi/PageIntro/PageIntro';

import UserInformationCard from '@/components/templates/payment/UserInformationCard';
import UserOrderCard from '@/components/templates/payment/UserOrderCard';

import { HiOutlineCreditCard } from 'react-icons/hi2';

export default function PaymentMain({ cart, shopCart }) {
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const hasShopCart =
    Array.isArray(shopCart?.items) && shopCart.items.length > 0;

  return (
    <main
      dir='rtl'
      className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
    >
      <PageBackground />

      <div className='container relative z-10 mx-auto px-4 pb-32 pt-5 sm:px-6 sm:pb-32 sm:pt-7 lg:pb-24'>
        <PageIntro
          eyebrow='تکمیل سفارش'
          title='اطلاعات و'
          highlight='پرداخت'
          description='اطلاعات گیرنده، آدرس و روش ارسال را بررسی کنید و در پایان سفارش خود را تکمیل کنید.'
          visualIcon={HiOutlineCreditCard}
          variant='compact'
        />

        <div className='mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-6'>
          <UserInformationCard
            className='min-w-0'
            hasShopCart={hasShopCart}
            onAddressSelect={(address) =>
              setSelectedAddressId(address?.id ?? null)
            }
          />

          <UserOrderCard
            data={{ cart, shopCart }}
            addressId={selectedAddressId}
            className='min-w-0 lg:sticky lg:top-24'
          />
        </div>
      </div>
    </main>
  );
}

PaymentMain.propTypes = {
  cart: PropTypes.any,
  shopCart: PropTypes.any,
};
