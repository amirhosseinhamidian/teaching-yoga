import { NextResponse } from 'next/server';
import iranCities from '@/data/iranCities.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  const provinces = Object.keys(iranCities);
  return NextResponse.json({ items: provinces }, { status: 200 });
}
