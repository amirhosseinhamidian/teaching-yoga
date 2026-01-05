/* eslint-disable no-undef */
'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { GoCreditCard } from 'react-icons/go';
import PageCheckoutTitle from '@/components/Ui/PageCheckoutTitle/PageCheckoutTitle';

import UserInformationCard from '@/components/templates/payment/UserInformationCard';
import UserOrderCard from '@/components/templates/payment/UserOrderCard';

export default function PaymentMain({ cart, shopCart }) {
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  console.log('shop cart ===========> ', shopCart);

  return (
    <>
      <div className='container'>
        <PageCheckoutTitle isSuccess={true} icon={GoCreditCard}>
          پرداخت
        </PageCheckoutTitle>

        <div className='mb-10 mt-4 grid grid-cols-1 gap-10 md:mb-16 md:mt-8 md:grid-cols-2 lg:gap-28'>
          <UserInformationCard
            className='order-last self-start md:order-first'
            hasShopCart={shopCart.items.length !== 0}
            onAddressSelect={(address) =>
              setSelectedAddressId(address?.id ?? null)
            }
          />

          <UserOrderCard
            data={{ cart, shopCart }}
            addressId={selectedAddressId}
            className='order-first self-start md:order-last'
          />
        </div>
      </div>
    </>
  );
}

PaymentMain.propTypes = {
  cart: PropTypes.any,
  shopCart: PropTypes.any,
};
