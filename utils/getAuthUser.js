/* eslint-disable no-undef */
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export function getAuthUser() {
  try {
    const token = cookies().get('auth_token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded; // { id, email, phone }
  } catch (err) {
    return null;
  }
}
