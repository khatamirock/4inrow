// Game logic for 4 in a row
export const BOARD_ROWS = 6;
export const BOARD_COLS = 7;
export const WIN_LENGTH = 4;

export class GameLogic {
  static createBoard(): (number | null)[][] {
    return Array(BOARD_ROWS)
      .fill(null)
      .map(() => Array(BOARD_COLS).fill(null));
  }

  static makeMove(
    board: (number | null)[][],
    column: number,
    playerNumber: number
  ): { success: boolean; row?: number; board?: (number | null)[][] } {
    if (column < 0 || column >= BOARD_COLS) {
      return { success: false };
    }

    // Find the lowest empty row in the column
    for (let row = BOARD_ROWS - 1; row >= 0; row--) {
      if (board[row][column] === null) {
        board[row][column] = playerNumber;
        return { success: true, row, board };
      }
    }

    return { success: false };
  }

  static checkWinner(
    board: (number | null)[][],
    row: number,
    col: number,
    playerNumber: number
  ): boolean {
    // Check horizontal
    if (this.checkDirection(board, row, col, playerNumber, 0, 1)) {
      return true;
    }

    // Check vertical
    if (this.checkDirection(board, row, col, playerNumber, 1, 0)) {
      return true;
    }

    // Check diagonal (top-left to bottom-right)
    if (this.checkDirection(board, row, col, playerNumber, 1, 1)) {
      return true;
    }

    // Check diagonal (top-right to bottom-left)
    if (this.checkDirection(board, row, col, playerNumber, 1, -1)) {
      return true;
    }

    return false;
  }

  private static checkDirection(
    board: (number | null)[][],
    row: number,
    col: number,
    playerNumber: number,
    rowDir: number,
    colDir: number
  ): boolean {
    let count = 1;

    // Check in positive direction
    let r = row + rowDir;
    let c = col + colDir;
    while (
      r >= 0 &&
      r < BOARD_ROWS &&
      c >= 0 &&
      c < BOARD_COLS &&
      board[r][c] === playerNumber
    ) {
      count++;
      r += rowDir;
      c += colDir;
    }

    // Check in negative direction
    r = row - rowDir;
    c = col - colDir;
    while (
      r >= 0 &&
      r < BOARD_ROWS &&
      c >= 0 &&
      c < BOARD_COLS &&
      board[r][c] === playerNumber
    ) {
      count++;
      r -= rowDir;
      c -= colDir;
    }

    return count >= WIN_LENGTH;
  }

  static isBoardFull(board: (number | null)[][]): boolean {
    return board[0].every((cell) => cell !== null);
  }
}
