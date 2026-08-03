'use server';

import prismadb from '@/libs/prismadb';

import { normalizeIranianPhone, OtpAuthError } from '@/server/auth/otp';

import { createChildLogger, logError } from '@/server/logger';

const log = createChildLogger({
  component: 'check-phone-action',
});

async function CheckPhoneAction(rawPhone) {
  try {
    const phone = normalizeIranianPhone(rawPhone);

    const user = await prismadb.user.findUnique({
      where: {
        phone,
      },

      select: {
        id: true,
      },
    });

    return Boolean(user);
  } catch (error) {
    /*
     * ورودی نامعتبر به معنی پیدا نشدن کاربر
     * در Flow رابط کاربری است.
     */
    if (error instanceof OtpAuthError) {
      return false;
    }

    logError({
      log,
      error,

      message: 'Phone existence check failed',

      data: {
        event: 'phone_existence_check_failed',
      },
    });

    throw new Error('Error finding user');
  }
}

export { CheckPhoneAction };
