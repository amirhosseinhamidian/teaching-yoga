/* eslint-disable no-undef */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const APPLY_CHANGES = process.argv.includes('--apply');

const HTTP_URL_PATTERN = /^https?:\/\//i;

const PUBLIC_MEDIA_ROOTS = new Set(['images', 'podcast', 'audio', 'videos']);

const STORAGE_KEY_ROOTS = new Set(['audio', 'videos']);

const stats = {
  scanned: 0,
  changed: 0,
  applied: 0,
  unchanged: 0,
  externalKept: 0,
  invalid: 0,
  optionalSkipped: 0,
};

const changeLog = [];

const addOrigin = (origins, value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return;
  }

  try {
    origins.add(new URL(value).origin);
  } catch {
    // مقدار محیطی نامعتبر نادیده گرفته می‌شود.
  }
};

const buildInternalOrigins = () => {
  const origins = new Set([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:3000',
  ]);

  /*
   * Originهای فعلی پروژه
   */
  addOrigin(origins, process.env.NEXT_PUBLIC_API_BASE_URL);

  addOrigin(origins, process.env.MEDIA_PUBLIC_BASE_URL);

  addOrigin(origins, process.env.VIDEO_PUBLIC_BASE_URL);

  /*
   * Originهای قدیمی Storage.
   *
   * مثال:
   *
   * LEGACY_MEDIA_ORIGINS=
   * https://beta.samaneyoga.ir,
   * https://old-media.example.com
   */
  const legacyOrigins = String(process.env.LEGACY_MEDIA_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  for (const legacyOrigin of legacyOrigins) {
    addOrigin(origins, legacyOrigin);
  }

  return origins;
};

const internalOrigins = buildInternalOrigins();

const safeDecodeURIComponent = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const removeQueryAndHash = (value) => {
  return value.split(/[?#]/, 1)[0];
};

const normalizeSlashes = (value) => {
  return value.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
};

const cleanMediaPath = (value) => {
  let pathValue = safeDecodeURIComponent(
    removeQueryAndHash(normalizeSlashes(value))
  );

  pathValue = pathValue.replace(/^\/+/, '');

  if (pathValue.startsWith('local-videos/')) {
    pathValue = pathValue.slice('local-videos/'.length);
  }

  const segments = pathValue.split('/').filter(Boolean);

  if (
    segments.length === 0 ||
    segments.some((segment) => segment === '.' || segment === '..')
  ) {
    return null;
  }

  return segments.join('/');
};

const extractInternalPath = (rawValue) => {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';

  if (!value) {
    return {
      value: null,
      external: false,
      invalid: false,
    };
  }

  if (!HTTP_URL_PATTERN.test(value)) {
    const cleanedPath = cleanMediaPath(value);

    return {
      value: cleanedPath,
      external: false,
      invalid: !cleanedPath,
    };
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(value);
  } catch {
    return {
      value: null,
      external: false,
      invalid: true,
    };
  }

  /*
   * URL خارجی مثل آواتار Google
   * نباید تغییر کند.
   */
  if (!internalOrigins.has(parsedUrl.origin)) {
    return {
      value,
      external: true,
      invalid: false,
    };
  }

  const cleanedPath = cleanMediaPath(parsedUrl.pathname);

  return {
    value: cleanedPath,
    external: false,
    invalid: !cleanedPath,
  };
};

const normalizePublicMediaValue = (rawValue) => {
  const extracted = extractInternalPath(rawValue);

  if (extracted.external) {
    return {
      value: typeof rawValue === 'string' ? rawValue.trim() : rawValue,

      external: true,
      invalid: false,
    };
  }

  if (extracted.invalid || !extracted.value) {
    return {
      value: rawValue,
      external: false,
      invalid: Boolean(rawValue),
    };
  }

  const root = extracted.value.split('/')[0];

  if (!PUBLIC_MEDIA_ROOTS.has(root)) {
    return {
      value: rawValue,
      external: false,
      invalid: true,
    };
  }

  return {
    value: `/${extracted.value}`,
    external: false,
    invalid: false,
  };
};

const normalizeStorageKeyValue = (rawValue) => {
  const extracted = extractInternalPath(rawValue);

  if (extracted.external) {
    return {
      value: rawValue,
      external: true,
      invalid: false,
    };
  }

  if (extracted.invalid || !extracted.value) {
    return {
      value: rawValue,
      external: false,
      invalid: Boolean(rawValue),
    };
  }

  const root = extracted.value.split('/')[0];

  if (!STORAGE_KEY_ROOTS.has(root)) {
    return {
      value: rawValue,
      external: false,
      invalid: true,
    };
  }

  return {
    value: extracted.value,
    external: false,
    invalid: false,
  };
};

const valuesAreEqual = (left, right) => {
  return JSON.stringify(left) === JSON.stringify(right);
};

const registerResult = ({
  model,
  id,
  field,
  previousValue,
  nextValue,
  result,
}) => {
  stats.scanned += 1;

  if (result.external) {
    stats.externalKept += 1;
  }

  if (result.invalid) {
    stats.invalid += 1;

    console.warn(`[invalid] ${model}.${field} id=${String(id)}`);

    console.warn(`  value: ${String(previousValue)}`);

    return false;
  }

  if (valuesAreEqual(previousValue, nextValue)) {
    stats.unchanged += 1;
    return false;
  }

  stats.changed += 1;

  changeLog.push({
    model,
    id,
    field,
    previousValue,
    nextValue,
  });

  console.log(`[change] ${model}.${field} id=${String(id)}`);

  console.log(`  from: ${JSON.stringify(previousValue)}`);

  console.log(`  to:   ${JSON.stringify(nextValue)}`);

  return true;
};

const migrateScalarField = async ({
  model,
  delegate,
  field,
  normalizer,
  where,
}) => {
  const rows = await delegate.findMany({
    where,

    select: {
      id: true,
      [field]: true,
    },
  });

  for (const row of rows) {
    const previousValue = row[field];

    if (
      previousValue === null ||
      previousValue === undefined ||
      previousValue === ''
    ) {
      stats.scanned += 1;
      stats.unchanged += 1;
      continue;
    }

    const result = normalizer(previousValue);

    const nextValue = result.value;

    const shouldUpdate = registerResult({
      model,
      id: row.id,
      field,
      previousValue,
      nextValue,
      result,
    });

    if (APPLY_CHANGES && shouldUpdate) {
      await delegate.update({
        where: {
          id: row.id,
        },

        data: {
          [field]: nextValue,
        },
      });

      stats.applied += 1;
    }
  }
};

const migrateProductImages = async () => {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      images: true,
    },
  });

  for (const product of products) {
    const previousImages = Array.isArray(product.images) ? product.images : [];

    const imageResults = previousImages.map(normalizePublicMediaValue);

    const nextImages = imageResults.map((result) => result.value);

    const result = {
      value: nextImages,

      external: imageResults.some((item) => item.external),

      invalid: imageResults.some((item) => item.invalid),
    };

    const shouldUpdate = registerResult({
      model: 'Product',
      id: product.id,
      field: 'images',
      previousValue: previousImages,
      nextValue: nextImages,
      result,
    });

    if (APPLY_CHANGES && shouldUpdate) {
      await prisma.product.update({
        where: {
          id: product.id,
        },

        data: {
          images: nextImages,
        },
      });

      stats.applied += 1;
    }
  }
};

