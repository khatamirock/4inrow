import { NextRequest, NextResponse } from "next/server";
import { gameRoomManager } from "@/lib/gameRoomManager";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    console.log(`API: Getting room ${roomId}`);

    const room = await gameRoomManager.getRoom(roomId);
    if (!room) {
      console.log(`API: Room ${roomId} not found`);
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    console.log(`API: Room ${roomId} found successfully`);
    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error(`API: Error getting room:`, error);
    return NextResponse.json(
      { error: "Failed to get room" },
      { status: 500 }
    );
  }
}
