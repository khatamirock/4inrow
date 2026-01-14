import { NextRequest, NextResponse } from "next/server";
import { gameRoomManager } from "@/lib/gameRoomManager";

export async function POST(req: NextRequest) {
  try {
    const { roomId, playerId, column } = await req.json();

    if (!roomId || !playerId || column === undefined) {
      return NextResponse.json(
        { error: "roomId, playerId, and column required" },
        { status: 400 }
      );
    }

    const result = gameRoomManager.makeMove(roomId, playerId, column);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      room: result.room,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to make move" },
      { status: 500 }
    );
  }
}
