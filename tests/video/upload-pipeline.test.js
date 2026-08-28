import assert from 'node:assert/strict';
import test, {
  afterEach,
  beforeEach,
} from 'node:test';

import os from 'node:os';
import path from 'node:path';

import {
  access,
  mkdtemp,
  readFile,
  rm,
} from 'node:fs/promises';

import {
  finalizeParallelSourceVideo,
  getParallelSourceVideoUploadStatus,
  saveParallelSourceVideoChunk,
} from '../../src/server/video/uploads/parallel-source-video.js';

const JOB_ID = 'video-upload-test-job';
const FILE_NAME = 'source.mp4';

const TOTAL_SIZE = 12;
const CHUNK_SIZE = 5;

const FILE_FINGERPRINT_A =
  `sha256:${'a'.repeat(64)}`;

const FILE_FINGERPRINT_B =
  `sha256:${'b'.repeat(64)}`;

const ORIGINAL_UPLOAD_ROOT =
  process.env.VIDEO_UPLOAD_ROOT;

const ORIGINAL_MAX_SOURCE_VIDEO_BYTES =
  process.env.MAX_SOURCE_VIDEO_BYTES;

const ORIGINAL_DISK_RESERVE_BYTES =
  process.env.VIDEO_DISK_RESERVE_BYTES;

let uploadRoot = null;

const restoreEnvironmentValue = (
  key,
  value
) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

const createBody = (value) =>
  new Blob([value]).stream();

const uploadChunk = async ({
  index,
  offset,
  value,
  contentLength =
    Buffer.byteLength(value),
}) =>
  saveParallelSourceVideoChunk({
    jobId: JOB_ID,

    body: createBody(value),

    fileName: FILE_NAME,

    contentLength,
    uploadOffset: offset,

    totalSize: TOTAL_SIZE,
    chunkSize: CHUNK_SIZE,
    chunkIndex: index,
  });

const getStatus = (
  fileFingerprint = null
) =>
  getParallelSourceVideoUploadStatus({
    jobId: JOB_ID,
    fileName: FILE_NAME,
    totalSize: TOTAL_SIZE,
    chunkSize: CHUNK_SIZE,
    fileFingerprint,
  });

beforeEach(async () => {
  uploadRoot = await mkdtemp(
    path.join(
      os.tmpdir(),
      'teaching-yoga-video-upload-'
    )
  );

  process.env.VIDEO_UPLOAD_ROOT =
    uploadRoot;

  process.env.MAX_SOURCE_VIDEO_BYTES =
    '1048576';

  /*
   * تست finalize نباید به فضای آزاد واقعی سیستم
   * وابسته به reserve چند گیگابایتی production باشد.
   */
  process.env.VIDEO_DISK_RESERVE_BYTES =
    '1';
});

afterEach(async () => {
  if (uploadRoot) {
    await rm(uploadRoot, {
      recursive: true,
      force: true,
    });

    uploadRoot = null;
  }

  restoreEnvironmentValue(
    'VIDEO_UPLOAD_ROOT',
    ORIGINAL_UPLOAD_ROOT
  );

  restoreEnvironmentValue(
    'MAX_SOURCE_VIDEO_BYTES',
    ORIGINAL_MAX_SOURCE_VIDEO_BYTES
  );

  restoreEnvironmentValue(
    'VIDEO_DISK_RESERVE_BYTES',
    ORIGINAL_DISK_RESERVE_BYTES
  );
});

test(
  'initializes a resumable manifest with empty chunks',
  async () => {
    const status = await getStatus();

    assert.equal(status.uploadedBytes, 0);
    assert.equal(status.totalSize, TOTAL_SIZE);

    assert.equal(status.chunkSize, CHUNK_SIZE);
    assert.equal(status.totalChunks, 3);
    assert.equal(status.completedChunks, 0);

    assert.equal(status.complete, false);
    assert.equal(status.finalized, false);

    assert.deepEqual(
      status.chunks.map((chunk) => ({
        index: chunk.index,
        uploadedBytes:
          chunk.uploadedBytes,
        size: chunk.size,
        complete: chunk.complete,
      })),
      [
        {
          index: 0,
          uploadedBytes: 0,
          size: 5,
          complete: false,
        },
        {
          index: 1,
          uploadedBytes: 0,
          size: 5,
          complete: false,
        },
        {
          index: 2,
          uploadedBytes: 0,
          size: 2,
          complete: false,
        },
      ]
    );
  }
);

