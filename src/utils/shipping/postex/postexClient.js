// src/utils/shipping/postex/postexClient.js
/* eslint-disable no-undef */

const POSTEX_BASE = process.env.POSTEX_BASE;

function getApiKey() {
  // ✅ فقط سرور
  const key = process.env.NEXT_PUBLIC_POSTEX_API_KEY;
  if (!key) throw new Error('POSTEX_API_KEY is not set');
  return key;
}

async function safeJson(res) {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function postexFetch(path, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(`${POSTEX_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const data = await safeJson(res);

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Postex request failed: ${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/** GET /common/boxes */
export async function fetchPostexBoxes() {
  const data = await postexFetch('/common/boxes', { method: 'GET' });

  if (!Array.isArray(data)) return [];

  return data
    .map((b) => ({
      id: Number(b.id),
      boxTypeName: String(b.box_type_name || ''),
      height: Number(b.height || 0),
      width: Number(b.width || 0),
      length: Number(b.length || 0),
    }))
    .filter((b) => Number.isFinite(b.id) && b.id > 0);
}

/** GET /locality/cities/to/all?keyword=... */
export async function searchPostexCities(keyword) {
  const q = encodeURIComponent(String(keyword || '').trim());
  const data = await postexFetch(`/locality/cities/to/all?keyword=${q}`, {
    method: 'GET',
  });

  if (!Array.isArray(data)) return [];

  return data.map((c) => ({
    cityId: Number(c.city_id),
    provinceId: Number(c.province_id),
    cityName: String(c.city_name || ''),
    provinceName: String(c.province_name || ''),
    fullName: String(c.full_name || ''),
    lat: c.lat,
    lon: c.lon,
  }));
}

/** POST /shipping/quotes */
export async function fetchPostexQuotes(payload) {
  return postexFetch('/shipping/quotes', { method: 'POST', body: payload });
}