const migrateSeoImages = async () => {
  const rows = await prisma.seoSetting.findMany({
    where: {
      key: 'ogImage',
    },

    select: {
      page: true,
      key: true,
      value: true,
    },
  });

  for (const row of rows) {
    const previousValue = row.value;

    if (!previousValue) {
      stats.scanned += 1;
      stats.unchanged += 1;
      continue;
    }

    const result = normalizePublicMediaValue(previousValue);

    const nextValue = result.value;

    const shouldUpdate = registerResult({
      model: 'SeoSetting',
      id: `${row.page}:${row.key}`,
      field: 'value',
      previousValue,
      nextValue,
      result,
    });

    if (APPLY_CHANGES && shouldUpdate) {
      await prisma.seoSetting.update({
        where: {
          page_key: {
            page: row.page,

            key: row.key,
          },
        },

        data: {
          value: nextValue,
        },
      });

      stats.applied += 1;
    }
  }
};

const runOptionalMigration = async (label, callback) => {
  try {
    await callback();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    const isSchemaMismatch =
      message.includes('Unknown field') ||
      message.includes('does not exist') ||
      message.includes('Cannot read properties of undefined');

    if (!isSchemaMismatch) {
      throw error;
    }

    stats.optionalSkipped += 1;

    console.warn(`[optional skipped] ${label}`);

    console.warn(`  ${message}`);
  }
};

