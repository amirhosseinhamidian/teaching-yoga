/* eslint-disable no-undef */

import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

import { Client } from 'basic-ftp';

import { normalizeStorageKey } from './local-storage';

const DEFAULT_FTPS_PORT = 21;
const DEFAULT_FTPS_TIMEOUT_MS = 120_000;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

const getRequiredEnvironmentValue = (name) => {
  const value = String(process.env[name] || '').trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
};

const getPositiveInteger = (value, fallback, name) => {
  const parsedValue = Number(value);

  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }

    throw new Error(`${name} must be a positive integer.`);
  }

  return parsedValue;
};

const getFtpsConfiguration = () => {
  const host = getRequiredEnvironmentValue('MEDIA_FTPS_HOST');
  const user = getRequiredEnvironmentValue('MEDIA_FTPS_USER');
  const password = getRequiredEnvironmentValue('MEDIA_FTPS_PASSWORD');

  const port = getPositiveInteger(
    process.env.MEDIA_FTPS_PORT,
    DEFAULT_FTPS_PORT,
    'MEDIA_FTPS_PORT'
  );

  const timeout = getPositiveInteger(
    process.env.MEDIA_FTPS_TIMEOUT_MS,
    DEFAULT_FTPS_TIMEOUT_MS,
    'MEDIA_FTPS_TIMEOUT_MS'
  );

  return {
    host,
    user,
    password,
    port,
    timeout,
  };
};

const normalizeRemoteStorageKey = (key) => {
  const normalizedKey = normalizeStorageKey(key);

  if (CONTROL_CHARACTER_PATTERN.test(normalizedKey)) {
    throw new Error('Storage key contains invalid control characters.');
  }

  return normalizedKey;
};

const toRemotePath = (key) => {
  return `/${normalizeRemoteStorageKey(key)}`;
};

const isMissingFtpError = (error) => {
  const code = Number(error?.code);

  return code === 450 || code === 550;
};

const createTemporaryRemotePath = (destinationPath, label) => {
  const parentDirectory = path.posix.dirname(destinationPath);
  const fileName = path.posix.basename(destinationPath);

  return path.posix.join(
    parentDirectory,
    `.${fileName}.${label}-${randomUUID()}`
  );
};

const findRemoteEntry = async (client, remotePath) => {
  const parentDirectory = path.posix.dirname(remotePath);
  const targetName = path.posix.basename(remotePath);

  try {
    const entries = await client.list(parentDirectory);

    return entries.find((entry) => entry.name === targetName) || null;
  } catch (error) {
    if (isMissingFtpError(error)) {
      return null;
    }

    throw error;
  }
};

const removeRemotePathIfExists = async (client, remotePath) => {
  const entry = await findRemoteEntry(client, remotePath);

  if (!entry) {
    return false;
  }

  if (entry.isDirectory) {
    await client.removeDir(remotePath);
  } else {
    await client.remove(remotePath, true);
  }

  return true;
};

const promoteRemotePath = async ({
  client,
  incomingPath,
  destinationPath,
  backupPath,
}) => {
  let existingDestinationWasMoved = false;
  let incomingWasPromoted = false;

  try {
    await removeRemotePathIfExists(client, backupPath);

    const existingDestination = await findRemoteEntry(
      client,
      destinationPath
    );

    if (existingDestination) {
      await client.rename(destinationPath, backupPath);

      existingDestinationWasMoved = true;
    }

    await client.rename(incomingPath, destinationPath);

    incomingWasPromoted = true;
  } catch (error) {
    if (!incomingWasPromoted && existingDestinationWasMoved) {
      const destinationStillExists = await findRemoteEntry(
        client,
        destinationPath
      ).catch(() => null);

      const backupStillExists = await findRemoteEntry(
        client,
        backupPath
      ).catch(() => null);

      if (!destinationStillExists && backupStillExists) {
        await client.rename(backupPath, destinationPath).catch(() => {});
      }
    }

    await removeRemotePathIfExists(client, incomingPath).catch(() => {});

    throw error;
  }

  if (existingDestinationWasMoved) {
    /*
     * انتشار فایل جدید موفق شده است؛ شکست در پاک‌سازی Backup
     * نباید Job موفق را دوباره Failed کند.
     */
    await removeRemotePathIfExists(client, backupPath).catch(() => {});
  }
};

