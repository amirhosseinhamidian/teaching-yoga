/* eslint-disable no-undef */

import path from 'node:path';

import { createHash } from 'node:crypto';

import { createReadStream } from 'node:fs';

import { lstat, readdir } from 'node:fs/promises';

import { createInterface } from 'node:readline';

const DEFAULT_STORAGE_ROOT = './storage/published';

const DEFAULT_MANIFEST_DIRECTORY = './backups/media-manifests';

const MAX_ERROR_SAMPLES = 100;

const parseArguments = () => {
  const result = {
    root: null,
    manifest: null,
    allowExtra: false,
  };

  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--root') {
      result.root = args[index + 1] || null;

      index += 1;
      continue;
    }

    if (argument.startsWith('--root=')) {
      result.root = argument.slice('--root='.length);

      continue;
    }

    if (argument === '--manifest') {
      result.manifest = args[index + 1] || null;

      index += 1;
      continue;
    }

    if (argument.startsWith('--manifest=')) {
      result.manifest = argument.slice('--manifest='.length);

      continue;
    }

    if (argument === '--allow-extra') {
      result.allowExtra = true;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return result;
};

const shouldIgnoreName = (name) => {
  if (name === '.DS_Store' || name.startsWith('._')) {
    return true;
  }

  return (
    name.endsWith('.part') ||
    name.includes('.incoming-') ||
    name.includes('.backup-')
  );
};

const compareNames = (left, right) => {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
};

const normalizeManifestKey = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Manifest file key is empty.');
  }

  if (path.isAbsolute(value) || value.includes('\\')) {
    throw new Error(`Unsafe manifest key: ${value}`);
  }

  const segments = value.split('/').filter(Boolean);

  if (
    segments.length === 0 ||
    segments.some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error(`Unsafe manifest key: ${value}`);
  }

  return segments.join('/');
};

const resolveManifestPath = async (providedManifest) => {
  if (providedManifest) {
    return path.resolve(process.cwd(), providedManifest);
  }

  const directory = path.resolve(process.cwd(), DEFAULT_MANIFEST_DIRECTORY);

  const entries = await readdir(directory);

  const manifests = entries
    .filter(
      (name) => name.startsWith('media-manifest-') && name.endsWith('.jsonl')
    )
    .sort(compareNames);

  if (manifests.length === 0) {
    throw new Error(`No manifest was found in ${directory}`);
  }

  return path.join(directory, manifests[manifests.length - 1]);
};

const hashStableFile = async (filePath) => {
  const before = await lstat(filePath);

  if (before.isSymbolicLink()) {
    throw new Error(`Symbolic links are not allowed: ${filePath}`);
  }

  if (!before.isFile()) {
    throw new Error(`Not a regular file: ${filePath}`);
  }

  const hash = createHash('sha256');

  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('error', reject);

    stream.on('end', resolve);
  });

  const after = await lstat(filePath);

  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
    throw new Error(`File changed while verifying: ${filePath}`);
  }

  return {
    size: after.size,

    sha256: hash.digest('hex'),
  };
};

