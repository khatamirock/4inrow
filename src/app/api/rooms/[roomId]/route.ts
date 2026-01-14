import { NextRequest, NextResponse } from "next/server";
import { gameRoomManager } from "@/lib/gameRoomManager";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await gameRoomManager.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get room" },
      { status: 500 }
    );
  }
}
