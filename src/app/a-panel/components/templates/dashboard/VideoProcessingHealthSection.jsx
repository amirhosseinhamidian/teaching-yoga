/* eslint-disable no-undef */
'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FiRefreshCw,
} from 'react-icons/fi';

import {
  HiOutlineCircleStack,
} from 'react-icons/hi2';

import {
  MdOutlineHealthAndSafety,
  MdOutlineStorage,
} from 'react-icons/md';

import {
  PiQueueBold,
  PiWarningCircleBold,
} from 'react-icons/pi';

import {
  VIDEO_UPLOAD_BENCHMARK_HISTORY_CHANGED_EVENT,
  clearVideoUploadBenchmarkHistory,
  getVideoUploadBenchmarkHistory,
} from '@/client/video/video-upload-benchmark-history';

import {
  VIDEO_UPLOAD_BENCHMARK_CHUNK_SIZES_MIB,
  VIDEO_UPLOAD_BENCHMARK_CONCURRENCIES,
  clearVideoUploadRuntimeTuning,
  getDefaultVideoUploadTuning,
  getVideoUploadRuntimeTuning,
  setVideoUploadRuntimeTuning,
} from '@/client/video/video-upload-tuning';

const REFRESH_INTERVAL_MS =
  30 * 1000;

const STATUS_META = {
  healthy: {
    label: 'سالم',
    badgeClass:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },

  degraded: {
    label: 'نیازمند بررسی',
    badgeClass:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },

  critical: {
    label: 'بحرانی',
    badgeClass:
      'bg-red-500/10 text-red-600 dark:text-red-400',
  },

  unavailable: {
    label: 'در دسترس نیست',
    badgeClass:
      'bg-black/5 text-subtext-light dark:bg-white/10 dark:text-subtext-dark',
  },
};

const ISSUE_LABELS = {
  worker_heartbeat_unhealthy:
    'Worker پاسخ نمی‌دهد',

  disk_space_critical:
    'فضای دیسک بحرانی است',

  disk_space_warning:
    'فضای دیسک رو به اتمام است',

  stale_running_jobs:
    'Job پردازش گیرکرده وجود دارد',

  recent_failed_jobs:
    'Job ناموفق در ۲۴ ساعت اخیر وجود دارد',
};

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '—';
  }

  return Math.max(
    0,
    Math.round(number)
  ).toLocaleString('fa-IR');
};

const formatBytes = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return '—';
  }

  const bytes = Number(value);

  if (
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return '—';
  }

  const gib =
    bytes /
    (1024 * 1024 * 1024);

  if (gib >= 1) {
    return `${gib.toLocaleString(
      'fa-IR',
      {
        maximumFractionDigits: 1,
      }
    )} GB`;
  }

  const mib =
    bytes /
    (1024 * 1024);

  return `${mib.toLocaleString(
    'fa-IR',
    {
      maximumFractionDigits: 0,
    }
  )} MB`;
};

const formatSpeed = (value) => {
  const bytesPerSecond =
    Number(value);

  if (
    !Number.isFinite(
      bytesPerSecond
    ) ||
    bytesPerSecond <= 0
  ) {
    return '—';
  }

  const megabytesPerSecond =
    bytesPerSecond /
    (1024 * 1024);

  return `${megabytesPerSecond.toLocaleString(
    'fa-IR',
    {
      maximumFractionDigits: 1,
    }
  )} MB/s`;
};