const walkCurrentFiles = async ({ rootPath, currentPath, onFile }) => {
  const entries = await readdir(currentPath, {
    withFileTypes: true,
  });

  entries.sort((left, right) => compareNames(left.name, right.name));

  for (const entry of entries) {
    if (shouldIgnoreName(entry.name)) {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed: ${absolutePath}`);
    }

    if (entry.isDirectory()) {
      await walkCurrentFiles({
        rootPath,

        currentPath: absolutePath,

        onFile,
      });

      continue;
    }

    if (!entry.isFile()) {
      throw new Error(`Unsupported filesystem entry: ${absolutePath}`);
    }

    const key = path.relative(rootPath, absolutePath).split(path.sep).join('/');

    await onFile(key);
  }
};

const main = async () => {
  const argumentsData = parseArguments();

  const rootPath = path.resolve(
    process.cwd(),

    argumentsData.root ||
      process.env.LOCAL_MEDIA_ROOT ||
      process.env.LOCAL_VIDEO_ROOT ||
      DEFAULT_STORAGE_ROOT
  );

  const rootStat = await lstat(rootPath);

  if (!rootStat.isDirectory()) {
    throw new Error(`Storage root is not a directory: ${rootPath}`);
  }

  const manifestPath = await resolveManifestPath(argumentsData.manifest);

  const manifestStat = await lstat(manifestPath);

  if (!manifestStat.isFile()) {
    throw new Error(`Manifest is not a file: ${manifestPath}`);
  }

  console.log(`Manifest: ${manifestPath}`);

  console.log(`Storage:  ${rootPath}`);

  const expectedKeys = new Set();

  const recordsHash = createHash('sha256');

  let summary = null;
  let summarySeen = false;

  let recordCount = 0;
  let totalBytes = 0;

  let verifiedCount = 0;
  let errorCount = 0;
  let extraCount = 0;

  const errorSamples = [];
  const extraSamples = [];

  const addError = (message) => {
    errorCount += 1;

    if (errorSamples.length < MAX_ERROR_SAMPLES) {
      errorSamples.push(message);
    }
  };

  const inputStream = createReadStream(manifestPath, {
    encoding: 'utf8',
  });

  const lines = createInterface({
    input: inputStream,

    crlfDelay: Infinity,
  });

  let lineNumber = 0;

  for await (const rawLine of lines) {
    lineNumber += 1;

    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    let record;

    try {
      record = JSON.parse(line);
    } catch {
      addError(`Invalid JSON at manifest line ${lineNumber}.`);

      continue;
    }

    if (record?.type === 'summary') {
      if (summarySeen) {
        addError('Manifest contains more than one summary record.');

        continue;
      }

      summarySeen = true;
      summary = record;
      continue;
    }

    if (record?.type !== 'file') {
      addError(`Unknown manifest record type at line ${lineNumber}.`);

      continue;
    }

    if (summarySeen) {
      addError(`File record found after summary at line ${lineNumber}.`);

      continue;
    }

    recordsHash.update(`${rawLine}\n`);

    let key;

    try {
      key = normalizeManifestKey(record.key);
    } catch (error) {
      addError(error instanceof Error ? error.message : String(error));

      continue;
    }

    if (expectedKeys.has(key)) {
      addError(`Duplicate manifest key: ${key}`);

      continue;
    }

    expectedKeys.add(key);

    recordCount += 1;

    if (!Number.isSafeInteger(record.size) || record.size < 0) {
      addError(`Invalid size for ${key}`);

      continue;
    }

    totalBytes += record.size;

    const absolutePath = path.resolve(rootPath, ...key.split('/'));

    const relativePath = path.relative(rootPath, absolutePath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      addError(`Manifest key escapes storage root: ${key}`);

      continue;
    }

    try {
      const actual = await hashStableFile(absolutePath);

      if (actual.size !== record.size) {
        addError(
          `Size mismatch for ${key}: expected ${record.size}, received ${actual.size}`
        );

        continue;
      }

      if (actual.sha256 !== record.sha256) {
        addError(`SHA-256 mismatch for ${key}`);

        continue;
      }

      verifiedCount += 1;
    } catch (error) {
      addError(
        `${key}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (recordCount % 250 === 0) {
      console.log(`[verify] Checked ${recordCount} manifest records...`);
    }
  }

  const calculatedRecordsHash = recordsHash.digest('hex');

  if (!summary) {
    addError('Manifest summary record is missing.');
  } else {
    if (summary.schemaVersion !== 1) {
      addError(`Unsupported manifest schema version: ${summary.schemaVersion}`);
    }

    if (summary.fileCount !== recordCount) {
      addError(
        `Manifest file count mismatch: summary=${summary.fileCount}, records=${recordCount}`
      );
    }

    if (summary.totalBytes !== totalBytes) {
      addError(
        `Manifest byte count mismatch: summary=${summary.totalBytes}, records=${totalBytes}`
      );
    }

    if (summary.recordsSha256 !== calculatedRecordsHash) {
      addError('Manifest record checksum is invalid.');
    }
  }

  await walkCurrentFiles({
    rootPath,

    currentPath: rootPath,

    onFile: async (key) => {
      if (expectedKeys.has(key)) {
        return;
      }

      extraCount += 1;

      if (extraSamples.length < MAX_ERROR_SAMPLES) {
        extraSamples.push(key);
      }
    },
  });

  if (extraCount > 0 && !argumentsData.allowExtra) {
    addError(
      `${extraCount} extra files exist in storage but are not present in the manifest.`
    );
  }

  console.log('');
  console.log('===== MEDIA VERIFICATION SUMMARY =====');

  console.log(`Manifest records: ${recordCount}`);

  console.log(`Verified files:   ${verifiedCount}`);

  console.log(`Total bytes:      ${totalBytes}`);

  console.log(`Extra files:      ${extraCount}`);

  console.log(`Errors:           ${errorCount}`);

  if (errorSamples.length > 0) {
    console.log('');
    console.log('Error samples:');

    for (const message of errorSamples) {
      console.log(`- ${message}`);
    }
  }

  if (extraSamples.length > 0) {
    console.log('');
    console.log('Extra file samples:');

    for (const key of extraSamples) {
      console.log(`- ${key}`);
    }
  }

  if (errorCount > 0) {
    throw new Error('Media verification failed.');
  }

  console.log('');
  console.log('Media verification completed successfully.');
};

main().catch((error) => {
  console.error(
    '[media-verify] Failed:',
    error instanceof Error ? error.stack || error.message : error
  );

  process.exitCode = 1;
});