const withFtpsClient = async (operation) => {
  const configuration = getFtpsConfiguration();

  const client = new Client(configuration.timeout);

  client.ftp.verbose =
    String(process.env.MEDIA_FTPS_VERBOSE || '').toLowerCase() === 'true';

  try {
    await client.access({
      host: configuration.host,
      port: configuration.port,

      user: configuration.user,
      password: configuration.password,

      /*
       * secure: true یعنی Explicit FTPS روی پورت 21.
       */
      secure: true,

      secureOptions: {
        servername: configuration.host,
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
    });

    return await operation(client);
  } finally {
    client.close();
  }
};

class FtpsMediaStorage {
  async saveFile(sourcePath, key) {
    const normalizedKey = normalizeRemoteStorageKey(key);

    const destinationPath = toRemotePath(normalizedKey);

    const incomingPath = createTemporaryRemotePath(
      destinationPath,
      'incoming'
    );

    const backupPath = createTemporaryRemotePath(
      destinationPath,
      'backup'
    );

    const localSourcePath = path.resolve(sourcePath);

    await withFtpsClient(async (client) => {
      await client.ensureDir(path.posix.dirname(destinationPath));

      await client.uploadFrom(localSourcePath, incomingPath);

      await promoteRemotePath({
        client,
        incomingPath,
        destinationPath,
        backupPath,
      });
    });

    return {
      key: normalizedKey,
      path: destinationPath,
      url: this.getPublicUrl(normalizedKey),
    };
  }

  async saveBuffer(data, key) {
    const normalizedKey = normalizeRemoteStorageKey(key);

    const destinationPath = toRemotePath(normalizedKey);

    const incomingPath = createTemporaryRemotePath(
      destinationPath,
      'incoming'
    );

    const backupPath = createTemporaryRemotePath(
      destinationPath,
      'backup'
    );

    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    await withFtpsClient(async (client) => {
      await client.ensureDir(path.posix.dirname(destinationPath));

      await client.uploadFrom(
        Readable.from([buffer]),
        incomingPath
      );

      await promoteRemotePath({
        client,
        incomingPath,
        destinationPath,
        backupPath,
      });
    });

    return {
      key: normalizedKey,
      path: destinationPath,
      url: this.getPublicUrl(normalizedKey),
    };
  }

  async saveDirectory(sourceDirectory, prefix) {
    const normalizedPrefix = normalizeRemoteStorageKey(prefix);

    const destinationPath = toRemotePath(normalizedPrefix);

    const incomingPath = createTemporaryRemotePath(
      destinationPath,
      'incoming'
    );

    const backupPath = createTemporaryRemotePath(
      destinationPath,
      'backup'
    );

    const localSourceDirectory = path.resolve(sourceDirectory);

    await withFtpsClient(async (client) => {
      await client.ensureDir(path.posix.dirname(destinationPath));

      await client.uploadFromDir(
        localSourceDirectory,
        incomingPath
      );

      await promoteRemotePath({
        client,
        incomingPath,
        destinationPath,
        backupPath,
      });
    });

    return {
      key: normalizedPrefix,
      path: destinationPath,
      url: this.getPublicUrl(normalizedPrefix),
    };
  }

  async deletePath(key) {
    const remotePath = toRemotePath(key);

    await withFtpsClient(async (client) => {
      await removeRemotePathIfExists(client, remotePath);
    });
  }

  async exists(key) {
    const remotePath = toRemotePath(key);

    return withFtpsClient(async (client) => {
      const entry = await findRemoteEntry(client, remotePath);

      return Boolean(entry);
    });
  }

  getPublicUrl(key) {
    const normalizedKey = normalizeRemoteStorageKey(key);

    const baseUrl =
      process.env.MEDIA_PUBLIC_BASE_URL ||
      process.env.VIDEO_PUBLIC_BASE_URL;

    if (!baseUrl) {
      throw new Error(
        'MEDIA_PUBLIC_BASE_URL or VIDEO_PUBLIC_BASE_URL is not configured.'
      );
    }

    const encodedKey = normalizedKey
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    return `${baseUrl.replace(/\/+$/, '')}/${encodedKey}`;
  }

  getAbsolutePath() {
    throw new Error(
      'FTPS storage does not provide a local absolute file path.'
    );
  }
}

export const ftpsMediaStorage = new FtpsMediaStorage();