const formatRunDate = (value) => {
  const date =
    new Date(
      Number(value)
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return date.toLocaleString(
    'fa-IR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    }
  );
};

const formatDuration = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return '—';
  }

  const milliseconds =
    Number(value);

  if (
    !Number.isFinite(
      milliseconds
    ) ||
    milliseconds < 0
  ) {
    return '—';
  }

  if (
    milliseconds <
    60 * 1000
  ) {
    const seconds =
      Math.max(
        0,
        Math.round(
          milliseconds /
          1000
        )
      );

    return `${seconds.toLocaleString(
      'fa-IR'
    )} ثانیه`;
  }

  if (
    milliseconds <
    60 * 60 * 1000
  ) {
    const minutes =
      Math.max(
        1,
        Math.round(
          milliseconds /
          (60 * 1000)
        )
      );

    return `${minutes.toLocaleString(
      'fa-IR'
    )} دقیقه`;
  }

  const hours =
    milliseconds /
    (60 * 60 * 1000);

  return `${hours.toLocaleString(
    'fa-IR',
    {
      maximumFractionDigits: 1,
    }
  )} ساعت`;
};

const HealthMetric = ({
  icon: Icon,
  title,
  value,
  subtitle,
}) => (
  <div className='rounded-2xl border border-black/5 bg-background-light/60 p-3 sm:p-4 dark:border-white/10 dark:bg-background-dark/30'>
    <div className='flex items-center gap-2 text-subtext-light dark:text-subtext-dark'>
      <Icon
        size={18}
        className='shrink-0'
      />

      <span className='text-xs sm:text-sm'>
        {title}
      </span>
    </div>

    <div className='mt-2 font-faNa text-base font-bold text-text-light sm:text-lg dark:text-text-dark'>
      {value}
    </div>

    {subtitle && (
      <div className='mt-1 text-2xs leading-5 text-subtext-light sm:text-xs dark:text-subtext-dark'>
        {subtitle}
      </div>
    )}
  </div>
);

