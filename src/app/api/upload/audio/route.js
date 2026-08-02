/* eslint-disable no-undef */

import { NextResponse } from 'next/server';

import { getMediaStorage, normalizeStorageKey } from '@/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { toPublicMediaPath } from '@/server/media/public-media-path';

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

  if (!/^[a-zA-Z0-9_-]+$/.test(nameWithoutExtension)) {
    throw new AudioUploadError(
      'نام فایل صوتی فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و زیرخط باشد.'
    );
  }

  return nameWithoutExtension;
};

const normalizeFolderPath = (value) => {
  const folderPath = typeof value === 'string' ? value.trim() : '';

  if (!folderPath) {
    throw new AudioUploadError('مسیر ذخیره‌سازی فایل صوتی ارسال نشده است.');
  }

  try {
    return normalizeStorageKey(folderPath);
  } catch {
    throw new AudioUploadError('مسیر ذخیره‌سازی فایل صوتی معتبر نیست.');
  }
};

export async function POST(request) {
  try {
    const formData = await request.formData();

    const file = formData.get('file');
    const folderPath = normalizeFolderPath(formData.get('folderPath'));

    const baseFileName = normalizeFileName(formData.get('fileName') || 'audio');

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

    const fileExtension = detectAudioExtension(file);

    if (!fileExtension) {
      throw new AudioUploadError(
        'فقط فایل‌های صوتی mp3، m4a، wav، ogg و webm مجاز هستند.'
      );
    }

    const fileName = `${baseFileName}.${fileExtension}`;

    const fileKey = normalizeStorageKey(`${folderPath}/${fileName}`);

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const storage = getMediaStorage();

    const savedFile = await storage.saveBuffer(fileBuffer, fileKey);

    const publicPath = toPublicMediaPath(savedFile.key);

    return NextResponse.json(
      {
        success: true,

        /*
         * فایل صوتی جلسات باید این
         * مقدار را ذخیره کند.
         */
        fileKey: savedFile.key,

        /*
         * پادکست و رسانه‌های عمومی
         * این مقدار را ذخیره می‌کنند.
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

    console.error('[upload-audio] Upload error:', error);

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
}
