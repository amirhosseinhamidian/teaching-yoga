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

const DEFAULT_MAX_AUDIO_BYTES = 512 * 1024 * 1024;

const AUDIO_MIME_TYPES = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/x-m4a': 'm4a',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'application/ogg': 'ogg',
};

const ALLOWED_EXTENSIONS = new Set(['mp3', 'm4a', 'wav', 'webm', 'ogg']);

const ALLOWED_AUDIO_ROOTS = new Set(['audio', 'podcast']);

class AudioUploadError extends Error {
  constructor(message, status = 400) {
    super(message);

    this.name = 'AudioUploadError';
    this.status = status;
  }
}

const getMaxAudioBytes = () => {
  const configuredValue = Number(process.env.MAX_AUDIO_BYTES);

  if (Number.isFinite(configuredValue) && configuredValue > 0) {
    return Math.floor(configuredValue);
  }

  return DEFAULT_MAX_AUDIO_BYTES;
};

const detectAudioExtension = (file) => {
  const mimeType =
    typeof file.type === 'string' ? file.type.toLowerCase().trim() : '';

  const mimeExtension = AUDIO_MIME_TYPES[mimeType];

  if (mimeExtension) {
    return mimeExtension;
  }

  const originalName = typeof file.name === 'string' ? file.name.trim() : '';

  const extension = originalName.split('.').pop()?.toLowerCase() || '';

  if (ALLOWED_EXTENSIONS.has(extension)) {
    return extension;
  }

  return null;
};

const normalizeFileName = (value) => {
  const rawName = typeof value === 'string' ? value.trim() : '';

  const nameWithoutExtension = rawName.replace(/\.[^.]+$/, '');

  if (!nameWithoutExtension) {
    throw new AudioUploadError('نام فایل صوتی معتبر نیست.');
  }

  if (nameWithoutExtension.length > 120) {
    throw new AudioUploadError('نام فایل صوتی بیش از حد طولانی است.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(nameWithoutExtension)) {
    throw new AudioUploadError(
      'نام فایل صوتی فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و زیرخط باشد.'
    );
  }

  return nameWithoutExtension;
};

const normalizeFolderPath = (value) => {
  const folderPath =
    typeof value === 'string' ? value.normalize('NFC').trim() : '';

  if (!folderPath) {
    throw new AudioUploadError('مسیر ذخیره‌سازی فایل صوتی ارسال نشده است.');
  }

  if (folderPath.length > 500) {
    throw new AudioUploadError(
      'مسیر ذخیره‌سازی فایل صوتی بیش از حد طولانی است.'
    );
  }

  let normalizedPath;

  try {
    normalizedPath = normalizeStorageKey(folderPath);
  } catch {
    throw new AudioUploadError('مسیر ذخیره‌سازی فایل صوتی معتبر نیست.');
  }

  const rootDirectory = normalizedPath.split('/')[0];

  if (!ALLOWED_AUDIO_ROOTS.has(rootDirectory)) {
    throw new AudioUploadError(
      'فایل صوتی فقط در مسیرهای audio یا podcast قابل ذخیره‌سازی است.',
      403
    );
  }

  return normalizedPath;
};

const handlePost = async (request) => {
  let log = getRequestLogger({
    component: 'audio-upload',
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
      throw new AudioUploadError('لطفاً یک فایل صوتی معتبر ارسال کنید.');
    }

    if (typeof file.size !== 'number' || file.size <= 0) {
      throw new AudioUploadError('فایل صوتی خالی است.');
    }

    const maxAudioBytes = getMaxAudioBytes();

    if (file.size > maxAudioBytes) {
      throw new AudioUploadError(
        `حجم فایل صوتی نباید بیشتر از ${Math.floor(
          maxAudioBytes / 1024 / 1024
        )} مگابایت باشد.`,
        413
      );
    }

    const folderPath = normalizeFolderPath(formData.get('folderPath'));

    const baseFileName = normalizeFileName(formData.get('fileName') || 'audio');

    const fileExtension = detectAudioExtension(file);

    if (!fileExtension) {
      throw new AudioUploadError(
        'فقط فایل‌های صوتی mp3، m4a، wav، ogg و webm مجاز هستند.'
      );
    }

    const fileName = `${baseFileName}.${fileExtension}`;

    const fileKey = normalizeStorageKey(`${folderPath}/${fileName}`);

    const rootDirectory = fileKey.split('/')[0];

    uploadContext = {
      storageKey: fileKey,
      sizeBytes: file.size,
      contentType: file.type || null,
      extension: fileExtension,

      mediaVisibility: rootDirectory === 'podcast' ? 'PUBLIC' : 'PROTECTED',
    };

    log.info(
      {
        event: 'audio_upload_started',
        ...uploadContext,
      },
      'Audio upload started'
    );

    /*
     * در حال حاضر کل فایل وارد حافظه می‌شود.
     * Streaming Upload در مرحله Hardening VPS اصلاح خواهد شد.
     */
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const storage = getMediaStorage();

    const savedFile = await storage.saveBuffer(fileBuffer, fileKey);

    const publicPath = toPublicMediaPath(savedFile.key);

    log.info(
      {
        event: 'audio_upload_completed',
        ...uploadContext,
      },
      'Audio upload completed'
    );

    return NextResponse.json(
      {
        success: true,

        /*
         * فایل صوتی جلسات این مقدار را ذخیره می‌کند.
         */
        fileKey: savedFile.key,

        /*
         * پادکست و رسانه عمومی این مقدار را ذخیره می‌کنند.
         */
        fileUrl: publicPath,

        absoluteUrl: savedFile.url,

        contentType: file.type || null,
        size: file.size,

        message: 'فایل صوتی با موفقیت آپلود شد.',
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (error instanceof AudioUploadError) {
      log.warn(
        {
          event: 'audio_upload_rejected',

          status: error.status,
          reason: error.message,

          ...uploadContext,
        },
        'Audio upload was rejected'
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

      message: 'Audio upload failed',

      data: {
        event: 'audio_upload_failed',
        ...uploadContext,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در پردازش فایل صوتی.',
      },
      {
        status: 500,
      }
    );
  }
};

export const POST = withApiLogging(handlePost, {
  route: '/api/upload/audio',
  component: 'audio-upload-api',
});
