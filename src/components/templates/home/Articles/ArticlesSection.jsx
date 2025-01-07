/* eslint-disable no-undef */
import { headers } from 'next/headers';
import Link from 'next/link';
import React from 'react';
import ArticleMiniCard from './ArticleMiniCard';

const fetchArticlesData = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/articles?lastThree=true`,
      {
        method: 'GET',
        headers: headers(),
        next: {
          revalidate: 21600, // 6 hours
        },
      },
    );
    if (!response.ok) {
      throw new Error('Failed to fetch course data');
    }

    const articles = await response.json();
    return articles;
  } catch (error) {
    console.error('Error fetching articles data:', error);
  }
};

async function ArticlesSection() {
  const { data } = await fetchArticlesData();

  return (
    <div className='flex flex-col items-center justify-center gap-8 py-12 md:gap-12 md:py-16'>
      <h2
        className='text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl'
        data-aos='fade-up'
        data-aos-delay='200'
        data-aos-duration='1000'
      >
        آخرین مقالات
      </h2>
      <div className='container my-0 grid grid-cols-1 gap-4 sm:my-3 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-3 lg:gap-12 xl:px-32'>
        {data.map((article, index) => (
          <div
            key={article.id}
            data-aos={
              index === 0 ? 'fade-right' : index === 1 ? 'fade-up' : 'fade-left'
            }
            data-aos-mirror='true'
            className='transition-transform duration-300'
          >
            <ArticleMiniCard article={article} className='min-h-full' />
          </div>
        ))}
      </div>
      <Link
        href='/articles'
        className='rounded-full border border-subtext-light bg-transparent px-6 py-3 font-medium text-subtext-light transition-all duration-200 ease-in hover:border-transparent hover:bg-accent hover:text-text-light dark:border-subtext-dark dark:text-subtext-dark'
      >
        دیدن همه مقالات
      </Link>
    </div>
  );
}

export default ArticlesSection;
