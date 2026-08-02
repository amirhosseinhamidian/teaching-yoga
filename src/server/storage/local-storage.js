/* eslint-disable no-undef */
import path from 'node:path';
import { access, copyFile, cp, mkdir, rm, writeFile } from 'node:fs/promises';

const DEFAULT_STORAGE_ROOT = './storage/published';

const getStorageRoot = () =>
  path.resolve(
    process.cwd(),

    process.env.LOCAL_MEDIA_ROOT ||
      process.env.LOCAL_VIDEO_ROOT ||
      DEFAULT_STORAGE_ROOT
  );

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
    const destinationPath = resolveLocalVideoPath(normalizedKey);

    await mkdir(path.dirname(destinationPath), { recursive: true });
    await copyFile(path.resolve(sourcePath), destinationPath);

    return {
      key: normalizedKey,
      path: destinationPath,
      url: this.getPublicUrl(normalizedKey),
    };
  }

  async saveBuffer(data, key) {
    const normalizedKey = normalizeStorageKey(key);
    const destinationPath = resolveLocalVideoPath(normalizedKey);
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    await mkdir(path.dirname(destinationPath), { recursive: true });
    await writeFile(destinationPath, buffer);

    return {
      key: normalizedKey,
      path: destinationPath,
      url: this.getPublicUrl(normalizedKey),
    };
  }

  async saveDirectory(sourceDirectory, prefix) {
    const normalizedPrefix = normalizeStorageKey(prefix);

    const destinationPath = resolveLocalVideoPath(normalizedPrefix);

    await mkdir(path.dirname(destinationPath), {
      recursive: true,
    });

    await rm(destinationPath, {
      recursive: true,
      force: true,
    });

    await cp(path.resolve(sourceDirectory), destinationPath, {
      recursive: true,
      force: true,
    });

    return {
      key: normalizedPrefix,
      path: destinationPath,
      url: this.getPublicUrl(normalizedPrefix),
    };
  }

  async deletePath(key) {
    const targetPath = resolveLocalVideoPath(key);

    await rm(targetPath, {
      recursive: true,
      force: true,
    });
  }

  async exists(key) {
    const targetPath = resolveLocalVideoPath(key);

    try {
      await access(targetPath);
      return true;
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
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
