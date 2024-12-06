import { NextResponse } from 'next/server';

let progress = 0;
export function setProgress(newProgress) {
  progress = Math.ceil(newProgress);
}

export async function GET() {
  return NextResponse.json({ progress });
}
