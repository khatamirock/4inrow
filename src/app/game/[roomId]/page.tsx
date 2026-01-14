"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { GameRoom } from "@/types/game";
import Board from "@/components/Board";
import PlayerList from "@/components/PlayerList";
import GameInfo from "@/components/GameInfo";

const POLL_INTERVAL = 2000; // Poll every 2 seconds for updates (Vercel-optimized)

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playerId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('playerId');
      if (!id) {
        id = `player_${Math.random().toString(36).substring(7)}`;
        localStorage.setItem('playerId', id);
      }
      return id;
    }
    return `player_${Math.random().toString(36).substring(7)}`;
  });
  const [isCurrentPlayer, setIsCurrentPlayer] = useState(false);

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    try {
      const resolvedParams = await params;
      const response = await axios.get(`/api/rooms/${resolvedParams.roomId}`);
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
  }, [params, playerId]);

  // Polling effect - optimized for Vercel
  useEffect(() => {
    fetchRoom();

    // Always poll to keep the room alive in KV storage
    // Games can be reset after finishing, so we need to keep polling
    const interval = setInterval(fetchRoom, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchRoom]);

  const handleMove = async (column: number) => {
    if (!room || !isCurrentPlayer) return;

    try {
      const resolvedParams = await params;
      const response = await axios.post("/api/games/move", {
        roomId: resolvedParams.roomId,
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
      const resolvedParams = await params;
      const response = await axios.post("/api/games/reset", {
        roomId: resolvedParams.roomId,
      });

      setRoom(response.data.room);
      setError("");
    } catch (err: any) {
      setError("Failed to reset game");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>Loading...</h1>
          <p style={{ color: '#9ca3af' }}>Connecting to game room</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ minHeight: '100vh', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#ef4444', marginBottom: '16px' }}>Room Not Found</h1>
          <a href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
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
    <div style={{ minHeight: '100vh', backgroundImage: 'linear-gradient(135deg, #111827 0%, #1e3c72 50%, #000000 100%)', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', backgroundImage: 'linear-gradient(90deg, #60a5fa 0%, #22d3ee 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              4 in a Row
            </h1>
            <p style={{ color: '#9ca3af' }}>Room: {room.roomKey}</p>
          </div>
          <a
            href="/"
            style={{ padding: '8px 16px', backgroundColor: '#374151', color: 'white', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.3s ease' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
          >
            Exit
          </a>
        </div>

        {error && (
          <div style={{ background: '#7f1d1d', border: '1px solid #991b1b', color: '#fee2e2', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {/* Game Board */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ background: '#1f2937', borderRadius: '8px', padding: '24px', boxShadow: '0 20px 25px -5rgba(0, 0, 0, 0.1)' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: '#1f2937', borderRadius: '8px', padding: '24px', boxShadow: '0 20px 25px -5rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>Players</h2>
              <PlayerList room={room} playerId={playerId} />
            </div>

            <div style={{ background: '#1f2937', borderRadius: '8px', padding: '24px', boxShadow: '0 20px 25px -5rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>Game Info</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#d1d5db' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>Status</p>
                  <p style={{ fontWeight: '600', textTransform: 'capitalize', color: 'white' }}>
                    {room.status}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>Current Turn</p>
                  <p style={{ fontWeight: '600', color: 'white' }}>
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
