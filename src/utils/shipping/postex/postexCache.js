// src/utils/shipping/postex/postexCache.js
/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { fetchPostexBoxes } from './postexClient';

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function nowMs() {
  return Date.now();
}

function isStale(lastUpdatedAt) {
  if (!lastUpdatedAt) return true;
  return nowMs() - new Date(lastUpdatedAt).getTime() > TTL_MS;
}

/**
 * Prisma model (فعلی شما):
 * model PostexBoxCache {
 *   id        Int    @id // همون box id پستکس
 *   name      String
 *   height    Int
 *   width     Int
 *   length    Int
 *   updatedAt DateTime @updatedAt
 *   createdAt DateTime @default(now())
 * }
 *
 * خروجی استاندارد helper:
 * boxes: [{ id, boxTypeName, height, width, length }]
 */
export async function getPostexBoxesCached({ force = false } = {}) {
  // 1) read cache
  const cached = await prismadb.postexBoxCache.findMany({
    orderBy: { id: 'asc' },
  });

  const latestUpdatedAt =
    cached.length > 0
      ? cached.reduce((max, r) => {
          const t = new Date(r.updatedAt).getTime();
          return t > max ? t : max;
        }, 0)
      : 0;

  const stale = force || cached.length === 0 || isStale(latestUpdatedAt);

  // 2) if fresh -> return
  if (!stale) {
    return {
      boxes: cached.map((b) => ({
        id: Number(b.id),
        boxTypeName: String(b.name || ''),
        height: Number(b.height || 0),
        width: Number(b.width || 0),
        length: Number(b.length || 0),
      })),
      source: 'cache',
      updatedAt: cached[0]?.updatedAt || null,
    };
  }

  // 3) fetch from postex + upsert
  // انتظار: fetchPostexBoxes() => [{ id, box_type_name, height, width, length }] یا نزدیک به این
  const boxes = await fetchPostexBoxes();

  // اگر postex چیزی نداد، همان cache قبلی را برگردان
  if (!Array.isArray(boxes) || boxes.length === 0) {
    return {
      boxes: cached.map((b) => ({
        id: Number(b.id),
        boxTypeName: String(b.name || ''),
        height: Number(b.height || 0),
        width: Number(b.width || 0),
        length: Number(b.length || 0),
      })),
      source: cached.length ? 'cache-empty-postex' : 'empty',
      updatedAt: cached[0]?.updatedAt || null,
    };
  }

  await prismadb.$transaction(async (tx) => {
    for (const b of boxes) {
      const postexId = Number(b?.id);
      if (!Number.isFinite(postexId) || postexId <= 0) continue;

      // بعضی API ها box_type_name میدن، بعضی boxTypeName
      const name = (
        b.boxTypeName ??
        b.box_type_name ??
        b.box_type_name_fa ??
        b.name ??
        ''
      )
        .toString()
        .trim();

      await tx.postexBoxCache.upsert({
        where: { id: postexId },
        create: {
          id: postexId,
          name,
          height: Number(b.height || 0),
          width: Number(b.width || 0),
          length: Number(b.length || 0),
        },
        update: {
          name,
          height: Number(b.height || 0),
          width: Number(b.width || 0),
          length: Number(b.length || 0),
        },
      });
    }
  });

  // 4) return fresh cache
  const fresh = await prismadb.postexBoxCache.findMany({
    orderBy: { id: 'asc' },
  });

  return {
    boxes: fresh.map((b) => ({
      id: Number(b.id),
      boxTypeName: String(b.name || ''),
      height: Number(b.height || 0),
      width: Number(b.width || 0),
      length: Number(b.length || 0),
    })),
    source: 'postex',
    updatedAt: fresh[0]?.updatedAt || null,
  };
}
