import { GameRoom } from "@/types/game";
import { GameLogic } from "./gameLogic";
import { kv } from "@vercel/kv";

const USE_KV = process.env.KV_REST_API_URL ? true : false;
const ROOM_EXPIRY = 86400; // 24 hours

export class GameRoomManager {
  private memoryRooms: Map<string, GameRoom> = new Map();

  generateRoomKey(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  async createRoom(hostId: string, hostName: string): Promise<GameRoom> {
    const room: GameRoom = {
      id: this.generateRoomId(),
      roomKey: this.generateRoomKey(),
      host: hostId,
      players: [
        {
          id: hostId,
          name: hostName,
          playerNumber: 1,
        },
      ],
      spectators: [],
      board: GameLogic.createBoard(),
      currentPlayer: 1,
      status: "waiting",
      winner: null,
      maxPlayers: 3,
      createdAt: new Date(),
    };

    if (USE_KV) {
      await kv.setex(`room:${room.id}`, ROOM_EXPIRY, JSON.stringify(room));
      await kv.setex(`roomkey:${room.roomKey}`, ROOM_EXPIRY, room.id);
    } else {
      this.memoryRooms.set(room.id, room);
    }

    return room;
  }

  async getRoomByKey(roomKey: string): Promise<GameRoom | null> {
    if (USE_KV) {
      const roomId = (await kv.get(`roomkey:${roomKey}`)) as string | null;
      if (!roomId) return null;
      const roomData = await kv.get(`room:${roomId}`);
      return roomData ? JSON.parse(roomData as string) : null;
    } else {
      for (const room of this.memoryRooms.values()) {
        if (room.roomKey === roomKey) {
          return room;
        }
      }
      return null;
    }
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    if (USE_KV) {
      const roomData = await kv.get(`room:${roomId}`);
      return roomData ? JSON.parse(roomData as string) : null;
    } else {
      return this.memoryRooms.get(roomId) || null;
    }
  }

  private async saveRoom(room: GameRoom): Promise<void> {
    if (USE_KV) {
      await kv.setex(`room:${room.id}`, ROOM_EXPIRY, JSON.stringify(room));
    } else {
      this.memoryRooms.set(room.id, room);
    }
  }

  async joinRoomAsPlayer(
    roomId: string,
    playerId: string,
    playerName: string
  ): Promise<{ success: boolean; message: string; room?: GameRoom }> {
    const room = await this.getRoom(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    if (
      room.players.some((p) => p.id === playerId) ||
      room.spectators.includes(playerId)
    ) {
      return { success: true, message: "Already in room", room };
    }

    if (room.players.length >= room.maxPlayers) {
      return {
        success: false,
        message: "Room is full, you will be a spectator",
      };
    }

    const playerNumber = room.players.length + 1;
    room.players.push({
      id: playerId,
      name: playerName,
      playerNumber,
    });

    if (room.players.length >= 2 && room.status === "waiting") {
      room.status = "playing";
    }

    await this.saveRoom(room);
    return { success: true, message: "Joined as player", room };
  }

  async joinRoomAsSpectator(
    roomId: string,
    spectatorId: string
  ): Promise<{ success: boolean; message: string; room?: GameRoom }> {
    const room = await this.getRoom(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    if (room.spectators.includes(spectatorId)) {
      return { success: true, message: "Already spectating", room };
    }

    room.spectators.push(spectatorId);
    await this.saveRoom(room);
    return { success: true, message: "Joined as spectator", room };
  }

  async makeMove(
    roomId: string,
    playerId: string,
    column: number
  ): Promise<{ success: boolean; message: string; room?: GameRoom }> {
    const room = await this.getRoom(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, message: "Player not in this room" };
    }

    if (player.playerNumber !== room.currentPlayer) {
      return { success: false, message: "Not your turn" };
    }

    const moveResult = GameLogic.makeMove(
      room.board,
      column,
      player.playerNumber
    );
    if (!moveResult.success) {
      return { success: false, message: "Invalid move - column full" };
    }

    if (moveResult.row !== undefined) {
      if (
        GameLogic.checkWinner(
          room.board,
          moveResult.row,
          column,
          player.playerNumber
        )
      ) {
        room.winner = player.playerNumber;
        room.status = "finished";
        await this.saveRoom(room);
        return {
          success: true,
          message: `Player ${player.playerNumber} wins!`,
          room,
        };
      }
    }

    if (GameLogic.isBoardFull(room.board)) {
      room.status = "finished";
      room.winner = 0;
      await this.saveRoom(room);
      return { success: true, message: "Draw!", room };
    }

    const nextPlayer = (room.currentPlayer % room.players.length) + 1;
    room.currentPlayer = nextPlayer;

    await this.saveRoom(room);
    return { success: true, message: "Move made", room };
  }

  async resetGame(
    roomId: string
  ): Promise<{ success: boolean; room?: GameRoom }> {
    const room = await this.getRoom(roomId);
    if (!room) {
      return { success: false };
    }

    room.board = GameLogic.createBoard();
    room.currentPlayer = 1;
    room.status = "playing";
    room.winner = null;

    await this.saveRoom(room);
    return { success: true, room };
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    if (USE_KV) {
      await kv.del(`room:${roomId}`);
      return true;
    } else {
      return this.memoryRooms.delete(roomId);
    }
  }

  async getAllRooms(): Promise<GameRoom[]> {
    if (USE_KV) {
      return [];
    } else {
      return Array.from(this.memoryRooms.values());
    }
  }
}

export const gameRoomManager = new GameRoomManager();
