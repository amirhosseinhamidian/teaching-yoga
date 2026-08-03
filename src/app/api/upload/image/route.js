/* eslint-disable no-undef */

import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/server/auth/require-admin-api';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

import { toPublicMediaPath } from '@/server/media/public-media-path';

import { getMediaStorage, normalizeStorageKey } from '@/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const IMAGE_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const ALLOWED_IMAGE_ROOTS = new Set(['images']);

class ImageUploadError extends Error {
  constructor(message, status = 400) {
    super(message);

    this.name = 'ImageUploadError';
    this.status = status;
  }
}

const getMaxImageBytes = () => {
  const configuredValue = Number(process.env.MAX_IMAGE_BYTES);

  if (Number.isFinite(configuredValue) && configuredValue > 0) {
    return Math.floor(configuredValue);
  }

  return DEFAULT_MAX_IMAGE_BYTES;
};

const normalizeFolderPath = (value) => {
  const folderPath =
    typeof value === 'string' ? value.normalize('NFC').trim() : '';

  if (!folderPath) {
    throw new ImageUploadError('مسیر ذخیره‌سازی تصویر ارسال نشده است.');
  }

  if (folderPath.length > 500) {
    throw new ImageUploadError('مسیر ذخیره‌سازی تصویر بیش از حد طولانی است.');
  }

  let normalizedPath;

  try {
    normalizedPath = normalizeStorageKey(folderPath);
  } catch {
    throw new ImageUploadError('مسیر ذخیره‌سازی تصویر معتبر نیست.');
  }

  const rootDirectory = normalizedPath.split('/')[0];

  if (!ALLOWED_IMAGE_ROOTS.has(rootDirectory)) {
    throw new ImageUploadError(
      'تصاویر فقط در مسیر images قابل ذخیره‌سازی هستند.',
      403
    );
  }

  return normalizedPath;
};

const normalizeFileName = (value) => {
  const rawName =
    typeof value === 'string' ? value.normalize('NFC').trim() : '';

  const fileNameWithoutExtension = rawName.replace(/\.[^.]+$/, '').trim();

  if (!fileNameWithoutExtension) {
    throw new ImageUploadError('نام تصویر معتبر نیست.');
  }

  if (fileNameWithoutExtension.length > 120) {
    throw new ImageUploadError('نام تصویر بیش از حد طولانی است.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(fileNameWithoutExtension)) {
    throw new ImageUploadError(
      'نام تصویر فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و زیرخط باشد.'
    );
  }

  return fileNameWithoutExtension;
};

const detectImageExtension = (buffer) => {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpg';
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  if (buffer.length >= 6) {
    const gifSignature = buffer.subarray(0, 6).toString('ascii');

    if (gifSignature === 'GIF87a' || gifSignature === 'GIF89a') {
      return 'gif';
    }
  }

  if (buffer.length >= 12) {
    const riffSignature = buffer.subarray(0, 4).toString('ascii');

    const webpSignature = buffer.subarray(8, 12).toString('ascii');

    if (riffSignature === 'RIFF' && webpSignature === 'WEBP') {
      return 'webp';
    }
  }

  return null;
};

const validateImageType = ({ file, buffer }) => {
  const mimeType =
    typeof file.type === 'string' ? file.type.toLowerCase().trim() : '';

  const mimeExtension = IMAGE_MIME_TYPES[mimeType];

  if (!mimeExtension) {
    throw new ImageUploadError('فقط تصاویر JPG، PNG، GIF و WebP مجاز هستند.');
  }

  const detectedExtension = detectImageExtension(buffer);

  if (!detectedExtension) {
    throw new ImageUploadError('محتوای فایل انتخاب‌شده یک تصویر معتبر نیست.');
  }

  if (detectedExtension !== mimeExtension) {
    throw new ImageUploadError(
      'نوع واقعی تصویر با فرمت اعلام‌شده فایل مطابقت ندارد.'
    );
  }

  return detectedExtension;
};

const handlePost = async (request) => {
  let log = getRequestLogger({
    component: 'image-upload',
  });

  let uploadContext = {};

  try {
    const auth = await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }

    log = log.child({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
    });

    const formData = await request.formData();

    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      throw new ImageUploadError('لطفاً یک تصویر معتبر انتخاب کنید.');
    }

    if (typeof file.size !== 'number' || file.size <= 0) {
      throw new ImageUploadError('فایل تصویر خالی است.');
    }

    const maxImageBytes = getMaxImageBytes();

    if (file.size > maxImageBytes) {
      throw new ImageUploadError(
        `حجم تصویر نباید بیشتر از ${Math.floor(
          maxImageBytes / 1024 / 1024
        )} مگابایت باشد.`,
        413
      );
    }

    const folderPath = normalizeFolderPath(formData.get('folderPath'));

    const baseFileName = normalizeFileName(formData.get('fileName') || 'image');

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const fileExtension = validateImageType({
      file,
      buffer: fileBuffer,
    });

    const fileName = `${baseFileName}.${fileExtension}`;

    const fileKey = normalizeStorageKey(`${folderPath}/${fileName}`);

    uploadContext = {
      storageKey: fileKey,
      sizeBytes: file.size,
      contentType: file.type || null,
      extension: fileExtension,
    };

    log.info(
      {
        event: 'image_upload_started',
        ...uploadContext,
      },
      'Image upload started'
    );

    const storage = getMediaStorage();

    const savedFile = await storage.saveBuffer(fileBuffer, fileKey);

    const publicPath = toPublicMediaPath(savedFile.key);

    log.info(
      {
        event: 'image_upload_completed',
        ...uploadContext,
      },
      'Image upload completed'
    );

    return NextResponse.json(
      {
        success: true,

        fileKey: savedFile.key,

        /*
         * مقداری که فرم‌ها و دیتابیس استفاده می‌کنند.
         */
        fileUrl: publicPath,

        /*
         * فقط برای سازگاری با کلاینت فعلی.
         * در دیتابیس ذخیره نشود.
         */
        absoluteUrl: savedFile.url,

        contentType: file.type || null,
        size: file.size,

        message: 'تصویر با موفقیت آپلود شد.',
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (error instanceof ImageUploadError) {
      log.warn(
        {
          event: 'image_upload_rejected',

          status: error.status,
          reason: error.message,

          ...uploadContext,
        },
        'Image upload was rejected'
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: error.status,
        }
      );
    }

    logError({
      log,
      error,

      message: 'Image upload failed',

      data: {
        event: 'image_upload_failed',
        ...uploadContext,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در پردازش و ذخیره تصویر.',
      },
      {
        status: 500,
      }
    );
  }
};

export const POST = withApiLogging(handlePost, {
  route: '/api/upload/image',
  component: 'image-upload-api',
});
