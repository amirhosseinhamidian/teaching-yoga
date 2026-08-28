/* eslint-disable no-undef */

import { statfs } from 'node:fs/promises';

const DEFAULT_VIDEO_DISK_RESERVE_BYTES =
  2 * 1024 * 1024 * 1024;

const getPositiveInteger = (value, fallback) => {
  const number = Number(value);

  if (
    Number.isSafeInteger(number) &&
    number > 0
  ) {
    return number;
  }

  return fallback;
};

const getReserveBytes = () =>
  getPositiveInteger(
    process.env.VIDEO_DISK_RESERVE_BYTES,
    DEFAULT_VIDEO_DISK_RESERVE_BYTES
  );

const normalizeBytes = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.ceil(number);
};

const formatGiB = (bytes) => {
  const gib =
    normalizeBytes(bytes) /
    (1024 * 1024 * 1024);

  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 1,
  }).format(gib);
};

export class VideoDiskSpaceError extends Error {
  constructor({
    availableBytes,
    requiredBytes,
    reserveBytes,
    operation,
  }) {
    const minimumFreeBytes =
      requiredBytes + reserveBytes;

    super(
      `فضای خالی دیسک برای ${operation} کافی نیست. ` +
        `حداقل ${formatGiB(
          minimumFreeBytes
        )} گیگابایت فضای آزاد لازم است، ` +
        `اما حدود ${formatGiB(
          availableBytes
        )} گیگابایت آزاد است.`
    );

    this.name = 'VideoDiskSpaceError';
    this.code = 'VIDEO_DISK_SPACE_LOW';
    this.statusCode = 507;

    this.availableBytes =
      availableBytes;

    this.requiredBytes =
      requiredBytes;

    this.reserveBytes =
      reserveBytes;

    this.minimumFreeBytes =
      minimumFreeBytes;

    this.operation = operation;
  }
}

export async function getVideoDiskSpace(
  targetPath
) {
  const filesystem = await statfs(
    targetPath
  );

  const blockSize =
    Number(filesystem.bsize) || 0;

  const availableBlocks =
    Number(
      filesystem.bavail ??
        filesystem.bfree
    ) || 0;

  const availableBytes =
    Math.max(
      0,
      blockSize * availableBlocks
    );

  return {
    availableBytes,
    blockSize,
  };
}

export async function ensureVideoDiskSpace({
  targetPath,
  requiredBytes = 0,
  reserveBytes = getReserveBytes(),
  operation = 'عملیات ویدئو',
}) {
  const normalizedRequiredBytes =
    normalizeBytes(requiredBytes);

  const normalizedReserveBytes =
    normalizeBytes(reserveBytes);

  const {
    availableBytes,
  } = await getVideoDiskSpace(
    targetPath
  );

  const minimumFreeBytes =
    normalizedRequiredBytes +
    normalizedReserveBytes;

  if (
    availableBytes <
    minimumFreeBytes
  ) {
    throw new VideoDiskSpaceError({
      availableBytes,
      requiredBytes:
        normalizedRequiredBytes,
      reserveBytes:
        normalizedReserveBytes,
      operation,
    });
  }

  return {
    availableBytes,

    requiredBytes:
      normalizedRequiredBytes,

    reserveBytes:
      normalizedReserveBytes,

    minimumFreeBytes,

    remainingAfterOperation:
      availableBytes -
      normalizedRequiredBytes,
  };
}
