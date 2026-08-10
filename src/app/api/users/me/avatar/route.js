/* eslint-disable no-undef */

import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { requireUserApi } from '@/server/auth/require-user-api';

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

class AvatarUploadError extends Error {
  constructor(message, status = 400) {
    super(message);

    this.name = 'AvatarUploadError';
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

const detectImageExtension = (buffer) => {
  // JPEG
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpg';
  }

  // PNG
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

  // GIF
  if (buffer.length >= 6) {
    const gifSignature = buffer.subarray(0, 6).toString('ascii');

    if (gifSignature === 'GIF87a' || gifSignature === 'GIF89a') {
      return 'gif';
    }
  }

  // WebP
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
    throw new AvatarUploadError('فقط تصاویر JPG، PNG، GIF و WebP مجاز هستند.');
  }

  const detectedExtension = detectImageExtension(buffer);

  if (!detectedExtension) {
    throw new AvatarUploadError('محتوای فایل انتخاب‌شده یک تصویر معتبر نیست.');
  }

  if (detectedExtension !== mimeExtension) {
    throw new AvatarUploadError(
      'نوع واقعی تصویر با فرمت اعلام‌شده فایل مطابقت ندارد.'
    );
  }

  return detectedExtension;
};

const handlePost = async (request) => {
  let log = getRequestLogger({
    component: 'user-avatar-upload',
  });

  let uploadContext = {};

  try {
    /*
     * فقط login بودن کاربر بررسی می‌شود.
     * ADMIN بودن لازم نیست.
     */
    const auth = await requireUserApi();

    if (!auth.ok) {
      return auth.response;
    }

    const userId = auth.user.id;

    log = log.child({
      actorUserId: userId,
      actorRole: auth.user.role,
    });

    /*
     * فایل را از FormData دریافت می‌کنیم.
     *
     * مهم:
     * folderPath و fileName از client
     * دریافت نمی‌شوند.
     */
    const formData = await request.formData();

    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      throw new AvatarUploadError('لطفاً یک تصویر معتبر انتخاب کنید.');
    }

    if (typeof file.size !== 'number' || file.size <= 0) {
      throw new AvatarUploadError('فایل تصویر خالی است.');
    }

    /*
     * بررسی حجم
     */
    const maxImageBytes = getMaxImageBytes();

    if (file.size > maxImageBytes) {
      throw new AvatarUploadError(
        `حجم تصویر نباید بیشتر از ${Math.floor(
          maxImageBytes / 1024 / 1024
        )} مگابایت باشد.`,
        413
      );
    }

    /*
     * تبدیل File به Buffer
     */
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    /*
     * بررسی واقعی فرمت فایل
     */
    const fileExtension = validateImageType({
      file,
      buffer: fileBuffer,
    });

    /*
     * مسیر و filename کاملاً توسط سرور
     * تعیین می‌شود.
     *
     * بنابراین client نمی‌تواند:
     *
     * images/products
     * images/courses
     * یا userId شخص دیگری
     *
     * را ارسال کند.
     */
    const fileKey = normalizeStorageKey(
      `images/avatars/${userId}.${fileExtension}`
    );

    uploadContext = {
      storageKey: fileKey,
      sizeBytes: file.size,
      contentType: file.type || null,
      extension: fileExtension,
    };

    log.info(
      {
        event: 'avatar_upload_started',
        ...uploadContext,
      },
      'Avatar upload started'
    );

    /*
     * چون requireUserApi قبلاً user را از DB
     * خوانده، می‌دانیم user معتبر است.
     */
    const storage = getMediaStorage();

    /*
     * ذخیره فایل در storage
     */
    const savedFile = await storage.saveBuffer(fileBuffer, fileKey);

    /*
     * مقداری که باید داخل DB ذخیره شود.
     *
     * مثلاً:
     * /media/images/avatars/USER_ID.jpg
     */
    const publicPath = toPublicMediaPath(savedFile.key);

    /*
     * آپدیت avatar کاربر فعلی
     */
    const updatedUser = await prismadb.user.update({
      where: {
        id: userId,
      },

      data: {
        avatar: publicPath,
      },

      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        phone: true,
        email: true,
        avatar: true,
        role: true,
      },
    });

    log.info(
      {
        event: 'avatar_upload_completed',
        ...uploadContext,
      },
      'Avatar upload completed'
    );

    return NextResponse.json(
      {
        success: true,

        data: {
          user: updatedUser,

          fileKey: savedFile.key,

          fileUrl: publicPath,

          /*
           * فقط برای preview/debug.
           * داخل DB ذخیره نشود.
           */
          absoluteUrl: savedFile.url,

          contentType: file.type || null,

          size: file.size,
        },

        message: 'تصویر پروفایل با موفقیت تغییر کرد.',
      },
      {
        status: 200,

        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    if (error instanceof AvatarUploadError) {
      log.warn(
        {
          event: 'avatar_upload_rejected',

          status: error.status,

          reason: error.message,

          ...uploadContext,
        },
        'Avatar upload was rejected'
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

      message: 'Avatar upload failed',

      data: {
        event: 'avatar_upload_failed',

        ...uploadContext,
      },
    });

    return NextResponse.json(
      {
        success: false,

        error: 'خطا در پردازش و ذخیره تصویر پروفایل.',
      },
      {
        status: 500,
      }
    );
  }
};

export const POST = withApiLogging(handlePost, {
  route: '/api/users/me/avatar',

  component: 'user-avatar-upload-api',
});
