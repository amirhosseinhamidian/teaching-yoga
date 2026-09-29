const COURSE_CARD_CLASS = 'ql-course-card';

const COURSE_CARD_TAG_PATTERN = new RegExp(
  `<a\\b(?=[^>]*\\bclass=(['"])[^'"]*\\b${COURSE_CARD_CLASS}\\b[^'"]*\\1)[^>]*>[\\s\\S]*?<\\/a>`,
  'gi'
);

const COURSE_SLUG_ATTRIBUTE_PATTERN = /\bdata-course-slug=(['"])([^'"]+)\1/i;

const COURSE_HREF_PATTERN = /\bhref=(['"])\/courses\/([^?'"#]+)[^'"]*\1/i;

const normalizeSlug = (value) => {
  if (!value) {
    return '';
  }

  try {
    return decodeURIComponent(String(value)).trim();
  } catch {
    return String(value).trim();
  }
};

export const getCourseSlugFromEmbed = (html = '') => {
  const attributeMatch = String(html).match(COURSE_SLUG_ATTRIBUTE_PATTERN);

  if (attributeMatch?.[2]) {
    return normalizeSlug(attributeMatch[2]);
  }

  const hrefMatch = String(html).match(COURSE_HREF_PATTERN);

  return normalizeSlug(hrefMatch?.[2]);
};

export const extractEmbeddedCourseSlugs = (html = '') => {
  const slugs = new Set();

  for (const match of String(html).matchAll(COURSE_CARD_TAG_PATTERN)) {
    const slug = getCourseSlugFromEmbed(match[0]);

    if (slug) {
      slugs.add(slug);
    }
  }

  return [...slugs];
};

export const splitArticleCourseEmbeds = (html = '') => {
  const source = String(html);
  const parts = [];
  let lastIndex = 0;

  COURSE_CARD_TAG_PATTERN.lastIndex = 0;

  for (const match of source.matchAll(COURSE_CARD_TAG_PATTERN)) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'html',
        value: source.slice(lastIndex, match.index),
      });
    }

    parts.push({
      type: 'course',
      slug: getCourseSlugFromEmbed(match[0]),
      value: match[0],
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < source.length) {
    parts.push({ type: 'html', value: source.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'html', value: source }];
};
