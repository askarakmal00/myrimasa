import { NextResponse } from 'next/server';

export async function GET() {
  const now = new Date();
  
  // Format in WIB (UTC+7)
  const wibOffset = 7 * 60 * 60 * 1000;
  const wibMs = now.getTime() + wibOffset;
  const wibDate = new Date(wibMs);

  return NextResponse.json({
    utc: now.toISOString(),
    wib: wibDate.toISOString(),
    timestamp: now.getTime(),
    timezone: 'Asia/Jakarta',
  });
}
