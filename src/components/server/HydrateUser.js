import { cookies } from 'next/headers';
import { loadUserFromServer } from '@/utils/loadUserFromServer';

export async function getSSRUser() {
  const token = cookies().get('auth_token')?.value || null;

  if (!token) return { user: null };

  const user = await loadUserFromServer(token);

  return { user };
}
