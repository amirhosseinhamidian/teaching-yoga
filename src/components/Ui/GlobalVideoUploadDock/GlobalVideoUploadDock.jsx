'use client';

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiChevronDown,
  FiChevronUp,
  FiRotateCcw,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';

import { useGlobalVideoUpload } from '@/contexts/GlobalVideoUploadContext';

const STAGE_LABELS = {
  creating: 'در حال آماده‌سازی',
  uploading: 'در حال آپلود',
  paused: 'آپلود متوقف شده',
  queued: 'در صف پردازش',
  processing: 'در حال پردازش',
  publishing: 'در حال انتشار',
  ready: 'تکمیل شد',
  failed: 'ناموفق',
  cancelled: 'لغو شد',
};

const formatBytes = (value) => {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 MB';
  }

  const megabytes = bytes / 1024 / 1024;

  if (megabytes < 1024) {
    return `${megabytes.toFixed(
      megabytes >= 100 ? 0 : 1
    )} MB`;
  }

  const gigabytes = megabytes / 1024;

  return `${gigabytes.toFixed(
    gigabytes >= 10 ? 1 : 2
  )} GB`;
};

const formatSpeed = (value) => {
  const bytesPerSecond = Number(value);

  if (
    !Number.isFinite(bytesPerSecond) ||
    bytesPerSecond <= 0
  ) {
    return null;
  }

  return `${(
    bytesPerSecond /
    1024 /
    1024
  ).toFixed(2)} MB/s`;
};

