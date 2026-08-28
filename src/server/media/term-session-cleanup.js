const HTTP_URL_PATTERN =
  /^https?:\/\//i;

const CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u001f\u007f]/;

export const getOrphanTermSessionIds = ({
  sessionIds,
  sharedSessionIds,
}) => {
  const normalizedSessionIds =
    Array.isArray(sessionIds)
      ? sessionIds.filter(
          (value) =>
            typeof value ===
              'string' &&
            value.trim()
        )
      : [];

  const sharedSet =
    new Set(
      Array.isArray(
        sharedSessionIds
      )
        ? sharedSessionIds
        : []
    );

  return [
    ...new Set(
      normalizedSessionIds
    ),
  ].filter(
    (sessionId) =>
      !sharedSet.has(
        sessionId
      )
  );
};

export const getManagedSessionAudioKey =
  (value) => {
    const rawValue =
      typeof value === 'string'
        ? value.trim()
        : '';

    if (
      !rawValue ||
      HTTP_URL_PATTERN.test(
        rawValue
      ) ||
      CONTROL_CHARACTER_PATTERN.test(
        rawValue
      )
    ) {
      return null;
    }

    const cleanValue =
      rawValue
        .replace(/\\/g, '/')
        .replace(/^\/+/, '');

    const segments =
      cleanValue
        .split('/')
        .filter(Boolean);

    if (
      segments.length < 2 ||
      segments[0] !== 'audio' ||
      segments.some(
        (segment) =>
          segment === '.' ||
          segment === '..'
      )
    ) {
      return null;
    }

    return segments.join('/');
  };

export async function deleteManagedSessionAudio({
  storage,
  audioKey,
}) {
  const managedKey =
    getManagedSessionAudioKey(
      audioKey
    );

  if (!managedKey) {
    return {
      deleted: false,
      reason:
        'audio_not_managed',
      key: null,
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
    managedKey
  );

  return {
    deleted: true,
    reason: null,
    key: managedKey,
  };
}
