import assert from 'node:assert/strict';

import test from 'node:test';

import {
  clearVideoUploadBenchmarkHistory,
  getVideoUploadBenchmarkHistory,
  recordVideoUploadBenchmarkRun,
} from '../../src/client/video/video-upload-benchmark-history.js';

class MemoryStorage {
  constructor() {
    this.values =
      new Map();
  }

  getItem(key) {
    return this.values.has(key)
      ? this.values.get(key)
      : null;
  }

  setItem(key, value) {
    this.values.set(
      key,
      String(value)
    );
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const makeRun = (
  jobId,
  createdAt
) => ({
  jobId,
  taskId: `task-${jobId}`,
  fileName: `${jobId}.mov`,
  totalBytes: 500_000_000,
  chunkSizeBytes:
    16 * 1024 * 1024,
  concurrency: 2,
  retryCount: 0,
  averageBytesPerSecond:
    12_000_000,
  durationMs: 42_000,
  createdAt,
  targetType: 'SESSION',
});

test(
  'records benchmark runs newest first',
  () => {
    const storage =
      new MemoryStorage();

    recordVideoUploadBenchmarkRun(
      makeRun('job-a', 1000),
      {
        storage,
        notify: false,
      }
    );

    recordVideoUploadBenchmarkRun(
      makeRun('job-b', 2000),
      {
        storage,
        notify: false,
      }
    );

    const history =
      getVideoUploadBenchmarkHistory({
        storage,
      });

    assert.deepEqual(
      history.map(
        (item) =>
          item.jobId
      ),
      ['job-b', 'job-a']
    );
  }
);

test(
  'recording the same job replaces its previous result',
  () => {
    const storage =
      new MemoryStorage();

    recordVideoUploadBenchmarkRun(
      makeRun('job-a', 1000),
      {
        storage,
        notify: false,
      }
    );

    recordVideoUploadBenchmarkRun(
      {
        ...makeRun(
          'job-a',
          3000
        ),

        concurrency: 3,
      },
      {
        storage,
        notify: false,
      }
    );

    const history =
      getVideoUploadBenchmarkHistory({
        storage,
      });

    assert.equal(
      history.length,
      1
    );

    assert.equal(
      history[0].concurrency,
      3
    );

    assert.equal(
      history[0].createdAt,
      3000
    );
  }
);

test(
  'keeps only the latest 30 benchmark runs',
  () => {
    const storage =
      new MemoryStorage();

    for (
      let index = 0;
      index < 35;
      index += 1
    ) {
      recordVideoUploadBenchmarkRun(
        makeRun(
          `job-${index}`,
          index
        ),
        {
          storage,
          notify: false,
        }
      );
    }

    const history =
      getVideoUploadBenchmarkHistory({
        storage,
      });

    assert.equal(
      history.length,
      30
    );

    assert.equal(
      history[0].jobId,
      'job-34'
    );

    assert.equal(
      history.at(-1).jobId,
      'job-5'
    );
  }
);

test(
  'clears benchmark history',
  () => {
    const storage =
      new MemoryStorage();

    recordVideoUploadBenchmarkRun(
      makeRun('job-a', 1000),
      {
        storage,
        notify: false,
      }
    );

    clearVideoUploadBenchmarkHistory({
      storage,
      notify: false,
    });

    assert.deepEqual(
      getVideoUploadBenchmarkHistory({
        storage,
      }),
      []
    );
  }
);
