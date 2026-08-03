/* eslint-disable no-undef */

import path from 'node:path';
import { createHash } from 'node:crypto';

import { createReadStream, createWriteStream } from 'node:fs';

import { lstat, mkdir, readdir, rename, rm } from 'node:fs/promises';

const DEFAULT_STORAGE_ROOT = './storage/published';

const DEFAULT_MANIFEST_DIRECTORY = './backups/media-manifests';

const MANIFEST_SCHEMA_VERSION = 1;

const parseArguments = () => {
  const result = {
    root: null,
    output: null,
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

    if (argument === '--output') {
      result.output = args[index + 1] || null;

      index += 1;
      continue;
    }

    if (argument.startsWith('--output=')) {
      result.output = argument.slice('--output='.length);

      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return result;
};

const getDefaultStorageRoot = () => {
  return (
    process.env.LOCAL_MEDIA_ROOT ||
    process.env.LOCAL_VIDEO_ROOT ||
    DEFAULT_STORAGE_ROOT
  );
};

const getTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-');
};

const shouldIgnoreName = (name) => {
  if (name === '.DS_Store' || name.startsWith('._')) {
    return true;
  }

  if (
    name.endsWith('.part') ||
    name.includes('.incoming-') ||
    name.includes('.backup-')
  ) {
    return true;
  }

  return false;
};

const toStorageKey = (relativePath) => {
  const key = relativePath.split(path.sep).join('/').replace(/^\/+/, '');

  const segments = key.split('/').filter(Boolean);

  if (
    segments.length === 0 ||
    segments.some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error(`Invalid storage key: ${relativePath}`);
  }

  return segments.join('/');
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

const hashStableFile = async (filePath) => {
  const before = await lstat(filePath);

  if (before.isSymbolicLink()) {
    throw new Error(`Symbolic links are not allowed: ${filePath}`);
  }

  if (!before.isFile()) {
    throw new Error(`Path is not a regular file: ${filePath}`);
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
    throw new Error(`File changed while hashing: ${filePath}`);
  }

  return {
    size: after.size,

    sha256: hash.digest('hex'),
  };
};

const writeLine = (stream, value) => {
  const text = `${JSON.stringify(value)}\n`;

  return new Promise((resolve, reject) => {
    const handleError = (error) => {
      cleanup();
      reject(error);
    };

    const handleDrain = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      stream.removeListener('error', handleError);

      stream.removeListener('drain', handleDrain);
    };

    stream.once('error', handleError);

    const accepted = stream.write(text);

    if (accepted) {
      cleanup();
      resolve();
      return;
    }

    stream.once('drain', handleDrain);
  });
};

const finishStream = (stream) => {
  return new Promise((resolve, reject) => {
    stream.once('finish', resolve);

    stream.once('error', reject);

    stream.end();
  });
};

const walkDirectory = async ({ rootPath, currentPath, onFile, onIgnored }) => {
  const entries = await readdir(currentPath, {
    withFileTypes: true,
  });

  entries.sort((left, right) => compareNames(left.name, right.name));

  for (const entry of entries) {
    const absolutePath = path.join(currentPath, entry.name);

    const relativePath = path.relative(rootPath, absolutePath);

    if (shouldIgnoreName(entry.name)) {
      onIgnored?.(toStorageKey(relativePath));

      continue;
    }

    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed: ${absolutePath}`);
    }

    if (entry.isDirectory()) {
      await walkDirectory({
        rootPath,
        currentPath: absolutePath,
        onFile,
        onIgnored,
      });

      continue;
    }

    if (!entry.isFile()) {
      throw new Error(`Unsupported filesystem entry: ${absolutePath}`);
    }

    await onFile({
      absolutePath,

      key: toStorageKey(relativePath),
    });
  }
};

const main = async () => {
  const argumentsData = parseArguments();

  const rootPath = path.resolve(
    process.cwd(),

    argumentsData.root || getDefaultStorageRoot()
  );

  const rootStat = await lstat(rootPath);

  if (!rootStat.isDirectory()) {
    throw new Error(`Storage root is not a directory: ${rootPath}`);
  }

  const defaultOutputPath = path.resolve(
    process.cwd(),

    DEFAULT_MANIFEST_DIRECTORY,

    `media-manifest-${getTimestamp()}.jsonl`
  );

  const manifestPath = path.resolve(
    process.cwd(),

    argumentsData.output || defaultOutputPath
  );

  const manifestRelativeToRoot = path.relative(rootPath, manifestPath);

  if (
    !manifestRelativeToRoot.startsWith('..') &&
    !path.isAbsolute(manifestRelativeToRoot)
  ) {
    throw new Error('Manifest output must not be inside the storage root.');
  }

  await mkdir(path.dirname(manifestPath), {
    recursive: true,
  });

  const temporaryManifestPath = `${manifestPath}.part`;

  await rm(temporaryManifestPath, {
    force: true,
  });

  const outputStream = createWriteStream(temporaryManifestPath, {
    flags: 'wx',
    encoding: 'utf8',
  });

  const recordsHash = createHash('sha256');

  const rootCounts = {};

  let fileCount = 0;
  let totalBytes = 0;
  let ignoredCount = 0;

  const startedAt = new Date();

  try {
    await walkDirectory({
      rootPath,

      currentPath: rootPath,

      onIgnored: (key) => {
        ignoredCount += 1;

        console.warn(`[manifest] Ignored temporary file: ${key}`);
      },

      onFile: async ({ absolutePath, key }) => {
        const fileData = await hashStableFile(absolutePath);

        const record = {
          type: 'file',
          key,
          size: fileData.size,
          sha256: fileData.sha256,
        };

        const serializedRecord = JSON.stringify(record);

        recordsHash.update(`${serializedRecord}\n`);

        await writeLine(outputStream, record);

        fileCount += 1;
        totalBytes += fileData.size;

        const rootDirectory = key.includes('/') ? key.split('/')[0] : '(root)';

        rootCounts[rootDirectory] = (rootCounts[rootDirectory] || 0) + 1;

        if (fileCount % 250 === 0) {
          console.log(`[manifest] Hashed ${fileCount} files...`);
        }
      },
    });

    const summary = {
      type: 'summary',

      schemaVersion: MANIFEST_SCHEMA_VERSION,

      createdAt: startedAt.toISOString(),

      completedAt: new Date().toISOString(),

      algorithm: 'sha256',

      storageRoot: path.relative(process.cwd(), rootPath) || '.',

      fileCount,
      totalBytes,

      recordsSha256: recordsHash.digest('hex'),

      rootCounts,
      ignoredCount,
    };

    await writeLine(outputStream, summary);

    await finishStream(outputStream);

    await rename(temporaryManifestPath, manifestPath);

    console.log('');
    console.log('===== MEDIA MANIFEST CREATED =====');

    console.log(`Manifest: ${manifestPath}`);

    console.log(`Files:    ${fileCount}`);

    console.log(`Bytes:    ${totalBytes}`);

    console.log(`Ignored:  ${ignoredCount}`);

    console.log(`Records SHA-256: ${summary.recordsSha256}`);

    console.log('');
    console.log(`MANIFEST_PATH=${manifestPath}`);
  } catch (error) {
    outputStream.destroy();

    await rm(temporaryManifestPath, {
      force: true,
    }).catch(() => {});

    throw error;
  }
};

main().catch((error) => {
  console.error(
    '[media-manifest] Failed:',
    error instanceof Error ? error.stack || error.message : error
  );

  process.exitCode = 1;
});
