'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';

import {
  createVideoJobTabLeaseManager,
} from '@/client/video/video-job-tab-lease';

import {
  recordVideoUploadBenchmarkRun,
} from '@/client/video/video-upload-benchmark-history';

import {
  getDefaultVideoUploadTuning,
  getVideoUploadRuntimeTuning,
} from '@/client/video/video-upload-tuning';

import {
  cancelAdminVideoJob,
  createAdminCourseIntroVideoJob,
  createAdminVideoJob,
  getAdminVideoJob,
  listActiveAdminVideoJobs,
  retryAdminVideoJob,
  uploadAdminVideoSource,
  waitForAdminVideoJob,
} from '@/server/videoJobClient';

const GlobalVideoUploadContext = createContext(null);

const TERMINAL_STAGES = new Set(['ready', 'failed', 'cancelled']);

const CANCELLABLE_STAGES = new Set([
  'creating',
  'uploading',
  'paused',
  'queued',
]);

const PERSISTED_TASKS_STORAGE_KEY =
  'teaching-yoga:global-video-upload-tasks:v1';

const PERSISTABLE_STAGES = new Set([
  'uploading',
  'paused',
  'queued',
  'processing',
  'publishing',
]);

const RESTORABLE_STAGES = new Set([
  ...PERSISTABLE_STAGES,
  ...TERMINAL_STAGES,
]);

const MAX_PERSISTED_TASK_AGE_MS =
  24 * 60 * 60 * 1000;

const PERSISTENCE_THROTTLE_MS = 1000;

const normalizeProgress = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
};

