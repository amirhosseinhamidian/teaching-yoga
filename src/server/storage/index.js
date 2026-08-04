/* eslint-disable no-undef */

import { ftpsMediaStorage } from './ftps-storage';
import { localVideoStorage, normalizeStorageKey } from './local-storage';

export { normalizeStorageKey };

export const getMediaStorage = () => {
  const driver = String(
    process.env.MEDIA_STORAGE_DRIVER ||
      process.env.VIDEO_STORAGE_DRIVER ||
      'local'
  )
    .trim()
    .toLowerCase();

  switch (driver) {
    case 'local':
      return localVideoStorage;

    case 'ftps':
      return ftpsMediaStorage;

    default:
      throw new Error(`Unsupported media storage driver: ${driver}`);
  }
};

/*
 * برای سازگاری با کدهای فعلی ویدئو.
 */
export const getVideoStorage = getMediaStorage;
