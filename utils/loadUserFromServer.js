/* eslint-disable no-undef */
export async function loadUserFromServer(token) {
  if (!token) return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/get-me`,
      {
        method: 'GET',
        headers: {
          Cookie: `auth_token=${token}`,
        },
        cache: 'no-store',
      }
    );

    const data = await res.json();

    if (!data.success) return null;
    return data.user;
  } catch (err) {
    console.error('loadUserFromServer error:', err);
    return null;
  }
}
