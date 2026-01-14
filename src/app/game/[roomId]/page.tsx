"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { GameRoom } from "@/types/game";
import Board from "@/components/Board";
import PlayerList from "@/components/PlayerList";
import GameInfo from "@/components/GameInfo";

const POLL_INTERVAL = 500; // Poll every 500ms for updates

export default function GamePage({ params }: { params: { roomId: string } }) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playerId] = useState(() => `player_${Math.random().toString(36).substring(7)}`);
  const [isCurrentPlayer, setIsCurrentPlayer] = useState(false);

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    try {
      const response = await axios.get(`/api/rooms/${params.roomId}`);
      setRoom(response.data.room);
      setLoading(false);

      // Check if this player is the current player
      const currentRoom = response.data.room;
      const playerInRoom = currentRoom.players.find(
        (p: any) => p.id === playerId
      );
      if (playerInRoom) {
        setIsCurrentPlayer(playerInRoom.playerNumber === currentRoom.currentPlayer);
      }
    } catch (err: any) {
      setError("Failed to load room");
      setLoading(false);
    }
  }, [params.roomId, playerId]);

  // Polling effect
  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchRoom]);

  const handleMove = async (column: number) => {
    if (!room || !isCurrentPlayer) return;

    try {
      const response = await axios.post("/api/games/move", {
        roomId: params.roomId,
        playerId,
        column,
      });

      setRoom(response.data.room);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to make move");
    }
  };

  const handleReset = async () => {
    try {
      const response = await axios.post("/api/games/reset", {
        roomId: params.roomId,
      });

      setRoom(response.data.room);
      setError("");
    } catch (err: any) {
      setError("Failed to reset game");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Loading...</h1>
          <p className="text-gray-400">Connecting to game room</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Room Not Found</h1>
          <a href="/" className="text-blue-400 hover:text-blue-300">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  const currentPlayerObj = room.players.find(
    (p) => p.playerNumber === room.currentPlayer
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              4 in a Row
            </h1>
            <p className="text-gray-400">Room: {room.roomKey}</p>
          </div>
          <a
            href="/"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Exit
          </a>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
              <Board
                board={room.board}
                onMove={handleMove}
                isCurrentPlayer={isCurrentPlayer}
              />

              {/* Game Status */}
              <GameInfo
                room={room}
                currentPlayerObj={currentPlayerObj}
                isCurrentPlayer={isCurrentPlayer}
                onReset={handleReset}
              />
            </div>
          </div>

          {/* Players & Info */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Players</h2>
              <PlayerList room={room} playerId={playerId} />
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Game Info</h2>
              <div className="space-y-3 text-gray-300">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="font-semibold capitalize text-white">
                    {room.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Current Turn</p>
                  <p className="font-semibold text-white">
                    {currentPlayerObj?.name} (Player {room.currentPlayer})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
