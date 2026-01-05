'use client';
/* eslint-disable react/prop-types */
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ImSpinner2 } from 'react-icons/im';

function getNiceDomainNonNegative(values) {
  const nums = (values || [])
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v >= 0);

  if (!nums.length) return [0, 1];

  const max = Math.max(...nums);

  // اگر همه صفر بودن
  if (max === 0) return [0, 1];

  // padding فقط بالا (بدون منفی شدن محور)
  const pad = Math.max(max * 0.15, 1);

  return [0, max + pad];
}

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
  tickFormatterY, // (اختیاری) اگر خواستی اعداد Y رو کاستوم نمایش بدی
}) => {
  const yDomain = useMemo(() => {
    const values = (data || []).map((d) => d?.[yAxisKey]);
    return getNiceDomainNonNegative(values);
  }, [data, yAxisKey]);

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
            // ✅ margin بهتر که نمودار برش نخوره
            margin={{ top: 16, right: 16, bottom: 50, left: 24 }}
          >
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 14 }}
              tickMargin={15}
              label={{
                value: labelX,
                position: 'insideBottom',
                fontSize: 16,
                dy: 32,
              }}
            />

            <YAxis
              domain={yDomain} // ✅ بدون منفی
              allowDataOverflow={false}
              scale='linear'
              tick={{ fontSize: 14 }}
              tickMargin={12}
              tickCount={6}
              tickFormatter={
                tickFormatterY ||
                ((v) => Number(v || 0).toLocaleString('fa-IR'))
              }
              label={{
                value: labelY,
                angle: -90,
                position: 'insideLeft',
                fontSize: 16,
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#575757',
                borderRadius: '8px',
                color: '#c9c9c9',
              }}
              formatter={(value, name) => formatTooltip(value, name)}
            />

            <Line
              type='monotone'
              dataKey={yAxisKey}
              stroke={lineColor}
              strokeWidth={strokeWidth}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default LineChartComponent;
