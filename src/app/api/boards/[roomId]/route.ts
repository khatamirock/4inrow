import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

export async function GET(
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await params;
    const roomId = resolvedParams.roomId;

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID required" },
        { status: 400 }
      );
    }

    const boardData = await get(`board:${roomId}`);

    if (!boardData) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(boardData);
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json(
      { error: "Failed to fetch board data" },
      { status: 500 }
    );
  }
}
