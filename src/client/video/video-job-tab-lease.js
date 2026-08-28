const STORAGE_PREFIX =
  'teaching-yoga:video-job-tab-lease:v1:';

const BROADCAST_CHANNEL_NAME =
  'teaching-yoga:video-job-tab-lease:v1';

const DEFAULT_LEASE_DURATION_MS =
  15 * 1000;

const DEFAULT_HEARTBEAT_INTERVAL_MS =
  5 * 1000;

const DEFAULT_SETTLE_DELAY_MS = 60;

const createId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
};

const normalizeJobId = (value) => {
  const jobId =
    typeof value === 'string'
      ? value.trim()
      : '';

  if (!jobId) {
    throw new TypeError(
      'jobId is required.'
    );
  }

  return jobId;
};

const sleep = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(
      resolve,
      Math.max(
        0,
        Number(milliseconds) || 0
      )
    );
  });

const parseLease = (value) => {
  if (
    typeof value !== 'string' ||
    !value
  ) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(value);

    if (
      typeof parsed?.ownerId !==
        'string' ||
      typeof parsed?.token !==
        'string' ||
      !Number.isFinite(
        Number(parsed?.expiresAt)
      )
    ) {
      return null;
    }

    return {
      ownerId:
        parsed.ownerId,

      token:
        parsed.token,

      expiresAt:
        Number(
          parsed.expiresAt
        ),
    };
  } catch {
    return null;
  }
};

