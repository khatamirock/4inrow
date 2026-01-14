import { NextRequest, NextResponse } from "next/server";
import { gameRoomManager } from "@/lib/gameRoomManager";

export async function POST(req: NextRequest) {
  try {
    const { hostId, hostName } = await req.json();

    if (!hostId || !hostName) {
      return NextResponse.json(
        { error: "hostId and hostName required" },
        { status: 400 }
      );
    }

    const room = await gameRoomManager.createRoom(hostId, hostName);

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
