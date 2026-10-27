import { NextResponse } from 'next/server';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export function jsonNoStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: NO_STORE,
  });
}

export function emptyNoStore(status = 204): NextResponse {
  return new NextResponse(null, {
    status,
    headers: NO_STORE,
  });
}