test(
  'persists a partial chunk and resumes from the exact server offset',
  async () => {
    const partial = await uploadChunk({
      index: 0,
      offset: 0,
      value: 'ABC',
    });

    assert.equal(
      partial.chunk.uploadedBytes,
      3
    );

    assert.equal(
      partial.chunk.complete,
      false
    );

    const recoveredStatus =
      await getStatus();

    assert.equal(
      recoveredStatus.chunks[0]
        .uploadedBytes,
      3
    );

    assert.equal(
      recoveredStatus.uploadedBytes,
      3
    );

    const completed =
      await uploadChunk({
        index: 0,
        offset: 3,
        value: 'DE',
      });

    assert.equal(
      completed.chunk.uploadedBytes,
      5
    );

    assert.equal(
      completed.chunk.complete,
      true
    );

    assert.equal(
      completed.completedChunks,
      1
    );
  }
);

test(
  'rejects a stale resume offset and reports the server offset',
  async () => {
    await uploadChunk({
      index: 0,
      offset: 0,
      value: 'ABC',
    });

    await assert.rejects(
      () =>
        uploadChunk({
          index: 0,
          offset: 1,
          value: 'DE',
        }),
      (error) => {
        assert.equal(
          error.statusCode,
          409
        );

        assert.equal(
          error.expectedOffset,
          3
        );

        assert.equal(
          error.receivedOffset,
          1
        );

        return true;
      }
    );

    const status = await getStatus();

    assert.equal(
      status.chunks[0].uploadedBytes,
      3
    );
  }
);

test(
  'accepts independent chunks concurrently and out of order',
  async () => {
    const [
      firstChunkResult,
      secondChunkResult,
    ] = await Promise.all([
      uploadChunk({
        index: 0,
        offset: 0,
        value: 'ABCDE',
      }),

      uploadChunk({
        index: 1,
        offset: 5,
        value: 'FGHIJ',
      }),
    ]);

    assert.equal(
      firstChunkResult.chunk.complete,
      true
    );

    assert.equal(
      secondChunkResult.chunk.complete,
      true
    );

    await uploadChunk({
      index: 2,
      offset: 10,
      value: 'KL',
    });

    const status = await getStatus();

    assert.equal(
      status.uploadedBytes,
      TOTAL_SIZE
    );

    assert.equal(
      status.completedChunks,
      3
    );

    assert.equal(
      status.complete,
      true
    );

    assert.equal(
      status.finalized,
      false
    );
  }
);

test(
  'treats a repeated completed chunk as idempotent',
  async () => {
    await uploadChunk({
      index: 0,
      offset: 0,
      value: 'ABCDE',
    });

    /*
     * شبیه حالتی که سرور chunk را ذخیره کرده ولی
     * response در شبکه گم شده و client همان request
     * را دوباره ارسال می‌کند.
     */
    const repeated =
      await uploadChunk({
        index: 0,
        offset: 0,
        value: 'ABCDE',
      });

    assert.equal(
      repeated.chunk.complete,
      true
    );

    assert.equal(
      repeated.chunk.uploadedBytes,
      CHUNK_SIZE
    );

    const status = await getStatus();

    assert.equal(
      status.uploadedBytes,
      CHUNK_SIZE
    );

    assert.equal(
      status.completedChunks,
      1
    );
  }
);

test(
  'does not finalize while one or more chunks are incomplete',
  async () => {
    await uploadChunk({
      index: 0,
      offset: 0,
      value: 'ABCDE',
    });

    await assert.rejects(
      () =>
        finalizeParallelSourceVideo({
          jobId: JOB_ID,
          fileName: FILE_NAME,
          totalSize: TOTAL_SIZE,
          chunkSize: CHUNK_SIZE,
        }),
      (error) => {
        assert.equal(
          error.statusCode,
          409
        );

        assert.match(
          error.message,
          /completed before finalization/i
        );

        return true;
      }
    );

    const finalPath = path.join(
      uploadRoot,
      JOB_ID,
      FILE_NAME
    );

    await assert.rejects(
      () => access(finalPath),
      (error) =>
        error?.code === 'ENOENT'
    );
  }
);

