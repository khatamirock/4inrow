import { GameRoom, Player } from "@/types/game";
import { GameLogic } from "./gameLogic";

export class GameRoomManager {
  private rooms: Map<string, GameRoom> = new Map();

  generateRoomKey(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  createRoom(hostId: string, hostName: string): GameRoom {
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

    this.rooms.set(room.id, room);
    return room;
  }

  getRoomByKey(roomKey: string): GameRoom | null {
    for (const room of this.rooms.values()) {
      if (room.roomKey === roomKey) {
        return room;
      }
    }
    return null;
  }

  getRoom(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) || null;
  }

  joinRoomAsPlayer(
    roomId: string,
    playerId: string,
    playerName: string
  ): { success: boolean; message: string; room?: GameRoom } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    // Check if already in room
    if (
      room.players.some((p) => p.id === playerId) ||
      room.spectators.includes(playerId)
    ) {
      return { success: true, message: "Already in room", room };
    }

    // Check if game is already full
    if (room.players.length >= room.maxPlayers) {
      return {
        success: false,
        message: "Room is full, you will be a spectator",
      };
    }

    // Add as player
    const playerNumber = room.players.length + 1;
    room.players.push({
      id: playerId,
      name: playerName,
      playerNumber,
    });

    // Start game if 2+ players
    if (room.players.length >= 2 && room.status === "waiting") {
      room.status = "playing";
    }

    return { success: true, message: "Joined as player", room };
  }

  joinRoomAsSpectator(
    roomId: string,
    spectatorId: string
  ): { success: boolean; message: string; room?: GameRoom } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    if (room.spectators.includes(spectatorId)) {
      return { success: true, message: "Already spectating", room };
    }

    room.spectators.push(spectatorId);
    return { success: true, message: "Joined as spectator", room };
  }

  makeMove(
    roomId: string,
    playerId: string,
    column: number
  ): { success: boolean; message: string; room?: GameRoom } {
    const room = this.rooms.get(roomId);
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

    // Check for winner
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
        return {
          success: true,
          message: `Player ${player.playerNumber} wins!`,
          room,
        };
      }
    }

    // Check for draw
    if (GameLogic.isBoardFull(room.board)) {
      room.status = "finished";
      room.winner = 0; // 0 means draw
      return { success: true, message: "Draw!", room };
    }

    // Switch to next player
    const nextPlayer = (room.currentPlayer % room.players.length) + 1;
    room.currentPlayer = nextPlayer;

    return { success: true, message: "Move made", room };
  }

  resetGame(roomId: string): { success: boolean; room?: GameRoom } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false };
    }

    room.board = GameLogic.createBoard();
    room.currentPlayer = 1;
    room.status = "playing";
    room.winner = null;

    return { success: true, room };
  }

  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }
}

// Singleton instance for use across the app
export const gameRoomManager = new GameRoomManager();
