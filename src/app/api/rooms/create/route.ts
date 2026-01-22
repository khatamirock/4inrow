import { NextRequest, NextResponse } from "next/server";
import { gameRoomManager } from "@/lib/gameRoomManager";

export async function POST(req: NextRequest) {
  try {
    const { hostId, hostName, winningLength = 4 } = await req.json();
    console.log(`API: Creating room for host ${hostId} (${hostName}) with winning length ${winningLength}`);

    if (!hostId || !hostName) {
      return NextResponse.json(
        { error: "hostId and hostName required" },
        { status: 400 }
      );
    }

    const room = await gameRoomManager.createRoom(hostId, hostName, winningLength);
    console.log(`API: Room created successfully: ${room.id} with key ${room.roomKey}`);

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error(`API: Error creating room:`, error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