const formatEta = (value) => {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds < 0) {
    return null;
  }

  if (seconds < 60) {
    return `${Math.max(1, Math.ceil(seconds))} ثانیه`;
  }

  const minutes = Math.ceil(seconds / 60);

  if (minutes < 60) {
    return `${minutes} دقیقه`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours} ساعت و ${remainingMinutes} دقیقه`
    : `${hours} ساعت`;
};

const getTaskStageLabel = (stage) =>
  STAGE_LABELS[stage] || 'در حال انجام';

const SOURCE_UPLOAD_COMPLETE_STAGES =
  new Set([
    'queued',
    'processing',
    'publishing',
    'ready',
    'failed',
  ]);

// eslint-disable-next-line react/prop-types
const TaskProgress = ({ task }) => {
  const progress = Math.max(
    0,
    Math.min(100, Number(task.progress) || 0)
  );

  return (
    <div className='mt-2.5 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10'>
      <div
        className='h-full rounded-full bg-primary transition-[width] duration-300'
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
};

const GlobalVideoUploadDock = () => {
  const {
    tasks,
    activeTasks,
    activeCount,
    focusRequest,
    resumeTaskUpload,
    retryTaskProcessing,
    cancelTask,
    removeTask,
    clearFinishedTasks,
    isTerminalStage,
    canCancelStage,
  } = useGlobalVideoUpload();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!focusRequest?.taskId) {
      return;
    }

    setIsOpen(true);
  }, [focusRequest]);

  const featuredTask = useMemo(
    () => activeTasks[0] || tasks[0] || null,
    [activeTasks, tasks]
  );

  if (!featuredTask) {
    return null;
  }

  const metrics = featuredTask.uploadMetrics;

  const compactDetails =
    featuredTask.stage === 'uploading' && metrics
      ? formatEta(metrics.etaSeconds)
        ? `${formatEta(metrics.etaSeconds)} باقی‌مانده`
        : null
      : featuredTask.stage === 'paused'
        ? 'برای ادامه جزئیات را باز کنید'
        : null;

  const hasFinishedTasks = tasks.some(
    (task) =>
      isTerminalStage(task.stage) &&
      !task.retryingProcessing
  );

  return (
    <div
      dir='rtl'
      className='fixed bottom-4 right-3 z-[80] w-[calc(100vw-1.5rem)] max-w-[360px] sm:bottom-6 sm:right-6 sm:w-[360px] [.has-mobile-checkout-bar_&]:bottom-[calc(88px+env(safe-area-inset-bottom))] lg:[.has-mobile-checkout-bar_&]:bottom-6'
    >
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.985 }}
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className='mb-2 max-h-[min(60dvh,520px)] origin-bottom overflow-hidden rounded-2xl border border-black/5 bg-surface-light/95 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-dark/95 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]'
          >
          <div className='flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3 dark:border-white/10'>
            <div className='min-w-0'>
              <p className='text-sm font-black text-text-light dark:text-text-dark'>
                آپلود و پردازش ویدئو
              </p>

              <p className='mt-0.5 text-[11px] text-subtext-light dark:text-subtext-dark'>
                {activeCount > 0
                  ? `${activeCount} عملیات فعال`
                  : 'عملیات فعالی وجود ندارد'}
              </p>
            </div>

            <div className='flex items-center gap-1'>
              {hasFinishedTasks && (
                <button
                  type='button'
                  onClick={clearFinishedTasks}
                  className='flex h-8 w-8 items-center justify-center rounded-lg text-subtext-light transition hover:bg-black/5 hover:text-text-light dark:text-subtext-dark dark:hover:bg-white/10 dark:hover:text-text-dark'
                  aria-label='پاک کردن عملیات‌های تمام‌شده'
                  title='پاک کردن عملیات‌های تمام‌شده'
                >
                  <FiTrash2 size={16} />
                </button>
              )}

              <button
                type='button'
                onClick={() => setIsOpen(false)}
                className='flex h-8 w-8 items-center justify-center rounded-lg text-subtext-light transition hover:bg-black/5 hover:text-text-light dark:text-subtext-dark dark:hover:bg-white/10 dark:hover:text-text-dark'
                aria-label='بستن جزئیات'
              >
                <FiChevronDown size={18} />
              </button>
            </div>
          </div>

          <div className='max-h-[calc(min(60dvh,520px)-60px)] space-y-2 overflow-y-auto overscroll-contain p-3'>
            {tasks.map((task) => {
              const taskMetrics = task.uploadMetrics;

              const speed =
                task.stage === 'uploading'
                  ? formatSpeed(
                      taskMetrics?.bytesPerSecond
                    )
                  : null;

              const eta =
                task.stage === 'uploading'
                  ? formatEta(taskMetrics?.etaSeconds)
                  : null;

              return (
                <div
                  key={task.id}
                  className='rounded-xl border border-black/5 bg-background-light/50 p-3 dark:border-white/10 dark:bg-background-dark/35'
                >
                  <div className='flex items-start gap-3'>
                    <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                      <FiUploadCloud size={18} />
                    </div>

                    <div className='min-w-0 flex-1'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-black text-text-light dark:text-text-dark'>
                            {task.label}
                          </p>

                          {task.fileName && (
                            <p className='mt-1 truncate text-xs font-medium text-subtext-light dark:text-subtext-dark'>
                              {task.fileName}
                            </p>
                          )}
                        </div>

                        <span className='shrink-0 font-faNa text-sm font-black text-text-light dark:text-text-dark'>
                          {`${task.progress || 0}%`}
                        </span>
                      </div>

                      <TaskProgress task={task} />

                      <div className='mt-2.5 flex items-center justify-between gap-2 text-xs'>
                        <span className='font-semibold text-subtext-light dark:text-subtext-dark'>
                          {getTaskStageLabel(task.stage)}
                        </span>

                        {eta && (
                          <span className='font-medium text-subtext-light dark:text-subtext-dark'>
                            {`${eta} باقی‌مانده`}
                          </span>
                        )}
                      </div>

                      {task.stage === 'uploading' &&
                        taskMetrics && (
                          <div className='mt-3 grid grid-cols-2 gap-2'>
                            <div className='col-span-2 rounded-xl border border-black/5 bg-surface-light/80 px-3 py-2.5 dark:border-white/10 dark:bg-surface-dark/80'>
                              <p className='text-[11px] font-medium text-subtext-light dark:text-subtext-dark'>
                                مقدار آپلودشده
                              </p>

                              <p className='mt-1 font-faNa text-sm font-black text-text-light dark:text-text-dark'>
                                {`${formatBytes(
                                  taskMetrics.loadedBytes
                                )} از ${formatBytes(
                                  taskMetrics.totalBytes
                                )}`}
                              </p>
                            </div>

                            <div className='rounded-xl border border-black/5 bg-surface-light/80 px-3 py-2.5 dark:border-white/10 dark:bg-surface-dark/80'>
                              <p className='text-[11px] font-medium text-subtext-light dark:text-subtext-dark'>
                                سرعت لحظه‌ای
                              </p>

                              <p className='mt-1 font-faNa text-sm font-black text-text-light dark:text-text-dark'>
                                {speed || 'در حال محاسبه'}
                              </p>
                            </div>

                            <div className='rounded-xl border border-black/5 bg-surface-light/80 px-3 py-2.5 dark:border-white/10 dark:bg-surface-dark/80'>
                              <p className='text-[11px] font-medium text-subtext-light dark:text-subtext-dark'>
                                میانگین سرعت
                              </p>

                              <p className='mt-1 font-faNa text-sm font-black text-text-light dark:text-text-dark'>
                                {formatSpeed(
                                  taskMetrics.averageBytesPerSecond
                                ) || 'در حال محاسبه'}
                              </p>
                            </div>

                            <div className='col-span-2 rounded-xl border border-black/5 bg-surface-light/80 px-3 py-2.5 dark:border-white/10 dark:bg-surface-dark/80'>
                              <div className='flex items-center justify-between gap-3'>
                                <div>
                                  <p className='text-[11px] font-medium text-subtext-light dark:text-subtext-dark'>
                                    زمان باقی‌مانده
                                  </p>

                                  <p className='mt-1 text-sm font-black text-text-light dark:text-text-dark'>
                                    {eta || 'در حال محاسبه'}
                                  </p>
                                </div>

                                {taskMetrics.totalChunks > 0 && (
                                  <div className='text-left'>
                                    <p className='text-[11px] font-medium text-subtext-light dark:text-subtext-dark'>
                                      بخش‌های کامل
                                    </p>

                                    <p className='mt-1 font-faNa text-sm font-black text-text-light dark:text-text-dark'>
                                      {`${Math.max(
                                        0,
                                        taskMetrics.completedChunks || 0
                                      )} از ${taskMetrics.totalChunks}`}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {(taskMetrics.chunkSizeBytes > 0 ||
                                taskMetrics.uploadConcurrency > 0 ||
                                taskMetrics.retryCount > 0) && (
                                <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-black/5 pt-2 text-[11px] font-medium text-subtext-light dark:border-white/10 dark:text-subtext-dark'>
                                  {taskMetrics.chunkSizeBytes > 0 && (
                                    <span className='font-faNa'>
                                      {`اندازه هر بخش: ${formatBytes(
                                        taskMetrics.chunkSizeBytes
                                      )}`}
                                    </span>
                                  )}

                                  {taskMetrics.uploadConcurrency > 0 && (
                                    <span className='font-faNa'>
                                      {`اتصال همزمان: ${taskMetrics.activeChunks || 0} از ${taskMetrics.uploadConcurrency}`}
                                    </span>
                                  )}

                                  {taskMetrics.retryCount > 0 && (
                                    <span className='font-faNa text-amber-600 dark:text-amber-400'>
                                      {`تلاش مجدد: ${taskMetrics.retryCount}`}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {SOURCE_UPLOAD_COMPLETE_STAGES.has(
                        task.stage
                      ) &&
                        taskMetrics
                          ?.averageBytesPerSecond >
                          0 &&
                        taskMetrics
                          ?.chunkSizeBytes >
                          0 && (
                          <div className='mt-3 rounded-xl border border-primary/10 bg-primary/5 p-3'>
                            <div className='flex items-center justify-between gap-2'>
                              <span className='text-[11px] font-semibold text-text-light dark:text-text-dark'>
                                نتیجه آپلود
                              </span>

                              <span className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                                Raw upload
                              </span>
                            </div>

                            <div className='mt-2 grid grid-cols-2 gap-2'>
                              <div className='rounded-lg bg-background-light/70 px-2.5 py-2 dark:bg-background-dark/40'>
                                <div className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                                  سرعت میانگین
                                </div>

                                <bdi
                                  dir='ltr'
                                  className='mt-0.5 block font-faNa text-[11px] font-semibold text-text-light dark:text-text-dark'
                                >
                                  {formatSpeed(
                                    taskMetrics.averageBytesPerSecond
                                  )}
                                </bdi>
                              </div>

                              <div className='rounded-lg bg-background-light/70 px-2.5 py-2 dark:bg-background-dark/40'>
                                <div className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                                  اندازه Chunk
                                </div>

                                <bdi
                                  dir='ltr'
                                  className='mt-0.5 block font-faNa text-[11px] font-semibold text-text-light dark:text-text-dark'
                                >
                                  {formatBytes(
                                    taskMetrics.chunkSizeBytes
                                  )}
                                </bdi>
                              </div>

                              <div className='rounded-lg bg-background-light/70 px-2.5 py-2 dark:bg-background-dark/40'>
                                <div className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                                  اتصال همزمان
                                </div>

                                <bdi
                                  dir='ltr'
                                  className='mt-0.5 block font-faNa text-[11px] font-semibold text-text-light dark:text-text-dark'
                                >
                                  {taskMetrics.uploadConcurrency || 1}
                                </bdi>
                              </div>

                              <div className='rounded-lg bg-background-light/70 px-2.5 py-2 dark:bg-background-dark/40'>
                                <div className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                                  تلاش مجدد
                                </div>

                                <bdi
                                  dir='ltr'
                                  className='mt-0.5 block font-faNa text-[11px] font-semibold text-text-light dark:text-text-dark'
                                >
                                  {taskMetrics.retryCount || 0}
                                </bdi>
                              </div>
                            </div>
                          </div>
                        )}

                      {task.errorMessage && (
                        <p className='mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium leading-6 text-red-600 dark:bg-red-950/20 dark:text-red-400'>
                          {task.errorMessage}
                        </p>
                      )}

                      {task.blockedByAnotherTab && (
                        <p className='mt-2 text-[11px] leading-5 text-subtext-light dark:text-subtext-dark'>
                          قفل تب به‌صورت خودکار بعد از بسته‌شدن تب قبلی آزاد می‌شود.
                        </p>
                      )}
                    </div>
                  </div>

                  {(canCancelStage(task.stage) ||
                    isTerminalStage(task.stage)) && (
                    <div className='mt-2 flex flex-wrap items-center justify-end gap-2'>
                      {task.stage === 'paused' && (
                        <label className='inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/15'>
                          <FiUploadCloud size={13} />
                          ادامه آپلود

                          <input
                            type='file'
                            accept='.mp4,.mov,.m4v,.webm,.mkv,video/mp4,video/quicktime,video/x-m4v,video/webm,video/x-matroska'
                            className='hidden'
                            onChange={(event) => {
                              const selectedFile =
                                event.target.files?.[0];

                              if (selectedFile) {
                                void resumeTaskUpload(
                                  task.id,
                                  selectedFile
                                );
                              }

                              event.target.value = '';
                            }}
                          />
                        </label>
                      )}

                      {task.stage ===
                        'failed' &&
                        task.jobId && (
                          <button
                            type='button'
                            onClick={() =>
                              void retryTaskProcessing(
                                task.id
                              )
                            }
                            disabled={
                              task.retryingProcessing
                            }
                            className='inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60'
                          >
                            <FiRotateCcw
                              size={13}
                              className={
                                task.retryingProcessing
                                  ? 'animate-spin'
                                  : ''
                              }
                            />

                            {task.retryingProcessing
                              ? 'در حال ثبت تلاش مجدد'
                              : 'تلاش مجدد پردازش'}
                          </button>
                        )}

                      {canCancelStage(task.stage) ? (
                        <button
                          type='button'
                          onClick={() =>
                            void cancelTask(task.id)
                          }
                          className='inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
                        >
                          <FiX size={13} />
                          لغو عملیات
                        </button>
                      ) : (
                        <button
                          type='button'
                          onClick={() =>
                            removeTask(task.id)
                          }
                          disabled={
                            task.retryingProcessing
                          }
                          className='inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-subtext-light transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:text-subtext-dark dark:hover:bg-white/10'
                        >
                          <FiX size={13} />
                          بستن
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className='relative w-full pt-3'>
        {isTerminalStage(
          featuredTask.stage
        ) &&
          !featuredTask.retryingProcessing && (
          <button
            type='button'
            onClick={() => {
              removeTask(featuredTask.id);

              if (tasks.length <= 1) {
                setIsOpen(false);
              }
            }}
            className='absolute right-3 top-0 z-10 flex h-7 items-center gap-1 rounded-full border border-black/5 bg-surface-light/95 px-2.5 text-[10px] font-semibold text-subtext-light shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-black/5 hover:text-text-light dark:border-white/10 dark:bg-surface-dark/95 dark:text-subtext-dark dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)] dark:hover:bg-white/10 dark:hover:text-text-dark'
            aria-label='بستن عملیات تمام‌شده'
          >
            <FiX size={13} />
            بستن
          </button>
        )}

        <button
          type='button'
          onClick={() => setIsOpen((previous) => !previous)}
          className='w-full overflow-hidden rounded-2xl border border-black/5 bg-surface-light/95 px-3 py-3 text-right shadow-[0_14px_42px_rgba(15,23,42,0.14)] backdrop-blur-xl transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-surface-dark/95 dark:shadow-[0_18px_50px_rgba(0,0,0,0.32)]'
          aria-expanded={isOpen}
        >
          <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            <FiUploadCloud size={20} />
          </div>

          <div className='min-w-0 flex-1'>
            <div className='flex items-center justify-between gap-2'>
              <p className='truncate text-sm font-black text-text-light dark:text-text-dark'>
                {featuredTask.label}
              </p>

              <div className='flex shrink-0 items-center gap-1.5'>
                <span className='font-faNa text-sm font-black text-text-light dark:text-text-dark'>
                  {`${featuredTask.progress || 0}%`}
                </span>

                {isOpen ? (
                  <FiChevronDown size={16} />
                ) : (
                  <FiChevronUp size={16} />
                )}
              </div>
            </div>

            <div className='mt-1.5 flex min-w-0 items-center gap-2 text-xs font-medium text-subtext-light dark:text-subtext-dark'>
              <span className='shrink-0'>
                {getTaskStageLabel(featuredTask.stage)}
              </span>

              {compactDetails && (
                <>
                  <span aria-hidden='true'>•</span>
                  <span className='truncate font-faNa'>
                    {compactDetails}
                  </span>
                </>
              )}

              {activeCount > 1 && (
                <span className='mr-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-faNa text-primary'>
                  {`+${activeCount - 1}`}
                </span>
              )}
            </div>

            <TaskProgress task={featuredTask} />

            {featuredTask.stage === 'uploading' &&
              metrics && (
                <div className='mt-2.5 grid grid-cols-2 gap-2 text-xs'>
                  <div className='min-w-0'>
                    <span className='text-subtext-light dark:text-subtext-dark'>
                      آپلود:
                    </span>{' '}

                    <strong className='font-faNa text-text-light dark:text-text-dark'>
                      {`${formatBytes(
                        metrics.loadedBytes
                      )} / ${formatBytes(
                        metrics.totalBytes
                      )}`}
                    </strong>
                  </div>

                  <div className='min-w-0 text-left'>
                    <span className='text-subtext-light dark:text-subtext-dark'>
                      سرعت:
                    </span>{' '}

                    <strong className='font-faNa text-text-light dark:text-text-dark'>
                      {formatSpeed(
                        metrics.bytesPerSecond
                      ) || '...'}
                    </strong>
                  </div>
                </div>
              )}
          </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default GlobalVideoUploadDock;
