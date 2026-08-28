import assert from 'node:assert/strict';

import test from 'node:test';

import {
  cleanupPreviousCourseCover,
  getManagedCourseCoverKey,
} from '../../src/server/media/cleanup-course-cover.js';

test(
  'extracts a managed course cover storage key',
  () => {
    assert.equal(
      getManagedCourseCoverKey(
        '/images/course_covers/Yoga/cover.webp'
      ),
      'images/course_covers/Yoga/cover.webp'
    );
  }
);

test(
  'rejects external and non-course-cover values',
  () => {
    assert.equal(
      getManagedCourseCoverKey(
        'https://cdn.example.com/cover.webp'
      ),
      null
    );

    assert.equal(
      getManagedCourseCoverKey(
        '/images/profile/avatar.webp'
      ),
      null
    );
  }
);

test(
  'deletes a replaced managed course cover',
  async () => {
    const deleted = [];

    const result =
      await cleanupPreviousCourseCover({
        storage: {
          async deletePath(key) {
            deleted.push(key);
          },
        },

        previousCover:
          '/images/course_covers/Yoga/cover.jpg',

        currentCover:
          '/images/course_covers/Yoga/cover.webp',
      });

    assert.equal(
      result.deleted,
      true
    );

    assert.deepEqual(
      deleted,
      [
        'images/course_covers/Yoga/cover.jpg',
      ]
    );
  }
);

test(
  'keeps the cover when the storage key did not change',
  async () => {
    let deleteCalls = 0;

    const result =
      await cleanupPreviousCourseCover({
        storage: {
          async deletePath() {
            deleteCalls += 1;
          },
        },

        previousCover:
          '/images/course_covers/Yoga/cover.webp',

        currentCover:
          '/images/course_covers/Yoga/cover.webp',
      });

    assert.equal(
      result.deleted,
      false
    );

    assert.equal(
      result.reason,
      'same_cover_key'
    );

    assert.equal(
      deleteCalls,
      0
    );
  }
);

test(
  'deletes a managed cover when the course is removed',
  async () => {
    const deleted = [];

    const result =
      await cleanupPreviousCourseCover({
        storage: {
          async deletePath(key) {
            deleted.push(key);
          },
        },

        previousCover:
          '/images/course_covers/Yoga/cover.png',
      });

    assert.equal(
      result.deleted,
      true
    );

    assert.deepEqual(
      deleted,
      [
        'images/course_covers/Yoga/cover.png',
      ]
    );
  }
);
