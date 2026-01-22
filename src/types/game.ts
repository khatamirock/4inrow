// Game types
export interface GameRoom {
  id: string;
  roomKey: string;
  host: string;
  players: Player[];
  spectators: string[];
  board: (number | null)[][];
  currentPlayer: number;
  status: "waiting" | "playing" | "finished";
  winner: number | null;
  maxPlayers: number;
  winningLength: number;
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  playerNumber: number; // 1, 2, or 3
}

export interface GameState {
  board: (number | null)[][];
  currentPlayer: number;
  status: "waiting" | "playing" | "finished";
  winner: number | null;
  moves: Array<{ player: number; column: number; row: number }>;
}

export interface MoveRequest {
  roomId: string;
  playerId: string;
  column: number;
}

export interface MoveResponse {
  success: boolean;
  board?: (number | null)[][];
  currentPlayer?: number;
  winner?: number | null;
  status?: string;
  error?: string;
}
