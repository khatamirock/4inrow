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
}

export type CellValue = number | null;
