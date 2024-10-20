'use server';

import { generateCode } from '@/utils/generateCode';
import axios from 'axios';

const apiKey =
  '5274734E2B2F31634C4536573968316856544B614174506737627257415872752F4869485555666148396F3D';
const template = 'samanehyoga';

async function OTP(phone) {
  try {
    const token = generateCode();
    console.log('Generated token:', token);
    const { data, error, status } = await axios.get(
      `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`,
      {
        params: {
          receptor: phone,
          token: token,
          template: template,
        },
      },
    );
    if (!data) {
      console.log('No data received:', error, status);
      return {
        success: false,
        error,
        status,
      };
    }
    console.log('OTP success, returning token');
    return {
      success: true,
      token,
    };
  } catch (error) {
    console.error('Error in OTP function:', error);
    return {
      success: false,
      error,
    };
  }
}

export { OTP };
