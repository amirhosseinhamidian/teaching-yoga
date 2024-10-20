'use server';

import prismadb from '../../../libs/prismadb';

async function CheckPhoneAction(phone) {
  try {
    const user = await prismadb.user.findUnique({
      where: {
        phone,
      },
    });

    if(!user) return false
    return true;
  } catch (error) {
    console.error('Error finding user:', error);
    throw new Error('Error finding user');
  }
}

export { CheckPhoneAction };
