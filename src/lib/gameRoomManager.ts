import { GameRoom } from "@/types/game";
import { GameLogic } from "./gameLogic";
import { kv } from "@vercel/kv";
import { BlobStorage } from "./blobStorage";

// Access global io instance

const USE_KV = process.env.KV_REST_API_URL ? true : false;
console.log(`GameRoomManager: KV enabled: ${USE_KV}, KV_URL: ${process.env.KV_REST_API_URL ? 'set' : 'not set'}`);

// In-memory cache for active games (shared across all requests to this server instance)
const activeRoomsCache = new Map<string, { room: GameRoom; lastSaved: number }>();
const CACHE_SAVE_INTERVAL = 30000; // Save to KV every 30 seconds if room has changes

export class GameRoomManager {
  private memoryRooms: Map<string, GameRoom> = new Map();

  private emitToRoom(roomId: string, event: string, data: any) {
    if ((globalThis as any).io) {
      (globalThis as any).io.to(roomId).emit(event, data);
    }
  }

  generateRoomKey(): string {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit number (1000-9999)
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

    console.log(`Creating room ${room.id} with key ${room.roomKey}`);

    // Always add to in-memory cache immediately
    activeRoomsCache.set(room.id, { room, lastSaved: Date.now() });

    // Also save to KV for persistence
    if (USE_KV) {
      try {
        const expiry = 2592000; // 30 days
        await kv.setex(`room:${room.id}`, expiry, JSON.stringify(room));
        await kv.setex(`roomkey:${room.roomKey}`, expiry, room.id);
        console.log(`Room ${room.id} saved to KV successfully`);
      } catch (error) {
        console.error(`Failed to save room ${room.id} to KV:`, error);
        throw error; // Re-throw so the API knows it failed
      }
    } else {
      this.memoryRooms.set(room.id, room);
      console.log(`Room ${room.id} saved to memory`);
    }

    return room;
  }

  async getRoomByKey(roomKey: string): Promise<GameRoom | null> {
    if (USE_KV) {
      try {
        const roomId = (await kv.get(`roomkey:${roomKey}`)) as string | null;
        if (!roomId) return null;
        const roomData = await kv.get(`room:${roomId}`);
        if (roomData) {
          const room = JSON.parse(roomData as string);
          // Validate room data structure
          if (room && room.id && room.players && room.board) {
            return room;
          } else {
            console.error(`Invalid room data structure for room key ${roomKey}`);
            return null;
          }
        }
        return null;
      } catch (error) {
        console.error(`Error retrieving room by key ${roomKey} from KV:`, error);
        return null;
      }
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
    console.log(`Getting room ${roomId}, USE_KV: ${USE_KV}`);

    // Check in-memory cache first (fast, no KV calls)
    const cached = activeRoomsCache.get(roomId);
    if (cached) {
      console.log(`Found room ${roomId} in cache`);
      return cached.room;
    }

    console.log(`Room ${roomId} not in cache, checking KV`);

    // If not in cache, try KV for recovery
    if (USE_KV) {
      try {
        const roomData = await kv.get(`room:${roomId}`);
        console.log(`KV get result for room:${roomId}:`, roomData ? 'found' : 'not found');

        if (roomData) {
          const room = JSON.parse(roomData as string);
          console.log(`Parsed room data:`, room);

          // Validate room data structure
          if (room && room.id && room.players && room.board) {
            // Put it back in memory cache
            activeRoomsCache.set(roomId, { room, lastSaved: Date.now() });
            console.log(`Room ${roomId} loaded from KV and cached`);
            return room;
          } else {
            console.error(`Invalid room data structure for room ${roomId}:`, room);
            return null;
          }
        } else {
          console.log(`Room ${roomId} not found in KV`);
        }
      } catch (error) {
        console.error(`Error retrieving room ${roomId} from KV:`, error);
        return null;
      }
    } else {
      console.log('KV not enabled, checking memory rooms');
    }

    console.log(`Room ${roomId} not found anywhere`);
    return null;
  }

  private async saveRoom(room: GameRoom): Promise<void> {
    // Always save to in-memory cache (instant, shared across users)
    activeRoomsCache.set(room.id, { room, lastSaved: Date.now() });

    // Save to KV more frequently for active games
    if (USE_KV) {
      const cached = activeRoomsCache.get(room.id)!;
      const timeSinceLastSave = Date.now() - cached.lastSaved;

      // Save immediately for active games (playing status) or every 30 seconds
      const shouldSave = room.status === 'playing' || timeSinceLastSave > CACHE_SAVE_INTERVAL;

      if (shouldSave) {
        try {
          const expiry = 2592000; // 30 days
          await kv.setex(`room:${room.id}`, expiry, JSON.stringify(room));
          await kv.setex(`roomkey:${room.roomKey}`, expiry, room.id);
          cached.lastSaved = Date.now();
        } catch (error) {
          console.error(`Failed to save room ${room.id} to KV:`, error);
          // Continue without throwing - room stays in memory cache
        }
      }
    }
  }

  private async logGameEvent(roomId: string, event: string, data: any): Promise<void> {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        roomId,
        event,
        data
      };

      // Store game log in Blob storage
      await BlobStorage.storeGameLog(roomId, logData);
      console.log(`Game event logged: ${event} for room ${roomId}`);
    } catch (error) {
      console.error(`Failed to log game event ${event} for room ${roomId}:`, error);
      // Don't throw - logging failure shouldn't break the game
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

    // Emit room update to all players in the room
    this.emitToRoom(roomId, 'room-updated', { room });

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

        // Log game completion
        await this.logGameEvent(roomId, 'game_won', {
          winner: player.playerNumber,
          winnerName: player.name,
          finalBoard: room.board,
          players: room.players,
          moveCount: GameLogic.getMoveCount(room.board)
        });

        // Emit game finished event
        this.emitToRoom(roomId, 'game-finished', {
          winner: player.playerNumber,
          room
        });

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

      // Log game completion (draw)
      await this.logGameEvent(roomId, 'game_draw', {
        winner: 0,
        finalBoard: room.board,
        players: room.players,
        moveCount: GameLogic.getMoveCount(room.board)
      });

      // Emit game finished event (draw)
      this.emitToRoom(roomId, 'game-finished', {
        winner: 0,
        room
      });

      return { success: true, message: "Draw!", room };
    }

    const nextPlayer = (room.currentPlayer % room.players.length) + 1;
    room.currentPlayer = nextPlayer;

    await this.saveRoom(room);

    // Emit room update to all players in the room
    this.emitToRoom(roomId, 'room-updated', { room });

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

    // Emit room update to all players in the room
    this.emitToRoom(roomId, 'room-updated', { room });

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

  // Clean up inactive rooms (call this periodically)
  async cleanupInactiveRooms(): Promise<void> {
    const now = Date.now();
    const INACTIVE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

    if (USE_KV) {
      // In KV mode, we can't easily list all rooms, so we rely on expiry
      // Clean up in-memory cache for rooms that haven't been accessed recently
      for (const [roomId, cached] of activeRoomsCache.entries()) {
        if (now - cached.lastSaved > INACTIVE_THRESHOLD) {
          activeRoomsCache.delete(roomId);
        }
      }
    } else {
      // In memory mode, clean up old rooms
      for (const [roomId, room] of this.memoryRooms.entries()) {
        const roomAge = now - new Date(room.createdAt).getTime();
        if (roomAge > INACTIVE_THRESHOLD) {
          this.memoryRooms.delete(roomId);
          activeRoomsCache.delete(roomId);
        }
      }
    }
  }
}

export const gameRoomManager = new GameRoomManager();
