import { NextResponse } from 'next/server';
import iranCities from '@/data/iranCities.json';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const province = String(searchParams.get('province') || '').trim();

  if (!province) {
    return NextResponse.json(
      { error: 'province is required' },
      { status: 400 }
    );
  }

  const cities = iranCities[province] || [];
  return NextResponse.json({ items: cities }, { status: 200 });
}
