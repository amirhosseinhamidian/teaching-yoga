import assert from 'node:assert/strict';

import test from 'node:test';

import {
  deleteManagedSessionAudio,
  getManagedSessionAudioKey,
  getOrphanTermSessionIds,
} from '../../src/server/media/term-session-cleanup.js';

test(
  'keeps shared sessions and returns only orphan session ids',
  () => {
    assert.deepEqual(
      getOrphanTermSessionIds({
        sessionIds: [
          'session-a',
          'session-b',
          'session-c',
          'session-a',
        ],

        sharedSessionIds: [
          'session-b',
        ],
      }),
      [
        'session-a',
        'session-c',
      ]
    );
  }
);

test(
  'extracts managed session audio keys',
  () => {
    assert.equal(
      getManagedSessionAudioKey(
        '/audio/11/session-a/audio.m4a'
      ),
      'audio/11/session-a/audio.m4a'
    );
  }
);

test(
  'rejects external and non-session-audio values',
  () => {
    assert.equal(
      getManagedSessionAudioKey(
        'https://cdn.example.com/audio.mp3'
      ),
      null
    );

    assert.equal(
      getManagedSessionAudioKey(
        '/podcast/episode.mp3'
      ),
      null
    );
  }
);

test(
  'deletes a managed orphan session audio file',
  async () => {
    const deleted = [];

    const result =
      await deleteManagedSessionAudio({
        storage: {
          async deletePath(key) {
            deleted.push(key);
          },
        },

        audioKey:
          'audio/11/session-a/audio.mp3',
      });

    assert.equal(
      result.deleted,
      true
    );

    assert.deepEqual(
      deleted,
      [
        'audio/11/session-a/audio.mp3',
      ]
    );
  }
);

test(
  'does not delete legacy external session audio',
  async () => {
    let deleteCalls = 0;

    const result =
      await deleteManagedSessionAudio({
        storage: {
          async deletePath() {
            deleteCalls += 1;
          },
        },

        audioKey:
          'https://legacy.example.com/audio.mp3',
      });

    assert.equal(
      result.deleted,
      false
    );

    assert.equal(
      deleteCalls,
      0
    );
  }
);
