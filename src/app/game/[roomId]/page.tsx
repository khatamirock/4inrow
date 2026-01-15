"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { GameRoom } from "@/types/game";
import Board from "@/components/Board";
import PlayerList from "@/components/PlayerList";
import GameInfo from "@/components/GameInfo";

const POLL_INTERVAL_FAST = 3000; // Poll every 3 seconds when it's your turn
const POLL_INTERVAL_NORMAL = 5000; // Poll every 5 seconds normally

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
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

      // Try to get board data from Edge Config first (fast)
      let boardData = null;
      try {
        const boardResponse = await axios.get(`/api/boards/${resolvedParams.roomId}`);
        boardData = boardResponse.data;
      } catch (boardErr) {
        console.log("Board data not available from Edge Config, falling back to room API");
      }

      const response = await axios.get(`/api/rooms/${resolvedParams.roomId}`);
      const newRoom = response.data.room;

      if (!newRoom) {
        setError("Room not found");
        setLoading(false);
        return;
      }

      // Merge board data from Edge Config if available (faster updates)
      if (boardData) {
        newRoom.board = boardData.board;
        newRoom.currentPlayer = boardData.currentPlayer;
        newRoom.status = boardData.status;
        newRoom.winner = boardData.winner;
        newRoom.players = boardData.players;
      }

      // Only update state if room data actually changed
      setRoom(prevRoom => {
        if (!prevRoom || JSON.stringify(prevRoom) !== JSON.stringify(newRoom)) {
          // Check if this player is the current player
          const playerInRoom = newRoom.players.find(
            (p: any) => p.id === playerId
          );
          if (playerInRoom) {
            setIsCurrentPlayer(playerInRoom.playerNumber === newRoom.currentPlayer);
          }
          setLoading(false);
          setError(""); // Clear any previous errors
          return newRoom;
        }
        return prevRoom;
      });
    } catch (err: any) {
      console.error("Error fetching room:", err);
      if (err.response?.status === 404) {
        setError("Room not found");
      } else if (err.response?.status === 500) {
        setError("Server error - please try again");
      } else {
        setError("Connection failed - check your internet");
      }
      setLoading(false);
    }
  }, [params, playerId]);

  // Real-time connection effect (try WebSocket first, fallback to polling)
  useEffect(() => {
    const initConnection = async () => {
      const resolvedParams = await params;
      const isProduction = process.env.NODE_ENV === 'production' || typeof window !== 'undefined' && window.location.hostname !== 'localhost';

      // Try WebSocket connection first (works on Vercel too)
      try {
        console.log('Attempting WebSocket connection...');
        const socketInstance = io(isProduction ? undefined : '/', {
          transports: ['websocket', 'polling'], // Allow fallback to polling
          timeout: 5000,
        });

        socketInstance.on('connect', () => {
          console.log('Connected to server via WebSocket');
          socketInstance.emit('join-room', resolvedParams.roomId);
        });

        socketInstance.on('room-joined', () => {
          console.log('Joined room successfully');
          fetchRoom(); // Initial room fetch
        });

        socketInstance.on('room-updated', (data) => {
          console.log('Room updated via WebSocket:', data);
          setRoom(data.room);

          // Update current player status
          const currentRoom = data.room;
          const playerInRoom = currentRoom.players.find(
            (p: any) => p.id === playerId
          );
          if (playerInRoom) {
            setIsCurrentPlayer(playerInRoom.playerNumber === currentRoom.currentPlayer);
          }
        });

        socketInstance.on('game-finished', (data) => {
          console.log('Game finished via WebSocket:', data);
          setRoom(data.room);
          setIsCurrentPlayer(false); // Game is over
        });

        socketInstance.on('move-error', (data) => {
          console.log('Move error via WebSocket:', data);
          setError(data.message);
        });

        socketInstance.on('reset-error', (data) => {
          console.log('Reset error via WebSocket:', data);
          setError(data.message);
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          // If WebSocket fails, fallback to polling
          if (reason === 'io server disconnect' || reason === 'io client disconnect') {
            console.log('Falling back to polling...');
            startPolling();
          }
        });

        socketInstance.on('connect_error', (error) => {
          console.log('WebSocket connection failed, falling back to polling:', error);
          startPolling();
        });

        setSocket(socketInstance);

        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('Failed to initialize WebSocket, using polling:', error);
        startPolling();
      }
    };

    const startPolling = () => {
      console.log('Using polling for real-time updates');
      fetchRoom();

      let intervalId: NodeJS.Timeout;
      let consecutiveErrors = 0;
      const MAX_CONSECUTIVE_ERRORS = 5;

      const scheduleNextPoll = () => {
        // Use faster polling when it's your turn, normal speed otherwise
        const pollInterval = isCurrentPlayer ? POLL_INTERVAL_FAST : POLL_INTERVAL_NORMAL;
        intervalId = setTimeout(async () => {
          try {
            await fetchRoom();
            consecutiveErrors = 0; // Reset error count on success
          } catch (err) {
            consecutiveErrors++;
            console.error(`Polling failed (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, err);

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              setError("Connection lost. Please refresh the page.");
              return; // Stop polling
            }
          }
          scheduleNextPoll(); // Schedule next poll
        }, pollInterval);
      };

      scheduleNextPoll(); // Start the polling cycle

      return () => {
        if (intervalId) clearTimeout(intervalId);
      };
    };

    initConnection();
  }, [params, playerId, fetchRoom, isCurrentPlayer]);

  const handleMove = async (column: number) => {
    if (!room || !isCurrentPlayer) return;

    try {
      const resolvedParams = await params;

      // Try WebSocket first if available
      if (socket && socket.connected) {
        socket.emit('make-move', {
          roomId: resolvedParams.roomId,
          playerId,
          column,
        });
      } else {
        // Fallback to HTTP request
        const response = await axios.post("/api/games/move", {
          roomId: resolvedParams.roomId,
          playerId,
          column,
        });

        if (response.data.success) {
          setRoom(response.data.room);
          setError(""); // Clear any previous errors
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to make move");
    }
  };

  const handleReset = async () => {
    try {
      const resolvedParams = await params;

      // Try WebSocket first if available
      if (socket && socket.connected) {
        socket.emit('reset-game', {
          roomId: resolvedParams.roomId,
        });
      } else {
        // Fallback to HTTP request
        const response = await axios.post("/api/games/reset", {
          roomId: resolvedParams.roomId,
        });

        if (response.data.success) {
          setRoom(response.data.room);
          setError(""); // Clear any previous errors
        }
      }
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
              3 in a Row (10x10)
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          {/* Game Board */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ background: '#1f2937', borderRadius: '8px', padding: '16px', boxShadow: '0 20px 25px -5rgba(0, 0, 0, 0.1)' }}>
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
