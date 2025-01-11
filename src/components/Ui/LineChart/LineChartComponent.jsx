'use client';
/* eslint-disable react/prop-types */
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ImSpinner2 } from 'react-icons/im';

const LineChartComponent = ({
  data,
  className,
  lineColor = '#64F4AB',
  xAxisKey,
  yAxisKey,
  labelX = 'تاریخ',
  labelY = '',
  strokeWidth = 2,
  title,
  isLoading = false,
  subtitle,
  formatTooltip,
}) => {
  return (
    <div className={className}>
      <h2 className='mb-2 text-base font-semibold md:text-lg lg:text-xl xl:text-2xl'>
        {title}
      </h2>
      <p className='mb-5 text-2xs text-subtext-light xs:text-xs lg:text-base dark:text-subtext-dark'>
        {subtitle}
      </p>
      {isLoading ? (
        <div className='z-10 flex h-96 w-full items-center justify-center rounded-xl bg-surface-light dark:bg-surface-dark'>
          <ImSpinner2 size={42} className='animate-spin text-primary' />
        </div>
      ) : (
        <ResponsiveContainer
          width='100%'
          height={460}
          className='rounded-xl bg-surface-light py-3 dark:bg-surface-dark'
        >
          <LineChart
            data={data}
            className='font-faNa'
            margin={{ top: 0, right: 0, bottom: 50, left: 0 }}
          >
            <XAxis
              dataKey={xAxisKey}
              tick={{
                fontSize: 14, // تغییر اندازه فونت
              }}
              tickMargin={15} // فاصله مقادیر از محور
              label={{
                value: labelX,
                position: 'insideBottom',
                fontSize: 16,
                dy: 32,
              }}
            />
            <YAxis
              dataKey={yAxisKey}
              tick={{
                fontSize: 14, // تغییر اندازه فونت
              }}
              tickMargin={25} // فاصله مقادیر از محور
              label={{
                value: labelY,
                angle: -90,
                position: 'insideLeft',
                fontSize: 16,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#575757', // تغییر رنگ پس‌زمینه
                borderRadius: '8px', // تنظیم گوشه‌های گرد
                color: '#c9c9c9', // تنظیم رنگ متن
              }}
              formatter={(value, name) => formatTooltip(value, name)}
            />
            <Line
              type='monotone'
              dataKey={yAxisKey}
              stroke={lineColor}
              strokeWidth={strokeWidth}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default LineChartComponent;
