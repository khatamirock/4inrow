"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
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
  const [playerName, setPlayerName] = useState("");
  const [roomKey, setRoomKey] = useState("");
  const [winningLength, setWinningLength] = useState(4);
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
        winningLength,
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
    <div style={{ minHeight: '100vh', backgroundImage: 'linear-gradient(135deg, #111827 0%, #1e3c72 50%, #000000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: '448px', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', backgroundImage: 'linear-gradient(90deg, #60a5fa 0%, #22d3ee 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', marginBottom: '8px' }}>
            3 in a Row
          </h1>
          <p style={{ color: '#d1d5db', fontSize: '18px' }}>Multiplayer Game</p>
        </div>

        <div style={{ background: '#1f2937', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          {error && (
            <div style={{ background: '#7f1d1d', border: '1px solid #991b1b', color: '#fee2e2', padding: '16px', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              onKeyPress={(e) => {
                if (e.key === "Enter") handleCreateRoom();
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
              Win Condition
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setWinningLength(3)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: winningLength === 3 ? '2px solid #60a5fa' : '2px solid #374151',
                  background: winningLength === 3 ? '#1e3a5f' : '#111827',
                  color: winningLength === 3 ? '#60a5fa' : '#9ca3af',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Connect 3
              </button>
              <button
                onClick={() => setWinningLength(4)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: winningLength === 4 ? '2px solid #60a5fa' : '2px solid #374151',
                  background: winningLength === 4 ? '#1e3a5f' : '#111827',
                  color: winningLength === 4 ? '#60a5fa' : '#9ca3af',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Connect 4
              </button>
            </div>
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            style={{
              width: '100%',
              backgroundImage: 'linear-gradient(90deg, #2563eb 0%, #0891b2 100%)',
              color: 'white',
              fontWeight: 'bold',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: isCreating ? 0.5 : 1,
              transform: 'scale(1)'
            }}
            onMouseEnter={(e) => !isCreating && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isCreating ? "Loading..." : "Create Room"}
          </button>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid #4b5563' }}></div>
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '14px' }}>
              <span style={{ padding: '0 8px', background: '#1f2937', color: '#9ca3af' }}>Or</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
              Room Key
            </label>
            <input
              type="text"
              value={roomKey}
              onChange={(e) => setRoomKey(e.target.value)}
              placeholder="Enter room key"
              onKeyPress={(e) => {
                if (e.key === "Enter") handleJoinRoom();
              }}
            />
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={isCreating}
            style={{
              width: '100%',
              backgroundImage: 'linear-gradient(90deg, #9333ea 0%, #db2777 100%)',
              color: 'white',
              fontWeight: 'bold',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: isCreating ? 0.5 : 1,
              transform: 'scale(1)'
            }}
            onMouseEnter={(e) => !isCreating && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isCreating ? "Loading..." : "Join Room"}
          </button>
        </div>

        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
          <p>🎮 Play with up to 3 players</p>
          <p>👁️ Others can spectate</p>
          <p>🏆 First to connect 3 or 4 wins!</p>
        </div>
      </div>
    </div>
  );
}
