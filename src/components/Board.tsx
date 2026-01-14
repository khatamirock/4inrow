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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="board">
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <button
              key={`${rowIdx}-${colIdx}`}
              onClick={() => handleColumnClick(colIdx)}
              disabled={!isCurrentPlayer}
              className={`cell ${getPlayerColor(cell)}`}
              style={{
                opacity: !isCurrentPlayer ? 0.5 : 1,
                cursor: isCurrentPlayer ? 'pointer' : 'not-allowed'
              }}
              title={isCurrentPlayer ? `Click to place in column ${colIdx}` : "Wait for your turn"}
            >
              {cell && (
                <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.5 }}>
                  P{cell}
                </span>
              )}
            </button>
          ))
        )}
      </div>
      {!isCurrentPlayer && (
        <p style={{ textAlign: 'center', color: '#fcd34d', fontSize: '14px' }}>⏳ Waiting for your turn...</p>
      )}
    </div>
  );
});

export default Board;
