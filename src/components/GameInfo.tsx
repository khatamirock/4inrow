"use client";

import { GameRoom } from "@/types/game";

interface GameInfoProps {
  room: GameRoom;
  currentPlayerObj: any;
  isCurrentPlayer: boolean;
  onReset: () => void;
}

export default function GameInfo({
  room,
  currentPlayerObj,
  isCurrentPlayer,
  onReset,
}: GameInfoProps) {
  return (
    <div className="mt-6 space-y-4">
      {room.status === "finished" && (
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-white">
            {room.winner === 0
              ? "🤝 It's a Draw!"
              : `🎉 Player ${room.winner} Wins!`}
          </p>
          {room.winner !== 0 && room.players.find((p) => p.playerNumber === room.winner) && (
            <p className="text-white">
              Congratulations {room.players.find((p) => p.playerNumber === room.winner)?.name}!
            </p>
          )}
          <button
            onClick={onReset}
            className="mt-3 px-4 py-2 bg-white text-orange-600 font-bold rounded hover:bg-gray-100 transition"
          >
            Play Again
          </button>
        </div>
      )}

      {room.status === "playing" && (
        <div className="bg-blue-600 p-4 rounded-lg text-center">
          <p className="text-sm text-blue-100">Current Turn</p>
          <p className="text-xl font-bold text-white">{currentPlayerObj?.name}</p>
          {isCurrentPlayer && <p className="text-yellow-300 text-sm mt-1">👉 Your turn!</p>}
        </div>
      )}

      {room.status === "waiting" && (
        <div className="bg-purple-600 p-4 rounded-lg text-center">
          <p className="text-white font-semibold">
            Waiting for {3 - room.players.length} more player{3 - room.players.length !== 1 ? "s" : ""}...
          </p>
          <p className="text-sm text-purple-200 mt-1">Share room key: {room.roomKey}</p>
        </div>
      )}
    </div>
  );
}
