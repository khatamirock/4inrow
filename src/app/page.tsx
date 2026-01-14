"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const [playerId] = useState(() => `player_${Math.random().toString(36).substring(7)}`);
  const [playerName, setPlayerName] = useState("");
  const [roomKey, setRoomKey] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const response = await axios.post("/api/rooms/create", {
        hostId: playerId,
        hostName: playerName,
      });

      const { room } = response.data;
      router.push(`/game/${room.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create room");
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!roomKey.trim()) {
      setError("Please enter a room key");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const response = await axios.post("/api/rooms/join", {
        roomKey: roomKey.toUpperCase(),
        playerId,
        playerName,
        asSpectator: false,
      });

      const { roomId } = response.data;
      router.push(`/game/${roomId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to join room");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
            4 in a Row
          </h1>
          <p className="text-gray-300 text-lg">Multiplayer Game</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 space-y-6 shadow-2xl">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === "Enter") handleCreateRoom();
              }}
            />
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105"
          >
            {isCreating ? "Loading..." : "Create Room"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room Key
            </label>
            <input
              type="text"
              value={roomKey}
              onChange={(e) => setRoomKey(e.target.value)}
              placeholder="Enter room key"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === "Enter") handleJoinRoom();
              }}
            />
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105"
          >
            {isCreating ? "Loading..." : "Join Room"}
          </button>
        </div>

        <div className="text-center text-gray-400 text-sm">
          <p>🎮 Play with up to 3 players</p>
          <p>👁️ Others can spectate</p>
          <p>🏆 First to 4 in a row wins!</p>
        </div>
      </div>
    </div>
  );
}
