import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Resume Parser API is healthy'
    },
    { status: 200 }
  );
} 