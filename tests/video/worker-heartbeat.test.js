import assert from 'node:assert/strict';

import test, {
  afterEach,
  beforeEach,
} from 'node:test';

import os from 'node:os';
import path from 'node:path';

import {
  mkdtemp,
  rm,
} from 'node:fs/promises';

import {
  readVideoWorkerHeartbeat,
  writeVideoWorkerHeartbeat,
} from '../../src/server/video/worker/video-worker-heartbeat.js';

const ORIGINAL_HEARTBEAT_PATH =
  process.env
    .VIDEO_WORKER_HEARTBEAT_PATH;

let tempDirectory = null;

beforeEach(async () => {
  tempDirectory =
    await mkdtemp(
      path.join(
        os.tmpdir(),
        'teaching-yoga-heartbeat-'
      )
    );

  process.env
    .VIDEO_WORKER_HEARTBEAT_PATH =
      path.join(
        tempDirectory,
        'heartbeat.json'
      );
});

afterEach(async () => {
  if (tempDirectory) {
    await rm(
      tempDirectory,
      {
        recursive: true,
        force: true,
      }
    );

    tempDirectory = null;
  }

  if (
    ORIGINAL_HEARTBEAT_PATH ===
    undefined
  ) {
    delete process.env
      .VIDEO_WORKER_HEARTBEAT_PATH;
  } else {
    process.env
      .VIDEO_WORKER_HEARTBEAT_PATH =
        ORIGINAL_HEARTBEAT_PATH;
  }
});

test(
  'reports a fresh running heartbeat as healthy',
  async () => {
    const payload =
      await writeVideoWorkerHeartbeat({
        status: 'running',

        startedAt:
          new Date(
            Date.now() - 1000
          ).toISOString(),
      });

    const heartbeat =
      await readVideoWorkerHeartbeat({
        now:
          Date.parse(
            payload.updatedAt
          ) + 1000,

        staleAfterMs: 5000,
      });

    assert.equal(
      heartbeat.exists,
      true
    );

    assert.equal(
      heartbeat.valid,
      true
    );

    assert.equal(
      heartbeat.healthy,
      true
    );

    assert.equal(
      heartbeat.stale,
      false
    );

    assert.equal(
      heartbeat.status,
      'running'
    );
  }
);

test(
  'reports an old running heartbeat as stale',
  async () => {
    const payload =
      await writeVideoWorkerHeartbeat({
        status: 'running',
      });

    const heartbeat =
      await readVideoWorkerHeartbeat({
        now:
          Date.parse(
            payload.updatedAt
          ) + 60_000,

        staleAfterMs: 45_000,
      });

    assert.equal(
      heartbeat.healthy,
      false
    );

    assert.equal(
      heartbeat.stale,
      true
    );

    assert.equal(
      heartbeat.ageMs,
      60_000
    );
  }
);

test(
  'reports a graceful stopped heartbeat as unhealthy immediately',
  async () => {
    const payload =
      await writeVideoWorkerHeartbeat({
        status: 'stopped',
      });

    const heartbeat =
      await readVideoWorkerHeartbeat({
        now:
          Date.parse(
            payload.updatedAt
          ),

        staleAfterMs: 45_000,
      });

    assert.equal(
      heartbeat.healthy,
      false
    );

    assert.equal(
      heartbeat.stale,
      false
    );

    assert.equal(
      heartbeat.status,
      'stopped'
    );
  }
);

test(
  'reports a missing heartbeat file without throwing',
  async () => {
    const heartbeat =
      await readVideoWorkerHeartbeat({
        staleAfterMs: 45_000,
      });

    assert.equal(
      heartbeat.exists,
      false
    );

    assert.equal(
      heartbeat.healthy,
      false
    );

    assert.equal(
      heartbeat.status,
      'missing'
    );
  }
);