test(
  'assembles chunks byte-for-byte and removes temporary chunk files',
  async () => {
    await Promise.all([
      uploadChunk({
        index: 1,
        offset: 5,
        value: 'FGHIJ',
      }),

      uploadChunk({
        index: 0,
        offset: 0,
        value: 'ABCDE',
      }),
    ]);

    await uploadChunk({
      index: 2,
      offset: 10,
      value: 'KL',
    });

    const result =
      await finalizeParallelSourceVideo({
        jobId: JOB_ID,
        fileName: FILE_NAME,
        totalSize: TOTAL_SIZE,
        chunkSize: CHUNK_SIZE,
      });

    assert.equal(
      result.finalized,
      true
    );

    assert.equal(
      result.size,
      TOTAL_SIZE
    );

    const sourceBytes =
      await readFile(
        result.absolutePath
      );

    assert.equal(
      sourceBytes.toString('utf8'),
      'ABCDEFGHIJKL'
    );

    const parallelDirectory =
      path.join(
        uploadRoot,
        JOB_ID,
        'parallel-source'
      );

    await assert.rejects(
      () => access(parallelDirectory),
      (error) =>
        error?.code === 'ENOENT'
    );

    const status = await getStatus();

    assert.equal(
      status.finalized,
      true
    );

    assert.equal(
      status.complete,
      true
    );

    assert.equal(
      status.uploadedBytes,
      TOTAL_SIZE
    );
  }
);

test(
  'keeps finalization idempotent after the source file already exists',
  async () => {
    await Promise.all([
      uploadChunk({
        index: 0,
        offset: 0,
        value: 'ABCDE',
      }),

      uploadChunk({
        index: 1,
        offset: 5,
        value: 'FGHIJ',
      }),
    ]);

    await uploadChunk({
      index: 2,
      offset: 10,
      value: 'KL',
    });

    const first =
      await finalizeParallelSourceVideo({
        jobId: JOB_ID,
        fileName: FILE_NAME,
        totalSize: TOTAL_SIZE,
        chunkSize: CHUNK_SIZE,
      });

    const second =
      await finalizeParallelSourceVideo({
        jobId: JOB_ID,
        fileName: FILE_NAME,
        totalSize: TOTAL_SIZE,
        chunkSize: CHUNK_SIZE,
      });

    assert.equal(
      second.absolutePath,
      first.absolutePath
    );

    assert.equal(
      second.size,
      TOTAL_SIZE
    );

    assert.equal(
      second.finalized,
      true
    );

    assert.equal(
      (
        await readFile(
          second.absolutePath
        )
      ).toString('utf8'),
      'ABCDEFGHIJKL'
    );
  }
);

test(
  'rejects a different file shape for an existing resumable upload',
  async () => {
    await getStatus();

    await assert.rejects(
      () =>
        getParallelSourceVideoUploadStatus({
          jobId: JOB_ID,
          fileName: FILE_NAME,
          totalSize: TOTAL_SIZE,
          chunkSize: 4,
        }),
      (error) => {
        assert.equal(
          error.statusCode,
          409
        );

        assert.match(
          error.message,
          /does not match/i
        );

        return true;
      }
    );
  }
);
test(
  'binds a new resumable upload to its file fingerprint',
  async () => {
    const firstStatus =
      await getStatus(
        FILE_FINGERPRINT_A
      );

    assert.equal(
      firstStatus.uploadedBytes,
      0
    );

    await assert.rejects(
      () =>
        getStatus(
          FILE_FINGERPRINT_B
        ),
      (error) => {
        assert.equal(
          error.statusCode,
          409
        );

        assert.match(
          error.message,
          /does not match/i
        );

        return true;
      }
    );
  }
);

test(
  'upgrades a legacy manifest with a fingerprint on first new resume',
  async () => {
    await getStatus();

    const upgraded =
      await getStatus(
        FILE_FINGERPRINT_A
      );

    assert.equal(
      upgraded.uploadedBytes,
      0
    );

    await assert.rejects(
      () =>
        getStatus(
          FILE_FINGERPRINT_B
        ),
      (error) => {
        assert.equal(
          error.statusCode,
          409
        );

        return true;
      }
    );
  }
);
