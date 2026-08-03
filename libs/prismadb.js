/* eslint-disable no-undef */

import { PrismaClient } from '@prisma/client';

import { logger } from '@/server/logger';

const PRISMA_KEY = Symbol.for('teaching-yoga.prisma-client');

const databaseLogger = logger.child({
  component: 'database',
  database: 'postgresql',
});

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'warn',
      },
      {
        emit: 'event',
        level: 'error',
      },
    ],
  });

  client.$on('warn', (event) => {
    databaseLogger.warn(
      {
        event: 'prisma_warning',

        target: event.target,

        prismaMessage: event.message,

        timestamp: event.timestamp,
      },

      'Prisma warning'
    );
  });

  client.$on('error', (event) => {
    databaseLogger.error(
      {
        event: 'prisma_error',

        target: event.target,

        prismaMessage: event.message,

        timestamp: event.timestamp,
      },

      'Prisma error'
    );
  });

  return client;
};

if (!globalThis[PRISMA_KEY]) {
  globalThis[PRISMA_KEY] = createPrismaClient();
}

const prismadb = globalThis[PRISMA_KEY];

export default prismadb;
