import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  try {
    const externalRes = await fetch(url, {
      headers: {
        Range: request.headers.get('range') || '', // پشتیبانی از seek
      },
    });

    const headers = new Headers();
    externalRes.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    return new NextResponse(externalRes.body, {
      status: externalRes.status,
      headers,
    });
  } catch (err) {
    return new NextResponse('Error fetching audio', { status: 500 });
  }
}
