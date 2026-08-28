const HTTP_URL_PATTERN =
  /^https?:\/\//i;

const CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u001f\u007f]/;

const COURSE_COVER_PREFIX = [
  'images',
  'course_covers',
];

export const getManagedCourseCoverKey =
  (value) => {
    const rawValue =
      typeof value === 'string'
        ? value.trim()
        : '';

    if (
      !rawValue ||
      HTTP_URL_PATTERN.test(
        rawValue
      ) ||
      CONTROL_CHARACTER_PATTERN.test(
        rawValue
      )
    ) {
      return null;
    }

    const cleanValue =
      rawValue
        .replace(/\\/g, '/')
        .replace(/^\/+/, '');

    const segments =
      cleanValue
        .split('/')
        .filter(Boolean);

    if (
      segments.length < 3 ||
      segments[0] !==
        COURSE_COVER_PREFIX[0] ||
      segments[1] !==
        COURSE_COVER_PREFIX[1] ||
      segments.some(
        (segment) =>
          segment === '.' ||
          segment === '..'
      )
    ) {
      return null;
    }

    return segments.join('/');
  };

export async function cleanupPreviousCourseCover({
  storage,
  previousCover,
  currentCover = null,
}) {
  const previousKey =
    getManagedCourseCoverKey(
      previousCover
    );

  if (!previousKey) {
    return {
      deleted: false,
      reason:
        'previous_cover_not_managed',
      key: null,
    };
  }

  const currentKey =
    getManagedCourseCoverKey(
      currentCover
    );

  if (
    currentKey &&
    currentKey === previousKey
  ) {
    return {
      deleted: false,
      reason:
        'same_cover_key',
      key: previousKey,
    };
  }

  if (
    !storage ||
    typeof storage.deletePath !==
      'function'
  ) {
    throw new TypeError(
      'Storage deletePath() is required.'
    );
  }

  await storage.deletePath(
    previousKey
  );

  return {
    deleted: true,
    reason: null,
    key: previousKey,
  };
}