const VideoProcessingHealthSection =
  ({
    className = '',
  }) => {
    const [health, setHealth] =
      useState(null);

    const [isLoading, setIsLoading] =
      useState(true);

    const [
      isRefreshing,
      setIsRefreshing,
    ] = useState(false);

    const [
      errorMessage,
      setErrorMessage,
    ] = useState('');

    const defaultUploadTuning =
      useMemo(
        () =>
          getDefaultVideoUploadTuning(),
        []
      );

    const [
      uploadTuning,
      setUploadTuning,
    ] = useState(
      defaultUploadTuning
    );

    const [
      draftChunkSizeMiB,
      setDraftChunkSizeMiB,
    ] = useState(
      defaultUploadTuning
        .chunkSizeMiB
    );

    const [
      draftConcurrency,
      setDraftConcurrency,
    ] = useState(
      defaultUploadTuning
        .concurrency
    );

    const [
      tuningMessage,
      setTuningMessage,
    ] = useState('');

    const [
      benchmarkHistory,
      setBenchmarkHistory,
    ] = useState([]);

    useEffect(() => {
      const refreshHistory =
        () => {
          setBenchmarkHistory(
            getVideoUploadBenchmarkHistory()
          );
        };

      refreshHistory();

      window.addEventListener(
        VIDEO_UPLOAD_BENCHMARK_HISTORY_CHANGED_EVENT,
        refreshHistory
      );

      return () => {
        window.removeEventListener(
          VIDEO_UPLOAD_BENCHMARK_HISTORY_CHANGED_EVENT,
          refreshHistory
        );
      };
    }, []);

    useEffect(() => {
      const current =
        getVideoUploadRuntimeTuning();

      setUploadTuning(
        current
      );

      setDraftChunkSizeMiB(
        current.chunkSizeMiB
      );

      setDraftConcurrency(
        current.concurrency
      );
    }, []);

    const applyUploadTuning =
      () => {
        try {
          const saved =
            setVideoUploadRuntimeTuning({
              chunkSizeMiB:
                draftChunkSizeMiB,

              concurrency:
                draftConcurrency,
            });

          setUploadTuning(
            saved
          );

          setTuningMessage(
            'تنظیم برای آپلودهای جدید ذخیره شد.'
          );
        } catch (error) {
          setTuningMessage(
            error?.message ||
              'تنظیم آپلود ذخیره نشد.'
          );
        }
      };

    const resetUploadTuning =
      () => {
        const defaults =
          clearVideoUploadRuntimeTuning();

        setUploadTuning(
          defaults
        );

        setDraftChunkSizeMiB(
          defaults.chunkSizeMiB
        );

        setDraftConcurrency(
          defaults.concurrency
        );

        setTuningMessage(
          'تنظیمات آپلود به مقدار محیط بازگشت.'
        );
      };

    const fetchHealth =
      useCallback(
        async ({
          background = false,
        } = {}) => {
          if (background) {
            setIsRefreshing(true);
          } else {
            setIsLoading(true);
          }

          try {
            const response =
              await fetch(
                '/api/admin/video-jobs/health',
                {
                  cache:
                    'no-store',
                }
              );

            const payload =
              await response
                .json()
                .catch(
                  () => null
                );

            if (
              !response.ok ||
              !payload?.success ||
              !payload?.health
            ) {
              throw new Error(
                payload?.error ||
                  'وضعیت پردازش ویدئو دریافت نشد.'
              );
            }

            setHealth(
              payload.health
            );

            setErrorMessage('');
          } catch (error) {
            setErrorMessage(
              error?.message ||
                'وضعیت پردازش ویدئو دریافت نشد.'
            );
          } finally {
            setIsLoading(false);
            setIsRefreshing(false);
          }
        },
        []
      );

    useEffect(() => {
      void fetchHealth();

      const refreshWhenVisible =
        () => {
          if (
            document.visibilityState !==
            'visible'
          ) {
            return;
          }

          void fetchHealth({
            background: true,
          });
        };

      const interval =
        window.setInterval(
          refreshWhenVisible,
          REFRESH_INTERVAL_MS
        );

      document.addEventListener(
        'visibilitychange',
        refreshWhenVisible
      );

      return () => {
        window.clearInterval(
          interval
        );

        document.removeEventListener(
          'visibilitychange',
          refreshWhenVisible
        );
      };
    }, [fetchHealth]);

    const status =
      health?.status ||
      'unavailable';

    const statusMeta =
      STATUS_META[status] ||
      STATUS_META.unavailable;

    const queue =
      health?.queue || {};

    const activeCount =
      Number(queue.active) || 0;

    const workerAge =
      formatDuration(
        health?.worker?.ageMs
      );

    const diskAvailable =
      formatBytes(
        health?.disk
          ?.availableBytes
      );

    const issueLabels =
      useMemo(
        () =>
          (
            Array.isArray(
              health?.issues
            )
              ? health.issues
              : []
          )
            .map(
              (issue) =>
                ISSUE_LABELS[
                  issue
                ] || issue
            )
            .filter(Boolean),
        [health?.issues]
      );

    const bestBenchmarkJobId =
      useMemo(() => {
        let bestRun = null;

        for (
          const run of
          benchmarkHistory
        ) {
          if (
            !bestRun ||
            Number(
              run.averageBytesPerSecond
            ) >
              Number(
                bestRun
                  .averageBytesPerSecond
              )
          ) {
            bestRun = run;
          }
        }

        return (
          bestRun?.jobId ||
          null
        );
      }, [benchmarkHistory]);

    return (
      <section
        className={[
          'rounded-3xl bg-surface-light p-4 sm:p-5 md:p-6 dark:bg-surface-dark',
          className,
        ].join(' ')}
      >
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <div className='flex items-center gap-2'>
              <MdOutlineHealthAndSafety
                size={22}
                className='text-primary'
              />

              <h2 className='text-base font-semibold md:text-lg lg:text-xl'>
                وضعیت پردازش ویدئو
              </h2>
            </div>

            <p className='mt-1 text-xs leading-6 text-subtext-light sm:text-sm dark:text-subtext-dark'>
              وضعیت Worker، صف پردازش و فضای دیسک
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <span
              className={[
                'rounded-full px-3 py-1 text-xs font-semibold',
                statusMeta.badgeClass,
              ].join(' ')}
            >
              {statusMeta.label}
            </span>

            <button
              type='button'
              onClick={() =>
                fetchHealth({
                  background: true,
                })
              }
              disabled={
                isLoading ||
                isRefreshing
              }
              aria-label='بروزرسانی وضعیت پردازش ویدئو'
              className='flex h-9 w-9 items-center justify-center rounded-xl border border-black/5 text-subtext-light transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-subtext-dark dark:hover:bg-white/10'
            >
              <FiRefreshCw
                size={17}
                className={
                  isRefreshing
                    ? 'animate-spin'
                    : ''
                }
              />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className='mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4'>
            {[0, 1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className='h-24 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5'
                />
              )
            )}
          </div>
        ) : (
          <>
            <div className='mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4'>
              <HealthMetric
                icon={
                  MdOutlineHealthAndSafety
                }
                title='Worker'
                value={
                  health?.worker
                    ?.healthy
                    ? 'فعال'
                    : 'غیرفعال'
                }
                subtitle={
                  health?.worker
                    ?.updatedAt
                    ? `آخرین heartbeat: ${workerAge} قبل`
                    : 'Heartbeat ثبت نشده'
                }
              />

              <HealthMetric
                icon={
                  PiQueueBold
                }
                title='صف فعال'
                value={
                  formatNumber(
                    activeCount
                  )
                }
                subtitle={`در صف: ${formatNumber(
                  queue.queued
                )} • در حال پردازش: ${formatNumber(
                  (
                    Number(
                      queue.processing
                    ) || 0
                  ) +
                    (
                      Number(
                        queue.publishing
                      ) || 0
                    )
                )}`}
              />

              <HealthMetric
                icon={
                  MdOutlineStorage
                }
                title='فضای آزاد'
                value={
                  diskAvailable
                }
                subtitle={
                  health?.disk
                    ?.level ===
                  'critical'
                    ? 'کمتر از حد امن'
                    : health
                          ?.disk
                          ?.level ===
                        'warning'
                      ? 'نزدیک حد هشدار'
                      : 'وضعیت مناسب'
                }
              />

              <HealthMetric
                icon={
                  HiOutlineCircleStack
                }
                title='خطاهای ۲۴ ساعت'
                value={formatNumber(
                  health
                    ?.failures
                    ?.last24Hours
                )}
                subtitle={`Job گیرکرده: ${formatNumber(
                  queue.staleRunning
                )}`}
              />
            </div>

            <div className='mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs leading-6 text-subtext-light sm:text-sm dark:text-subtext-dark'>
              <span>
                در حال آپلود:{' '}
                <b className='font-faNa text-text-light dark:text-text-dark'>
                  {formatNumber(
                    queue.uploading
                  )}
                </b>
              </span>

              <span>
                قدیمی‌ترین Job صف:{' '}
                <b className='font-faNa text-text-light dark:text-text-dark'>
                  {formatDuration(
                    queue.oldestQueuedAgeMs
                  )}
                </b>
              </span>
            </div>

            {issueLabels.length >
              0 && (
              <div className='mt-4 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-3 sm:p-4'>
                <div className='flex items-start gap-2'>
                  <PiWarningCircleBold
                    size={19}
                    className='mt-0.5 shrink-0 text-amber-600 dark:text-amber-400'
                  />

                  <div className='min-w-0'>
                    <p className='text-xs font-semibold text-amber-700 sm:text-sm dark:text-amber-300'>
                      موارد نیازمند بررسی
                    </p>

                    <div className='mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-6 text-subtext-light dark:text-subtext-dark'>
                      {issueLabels.map(
                        (issue) => (
                          <span
                            key={issue}
                          >
                            • {issue}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className='mt-5 border-t border-black/5 pt-5 dark:border-white/10'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <h3 className='text-sm font-semibold text-text-light sm:text-base dark:text-text-dark'>
                تنظیم تست سرعت آپلود
              </h3>

              <p className='mt-1 max-w-2xl text-xs leading-6 text-subtext-light dark:text-subtext-dark'>
                فقط روی آپلودهای جدید اعمال می‌شود. Resume یک آپلود نیمه‌کاره از chunk ثبت‌شده همان Job استفاده می‌کند.
              </p>
            </div>

            <span className='rounded-full bg-primary/10 px-3 py-1 font-faNa text-xs font-semibold text-primary'>
              {uploadTuning.source ===
              'runtime'
                ? `${uploadTuning.chunkSizeMiB}MB × ${uploadTuning.concurrency}`
                : `ENV: ${uploadTuning.chunkSizeMiB}MB × ${uploadTuning.concurrency}`}
            </span>
          </div>

          <div className='mt-4 grid gap-4 md:grid-cols-2'>
            <div>
              <p className='mb-2 text-xs font-semibold text-subtext-light dark:text-subtext-dark'>
                اندازه Chunk
              </p>

              <div className='flex flex-wrap gap-2'>
                {VIDEO_UPLOAD_BENCHMARK_CHUNK_SIZES_MIB.map(
                  (size) => (
                    <button
                      key={size}
                      type='button'
                      onClick={() =>
                        setDraftChunkSizeMiB(
                          size
                        )
                      }
                      className={[
                        'rounded-xl border px-4 py-2 font-faNa text-xs font-semibold transition',
                        draftChunkSizeMiB ===
                        size
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-black/5 text-subtext-light hover:bg-black/5 dark:border-white/10 dark:text-subtext-dark dark:hover:bg-white/10',
                      ].join(' ')}
                    >
                      {`${size} MB`}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <p className='mb-2 text-xs font-semibold text-subtext-light dark:text-subtext-dark'>
                اتصال همزمان
              </p>

              <div className='flex flex-wrap gap-2'>
                {VIDEO_UPLOAD_BENCHMARK_CONCURRENCIES.map(
                  (value) => (
                    <button
                      key={value}
                      type='button'
                      onClick={() =>
                        setDraftConcurrency(
                          value
                        )
                      }
                      className={[
                        'rounded-xl border px-4 py-2 font-faNa text-xs font-semibold transition',
                        draftConcurrency ===
                        value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-black/5 text-subtext-light hover:bg-black/5 dark:border-white/10 dark:text-subtext-dark dark:hover:bg-white/10',
                      ].join(' ')}
                    >
                      {value}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className='mt-4 flex flex-wrap items-center gap-2'>
            <button
              type='button'
              onClick={
                applyUploadTuning
              }
              className='rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90'
            >
              اعمال برای آپلود بعدی
            </button>

            <button
              type='button'
              onClick={
                resetUploadTuning
              }
              className='rounded-xl border border-black/5 px-4 py-2 text-xs font-semibold text-subtext-light transition hover:bg-black/5 dark:border-white/10 dark:text-subtext-dark dark:hover:bg-white/10'
            >
              بازگشت به ENV
            </button>

            {tuningMessage && (
              <span className='text-xs leading-6 text-subtext-light dark:text-subtext-dark'>
                {tuningMessage}
              </span>
            )}
          </div>

          <p className='mt-3 text-[11px] leading-6 text-subtext-light dark:text-subtext-dark'>
            برای Benchmark شش حالت 16/32MB × 1/2/3 اتصال را جداگانه اجرا کن؛ نتیجه میانگین سرعت و retry بعد از پایان raw upload داخل Dock باقی می‌ماند.
          </p>
        </div>

        <div className='mt-5 border-t border-black/5 pt-5 dark:border-white/10'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <h3 className='text-sm font-semibold text-text-light sm:text-base dark:text-text-dark'>
                تاریخچه Benchmark آپلود
              </h3>

              <p className='mt-1 text-xs leading-6 text-subtext-light dark:text-subtext-dark'>
                آخرین ۳۰ آپلود جدید در همین مرورگر ذخیره می‌شود. اجرای Resume در این جدول ثبت نمی‌شود تا مقایسه سرعت گمراه‌کننده نباشد.
              </p>
            </div>

            {benchmarkHistory.length >
              0 && (
              <button
                type='button'
                onClick={() => {
                  clearVideoUploadBenchmarkHistory();

                  setBenchmarkHistory(
                    []
                  );
                }}
                className='rounded-xl border border-black/5 px-3 py-2 text-xs font-semibold text-subtext-light transition hover:bg-black/5 dark:border-white/10 dark:text-subtext-dark dark:hover:bg-white/10'
              >
                پاک‌کردن تاریخچه
              </button>
            )}
          </div>

          {benchmarkHistory.length ===
          0 ? (
            <div className='mt-4 rounded-2xl border border-dashed border-black/10 px-4 py-5 text-center text-xs leading-6 text-subtext-light dark:border-white/10 dark:text-subtext-dark'>
              هنوز Benchmark جدیدی ثبت نشده است.
            </div>
          ) : (
            <div className='mt-4 space-y-2'>
              {benchmarkHistory.map(
                (run) => (
                  <div
                    key={run.jobId}
                    className={[
                      'grid gap-3 rounded-2xl border p-3 sm:grid-cols-[minmax(0,1.3fr)_repeat(5,minmax(0,1fr))] sm:items-center',
                      run.jobId ===
                      bestBenchmarkJobId
                        ? 'border-emerald-500/25 bg-emerald-500/5'
                        : 'border-black/5 bg-background-light/50 dark:border-white/10 dark:bg-background-dark/20',
                    ].join(' ')}
                  >
                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='truncate text-xs font-semibold text-text-light dark:text-text-dark'>
                          {run.fileName}
                        </span>

                        {run.jobId ===
                          bestBenchmarkJobId && (
                          <span className='rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400'>
                            سریع‌ترین
                          </span>
                        )}
                      </div>

                      <div className='mt-1 text-[10px] leading-5 text-subtext-light dark:text-subtext-dark'>
                        {formatRunDate(
                          run.createdAt
                        )}
                      </div>
                    </div>

                    <div>
                      <div className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                        تنظیم
                      </div>

                      <bdi
                        dir='ltr'
                        className='mt-0.5 block font-faNa text-xs font-semibold text-text-light dark:text-text-dark'
                      >
                        {`${Math.round(
                          run.chunkSizeBytes /
                            (1024 * 1024)
                        )}MB × ${run.concurrency}`}
                      </bdi>
                    </div>

                    <div>
                      <div className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                        سرعت
                      </div>

                      <bdi
                        dir='ltr'
                        className='mt-0.5 block font-faNa text-xs font-semibold text-text-light dark:text-text-dark'
                      >
                        {formatSpeed(
                          run.averageBytesPerSecond
                        )}
                      </bdi>
                    </div>

                    <div>
                      <div className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                        زمان
                      </div>

                      <bdi
                        dir='ltr'
                        className='mt-0.5 block font-faNa text-xs font-semibold text-text-light dark:text-text-dark'
                      >
                        {formatDuration(
                          run.durationMs
                        )}
                      </bdi>
                    </div>

                    <div>
                      <div className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                        حجم
                      </div>

                      <bdi
                        dir='ltr'
                        className='mt-0.5 block font-faNa text-xs font-semibold text-text-light dark:text-text-dark'
                      >
                        {formatBytes(
                          run.totalBytes
                        )}
                      </bdi>
                    </div>

                    <div>
                      <div className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                        Retry
                      </div>

                      <bdi
                        dir='ltr'
                        className='mt-0.5 block font-faNa text-xs font-semibold text-text-light dark:text-text-dark'
                      >
                        {run.retryCount}
                      </bdi>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {errorMessage && (
          <div
            role='alert'
            className='mt-4 rounded-2xl bg-red-500/10 px-3 py-3 text-xs leading-6 text-red-600 sm:text-sm dark:text-red-400'
          >
            {errorMessage}
          </div>
        )}
      </section>
    );
  };

export default VideoProcessingHealthSection;
