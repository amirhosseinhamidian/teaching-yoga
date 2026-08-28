import assert from 'node:assert/strict';

import test, {
  afterEach,
  beforeEach,
} from 'node:test';

import os from 'node:os';
import path from 'node:path';

import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';

import {
  assertRetryableVideoSource,
} from '../../src/server/video/jobs/assert-retryable-video-source.js';

const ORIGINAL_UPLOAD_ROOT =
  process.env
    .VIDEO_UPLOAD_ROOT;

const JOB_ID =
  'retry-source-test-job';

let tempDirectory = null;
let uploadRoot = null;

beforeEach(async () => {
  tempDirectory =
    await mkdtemp(
      path.join(
        os.tmpdir(),
        'teaching-yoga-retry-'
      )
    );

  uploadRoot =
    path.join(
      tempDirectory,
      'uploads'
    );

  process.env
    .VIDEO_UPLOAD_ROOT =
      uploadRoot;

  await mkdir(
    path.join(
      uploadRoot,
      JOB_ID
    ),
    {
      recursive: true,
    }
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
    uploadRoot = null;
  }

  if (
    ORIGINAL_UPLOAD_ROOT ===
    undefined
  ) {
    delete process.env
      .VIDEO_UPLOAD_ROOT;
  } else {
    process.env
      .VIDEO_UPLOAD_ROOT =
        ORIGINAL_UPLOAD_ROOT;
  }
});

test(
  'accepts an existing source file inside the job upload directory',
  async () => {
    const sourcePath =
      path.join(
        uploadRoot,
        JOB_ID,
        'source.mp4'
      );

    await writeFile(
      sourcePath,
      Buffer.from(
        'video-source'
      )
    );

    const result =
      await assertRetryableVideoSource({
        jobId: JOB_ID,

        sourcePath:
          path.relative(
            process.cwd(),
            sourcePath
          ),
      });

    assert.equal(
      result.absolutePath,
      sourcePath
    );

    assert.equal(
      result.size,
      12
    );
  }
);

test(
  'rejects a missing source file',
  async () => {
    const missingPath =
      path.join(
        uploadRoot,
        JOB_ID,
        'source.mp4'
      );

    await assert.rejects(
      () =>
        assertRetryableVideoSource({
          jobId: JOB_ID,

          sourcePath:
            path.relative(
              process.cwd(),
              missingPath
            ),
        }),
      (error) => {
        assert.equal(
          error.statusCode,
          409
        );

        assert.match(
          error.message,
          /دوباره آپلود/
        );

        return true;
      }
    );
  }
);

test(
  'rejects a source path outside the job upload directory',
  async () => {
    const outsidePath =
      path.join(
        tempDirectory,
        'outside.mp4'
      );

    await writeFile(
      outsidePath,
      Buffer.from(
        'wrong-video'
      )
    );

    await assert.rejects(
      () =>
        assertRetryableVideoSource({
          jobId: JOB_ID,

          sourcePath:
            path.relative(
              process.cwd(),
              outsidePath
            ),
        }),
      (error) => {
        assert.equal(
          error.statusCode,
          409
        );

        assert.match(
          error.message,
          /مسیر/
        );

        return true;
      }
    );
  }
);

test(
  'rejects an empty source file',
  async () => {
    const sourcePath =
      path.join(
        uploadRoot,
        JOB_ID,
        'source.mp4'
      );

    await writeFile(
      sourcePath,
      Buffer.alloc(0)
    );

    await assert.rejects(
      () =>
        assertRetryableVideoSource({
          jobId: JOB_ID,

          sourcePath:
            path.relative(
              process.cwd(),
              sourcePath
            ),
        }),
      (error) => {
        assert.equal(
          error.statusCode,
          409
        );

        assert.match(
          error.message,
          /معتبر نیست/
        );

        return true;
      }
    );
  }
);
