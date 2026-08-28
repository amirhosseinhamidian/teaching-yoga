import assert from 'node:assert/strict';

import test from 'node:test';

import {
  createVideoJobTabLeaseManager,
} from '../../src/client/video/video-job-tab-lease.js';

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

const createManager = ({
  storage,
  now,
} = {}) =>
  createVideoJobTabLeaseManager({
    storage,
    now,
    navigatorObject: {},
    broadcastChannel: null,
    settleDelayMs: 0,
    leaseDurationMs: 1000,
    heartbeatIntervalMs:
      60 * 1000,
  });

test(
  'only one tab can hold the same video job lease',
  async () => {
    const storage =
      new MemoryStorage();

    const first =
      createManager({
        storage,
      });

    const second =
      createManager({
        storage,
      });

    assert.equal(
      await first.acquire(
        'job-1'
      ),
      true
    );

    assert.equal(
      await second.acquire(
        'job-1'
      ),
      false
    );

    first.dispose();
    second.dispose();
  }
);

test(
  'another tab can acquire after the owner releases',
  async () => {
    const storage =
      new MemoryStorage();

    const first =
      createManager({
        storage,
      });

    const second =
      createManager({
        storage,
      });

    assert.equal(
      await first.acquire(
        'job-2'
      ),
      true
    );

    assert.equal(
      first.release(
        'job-2'
      ),
      true
    );

    assert.equal(
      await second.acquire(
        'job-2'
      ),
      true
    );

    first.dispose();
    second.dispose();
  }
);

test(
  'an expired fallback lease can be reclaimed',
  async () => {
    const storage =
      new MemoryStorage();

    let currentTime = 1000;

    const first =
      createManager({
        storage,
        now: () =>
          currentTime,
      });

    const second =
      createManager({
        storage,
        now: () =>
          currentTime,
      });

    assert.equal(
      await first.acquire(
        'job-3'
      ),
      true
    );

    currentTime = 2501;

    assert.equal(
      await second.acquire(
        'job-3'
      ),
      true
    );

    first.dispose();
    second.dispose();
  }
);

test(
  'releasing one job does not release another active lease',
  async () => {
    const storage =
      new MemoryStorage();

    const first =
      createManager({
        storage,
      });

    const second =
      createManager({
        storage,
      });

    assert.equal(
      await first.acquire(
        'job-a'
      ),
      true
    );

    assert.equal(
      await first.acquire(
        'job-b'
      ),
      true
    );

    first.release(
      'job-a'
    );

    assert.equal(
      await second.acquire(
        'job-a'
      ),
      true
    );

    assert.equal(
      await second.acquire(
        'job-b'
      ),
      false
    );

    first.dispose();
    second.dispose();
  }
);
