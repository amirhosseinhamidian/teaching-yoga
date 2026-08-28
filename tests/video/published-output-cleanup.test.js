import assert from 'node:assert/strict';

import test from 'node:test';

import {
  cleanupPreviousPublishedVideo,
  deleteManagedPublishedVideo,
  getManagedVideoOutputPrefix,
} from '../../src/server/video/cleanup-previous-published-video.js';

test(
  'extracts the managed directory from a master playlist key',
  () => {
    assert.equal(
      getManagedVideoOutputPrefix(
        'videos/11/session-a/job-old/master.m3u8'
      ),
      'videos/11/session-a/job-old'
    );
  }
);

test(
  'rejects external and unmanaged output keys',
  () => {
    assert.equal(
      getManagedVideoOutputPrefix(
        'https://cdn.example.com/videos/a/master.m3u8'
      ),
      null
    );

    assert.equal(
      getManagedVideoOutputPrefix(
        'legacy/video.mp4'
      ),
      null
    );
  }
);

test(
  'deletes a superseded managed output directory',
  async () => {
    const deleted = [];

    const result =
      await cleanupPreviousPublishedVideo({
        storage: {
          async deletePath(key) {
            deleted.push(key);
          },
        },

        previousOutputKey:
          'videos/11/session-a/job-old/master.m3u8',

        currentOutputKey:
          'videos/11/session-a/job-new/master.m3u8',
      });

    assert.equal(
      result.deleted,
      true
    );

    assert.deepEqual(
      deleted,
      [
        'videos/11/session-a/job-old',
      ]
    );
  }
);

test(
  'never deletes when previous and current output use the same prefix',
  async () => {
    let deleteCalls = 0;

    const result =
      await cleanupPreviousPublishedVideo({
        storage: {
          async deletePath() {
            deleteCalls += 1;
          },
        },

        previousOutputKey:
          'videos/course/intro/job-a/master.m3u8',

        currentOutputKey:
          'videos/course/intro/job-a/master.m3u8',
      });

    assert.equal(
      result.deleted,
      false
    );

    assert.equal(
      result.reason,
      'same_output_prefix'
    );

    assert.equal(
      deleteCalls,
      0
    );
  }
);

test(
  'does not delete a legacy external previous URL',
  async () => {
    let deleteCalls = 0;

    const result =
      await cleanupPreviousPublishedVideo({
        storage: {
          async deletePath() {
            deleteCalls += 1;
          },
        },

        previousOutputKey:
          'https://old.example.com/video.mp4',

        currentOutputKey:
          'videos/11/session-a/job-new/master.m3u8',
      });

    assert.equal(
      result.deleted,
      false
    );

    assert.equal(
      result.reason,
      'previous_output_not_managed'
    );

    assert.equal(
      deleteCalls,
      0
    );
  }
);

test(
  'deletes a managed course intro output when the course is removed',
  async () => {
    const deleted = [];

    const result =
      await deleteManagedPublishedVideo({
        storage: {
          async deletePath(key) {
            deleted.push(key);
          },
        },

        outputKey:
          'videos/course-name/intro/job-a/master.m3u8',
      });

    assert.equal(
      result.deleted,
      true
    );

    assert.deepEqual(
      deleted,
      [
        'videos/course-name/intro/job-a',
      ]
    );
  }
);

test(
  'does not delete an external course intro URL',
  async () => {
    let deleteCalls = 0;

    const result =
      await deleteManagedPublishedVideo({
        storage: {
          async deletePath() {
            deleteCalls += 1;
          },
        },

        outputKey:
          'https://cdn.example.com/intro.mp4',
      });

    assert.equal(
      result.deleted,
      false
    );

    assert.equal(
      result.reason,
      'output_not_managed'
    );

    assert.equal(
      deleteCalls,
      0
    );
  }
);

test(
  'deletes the previous managed intro when a course update clears it',
  async () => {
    const deleted = [];

    const result =
      await cleanupPreviousPublishedVideo({
        storage: {
          async deletePath(key) {
            deleted.push(key);
          },
        },

        previousOutputKey:
          'videos/course-name/intro/job-old/master.m3u8',

        currentOutputKey: null,
      });

    assert.equal(
      result.deleted,
      true
    );

    assert.deepEqual(
      deleted,
      [
        'videos/course-name/intro/job-old',
      ]
    );
  }
);
