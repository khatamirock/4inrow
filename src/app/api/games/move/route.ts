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

    // Validate column range
    if (column < 0 || column > 9) {
      return NextResponse.json(
        { error: "Invalid column number" },
        { status: 400 }
      );
    }

    const result = await gameRoomManager.makeMove(roomId, playerId, column);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      room: result.room,
    });
  } catch (error) {
    console.error("Error in move API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
