/* eslint-disable no-undef */

import path from 'node:path';
import { randomUUID } from 'node:crypto';

import {
  access,
  copyFile,
  cp,
  mkdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';

import { logError } from '@/server/logger';

import { getStorageOperationLogger } from './storage-logger';

const DEFAULT_STORAGE_ROOT = './storage/published';

const getStorageRoot = () =>
  path.resolve(
    process.cwd(),

    process.env.LOCAL_MEDIA_ROOT ||
      process.env.LOCAL_VIDEO_ROOT ||
      DEFAULT_STORAGE_ROOT
  );

const getDurationMs = (startedAt) => Date.now() - startedAt;

const pathExists = async (targetPath) => {
  try {
    await access(targetPath);

    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
};

const removePathSafely = async (targetPath) => {
  await rm(targetPath, {
    recursive: true,
    force: true,
  });
};

const getTemporaryFilePath = (destinationPath, type) => {
  const directory = path.dirname(destinationPath);

  const fileName = path.basename(destinationPath);

  return path.join(directory, `.${fileName}.${type}-${randomUUID()}`);
};

const cleanTemporaryPath = async ({ temporaryPath, log, event, message }) => {
  try {
    await removePathSafely(temporaryPath);
  } catch (cleanupError) {
    logError({
      log,
      error: cleanupError,

      message,

      data: {
        event,
      },
    });
  }
};

export const normalizeStorageKey = (key) => {
  if (typeof key !== 'string' || !key.trim()) {
    throw new Error('Storage key is required.');
  }

  const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');

  const segments = cleanKey.split('/').filter(Boolean);

  if (
    segments.length === 0 ||
    segments.some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error('Invalid storage key.');
  }

  return segments.join('/');
};

export const resolveLocalVideoPath = (key) => {
  const normalizedKey = normalizeStorageKey(key);

  const storageRoot = getStorageRoot();

  const targetPath = path.resolve(storageRoot, ...normalizedKey.split('/'));

  const relativePath = path.relative(storageRoot, targetPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Storage key is outside the storage directory.');
  }

  return targetPath;
};

class LocalVideoStorage {
  async saveFile(sourcePath, key) {
    const normalizedKey = normalizeStorageKey(key);

    const operationId = randomUUID();

    const log = getStorageOperationLogger({
      operation: 'save_file',
      storageKey: normalizedKey,
      operationId,
    });

    const startedAt = Date.now();

    const destinationPath = resolveLocalVideoPath(normalizedKey);

    const temporaryPath = getTemporaryFilePath(destinationPath, 'incoming');

    try {
      const sourceStats = await stat(path.resolve(sourcePath));

      if (!sourceStats.isFile()) {
        throw new Error('Storage source path is not a file.');
      }

      log.debug(
        {
          event: 'local_storage_file_save_started',
          sizeBytes: sourceStats.size,
        },
        'Local storage file save started'
      );

      await mkdir(path.dirname(destinationPath), {
        recursive: true,
      });

      await copyFile(path.resolve(sourcePath), temporaryPath);

      /*
       * در Linux و macOS عملیات Rename روی همان
       * File System اتمیک است.
       */
      await rename(temporaryPath, destinationPath);

      log.info(
        {
          event: 'local_storage_file_saved',
          sizeBytes: sourceStats.size,
          durationMs: getDurationMs(startedAt),
        },
        'Local storage file saved'
      );
    } catch (error) {
      await cleanTemporaryPath({
        temporaryPath,
        log,

        event: 'local_storage_file_cleanup_failed',

        message: 'Failed to clean temporary storage file',
      });

      logError({
        log,
        error,

        message: 'Local storage file save failed',

        data: {
          event: 'local_storage_file_save_failed',
          durationMs: getDurationMs(startedAt),
        },
      });

      throw error;
    }

    return {
      key: normalizedKey,
      path: destinationPath,
      url: this.getPublicUrl(normalizedKey),
    };
  }

  async saveBuffer(data, key) {
    const normalizedKey = normalizeStorageKey(key);

    const operationId = randomUUID();

    const log = getStorageOperationLogger({
      operation: 'save_buffer',
      storageKey: normalizedKey,
      operationId,
    });

    const startedAt = Date.now();

    const destinationPath = resolveLocalVideoPath(normalizedKey);

    const temporaryPath = getTemporaryFilePath(destinationPath, 'incoming');

    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    try {
      log.debug(
        {
          event: 'local_storage_buffer_save_started',
          sizeBytes: buffer.length,
        },
        'Local storage buffer save started'
      );

      await mkdir(path.dirname(destinationPath), {
        recursive: true,
      });

      await writeFile(temporaryPath, buffer);

      await rename(temporaryPath, destinationPath);

      log.info(
        {
          event: 'local_storage_buffer_saved',
          sizeBytes: buffer.length,
          durationMs: getDurationMs(startedAt),
        },
        'Local storage buffer saved'
      );
    } catch (error) {
      await cleanTemporaryPath({
        temporaryPath,
        log,

        event: 'local_storage_buffer_cleanup_failed',

        message: 'Failed to clean temporary storage buffer',
      });

      logError({
        log,
        error,

        message: 'Local storage buffer save failed',

        data: {
          event: 'local_storage_buffer_save_failed',
          sizeBytes: buffer.length,
          durationMs: getDurationMs(startedAt),
        },
      });

      throw error;
    }

    return {
      key: normalizedKey,
      path: destinationPath,
      url: this.getPublicUrl(normalizedKey),
    };
  }

  async saveDirectory(sourceDirectory, prefix) {
    const normalizedPrefix = normalizeStorageKey(prefix);

    const operationId = randomUUID();

    const log = getStorageOperationLogger({
      operation: 'save_directory',
      storageKey: normalizedPrefix,
      operationId,
    });

    const startedAt = Date.now();

    const sourcePath = path.resolve(sourceDirectory);

    const destinationPath = resolveLocalVideoPath(normalizedPrefix);

    const parentDirectory = path.dirname(destinationPath);

    const directoryName = path.basename(destinationPath);

    /*
     * پوشه موقت داخل همان File System ساخته می‌شود
     * تا Rename نهایی اتمیک باشد.
     */
    const stagingPath = path.join(
      parentDirectory,
      `.${directoryName}.incoming-${operationId}`
    );

    const backupPath = path.join(
      parentDirectory,
      `.${directoryName}.backup-${operationId}`
    );

    let previousDirectoryMoved = false;
    let previousDirectoryRestored = false;

    try {
      log.debug(
        {
          event: 'local_storage_directory_save_started',
        },
        'Local storage directory save started'
      );

      await access(sourcePath);

      await mkdir(parentDirectory, {
        recursive: true,
      });

      await Promise.all([
        removePathSafely(stagingPath),
        removePathSafely(backupPath),
      ]);

      /*
       * ابتدا خروجی جدید در Staging کپی می‌شود.
       * نسخه فعلی کاربران هنوز دست‌نخورده است.
       */
      await cp(sourcePath, stagingPath, {
        recursive: true,
        force: true,
      });

      await access(stagingPath);

      /*
       * نسخه فعلی فقط در لحظه تعویض کنار گذاشته می‌شود.
       */
      if (await pathExists(destinationPath)) {
        await rename(destinationPath, backupPath);

        previousDirectoryMoved = true;
      }

      /*
       * تعویض اتمیک نسخه جدید.
       */
      await rename(stagingPath, destinationPath);

      /*
       * خطای حذف Backup نباید عملیات موفق انتشار
       * را Failed کند؛ ولی باید به‌صورت عملیاتی ثبت شود.
       */
      if (previousDirectoryMoved) {
        try {
          await removePathSafely(backupPath);
        } catch (backupCleanupError) {
          logError({
            log,
            error: backupCleanupError,

            message: 'Failed to remove old storage directory backup',

            data: {
              event: 'local_storage_backup_cleanup_failed',
            },
          });
        }
      }

      log.info(
        {
          event: 'local_storage_directory_saved',

          replacedPreviousDirectory: previousDirectoryMoved,

          durationMs: getDurationMs(startedAt),
        },
        'Local storage directory saved'
      );
    } catch (error) {
      await cleanTemporaryPath({
        temporaryPath: stagingPath,
        log,

        event: 'local_storage_staging_cleanup_failed',

        message: 'Failed to clean storage staging directory',
      });

      /*
       * اگر نسخه قبلی کنار گذاشته شده ولی جایگزینی
       * موفق نشده است، نسخه قبلی Restore می‌شود.
       */
      if (previousDirectoryMoved) {
        try {
          const destinationExists = await pathExists(destinationPath);

          const backupExists = await pathExists(backupPath);

          if (!destinationExists && backupExists) {
            await rename(backupPath, destinationPath);

            previousDirectoryRestored = true;

            log.warn(
              {
                event: 'local_storage_directory_backup_restored',
              },
              'Previous storage directory backup was restored'
            );
          }
        } catch (restoreError) {
          logError({
            log,
            error: restoreError,

            message: 'Failed to restore storage directory backup',

            data: {
              event: 'local_storage_backup_restore_failed',
            },
          });
        }
      }

      logError({
        log,
        error,

        message: 'Local storage directory save failed',

        data: {
          event: 'local_storage_directory_save_failed',

          previousDirectoryMoved,
          previousDirectoryRestored,

          durationMs: getDurationMs(startedAt),
        },
      });

      throw error;
    }

    return {
      key: normalizedPrefix,
      path: destinationPath,
      url: this.getPublicUrl(normalizedPrefix),
    };
  }

  async deletePath(key) {
    const normalizedKey = normalizeStorageKey(key);

    const operationId = randomUUID();

    const log = getStorageOperationLogger({
      operation: 'delete_path',
      storageKey: normalizedKey,
      operationId,
    });

    const startedAt = Date.now();

    const targetPath = resolveLocalVideoPath(normalizedKey);

    try {
      const existed = await pathExists(targetPath);

      await removePathSafely(targetPath);

      log.info(
        {
          event: 'local_storage_path_deleted',
          existed,
          durationMs: getDurationMs(startedAt),
        },
        'Local storage path deleted'
      );
    } catch (error) {
      logError({
        log,
        error,

        message: 'Local storage path deletion failed',

        data: {
          event: 'local_storage_path_delete_failed',
          durationMs: getDurationMs(startedAt),
        },
      });

      throw error;
    }
  }

  async exists(key) {
    const targetPath = resolveLocalVideoPath(key);

    return pathExists(targetPath);
  }

  getPublicUrl(key) {
    const normalizedKey = normalizeStorageKey(key);

    const baseUrl =
      process.env.MEDIA_PUBLIC_BASE_URL || process.env.VIDEO_PUBLIC_BASE_URL;

    if (!baseUrl) {
      throw new Error(
        'MEDIA_PUBLIC_BASE_URL or VIDEO_PUBLIC_BASE_URL is not configured.'
      );
    }

    const encodedKey = normalizedKey
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    return `${baseUrl.replace(/\/+$/, '')}/${encodedKey}`;
  }

  getAbsolutePath(key) {
    return resolveLocalVideoPath(key);
  }
}

export const localVideoStorage = new LocalVideoStorage();
