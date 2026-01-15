import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export const config = { matcher: '/api/boards/:roomId*' };

export async function middleware(request: Request) {
  const url = new URL(request.url);
  const roomId = url.pathname.split('/api/boards/')[1];

  if (!roomId) {
    return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
  }

  try {
    const boardData = await get(`board:${roomId}`);
    if (!boardData) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json(boardData);
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 });
  }
}