const createClientTaskId = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `video-upload-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const getJobStage = (job) => {
  if (typeof job?.stage === 'string' && job.stage.length > 0) {
    return job.stage;
  }

  if (typeof job?.status === 'string' && job.status.length > 0) {
    return job.status.toLowerCase();
  }

  return 'processing';
};

const getJobProgress = (job) => {
  if (Number.isFinite(job?.displayProgress)) {
    return normalizeProgress(job.displayProgress);
  }

  if (
    job?.status === 'UPLOADING' &&
    Number.isFinite(job?.uploadProgress)
  ) {
    return normalizeProgress(job.uploadProgress);
  }

  return normalizeProgress(job?.progress);
};

const getActiveConflictJob = (error) => {
  if (Number(error?.status) !== 409) {
    return null;
  }

  const job = error?.data?.job;

  if (
    !job ||
    typeof job.id !== 'string' ||
    !PERSISTABLE_STAGES.has(
      getJobStage(job)
    )
  ) {
    return null;
  }

  return job;
};

const serializePersistableTask = (task) => ({
  id: task.id,
  jobId: task.jobId,

  targetType: task.targetType,
  sessionId: task.sessionId,
  termId: task.termId,
  accessLevel: task.accessLevel,

  courseId: task.courseId,
  courseTitle: task.courseTitle,

  label: task.label,
  fileName: task.fileName,
  totalBytes: Number(task.totalBytes) || 0,

  uploadTuning:
    task.uploadTuning &&
    typeof task.uploadTuning === 'object'
      ? {
          chunkSizeMiB:
            Number(
              task.uploadTuning
                .chunkSizeMiB
            ) || 0,

          chunkSizeBytes:
            Number(
              task.uploadTuning
                .chunkSizeBytes
            ) || 0,

          concurrency:
            Number(
              task.uploadTuning
                .concurrency
            ) || 0,

          source:
            task.uploadTuning
              .source === 'runtime'
              ? 'runtime'
              : 'environment',
        }
      : null,

  stage: task.stage,
  progress: normalizeProgress(task.progress),

  uploadMetrics: {
    loadedBytes:
      Number(task.uploadMetrics?.loadedBytes) || 0,

    totalBytes:
      Number(task.uploadMetrics?.totalBytes) ||
      Number(task.totalBytes) ||
      0,

    bytesPerSecond: 0,

    averageBytesPerSecond:
      Number(
        task.uploadMetrics?.averageBytesPerSecond
      ) || 0,

    etaSeconds: null,

    chunkSizeBytes:
      Number(task.uploadMetrics?.chunkSizeBytes) || 0,

    currentChunk:
      Number(task.uploadMetrics?.currentChunk) || 0,

    totalChunks:
      Number(task.uploadMetrics?.totalChunks) || 0,

    completedChunks:
      Number(task.uploadMetrics?.completedChunks) || 0,

    uploadConcurrency:
      Number(task.uploadMetrics?.uploadConcurrency) || 0,

    activeChunks:
      Number(task.uploadMetrics?.activeChunks) || 0,

    retryCount:
      Number(task.uploadMetrics?.retryCount) || 0,

    confirmedUploadedBytes:
      Number(
        task.uploadMetrics?.confirmedUploadedBytes
      ) || 0,
  },

  errorMessage: '',
  createdAt: Number(task.createdAt) || Date.now(),
  completedAt: null,
  restoredFromStorage: false,
});

const createRestoredTaskFromServerJob = (job) => {
  const isCourseIntro = job?.targetType === 'COURSE_INTRO';

  const sessionName =
    typeof job?.session?.name === 'string'
      ? job.session.name.trim()
      : '';

  const courseName =
    typeof job?.course?.title === 'string'
      ? job.course.title.trim()
      : typeof job?.courseTitle === 'string'
        ? job.courseTitle.trim()
        : '';

  return {
    id: `server-${job.id}`,
    jobId: job.id,

    targetType: isCourseIntro
      ? 'COURSE_INTRO'
      : 'SESSION',

    sessionId: job.sessionId || null,
    termId: job.termId || null,
    accessLevel: job.accessLevel || null,

    courseId: job.courseId || null,
    courseTitle: courseName || null,

    label: isCourseIntro
      ? courseName
        ? `ویدئوی معرفی ${courseName}`
        : 'ویدئوی معرفی دوره'
      : sessionName
        ? `ویدئوی ${sessionName}`
        : 'ویدئوی جلسه',

    /*
     * برای UPLOADING بازیابی‌شده از خود سرور نام فایل اصلی
     * در مدل Job ذخیره نشده است. null یعنی هنگام Resume
     * فایل انتخاب‌شده توسط ادمین مبنا قرار بگیرد.
     */
    fileName:
      job?.status === 'UPLOADING'
        ? null
        : 'در حال ادامه پردازش روی سرور',

    totalBytes: 0,

    stage: getJobStage(job),
    progress: getJobProgress(job),

    uploadMetrics: {
      loadedBytes: 0,
      totalBytes: 0,
      bytesPerSecond: 0,
      etaSeconds: null,
    },

    errorMessage: '',
    createdAt: job?.createdAt
      ? new Date(job.createdAt).getTime()
      : Date.now(),

    completedAt: null,
    restoredFromStorage: false,
    restoredFromServer: true,
  };
};

const writePersistedTasks = (tasks) => {
  if (typeof window === 'undefined') {
    return;
  }

  const persistedTasks = tasks
    .filter(
      (task) =>
        typeof task.jobId === 'string' &&
        task.jobId.length > 0 &&
        RESTORABLE_STAGES.has(task.stage)
    )
    .map(serializePersistableTask);

  try {
    if (persistedTasks.length === 0) {
      window.localStorage.removeItem(
        PERSISTED_TASKS_STORAGE_KEY
      );

      return;
    }

    window.localStorage.setItem(
      PERSISTED_TASKS_STORAGE_KEY,
      JSON.stringify(persistedTasks)
    );
  } catch {
    // Persistence is best-effort; processing must continue.
  }
};

const getPersistenceStageSignature = (tasks) =>
  tasks
    .filter(
      (task) =>
        typeof task.jobId === 'string' &&
        task.jobId.length > 0 &&
        RESTORABLE_STAGES.has(task.stage)
    )
    .map(
      (task) =>
        `${task.id}:${task.jobId}:${task.stage}`
    )
    .sort()
    .join('|');

const readPersistedTasks = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(
      PERSISTED_TASKS_STORAGE_KEY
    );

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((task) => {
        if (
          !task ||
          typeof task.id !== 'string' ||
          typeof task.jobId !== 'string' ||
          !RESTORABLE_STAGES.has(task.stage)
        ) {
          return false;
        }

        const createdAt = Number(task.createdAt);

        if (
          Number.isFinite(createdAt) &&
          Date.now() - createdAt >
            MAX_PERSISTED_TASK_AGE_MS
        ) {
          return false;
        }

        if (task.targetType === 'COURSE_INTRO') {
          return (
            typeof task.courseTitle === 'string' &&
            task.courseTitle.trim().length > 0
          );
        }

        return (
          task.targetType === 'SESSION' &&
          typeof task.sessionId === 'string' &&
          task.sessionId.length > 0
        );
      })
      .map((task) => ({
        ...task,
        restoredFromStorage: true,
      }));
  } catch {
    return [];
  }
};

const createInitialTask = ({
  id,
  file,
  targetType = 'SESSION',
  sessionId = null,
  termId = null,
  accessLevel = null,
  courseId = null,
  courseTitle = null,
  uploadTuning = null,
  label,
}) => ({
  id,
  jobId: null,

  targetType,
  sessionId,
  termId,
  accessLevel,

  courseId,
  courseTitle,

  label:
    typeof label === 'string' && label.trim()
      ? label.trim()
      : targetType === 'COURSE_INTRO'
        ? 'ویدئوی معرفی دوره'
        : file.name || 'ویدئوی جلسه',

  fileName: file.name || 'source.mp4',
  totalBytes: Number(file.size) || 0,

  uploadTuning,

  stage: 'creating',
  progress: 0,

  uploadMetrics: {
    loadedBytes: 0,
    totalBytes: Number(file.size) || 0,
    bytesPerSecond: 0,
    etaSeconds: null,
  },

  errorMessage: '',
  createdAt: Date.now(),
  completedAt: null,
});

export function GlobalVideoUploadProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [focusRequest, setFocusRequest] = useState(null);

  const tasksRef = useRef(tasks);
  const controllersRef = useRef(new Map());
  const cancelRequestedRef = useRef(new Set());
  const restoredMonitoringRef = useRef(new Set());

  const tabLeaseManagerRef =
    useRef(null);

  const focusRequestSequenceRef = useRef(0);
  const observedTaskStagesRef = useRef(new Map());

  const persistenceTimerRef = useRef(null);
  const lastPersistedAtRef = useRef(0);
  const lastPersistenceStageSignatureRef = useRef('');

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const focusTask = useCallback((taskId) => {
    if (!taskId) {
      return;
    }

    setTasks((previousTasks) => {
      const focusedTask = previousTasks.find(
        (task) => task.id === taskId
      );

      if (!focusedTask) {
        return previousTasks;
      }

      return [
        focusedTask,
        ...previousTasks.filter(
          (task) => task.id !== taskId
        ),
      ];
    });

    focusRequestSequenceRef.current += 1;

    setFocusRequest({
      taskId,
      sequence: focusRequestSequenceRef.current,
    });
  }, []);

  useEffect(() => {
    const observedStages =
      observedTaskStagesRef.current;

    const currentTaskIds = new Set();

    tasks.forEach((task) => {
      currentTaskIds.add(task.id);

      const previousStage =
        observedStages.get(task.id);

      /*
       * Taskهایی که بعد از refresh از storage برمی‌گردند
       * نباید صرفاً به‌خاطر mount شدن دوباره notification
       * قدیمی ایجاد کنند. فقط Transition واقعی اطلاع می‌دهد.
       */
      if (previousStage === undefined) {
        observedStages.set(
          task.id,
          task.stage
        );

        return;
      }

      if (previousStage === task.stage) {
        return;
      }

      observedStages.set(
        task.id,
        task.stage
      );

      if (task.stage === 'ready') {
        toast.success(
          `${task.label || 'ویدئو'} آماده شد.`,
          {
            duration: 5000,
          }
        );

        return;
      }

      if (task.stage === 'failed') {
        toast.error(
          task.errorMessage
            ? `${task.label || 'ویدئو'}: ${task.errorMessage}`
            : `${task.label || 'ویدئو'} با خطا مواجه شد.`,
          {
            duration: 7000,
          }
        );

        focusTask(task.id);
        return;
      }

      if (task.stage === 'paused') {
        toast.error(
          `${task.label || 'ویدئو'} متوقف شد؛ برای ادامه همان فایل را دوباره انتخاب کنید.`,
          {
            duration: 6500,
          }
        );

        focusTask(task.id);
      }
    });

    [...observedStages.keys()].forEach(
      (taskId) => {
        if (!currentTaskIds.has(taskId)) {
          observedStages.delete(taskId);
        }
      }
    );
  }, [tasks, focusTask]);

  useEffect(() => {
    const persistedTasks = readPersistedTasks();

    if (persistedTasks.length > 0) {
      setTasks((previousTasks) => {
        const existingJobIds = new Set(
          previousTasks
            .map((task) => task.jobId)
            .filter(Boolean)
        );

        return [
          ...persistedTasks.filter(
            (task) =>
              !task.jobId ||
              !existingJobIds.has(task.jobId)
          ),
          ...previousTasks,
        ];
      });
    }

    setStorageHydrated(true);

    const controller = new AbortController();

    const restoreActiveServerJobs = async () => {
      try {
        const activeJobs =
          await listActiveAdminVideoJobs({
            signal: controller.signal,
          });

        const restoredTasks = activeJobs.map(
          createRestoredTaskFromServerJob
        );

        if (restoredTasks.length === 0) {
          return;
        }

        setTasks((previousTasks) => {
          const existingJobIds = new Set(
            previousTasks
              .map((task) => task.jobId)
              .filter(Boolean)
          );

          return [
            ...restoredTasks.filter(
              (task) =>
                task.jobId &&
                !existingJobIds.has(task.jobId)
            ),
            ...previousTasks,
          ];
        });
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error(
            'Active video jobs could not be restored:',
            error
          );
        }
      }
    };

    void restoreActiveServerJobs();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (
      !storageHydrated ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const stageSignature =
      getPersistenceStageSignature(tasks);

    const persistNow = () => {
      if (persistenceTimerRef.current) {
        clearTimeout(
          persistenceTimerRef.current
        );

        persistenceTimerRef.current = null;
      }

      writePersistedTasks(
        tasksRef.current
      );

      lastPersistedAtRef.current =
        Date.now();

      lastPersistenceStageSignatureRef.current =
        getPersistenceStageSignature(
          tasksRef.current
        );
    };

    /*
     * تغییر jobId/stage فوراً persist می‌شود، ولی
     * progress و metrics پرتکرار حداکثر هر یک ثانیه
     * localStorage را به‌صورت synchronous لمس می‌کنند.
     */
    const stageChanged =
      stageSignature !==
      lastPersistenceStageSignatureRef.current;

    const elapsed =
      Date.now() -
      lastPersistedAtRef.current;

    if (
      stageChanged ||
      elapsed >= PERSISTENCE_THROTTLE_MS
    ) {
      persistNow();
      return;
    }

    if (persistenceTimerRef.current) {
      return;
    }

    persistenceTimerRef.current =
      setTimeout(
        persistNow,
        Math.max(
          0,
          PERSISTENCE_THROTTLE_MS -
            elapsed
        )
      );
  }, [tasks, storageHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const persistBeforePageExit = () => {
      if (persistenceTimerRef.current) {
        clearTimeout(
          persistenceTimerRef.current
        );

        persistenceTimerRef.current = null;
      }

      writePersistedTasks(
        tasksRef.current
      );

      lastPersistedAtRef.current =
        Date.now();

      lastPersistenceStageSignatureRef.current =
        getPersistenceStageSignature(
          tasksRef.current
        );
    };

    window.addEventListener(
      'pagehide',
      persistBeforePageExit
    );

    return () => {
      window.removeEventListener(
        'pagehide',
        persistBeforePageExit
      );

      if (persistenceTimerRef.current) {
        clearTimeout(
          persistenceTimerRef.current
        );

        persistenceTimerRef.current = null;
      }
    };
  }, []);

  const getTabLeaseManager =
    useCallback(() => {
      if (
        !tabLeaseManagerRef.current
      ) {
        tabLeaseManagerRef.current =
          createVideoJobTabLeaseManager();
      }

      return (
        tabLeaseManagerRef.current
      );
    }, []);

  const releaseJobTabLease =
    useCallback((jobId) => {
      if (!jobId) {
        return;
      }

      tabLeaseManagerRef.current?.release(
        jobId
      );
    }, []);

  useEffect(() => {
    return () => {
      tabLeaseManagerRef.current?.dispose();

      tabLeaseManagerRef.current =
        null;
    };
  }, []);

  const updateTask = useCallback((taskId, patch) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...(typeof patch === 'function' ? patch(task) : patch),
            }
          : task
      )
    );
  }, []);

  const acquireJobTabLease =
    useCallback(
      async (
        jobId,
        taskId
      ) => {
        const acquired =
          await getTabLeaseManager()
            .acquire(jobId);

        if (!acquired) {
          updateTask(taskId, {
            stage: 'paused',
            completedAt: null,

            blockedByAnotherTab: true,

            errorMessage:
              'این آپلود در تب دیگری از همین مرورگر فعال است. ابتدا آن تب را ببندید یا چند ثانیه صبر کنید و دوباره ادامه دهید.',
          });
        }

        return acquired;
      },
      [
        getTabLeaseManager,
        updateTask,
      ]
    );

  const runVideoUpload = useCallback(
    async ({
      taskId,
      file,
      targetType = 'SESSION',
      sessionId = null,
      termId = null,
      accessLevel = null,
      courseId = null,
      courseTitle = null,
      uploadTuning = null,
    }) => {
      const controller = new AbortController();

      controllersRef.current.set(taskId, controller);

      let jobId = null;
      let sourceUploadCompleted = false;

      let rawUploadStartedAt = null;
      let latestUploadMetrics = null;

      try {
        let createdJob = null;

        try {
          createdJob =
            targetType === 'COURSE_INTRO'
              ? await createAdminCourseIntroVideoJob({
                  courseId,
                  courseTitle,
                  signal: controller.signal,
                })
              : await createAdminVideoJob({
                  sessionId,
                  termId,
                  accessLevel,
                  signal: controller.signal,
                });
        } catch (createError) {
          const activeJob =
            getActiveConflictJob(createError);

          if (!activeJob) {
            throw createError;
          }

          jobId = activeJob.id;

          /*
           * این Job ممکن است در تب دیگری ساخته شده باشد.
           * بنابراین metadata فایل انتخاب‌شده در این تب را
           * به Job موجود نسبت نمی‌دهیم.
           */
          updateTask(taskId, {
            jobId,
            fileName: null,
            totalBytes: 0,

            uploadTuning: null,

            stage:
              activeJob.status === 'UPLOADING'
                ? 'paused'
                : getJobStage(activeJob),

            progress:
              getJobProgress(activeJob),

            completedAt: null,

            restoredFromServer: true,
            restoredFromStorage: false,

            uploadMetrics: {
              loadedBytes: 0,
              totalBytes: 0,
              bytesPerSecond: 0,
              averageBytesPerSecond: 0,
              etaSeconds: null,
              chunkSizeBytes: 0,
              currentChunk: 0,
              totalChunks: 0,
              completedChunks: 0,
              uploadConcurrency: 0,
              activeChunks: 0,
              retryCount: 0,
              confirmedUploadedBytes: 0,
            },

            errorMessage:
              activeJob.status === 'UPLOADING'
                ? 'یک آپلود فعال برای این مقصد در تب یا نشست دیگری وجود دارد. برای ادامه، فایل اصلی همان آپلود را انتخاب کنید.'
                : '',
          });

          if (activeJob.status === 'UPLOADING') {
            return;
          }

          /*
           * Upload این Job قبلاً روی سرور کامل شده است.
           * فقط مانیتورینگ QUEUED / PROCESSING /
           * PUBLISHING را در همین task ادامه می‌دهیم.
           */
          sourceUploadCompleted = true;

          const readyJob =
            await waitForAdminVideoJob({
              jobId,
              signal: controller.signal,

              onUpdate: (job) => {
                updateTask(taskId, {
                  stage: getJobStage(job),
                  progress:
                    getJobProgress(job),

                  errorMessage:
                    typeof job?.errorMessage ===
                    'string'
                      ? job.errorMessage
                      : '',
                });
              },
            });

          updateTask(taskId, {
            stage: 'ready',
            progress: 100,
            completedAt: Date.now(),
            errorMessage: '',
            result: readyJob,
          });

          return;
        }

        jobId = createdJob.id;

        updateTask(taskId, {
          jobId,
          stage: 'uploading',
          progress: 0,
          blockedByAnotherTab: false,
        });

        const leaseAcquired =
          await acquireJobTabLease(
            jobId,
            taskId
          );

        if (!leaseAcquired) {
          return;
        }

        rawUploadStartedAt =
          Date.now();

        await uploadAdminVideoSource({
          jobId,
          file,
          signal: controller.signal,

          chunkSizeBytes:
            uploadTuning?.chunkSizeBytes,

          concurrency:
            uploadTuning?.concurrency,

          onProgress: (progress, metrics) => {
            if (
              metrics &&
              typeof metrics === 'object'
            ) {
              latestUploadMetrics =
                metrics;
            }

            updateTask(taskId, {
              stage: 'uploading',
              progress: normalizeProgress(progress),

              uploadMetrics:
                metrics && typeof metrics === 'object'
                  ? {
                      loadedBytes:
                        Number(metrics.loadedBytes) || 0,

                      totalBytes:
                        Number(metrics.totalBytes) ||
                        Number(file.size) ||
                        0,

                      bytesPerSecond:
                        Number(metrics.bytesPerSecond) || 0,

                      averageBytesPerSecond:
                        Number(
                          metrics.averageBytesPerSecond
                        ) || 0,

                      etaSeconds:
                        Number.isFinite(metrics.etaSeconds)
                          ? metrics.etaSeconds
                          : null,

                      chunkSizeBytes:
                        Number(metrics.chunkSizeBytes) || 0,

                      currentChunk:
                        Number(metrics.currentChunk) || 0,

                      totalChunks:
                        Number(metrics.totalChunks) || 0,

                      completedChunks:
                        Number(metrics.completedChunks) || 0,

                      uploadConcurrency:
                        Number(metrics.uploadConcurrency) || 0,

                      activeChunks:
                        Number(metrics.activeChunks) || 0,

                      retryCount:
                        Number(metrics.retryCount) || 0,

                      confirmedUploadedBytes:
                        Number(
                          metrics.confirmedUploadedBytes
                        ) || 0,
                    }
                  : undefined,
            });
          },
        });

        sourceUploadCompleted = true;

        const rawUploadCompletedAt =
          Date.now();

        const rawUploadDurationMs =
          rawUploadStartedAt
            ? Math.max(
                0,
                rawUploadCompletedAt -
                  rawUploadStartedAt
              )
            : 0;

        const measuredAverageSpeed =
          Number(
            latestUploadMetrics
              ?.averageBytesPerSecond
          ) || 0;

        recordVideoUploadBenchmarkRun({
          jobId,
          taskId,
          fileName:
            file.name,

          totalBytes:
            Number(file.size) || 0,

          chunkSizeBytes:
            Number(
              latestUploadMetrics
                ?.chunkSizeBytes
            ) ||
            Number(
              uploadTuning
                ?.chunkSizeBytes
            ) ||
            0,

          concurrency:
            Number(
              latestUploadMetrics
                ?.uploadConcurrency
            ) ||
            Number(
              uploadTuning
                ?.concurrency
            ) ||
            1,

          retryCount:
            Number(
              latestUploadMetrics
                ?.retryCount
            ) || 0,

          averageBytesPerSecond:
            measuredAverageSpeed ||
            (
              rawUploadDurationMs > 0
                ? (
                    Number(file.size) ||
                    0
                  ) /
                  (
                    rawUploadDurationMs /
                    1000
                  )
                : 0
            ),

          durationMs:
            rawUploadDurationMs,

          createdAt:
            rawUploadCompletedAt,

          targetType,
        });

        releaseJobTabLease(
          jobId
        );

        updateTask(
          taskId,
          (currentTask) => ({
            stage: 'queued',
            blockedByAnotherTab: false,
            progress: 0,

            uploadMetrics: {
              ...currentTask.uploadMetrics,

              loadedBytes:
                Number(file.size) || 0,

              totalBytes:
                Number(file.size) || 0,

              bytesPerSecond: 0,
              etaSeconds: 0,

              activeChunks: 0,

              completedChunks:
                Number(
                  currentTask.uploadMetrics
                    ?.totalChunks
                ) || 0,
            },
          })
        );

        const readyJob = await waitForAdminVideoJob({
          jobId,
          signal: controller.signal,

          onUpdate: (job) => {
            updateTask(taskId, {
              stage: getJobStage(job),
              progress: getJobProgress(job),

              errorMessage:
                typeof job?.errorMessage === 'string'
                  ? job.errorMessage
                  : '',
            });
          },
        });

        updateTask(taskId, {
          stage: 'ready',
          progress: 100,
          completedAt: Date.now(),
          errorMessage: '',
          result: readyJob,
        });
      } catch (error) {
        const wasCancelRequested =
          cancelRequestedRef.current.has(taskId);

        if (error?.name === 'AbortError' || wasCancelRequested) {
          updateTask(taskId, {
            stage: 'cancelled',
            completedAt: Date.now(),
            errorMessage: '',
          });

          return;
        }

        if (jobId && !sourceUploadCompleted) {
          updateTask(taskId, {
            stage: 'paused',
            completedAt: null,

            errorMessage:
              error?.message ||
              'آپلود موقتاً متوقف شد. برای ادامه، همان فایل را دوباره انتخاب کنید.',
          });

          return;
        }

        updateTask(taskId, {
          stage: 'failed',
          completedAt: Date.now(),

          errorMessage:
            error?.message ||
            'آپلود یا پردازش ویدئو با خطا مواجه شد.',
        });
      } finally {
        releaseJobTabLease(
          jobId
        );

        controllersRef.current.delete(taskId);
        cancelRequestedRef.current.delete(taskId);
      }
    },
    [
      acquireJobTabLease,
      releaseJobTabLease,
      updateTask,
    ]
  );

  const resumePersistedVideoJob = useCallback(
    async (task) => {
      if (
        !task?.id ||
        !task?.jobId ||
        restoredMonitoringRef.current.has(task.id)
      ) {
        return;
      }

      restoredMonitoringRef.current.add(task.id);

      const controller = new AbortController();

      controllersRef.current.set(task.id, controller);

      try {
        const currentJob = await getAdminVideoJob({
          jobId: task.jobId,
          signal: controller.signal,
        });

        if (currentJob.status === 'UPLOADING') {
          updateTask(task.id, {
            stage: 'paused',
            progress: getJobProgress(currentJob),
            completedAt: null,
            restoredFromStorage: false,
            restoredFromServer: false,

            errorMessage:
              'آپلود بعد از تازه‌سازی متوقف شده است. همان فایل را دوباره انتخاب کنید تا از آخرین بخش ذخیره‌شده ادامه پیدا کند.',
          });

          return;
        }

        if (currentJob.status === 'READY') {
          updateTask(task.id, {
            stage: 'ready',
            progress: 100,
            completedAt: Date.now(),
            errorMessage: '',
            result: currentJob,
          });

          return;
        }

        if (currentJob.status === 'FAILED') {
          updateTask(task.id, {
            stage: 'failed',
            progress: getJobProgress(currentJob),
            completedAt: Date.now(),

            errorMessage:
              currentJob.errorMessage ||
              'پردازش ویدئو با خطا مواجه شد.',
          });

          return;
        }

        if (currentJob.status === 'CANCELLED') {
          updateTask(task.id, {
            stage: 'cancelled',
            progress: getJobProgress(currentJob),
            completedAt: Date.now(),
            errorMessage: '',
          });

          return;
        }

        updateTask(task.id, {
          stage: getJobStage(currentJob),
          progress: getJobProgress(currentJob),
          errorMessage: '',
        });

        const readyJob = await waitForAdminVideoJob({
          jobId: task.jobId,
          signal: controller.signal,

          onUpdate: (job) => {
            updateTask(task.id, {
              stage: getJobStage(job),
              progress: getJobProgress(job),

              errorMessage:
                typeof job?.errorMessage === 'string'
                  ? job.errorMessage
                  : '',
            });
          },
        });

        updateTask(task.id, {
          stage: 'ready',
          progress: 100,
          completedAt: Date.now(),
          errorMessage: '',
          result: readyJob,
        });
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }

        if (
          task.stage === 'uploading' ||
          task.stage === 'paused'
        ) {
          updateTask(task.id, {
            stage: 'paused',
            completedAt: null,
            restoredFromStorage: false,
            restoredFromServer: false,

            errorMessage:
              'وضعیت آپلود فعلاً از سرور قابل دریافت نیست. بعد از برقراری ارتباط، همان فایل را برای ادامه انتخاب کنید.',
          });

          return;
        }

        const isCancelled =
          error?.message === 'عملیات ویدئو لغو شده است.';

        updateTask(task.id, {
          stage: isCancelled ? 'cancelled' : 'failed',
          completedAt: Date.now(),

          errorMessage: isCancelled
            ? ''
            : error?.message ||
              'بازیابی وضعیت پردازش ویدئو با خطا مواجه شد.',
        });
      } finally {
        controllersRef.current.delete(task.id);
        restoredMonitoringRef.current.delete(task.id);
      }
    },
    [updateTask]
  );

  useEffect(() => {
    if (!storageHydrated) {
      return;
    }

    tasks.forEach((task) => {
      if (
        (task.restoredFromStorage ||
          task.restoredFromServer) &&
        task.jobId &&
        PERSISTABLE_STAGES.has(task.stage) &&
        !controllersRef.current.has(task.id)
      ) {
        void resumePersistedVideoJob(task);
      }
    });
  }, [
    storageHydrated,
    tasks,
    resumePersistedVideoJob,
  ]);

  const startVideoUpload = useCallback(
    ({
      file,
      sessionId,
      termId,
      accessLevel,
      label,
    }) => {
      if (!(file instanceof File)) {
        throw new Error('فایل ویدئویی معتبر نیست.');
      }

      const normalizedTermId = Number(termId);

      if (
        !sessionId ||
        !Number.isInteger(normalizedTermId) ||
        normalizedTermId <= 0
      ) {
        throw new Error('اطلاعات جلسه یا ترم معتبر نیست.');
      }

      if (!accessLevel) {
        throw new Error('سطح دسترسی ویدئو مشخص نشده است.');
      }

      const existingTask =
        tasksRef.current.find(
          (task) =>
            !TERMINAL_STAGES.has(task.stage) &&
            task.targetType === 'SESSION' &&
            task.sessionId === sessionId &&
            Number(task.termId) === normalizedTermId
        );

      if (existingTask) {
        focusTask(existingTask.id);

        const conflictError = new Error(
          'برای این جلسه یک آپلود یا پردازش فعال وجود دارد.'
        );

        conflictError.code =
          'VIDEO_UPLOAD_ALREADY_ACTIVE';

        conflictError.taskId =
          existingTask.id;

        throw conflictError;
      }

      const taskId = createClientTaskId();

      const uploadTuning =
        getVideoUploadRuntimeTuning();

      const task = createInitialTask({
        id: taskId,
        file,
        targetType: 'SESSION',
        sessionId,
        termId: normalizedTermId,
        accessLevel,
        uploadTuning,
        label,
      });

      setTasks((previousTasks) => [
        task,
        ...previousTasks,
      ]);

      void runVideoUpload({
        taskId,
        file,
        targetType: 'SESSION',
        sessionId,
        termId: normalizedTermId,
        accessLevel,
        uploadTuning,
      });

      return taskId;
    },
    [focusTask, runVideoUpload]
  );

  const startCourseIntroVideoUpload = useCallback(
    ({
      file,
      courseId = null,
      courseTitle,
      label,
    }) => {
      if (!(file instanceof File)) {
        throw new Error('فایل ویدئویی معتبر نیست.');
      }

      const normalizedTitle =
        typeof courseTitle === 'string'
          ? courseTitle.normalize('NFC').trim()
          : '';

      if (!normalizedTitle) {
        throw new Error('عنوان دوره معتبر نیست.');
      }

      const normalizedCourseId =
        courseId === undefined ||
        courseId === null ||
        courseId === ''
          ? null
          : Number(courseId);

      if (
        normalizedCourseId !== null &&
        (!Number.isInteger(normalizedCourseId) ||
          normalizedCourseId <= 0)
      ) {
        throw new Error('شناسه دوره معتبر نیست.');
      }

      const existingTask =
        tasksRef.current.find(
          (task) => {
            if (
              TERMINAL_STAGES.has(task.stage) ||
              task.targetType !== 'COURSE_INTRO'
            ) {
              return false;
            }

            if (normalizedCourseId !== null) {
              return (
                Number(task.courseId) ===
                normalizedCourseId
              );
            }

            return (
              !task.courseId &&
              typeof task.courseTitle === 'string' &&
              task.courseTitle
                .normalize('NFC')
                .trim() === normalizedTitle
            );
          }
        );

      if (existingTask) {
        focusTask(existingTask.id);

        const conflictError = new Error(
          'برای ویدئوی معرفی این دوره یک آپلود یا پردازش فعال وجود دارد.'
        );

        conflictError.code =
          'VIDEO_UPLOAD_ALREADY_ACTIVE';

        conflictError.taskId =
          existingTask.id;

        throw conflictError;
      }

      const taskId = createClientTaskId();

      const uploadTuning =
        getVideoUploadRuntimeTuning();

      const task = createInitialTask({
        id: taskId,
        file,
        targetType: 'COURSE_INTRO',
        courseId: normalizedCourseId,
        courseTitle: normalizedTitle,
        uploadTuning,
        label:
          label ||
          `ویدئوی معرفی ${normalizedTitle}`,
      });

      setTasks((previousTasks) => [
        task,
        ...previousTasks,
      ]);

      void runVideoUpload({
        taskId,
        file,
        targetType: 'COURSE_INTRO',
        courseId: normalizedCourseId,
        courseTitle: normalizedTitle,
        uploadTuning,
      });

      return taskId;
    },
    [focusTask, runVideoUpload]
  );

  const resumeTaskUpload = useCallback(
    async (taskId, file) => {
      const task = tasksRef.current.find(
        (item) => item.id === taskId
      );

      if (
        !task ||
        task.stage !== 'paused' ||
        !task.jobId
      ) {
        return false;
      }

      if (!(file instanceof File)) {
        updateTask(taskId, {
          errorMessage:
            'لطفاً فایل ویدئویی قبلی را انتخاب کنید.',
        });

        return false;
      }

      if (
        task.fileName &&
        file.name !== task.fileName
      ) {
        updateTask(taskId, {
          errorMessage:
            'نام فایل انتخاب‌شده با فایل اولیه یکسان نیست.',
        });

        return false;
      }

      if (
        Number(task.totalBytes) > 0 &&
        file.size !== Number(task.totalBytes)
      ) {
        updateTask(taskId, {
          errorMessage:
            'حجم فایل انتخاب‌شده با فایل اولیه یکسان نیست.',
        });

        return false;
      }

      const fallbackTuning =
        getDefaultVideoUploadTuning();

      const resumeTuning = {
        chunkSizeBytes:
          Number(
            task.uploadTuning
              ?.chunkSizeBytes
          ) ||
          Number(
            task.uploadMetrics
              ?.chunkSizeBytes
          ) ||
          fallbackTuning.chunkSizeBytes,

        concurrency:
          Number(
            task.uploadTuning
              ?.concurrency
          ) ||
          Number(
            task.uploadMetrics
              ?.uploadConcurrency
          ) ||
          fallbackTuning.concurrency,
      };

      const leaseAcquired =
        await acquireJobTabLease(
          task.jobId,
          taskId
        );

      if (!leaseAcquired) {
        return false;
      }

      const controller = new AbortController();

      controllersRef.current.set(
        taskId,
        controller
      );

      updateTask(taskId, {
        stage: 'uploading',
        completedAt: null,
        errorMessage: '',
        blockedByAnotherTab: false,
      });

      void (async () => {
        let sourceUploadCompleted = false;

        try {
          await uploadAdminVideoSource({
            jobId: task.jobId,
            file,
            signal: controller.signal,

            chunkSizeBytes:
              resumeTuning.chunkSizeBytes,

            concurrency:
              resumeTuning.concurrency,

            onProgress: (progress, metrics) => {
              updateTask(taskId, {
                stage: 'uploading',
                progress:
                  normalizeProgress(progress),

                uploadMetrics:
                  metrics &&
                  typeof metrics === 'object'
                    ? {
                        loadedBytes:
                          Number(
                            metrics.loadedBytes
                          ) || 0,

                        totalBytes:
                          Number(
                            metrics.totalBytes
                          ) ||
                          Number(file.size) ||
                          0,

                        bytesPerSecond:
                          Number(
                            metrics.bytesPerSecond
                          ) || 0,

                        averageBytesPerSecond:
                          Number(
                            metrics.averageBytesPerSecond
                          ) || 0,

                        etaSeconds:
                          Number.isFinite(
                            metrics.etaSeconds
                          )
                            ? metrics.etaSeconds
                            : null,

                        chunkSizeBytes:
                          Number(
                            metrics.chunkSizeBytes
                          ) || 0,

                        currentChunk:
                          Number(
                            metrics.currentChunk
                          ) || 0,

                        totalChunks:
                          Number(
                            metrics.totalChunks
                          ) || 0,

                        completedChunks:
                          Number(
                            metrics.completedChunks
                          ) || 0,

                        uploadConcurrency:
                          Number(
                            metrics.uploadConcurrency
                          ) || 0,

                        activeChunks:
                          Number(
                            metrics.activeChunks
                          ) || 0,

                        retryCount:
                          Number(
                            metrics.retryCount
                          ) || 0,

                        confirmedUploadedBytes:
                          Number(
                            metrics.confirmedUploadedBytes
                          ) || 0,
                      }
                    : undefined,
              });
            },
          });

          sourceUploadCompleted = true;

          releaseJobTabLease(
            task.jobId
          );

          updateTask(
            taskId,
            (currentTask) => ({
              stage: 'queued',
              blockedByAnotherTab: false,
              progress: 0,
              errorMessage: '',

              uploadMetrics: {
                ...currentTask.uploadMetrics,

                loadedBytes:
                  Number(file.size) || 0,

                totalBytes:
                  Number(file.size) || 0,

                bytesPerSecond: 0,
                etaSeconds: 0,

                activeChunks: 0,

                completedChunks:
                  Number(
                    currentTask.uploadMetrics
                      ?.totalChunks
                  ) || 0,
              },
            })
          );

          const readyJob =
            await waitForAdminVideoJob({
              jobId: task.jobId,
              signal: controller.signal,

              onUpdate: (job) => {
                updateTask(taskId, {
                  stage: getJobStage(job),
                  progress:
                    getJobProgress(job),

                  errorMessage:
                    typeof job?.errorMessage ===
                    'string'
                      ? job.errorMessage
                      : '',
                });
              },
            });

          updateTask(taskId, {
            stage: 'ready',
            progress: 100,
            completedAt: Date.now(),
            errorMessage: '',
            result: readyJob,
          });
        } catch (error) {
          const wasCancelRequested =
            cancelRequestedRef.current.has(
              taskId
            );

          if (
            error?.name === 'AbortError' ||
            wasCancelRequested
          ) {
            updateTask(taskId, {
              stage: 'cancelled',
              completedAt: Date.now(),
              errorMessage: '',
            });

            return;
          }

          if (!sourceUploadCompleted) {
            updateTask(taskId, {
              stage: 'paused',
              completedAt: null,

              errorMessage:
                error?.message
                  ? `آپلود متوقف شد: ${error.message}`
                  : 'آپلود متوقف شد. دوباره برای ادامه فایل را انتخاب کنید.',
            });

            return;
          }

          updateTask(taskId, {
            stage: 'failed',
            completedAt: Date.now(),

            errorMessage:
              error?.message ||
              'پردازش ویدئو با خطا مواجه شد.',
          });
        } finally {
          releaseJobTabLease(
            task.jobId
          );

          controllersRef.current.delete(
            taskId
          );

          cancelRequestedRef.current.delete(
            taskId
          );
        }
      })();

      return true;
    },
    [
      acquireJobTabLease,
      releaseJobTabLease,
      updateTask,
    ]
  );

  const retryTaskProcessing = useCallback(
    async (taskId) => {
      const task =
        tasksRef.current.find(
          (item) =>
            item.id === taskId
        );

      if (
        !task ||
        task.stage !== 'failed' ||
        !task.jobId ||
        controllersRef.current.has(
          taskId
        )
      ) {
        return false;
      }

      const leaseAcquired =
        await acquireJobTabLease(
          task.jobId,
          taskId
        );

      if (!leaseAcquired) {
        updateTask(taskId, {
          stage: 'failed',

          errorMessage:
            'تلاش مجدد این ویدئو در تب دیگری فعال است.',
        });

        return false;
      }

      const controller =
        new AbortController();

      controllersRef.current.set(
        taskId,
        controller
      );

      updateTask(taskId, {
        retryingProcessing: true,
        blockedByAnotherTab: false,
        errorMessage: '',
      });

      try {
        const queuedJob =
          await retryAdminVideoJob({
            jobId:
              task.jobId,

            signal:
              controller.signal,
          });

        releaseJobTabLease(
          task.jobId
        );

        updateTask(taskId, {
          stage:
            getJobStage(
              queuedJob
            ),

          progress:
            getJobProgress(
              queuedJob
            ),

          completedAt: null,
          errorMessage: '',
          retryingProcessing: false,
          result: null,
        });

        toast.success(
          'پردازش ویدئو دوباره در صف قرار گرفت.'
        );

        const readyJob =
          await waitForAdminVideoJob({
            jobId:
              task.jobId,

            signal:
              controller.signal,

            onUpdate: (job) => {
              updateTask(
                taskId,
                {
                  stage:
                    getJobStage(
                      job
                    ),

                  progress:
                    getJobProgress(
                      job
                    ),

                  errorMessage:
                    typeof job
                      ?.errorMessage ===
                    'string'
                      ? job.errorMessage
                      : '',

                  retryingProcessing:
                    false,
                }
              );
            },
          });

        updateTask(taskId, {
          stage: 'ready',
          progress: 100,
          completedAt:
            Date.now(),
          errorMessage: '',
          retryingProcessing: false,
          result:
            readyJob,
        });

        return true;
      } catch (error) {
        if (
          error?.name ===
          'AbortError'
        ) {
          return false;
        }

        updateTask(taskId, {
          stage: 'failed',

          completedAt:
            Date.now(),

          retryingProcessing: false,

          errorMessage:
            error?.message ||
            'تلاش مجدد پردازش ویدئو با خطا مواجه شد.',
        });

        return false;
      } finally {
        releaseJobTabLease(
          task.jobId
        );

        controllersRef.current.delete(
          taskId
        );
      }
    },
    [
      acquireJobTabLease,
      releaseJobTabLease,
      updateTask,
    ]
  );

  const cancelTask = useCallback(
    async (taskId) => {
      const task = tasksRef.current.find(
        (item) => item.id === taskId
      );

      if (!task || !CANCELLABLE_STAGES.has(task.stage)) {
        return false;
      }

      cancelRequestedRef.current.add(taskId);

      const controller = controllersRef.current.get(taskId);

      controller?.abort();

      releaseJobTabLease(
        task.jobId
      );

      if (task.jobId) {
        await cancelAdminVideoJob({
          jobId: task.jobId,
        }).catch(() => {});
      }

      updateTask(taskId, {
        stage: 'cancelled',
        completedAt: Date.now(),
        errorMessage: '',
      });

      return true;
    },
    [
      releaseJobTabLease,
      updateTask,
    ]
  );

  const removeTask = useCallback((taskId) => {
    setTasks((previousTasks) =>
      previousTasks.filter((task) => {
        if (task.id !== taskId) {
          return true;
        }

        if (
          task.retryingProcessing
        ) {
          return true;
        }

        return !TERMINAL_STAGES.has(task.stage);
      })
    );
  }, []);

  const clearFinishedTasks = useCallback(() => {
    setTasks((previousTasks) =>
      previousTasks.filter(
        (task) =>
          task.retryingProcessing ||
          !TERMINAL_STAGES.has(
            task.stage
          )
      )
    );
  }, []);

  const value = useMemo(() => {
    const activeTasks = tasks.filter(
      (task) => !TERMINAL_STAGES.has(task.stage)
    );

    return {
      tasks,
      activeTasks,
      activeCount: activeTasks.length,

      focusRequest,
      focusTask,

      startVideoUpload,
      startCourseIntroVideoUpload,
      resumeTaskUpload,
      retryTaskProcessing,
      cancelTask,
      removeTask,
      clearFinishedTasks,

      isTerminalStage: (stage) =>
        TERMINAL_STAGES.has(stage),

      canCancelStage: (stage) =>
        CANCELLABLE_STAGES.has(stage),
    };
  }, [
    tasks,
    focusRequest,
    focusTask,
    startVideoUpload,
    startCourseIntroVideoUpload,
    resumeTaskUpload,
    retryTaskProcessing,
    cancelTask,
    removeTask,
    clearFinishedTasks,
  ]);

  return (
    <GlobalVideoUploadContext.Provider value={value}>
      {children}
    </GlobalVideoUploadContext.Provider>
  );
}

GlobalVideoUploadProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useGlobalVideoUpload = () => {
  const context = useContext(GlobalVideoUploadContext);

  if (!context) {
    throw new Error(
      'useGlobalVideoUpload must be used inside GlobalVideoUploadProvider.'
    );
  }

  return context;
};
