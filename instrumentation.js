/* eslint-disable no-undef */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { installProcessErrorHandlers } =
    await import('@/server/logger/process-handlers');

  installProcessErrorHandlers({
    service: process.env.LOG_SERVICE || 'teaching-yoga-web',
  });
}
