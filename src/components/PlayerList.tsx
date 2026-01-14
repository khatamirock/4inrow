"use client";

import { GameRoom } from "@/types/game";

interface PlayerListProps {
  room: GameRoom;
  playerId: string;
}

export default function PlayerList({ room, playerId }: PlayerListProps) {
  const isHost = room.host === playerId;
  const isPlayer = room.players.some((p) => p.id === playerId);

  return (
    <div className="space-y-3">
      {/* Players */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Active Players</h3>
        <div className="space-y-2">
          {room.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                player.playerNumber === room.currentPlayer
                  ? "bg-gradient-to-r from-yellow-600 to-orange-600"
                  : player.playerNumber === 1
                  ? "bg-red-900"
                  : player.playerNumber === 2
                  ? "bg-yellow-900"
                  : "bg-green-900"
              }`}
            >
              <div>
                <p className="font-semibold text-white">{player.name}</p>
                <p className="text-xs text-gray-200">
                  Player {player.playerNumber}
                  {isHost && player.id === room.host && " 👑"}
                  {player.id === playerId && " (You)"}
                </p>
              </div>
              <div className="w-6 h-6 rounded-full border-2 border-white"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Spectators */}
      {room.spectators.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Spectators ({room.spectators.length})
          </h3>
          <div className="bg-gray-700 p-2 rounded-lg text-xs text-gray-300">
            {room.spectators.length} watching
          </div>
        </div>
      )}

      {/* Room Key */}
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="text-xs text-gray-400 mb-1">Room Key</p>
        <div className="flex items-center justify-between">
          <p className="font-mono text-lg font-bold text-cyan-400">{room.roomKey}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(room.roomKey);
            }}
            className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
