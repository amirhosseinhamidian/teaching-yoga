/* eslint-disable no-undef */

import { localVideoStorage, normalizeStorageKey } from './local-storage';

export { normalizeStorageKey };

export const getMediaStorage = () => {
  const driver =
    process.env.MEDIA_STORAGE_DRIVER ||
    process.env.VIDEO_STORAGE_DRIVER ||
    'local';

  switch (driver) {
    case 'local':
      return localVideoStorage;

    default:
      throw new Error(`Unsupported media storage driver: ${driver}`);
  }
};

/*
 * برای سازگاری با کدهای فعلی ویدئو.
 */
export const getVideoStorage = getMediaStorage;
