const ANCHOR_TAG_PATTERN = /<a\b[^>]*>[\s\S]*?<\/a>/gi;

const COURSE_SLUG_ATTRIBUTE_PATTERN = /\bdata-course-slug=(['"])([^'"]+)\1/i;

const COURSE_HREF_PATTERN =
  /\bhref=(['"])(?:https?:\/\/[^/'"]+)?\/courses\/([^/?'"#]+)(?:[/?#][^'"]*)?\1/i;

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

  for (const match of String(html).matchAll(ANCHOR_TAG_PATTERN)) {
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

  ANCHOR_TAG_PATTERN.lastIndex = 0;

  for (const match of source.matchAll(ANCHOR_TAG_PATTERN)) {
    const slug = getCourseSlugFromEmbed(match[0]);

    if (!slug) {
      continue;
    }

    let embedStart = match.index;
    let embedEnd = match.index + match[0].length;
    const beforeEmbed = source.slice(lastIndex, embedStart);
    const afterEmbed = source.slice(embedEnd);
    const paragraphStart = beforeEmbed.match(/<p\b[^>]*>\s*$/i);
    const paragraphEnd = afterEmbed.match(/^\s*<\/p>/i);

    if (paragraphStart && paragraphEnd) {
      embedStart = lastIndex + paragraphStart.index;
      embedEnd += paragraphEnd[0].length;
    }

    if (embedStart > lastIndex) {
      parts.push({
        type: 'html',
        value: source.slice(lastIndex, embedStart),
      });
    }

    parts.push({
      type: 'course',
      slug,
      value: match[0],
    });

    lastIndex = embedEnd;
  }

  if (lastIndex < source.length) {
    parts.push({ type: 'html', value: source.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'html', value: source }];
};
