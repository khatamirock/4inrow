export interface Player {
    id: string;
    name: string;
    playerNumber: number;
}

export interface Room {
    code: string;
    players: Player[];
    board: (number | null)[][];
    currentTurn: number;
    gameStarted: boolean;
    winner: number | 'draw' | null;
    maxPlayers: number;
    winCondition: number;
    // New Game Features
    gravity: boolean;
    gridSize: { rows: number, cols: number };
    timeLimit: number; // 0 for off, seconds otherwise
    turnDeadline?: number; // Timestamp when current turn ends
    powerMoves: {
        remove: number; // count allowed per player
        swap: number; // count allowed per player
    };
}

export type CellValue = number | null;
