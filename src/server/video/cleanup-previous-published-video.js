const MASTER_PLAYLIST_FILE_NAME =
  'master.m3u8';

const MANAGED_VIDEO_ROOT =
  'videos';

export const getManagedVideoOutputPrefix = (
  outputKey
) => {
  if (
    typeof outputKey !== 'string' ||
    !outputKey.trim()
  ) {
    return null;
  }

  const cleanKey =
    outputKey
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');

  /*
   * Legacy/external URLs must never be treated as
   * storage keys owned by this application.
   */
  if (
    /^[a-z][a-z0-9+.-]*:\/\//i.test(
      cleanKey
    )
  ) {
    return null;
  }

  const segments =
    cleanKey
      .split('/')
      .filter(Boolean);

  if (
    segments.length < 3 ||
    segments[0] !==
      MANAGED_VIDEO_ROOT ||
    segments[
      segments.length - 1
    ] !==
      MASTER_PLAYLIST_FILE_NAME ||
    segments.some(
      (segment) =>
        segment === '.' ||
        segment === '..'
    )
  ) {
    return null;
  }

  return segments
    .slice(0, -1)
    .join('/');
};

export async function deleteManagedPublishedVideo({
  storage,
  outputKey,
}) {
  const outputPrefix =
    getManagedVideoOutputPrefix(
      outputKey
    );

  if (!outputPrefix) {
    return {
      deleted: false,
      reason:
        'output_not_managed',
      outputPrefix: null,
    };
  }

  if (
    !storage ||
    typeof storage.deletePath !==
      'function'
  ) {
    throw new TypeError(
      'Storage deletePath() is required.'
    );
  }

  await storage.deletePath(
    outputPrefix
  );

  return {
    deleted: true,
    reason: null,
    outputPrefix,
  };
}

export async function cleanupPreviousPublishedVideo({
  storage,
  previousOutputKey,
  currentOutputKey,
}) {
  const previousPrefix =
    getManagedVideoOutputPrefix(
      previousOutputKey
    );

  if (!previousPrefix) {
    return {
      deleted: false,
      reason:
        'previous_output_not_managed',
      previousPrefix: null,
    };
  }

  const currentPrefix =
    getManagedVideoOutputPrefix(
      currentOutputKey
    );

  if (
    currentPrefix &&
    currentPrefix ===
      previousPrefix
  ) {
    return {
      deleted: false,
      reason:
        'same_output_prefix',
      previousPrefix,
    };
  }

  if (
    !storage ||
    typeof storage.deletePath !==
      'function'
  ) {
    throw new TypeError(
      'Storage deletePath() is required.'
    );
  }

  await storage.deletePath(
    previousPrefix
  );

  return {
    deleted: true,
    reason: null,
    previousPrefix,
  };
}
