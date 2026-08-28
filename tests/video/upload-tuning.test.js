import assert from 'node:assert/strict';

import test from 'node:test';

import {
  clearVideoUploadRuntimeTuning,
  getVideoUploadRuntimeTuning,
  setVideoUploadRuntimeTuning,
} from '../../src/client/video/video-upload-tuning.js';

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

test(
  'stores and reads a runtime upload tuning override',
  () => {
    const storage =
      new MemoryStorage();

    const saved =
      setVideoUploadRuntimeTuning(
        {
          chunkSizeMiB: 32,
          concurrency: 3,
        },
        {
          storage,
        }
      );

    assert.equal(
      saved.chunkSizeMiB,
      32
    );

    assert.equal(
      saved.chunkSizeBytes,
      32 * 1024 * 1024
    );

    assert.equal(
      saved.concurrency,
      3
    );

    assert.equal(
      saved.source,
      'runtime'
    );

    assert.deepEqual(
      getVideoUploadRuntimeTuning({
        storage,
      }),
      saved
    );
  }
);

test(
  'rejects invalid runtime tuning values',
  () => {
    const storage =
      new MemoryStorage();

    assert.throws(
      () =>
        setVideoUploadRuntimeTuning(
          {
            chunkSizeMiB: 128,
            concurrency: 2,
          },
          {
            storage,
          }
        ),
      RangeError
    );

    assert.throws(
      () =>
        setVideoUploadRuntimeTuning(
          {
            chunkSizeMiB: 16,
            concurrency: 4,
          },
          {
            storage,
          }
        ),
      RangeError
    );
  }
);

test(
  'ignores malformed stored overrides',
  () => {
    const storage =
      new MemoryStorage();

    storage.setItem(
      'teaching-yoga:video-upload-tuning:v1',
      '{"chunkSizeMiB":"bad"}'
    );

    const result =
      getVideoUploadRuntimeTuning({
        storage,
      });

    assert.equal(
      result.source,
      'environment'
    );

    assert.ok(
      result.chunkSizeBytes > 0
    );

    assert.ok(
      result.concurrency >= 1 &&
      result.concurrency <= 3
    );
  }
);

test(
  'clear removes runtime override and returns defaults',
  () => {
    const storage =
      new MemoryStorage();

    setVideoUploadRuntimeTuning(
      {
        chunkSizeMiB: 32,
        concurrency: 1,
      },
      {
        storage,
      }
    );

    const cleared =
      clearVideoUploadRuntimeTuning({
        storage,
      });

    assert.equal(
      cleared.source,
      'environment'
    );

    assert.equal(
      getVideoUploadRuntimeTuning({
        storage,
      }).source,
      'environment'
    );
  }
);