const getDefaultStorage = () => {
  try {
    if (
      typeof window ===
        'undefined' ||
      !window.localStorage
    ) {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
};

const getDefaultNavigator = () =>
  typeof navigator !== 'undefined'
    ? navigator
    : null;

const createDefaultBroadcastChannel =
  () => {
    if (
      typeof BroadcastChannel !==
      'function'
    ) {
      return null;
    }

    try {
      return new BroadcastChannel(
        BROADCAST_CHANNEL_NAME
      );
    } catch {
      return null;
    }
  };

export function createVideoJobTabLeaseManager({
  storage = getDefaultStorage(),
  navigatorObject =
    getDefaultNavigator(),
  broadcastChannel =
    createDefaultBroadcastChannel(),
  now = () => Date.now(),
  leaseDurationMs =
    DEFAULT_LEASE_DURATION_MS,
  heartbeatIntervalMs =
    DEFAULT_HEARTBEAT_INTERVAL_MS,
  settleDelayMs =
    DEFAULT_SETTLE_DELAY_MS,
} = {}) {
  const ownerId =
    createId();

  const activeLeases =
    new Map();

  let disposed = false;

  const getStorageKey = (jobId) =>
    `${STORAGE_PREFIX}${encodeURIComponent(
      normalizeJobId(jobId)
    )}`;

  const safeReadLease = (
    jobId
  ) => {
    if (!storage) {
      return null;
    }

    try {
      return parseLease(
        storage.getItem(
          getStorageKey(jobId)
        )
      );
    } catch {
      return null;
    }
  };

  const safeWriteLease = (
    jobId,
    lease
  ) => {
    if (!storage) {
      return false;
    }

    try {
      storage.setItem(
        getStorageKey(jobId),
        JSON.stringify(lease)
      );

      return true;
    } catch {
      return false;
    }
  };

  const safeRemoveLease = (
    jobId,
    token
  ) => {
    if (!storage) {
      return;
    }

    try {
      const current =
        safeReadLease(jobId);

      if (
        current?.ownerId ===
          ownerId &&
        current?.token ===
          token
      ) {
        storage.removeItem(
          getStorageKey(jobId)
        );
      }
    } catch {
      // Cross-tab coordination must not break upload.
    }
  };

  const announce = (
    type,
    jobId
  ) => {
    try {
      broadcastChannel?.postMessage({
        type,
        jobId,
        ownerId,
        at: now(),
      });
    } catch {
      // BroadcastChannel is only an optimization.
    }
  };

  const release = (jobId) => {
    const normalizedJobId =
      normalizeJobId(jobId);

    const active =
      activeLeases.get(
        normalizedJobId
      );

    if (!active) {
      return false;
    }

    activeLeases.delete(
      normalizedJobId
    );

    if (active.timer) {
      clearInterval(
        active.timer
      );
    }

    if (
      active.type ===
      'web-lock'
    ) {
      active.release?.();
    } else {
      safeRemoveLease(
        normalizedJobId,
        active.token
      );
    }

    announce(
      'released',
      normalizedJobId
    );

    return true;
  };

  const acquireWebLock =
    async (jobId) => {
      const lockManager =
        navigatorObject?.locks;

      if (
        typeof lockManager?.request !==
        'function'
      ) {
        return null;
      }

      let settled = false;

      return new Promise(
        (resolve) => {
          const finish = (value) => {
            if (settled) {
              return;
            }

            settled = true;
            resolve(value);
          };

          Promise.resolve(
            lockManager.request(
              `teaching-yoga:video-job:${jobId}`,
              {
                mode: 'exclusive',
                ifAvailable: true,
              },
              async (lock) => {
                if (
                  !lock ||
                  disposed
                ) {
                  finish(false);
                  return;
                }

                let releaseLock;

                const holdLock =
                  new Promise(
                    (releaseResolve) => {
                      releaseLock =
                        releaseResolve;
                    }
                  );

                activeLeases.set(
                  jobId,
                  {
                    type:
                      'web-lock',
                    release:
                      releaseLock,
                  }
                );

                announce(
                  'claimed',
                  jobId
                );

                finish(true);

                await holdLock;
              }
            )
          ).catch(() => {
            finish(null);
          });
        }
      );
    };

  const acquireFallbackLease =
    async (jobId) => {
      /*
       * اگر localStorage در دسترس نباشد coordination
       * را fail-open می‌کنیم؛ upload نباید صرفاً به‌خاطر
       * محدودیت browser storage از کار بیفتد.
       */
      if (!storage) {
        activeLeases.set(
          jobId,
          {
            type: 'memory',
          }
        );

        return true;
      }

      const timestamp =
        Number(now());

      const current =
        safeReadLease(jobId);

      if (
        current &&
        current.ownerId !== ownerId &&
        current.expiresAt >
          timestamp
      ) {
        return false;
      }

      const token =
        createId();

      const candidate = {
        ownerId,
        token,

        expiresAt:
          timestamp +
          leaseDurationMs,
      };

      if (
        !safeWriteLease(
          jobId,
          candidate
        )
      ) {
        activeLeases.set(
          jobId,
          {
            type: 'memory',
          }
        );

        return true;
      }

      /*
       * دو تب ممکن است در یک tick خالی‌بودن lease را ببینند.
       * بعد از settle فقط آخرین writer مالک باقی می‌ماند.
       */
      await sleep(
        settleDelayMs
      );

      if (disposed) {
        safeRemoveLease(
          jobId,
          token
        );

        return false;
      }

      const confirmed =
        safeReadLease(jobId);

      if (
        confirmed?.ownerId !==
          ownerId ||
        confirmed?.token !==
          token
      ) {
        return false;
      }

      const timer =
        setInterval(() => {
          const active =
            activeLeases.get(
              jobId
            );

          if (
            !active ||
            active.token !==
              token
          ) {
            return;
          }

          const latest =
            safeReadLease(
              jobId
            );

          if (
            latest?.ownerId !==
              ownerId ||
            latest?.token !==
              token
          ) {
            clearInterval(
              timer
            );

            activeLeases.delete(
              jobId
            );

            return;
          }

          safeWriteLease(
            jobId,
            {
              ownerId,
              token,

              expiresAt:
                Number(now()) +
                leaseDurationMs,
            }
          );
        }, heartbeatIntervalMs);

      timer.unref?.();

      activeLeases.set(
        jobId,
        {
          type: 'storage',
          token,
          timer,
        }
      );

      announce(
        'claimed',
        jobId
      );

      return true;
    };

  const acquire = async (
    jobId
  ) => {
    const normalizedJobId =
      normalizeJobId(jobId);

    if (disposed) {
      return false;
    }

    if (
      activeLeases.has(
        normalizedJobId
      )
    ) {
      return true;
    }

    const webLockResult =
      await acquireWebLock(
        normalizedJobId
      );

    if (
      webLockResult !== null
    ) {
      return webLockResult;
    }

    return acquireFallbackLease(
      normalizedJobId
    );
  };

  const owns = (jobId) => {
    const normalizedJobId =
      normalizeJobId(jobId);

    return activeLeases.has(
      normalizedJobId
    );
  };

  if (broadcastChannel) {
    broadcastChannel.onmessage =
      (event) => {
        const message =
          event?.data;

        if (
          message?.type !==
            'claimed' ||
          message?.ownerId ===
            ownerId ||
          typeof message?.jobId !==
            'string'
        ) {
          return;
        }

        const active =
          activeLeases.get(
            message.jobId
          );

        if (
          active?.type !==
          'storage'
        ) {
          return;
        }

        const stored =
          safeReadLease(
            message.jobId
          );

        if (
          stored?.ownerId !==
            ownerId ||
          stored?.token !==
            active.token
        ) {
          if (active.timer) {
            clearInterval(
              active.timer
            );
          }

          activeLeases.delete(
            message.jobId
          );
        }
      };
  }

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;

    [
      ...activeLeases.keys(),
    ].forEach((jobId) => {
      release(jobId);
    });

    try {
      broadcastChannel?.close?.();
    } catch {
      // Nothing else to clean up.
    }
  };

  return {
    acquire,
    release,
    owns,
    dispose,
  };
}
