import { NextRequest, NextResponse } from "next/server";
import { gameRoomManager } from "@/lib/gameRoomManager";

export async function POST(req: NextRequest) {
  try {
    const { roomKey, playerId, playerName, asSpectator } = await req.json();

    if (!roomKey) {
      return NextResponse.json({ error: "roomKey required" }, { status: 400 });
    }

    const room = await gameRoomManager.getRoomByKey(roomKey);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    let result;
    if (asSpectator) {
      result = await gameRoomManager.joinRoomAsSpectator(room.id, playerId);
    } else {
      result = await gameRoomManager.joinRoomAsPlayer(room.id, playerId, playerName);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      roomId: room.id,
      room: result.room,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}
