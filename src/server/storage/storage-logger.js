import { createChildLogger } from '@/server/logger';

export const storageLogger = createChildLogger({
  component: 'storage',
  storageDriver: 'local',
});

export const getStorageOperationLogger = ({
  operation = 'unknown',
  storageKey = null,
  operationId = null,
} = {}) => {
  return storageLogger.child({
    operation,
    storageKey,
    operationId,
  });
};
