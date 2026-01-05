// src/app/api/admin/postex/boxes/route.js
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/getAuthUser';
import { getPostexBoxesCached } from '@/utils/shipping/postex/postexCache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boxes, source, updatedAt } = await getPostexBoxesCached();

    return NextResponse.json(
      {
        success: true,
        data: boxes,
        meta: {
          source, // cache | postex | cache-empty-postex
          updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_POSTEX_BOXES_GET]', error);
    return NextResponse.json(
      { success: false, error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}
