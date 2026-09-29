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
  const plainCourseLink =
    '<a href="https://samaneyoga.ir/courses/flexibility?source=article">انعطاف‌پذیری</a>';
  const content = `<p>شروع مقاله</p>${firstEmbed}<p>میانه</p>${secondEmbed}${firstEmbed}${plainCourseLink}`;

  assert.deepEqual(extractEmbeddedCourseSlugs(content), [
    'yoga-beginner',
    'meditation',
    'flexibility',
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

test('converts a classless course link and removes its empty paragraph wrapper', () => {
  const classlessEmbed =
    '<a href="/courses/yoga-first-term">ترم اول دوره جامع یوگا</a>';
  const content = `<p>قبل</p><p class="ql-align-right">${classlessEmbed}</p><h2>بعد</h2>`;

  assert.deepEqual(splitArticleCourseEmbeds(content), [
    { type: 'html', value: '<p>قبل</p>' },
    {
      type: 'course',
      slug: 'yoga-first-term',
      value: classlessEmbed,
    },
    { type: 'html', value: '<h2>بعد</h2>' },
  ]);
});
