"use client";

import { memo } from "react";

interface BoardProps {
  board: (number | null)[][];
  onMove: (column: number) => void;
  isCurrentPlayer: boolean;
}

const Board = memo(function Board({ board, onMove, isCurrentPlayer }: BoardProps) {
  const handleColumnClick = (col: number) => {
    if (isCurrentPlayer) {
      onMove(col);
    }
  };

  const getPlayerColor = (playerNumber: number | null) => {
    if (playerNumber === null) return "";
    if (playerNumber === 1) return "p1";
    if (playerNumber === 2) return "p2";
    if (playerNumber === 3) return "p3";
    return "";
  };

  return (
    <div className="space-y-4">
      <div className="board">
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <button
              key={`${rowIdx}-${colIdx}`}
              onClick={() => handleColumnClick(colIdx)}
              disabled={!isCurrentPlayer}
              className={`cell ${getPlayerColor(cell)} ${
                !isCurrentPlayer ? "opacity-50" : "hover:opacity-80"
              }`}
              title={isCurrentPlayer ? `Click to place in column ${colIdx}` : "Wait for your turn"}
            >
              {cell && (
                <span className="text-xs font-bold opacity-50">
                  P{cell}
                </span>
              )}
            </button>
          ))
        )}
      </div>
      {!isCurrentPlayer && (
        <p className="text-center text-yellow-400 text-sm">⏳ Waiting for your turn...</p>
      )}
    </div>
  );
});

export default Board;
