export class ActiveVideoJobConflictError extends Error {
  constructor(job) {
    super(
      'An active video job already exists for this target.'
    );

    this.name =
      'ActiveVideoJobConflictError';

    this.code =
      'ACTIVE_VIDEO_JOB_CONFLICT';

    this.job = job || null;
  }
}