const main = async () => {
  console.log(
    APPLY_CHANGES
      ? 'Media path migration: APPLY MODE'
      : 'Media path migration: DRY RUN'
  );

  console.log('Internal origins:', [...internalOrigins]);

  console.log('');

  // تصاویر عمومی
  await migrateScalarField({
    model: 'User',
    delegate: prisma.user,
    field: 'avatar',
    normalizer: normalizePublicMediaValue,
  });

  await migrateScalarField({
    model: 'Course',
    delegate: prisma.course,
    field: 'cover',
    normalizer: normalizePublicMediaValue,
  });

  await migrateScalarField({
    model: 'Article',
    delegate: prisma.article,
    field: 'cover',
    normalizer: normalizePublicMediaValue,
  });

  await migrateScalarField({
    model: 'Podcast',
    delegate: prisma.podcast,
    field: 'logoUrl',
    normalizer: normalizePublicMediaValue,
  });

  await migrateScalarField({
    model: 'Podcast',
    delegate: prisma.podcast,
    field: 'bannerUrl',
    normalizer: normalizePublicMediaValue,
  });

  await migrateScalarField({
    model: 'PodcastEpisode',
    delegate: prisma.podcastEpisode,
    field: 'audioUrl',
    normalizer: normalizePublicMediaValue,
  });

  await migrateScalarField({
    model: 'PodcastEpisode',
    delegate: prisma.podcastEpisode,
    field: 'coverImageUrl',
    normalizer: normalizePublicMediaValue,
  });

  await migrateScalarField({
    model: 'Product',
    delegate: prisma.product,
    field: 'coverImage',
    normalizer: normalizePublicMediaValue,
  });

  await migrateProductImages();
  await migrateSeoImages();

  /*
   * فیلد تنظیمات سایت.
   * اگر در Schema فعلی وجود نداشته باشد،
   * فقط این بخش Skip می‌شود.
   */
  await runOptionalMigration(
    'SiteInfo.heroImage',

    async () => {
      await migrateScalarField({
        model: 'SiteInfo',

        delegate: prisma.siteInfo,

        field: 'heroImage',

        normalizer: normalizePublicMediaValue,
      });
    }
  );

  /*
   * Snapshot تصویر محصول در سفارش‌ها.
   */
  await runOptionalMigration(
    'ShopOrderItem.coverImage',

    async () => {
      await migrateScalarField({
        model: 'ShopOrderItem',

        delegate: prisma.shopOrderItem,

        field: 'coverImage',

        normalizer: normalizePublicMediaValue,
      });
    }
  );

  // کلیدهای خصوصی ویدئو و صوت
  await migrateScalarField({
    model: 'Course',
    delegate: prisma.course,
    field: 'introVideoUrl',
    normalizer: normalizeStorageKeyValue,
  });

  await migrateScalarField({
    model: 'SessionVideo',
    delegate: prisma.sessionVideo,
    field: 'videoKey',
    normalizer: normalizeStorageKeyValue,
  });

  await migrateScalarField({
    model: 'SessionAudio',
    delegate: prisma.sessionAudio,
    field: 'audioKey',
    normalizer: normalizeStorageKeyValue,
  });

  console.log('');
  console.log('===== SUMMARY =====');
  console.log(JSON.stringify(stats, null, 2));

  if (!APPLY_CHANGES) {
    console.log('');
    console.log('No database rows were modified.');

    console.log('Run again with --apply to save these changes.');
  } else {
    console.log('');
    console.log(`${stats.applied} database updates were applied.`);
  }

  if (stats.invalid > 0) {
    console.warn('');
    console.warn(`${stats.invalid} invalid media values were not modified.`);
  }
};

main()
  .catch((error) => {
    console.error('Media migration failed:', error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
