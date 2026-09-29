import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../src/utils/articleCourseEmbeds.js', import.meta.url),
  'utf8'
);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString(
  'base64'
)}`;
const { extractEmbeddedCourseSlugs, splitArticleCourseEmbeds } = await import(
  moduleUrl
);

const firstEmbed =
  '<a class="ql-course-card" href="/courses/yoga-beginner" data-course-slug="yoga-beginner">یوگا مقدماتی</a>';
const secondEmbed =
  '<a data-course-slug="meditation" class="featured ql-course-card" href="/courses/meditation">مدیتیشن</a>';

test('extracts unique course slugs from the article HTML', () => {
  const content = `<p>شروع مقاله</p>${firstEmbed}<p>میانه</p>${secondEmbed}${firstEmbed}`;

  assert.deepEqual(extractEmbeddedCourseSlugs(content), [
    'yoga-beginner',
    'meditation',
  ]);
});

test('splits HTML and course embeds while keeping their position', () => {
  const content = `<p>قبل</p>${firstEmbed}<p>بعد</p>`;

  assert.deepEqual(splitArticleCourseEmbeds(content), [
    { type: 'html', value: '<p>قبل</p>' },
    {
      type: 'course',
      slug: 'yoga-beginner',
      value: firstEmbed,
    },
    { type: 'html', value: '<p>بعد</p>' },
  ]);
});
