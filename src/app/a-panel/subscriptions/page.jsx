/* eslint-disable no-undef */
// app/a-panel/subscriptions/page.jsx
import React from 'react';
import { headers } from 'next/headers';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import SubscriptionsAdminClient from '../components/templates/subscription/SubscriptionsAdminClient';

export const dynamic = 'force-dynamic';

async function fetchPlans() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/subscription/plans`,
      {
        method: 'GET',
        headers: headers(),
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      console.error('Failed to fetch subscription plans (admin)');
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching subscription plans (admin):', error);
    return [];
  }
}

async function fetchCourses() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/subscription/courses`,
      {
        method: 'GET',
        headers: headers(),
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      console.error('Failed to fetch courses for subscription admin');
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching courses for subscription admin:', error);
    return [];
  }
}

export default async function AdminSubscriptionsPage() {
  const [plans, courses] = await Promise.all([fetchPlans(), fetchCourses()]);

  return (
    <div className='container'>
      <div className='mb-4'>
        <PageTitle>مدیریت پلن‌های اشتراک</PageTitle>
        <p className='mt-2 text-sm'>
          در این صفحه می‌توانید پلن‌های اشتراک ایجاد، ویرایش و دوره‌های شامل هر
          پلن را تنظیم کنید.
        </p>
      </div>

      <SubscriptionsAdminClient plans={plans} courses={courses} />
    </div>
  );
}
