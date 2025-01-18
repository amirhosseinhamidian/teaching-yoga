import React from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import Image from 'next/image';

const CourseSaleTable = ({ courses, isLoading, className }) => {
  const columns = [
    { key: 'ranking', label: 'رتبه' },
    {
      key: 'title',
      minWidth: '180px',
      label: 'دوره',
      render: (_, row) => (
        <div className='flex items-center justify-start gap-2'>
          <Image
            src={row?.cover}
            alt={row.title}
            className='w-16 rounded object-cover sm:w-20'
            width={96}
            height={56}
          />
          <p>{row.title}</p>
        </div>
      ),
    },
    {
      key: 'totalRegister',
      label: 'تعداد کل ثبت نام ها',
      minWidth: '100px',
    },
    {
      key: 'totalSale',
      label: 'مجموع فروش (تومان)',
      render: (amount) => amount.toLocaleString('fa-IR'),
    },
  ];

  const data = courses.map((course, index) => ({
    ranking: index + 1,
    cover: course.cover,
    title: course.title,
    totalRegister: course.totalRegister,
    totalSale: course.totalSale,
  }));
  return (
    <div className={className}>
      <h2 className='mb-2 text-base font-semibold md:text-lg lg:text-xl xl:text-2xl'>
        رتبه بندی دوره ها
      </h2>
      <p className='mb-5 text-2xs text-subtext-light xs:text-xs lg:text-base dark:text-subtext-dark'>
        براساس تعداد فروش
      </p>
      <Table
        columns={columns}
        data={data}
        className='mb-3 mt-6 sm:mb-4 sm:mt-10'
        loading={isLoading}
      />
    </div>
  );
};

CourseSaleTable.propTypes = {
  courses: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  className: PropTypes.string,
};

export default CourseSaleTable;
