import { NextRequest, NextResponse } from "next/server";
import { gameRoomManager } from "@/lib/gameRoomManager";

export async function POST(req: NextRequest) {
  try {
    const { roomId } = await req.json();

    if (!roomId) {
      return NextResponse.json({ error: "roomId required" }, { status: 400 });
    }

    const result = gameRoomManager.resetGame(roomId);

    if (!result.success) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      room: result.room,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reset game" },
      { status: 500 }
    );
  }
}
