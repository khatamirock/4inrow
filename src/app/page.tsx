'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room } from '@/types/game';

type GameState = 'home' | 'create' | 'join' | 'waiting' | 'playing';

export default function Home() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameState, setGameState] = useState<GameState>('home');
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [room, setRoom] = useState<Room | null>(null);
    const [myPlayerNumber, setMyPlayerNumber] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [gameOver, setGameOver] = useState<{ winner: number | 'draw', winnerName?: string } | null>(null);

    useEffect(() => {
        // Initialize socket connection
        const socketInitializer = async () => {
            // Call the API route to initialize Socket.io
            await fetch('/api/socket');

            const newSocket = io({
                path: '/api/socket',
            });

            newSocket.on('connect', () => {
                console.log('Connected to server');
            });

            newSocket.on('connect_error', (error) => {
                console.error('Connection error:', error);
            });

            setSocket(newSocket);

            newSocket.on('roomUpdate', (updatedRoom: Room) => {
                setRoom(updatedRoom);
                if (updatedRoom.gameStarted && gameState === 'waiting') {
                    setGameState('playing');
                }
            });

            newSocket.on('gameOver', (data: { winner: number | 'draw', winnerName?: string }) => {
                setGameOver(data);
            });

            newSocket.on('playerLeft', () => {
                setError('A player has left the game');
            });
        };

        socketInitializer();

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, []);

    const handleCreateRoom = () => {
        if (!playerName.trim()) {
            setError('Please enter your name');
            return;
        }

        if (socket) {
            socket.emit('createRoom', playerName, (response: { success: boolean, roomCode?: string }) => {
                if (response.success && response.roomCode) {
                    setRoomCode(response.roomCode);
                    setMyPlayerNumber(1);
                    setGameState('waiting');
                    setError('');
                }
            });
        }
    };

    const handleJoinRoom = () => {
        if (!playerName.trim()) {
            setError('Please enter your name');
            return;
        }

        if (roomCode.length !== 3) {
            setError('Room code must be 3 digits');
            return;
        }

        if (socket) {
            socket.emit('joinRoom', roomCode, playerName, (response: { success: boolean, error?: string, playerNumber?: number }) => {
                if (response.success && response.playerNumber) {
                    setMyPlayerNumber(response.playerNumber);
                    setGameState('waiting');
                    setError('');
                } else {
                    setError(response.error || 'Failed to join room');
                }
            });
        }
    };

    const handleMove = (col: number) => {
        if (!socket || !room || !room.gameStarted || gameOver) return;
        if (myPlayerNumber !== room.currentTurn) return;

        socket.emit('makeMove', roomCode, col);
    };

    const resetGame = () => {
        setGameState('home');
        setPlayerName('');
        setRoomCode('');
        setRoom(null);
        setMyPlayerNumber(null);
        setError('');
        setGameOver(null);
    };

    const renderHome = () => (
        <div className="home-screen">
            <h1>🎮 4 in a Row</h1>
            <p>Play with friends online!</p>

            <div className="input-group">
                <label>Your Name</label>
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={20}
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-group">
                <button className="btn-primary" onClick={() => setGameState('create')}>
                    Create Room
                </button>
                <button className="btn-secondary" onClick={() => setGameState('join')}>
                    Join Room
                </button>
            </div>
        </div>
    );

    const renderCreate = () => (
        <div className="home-screen">
            <h1>Create Room</h1>

            <div className="input-group">
                <label>Your Name</label>
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={20}
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button className="btn-primary" onClick={handleCreateRoom}>
                Create Room
            </button>
            <button className="btn-back" onClick={() => setGameState('home')}>
                Back
            </button>
        </div>
    );

    const renderJoin = () => (
        <div className="home-screen">
            <h1>Join Room</h1>

            <div className="input-group">
                <label>Your Name</label>
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={20}
                />
            </div>

            <div className="input-group">
                <label>Room Code</label>
                <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setRoomCode(value);
                    }}
                    placeholder="000"
                    maxLength={3}
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button className="btn-primary" onClick={handleJoinRoom}>
                Join Room
            </button>
            <button className="btn-back" onClick={() => setGameState('home')}>
                Back
            </button>
        </div>
    );

    const renderWaiting = () => (
        <div>
            <h1 style={{ textAlign: 'center', color: '#667eea', marginBottom: '1rem' }}>
                4 in a Row
            </h1>

            <div className="room-code-display">
                <h2>Room Code</h2>
                <div className="code">{roomCode}</div>
            </div>

            {room && (
                <div className="players-list">
                    <h3>Players ({room.players.length}/3)</h3>
                    {room.players.map((player) => (
                        <div key={player.id} className="player-item">
                            <div className={`player-color p${player.playerNumber}`}></div>
                            <div>
                                <strong>{player.name}</strong>
                                {player.playerNumber === myPlayerNumber && ' (You)'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {room && room.players.length < 3 && (
                <div className="waiting-message">
                    Waiting for {3 - room.players.length} more player(s)...
                </div>
            )}

            <button className="btn-back" onClick={resetGame}>
                Leave Room
            </button>
        </div>
    );

    const renderPlaying = () => {
        if (!room) return null;

        const currentPlayer = room.players.find(p => p.playerNumber === room.currentTurn);
        const isMyTurn = myPlayerNumber === room.currentTurn;

        return (
            <div>
                <h1 style={{ textAlign: 'center', color: '#667eea', marginBottom: '1rem' }}>
                    4 in a Row
                </h1>

                <div className="room-code-display">
                    <h2>Room Code</h2>
                    <div className="code">{roomCode}</div>
                </div>

                <div className="players-list">
                    <h3>Players</h3>
                    {room.players.map((player) => (
                        <div
                            key={player.id}
                            className={`player-item ${player.playerNumber === room.currentTurn ? 'active' : ''}`}
                        >
                            <div className={`player-color p${player.playerNumber}`}></div>
                            <div>
                                <strong>{player.name}</strong>
                                {player.playerNumber === myPlayerNumber && ' (You)'}
                            </div>
                        </div>
                    ))}
                </div>

                {!gameOver && (
                    <div className="game-status">
                        {isMyTurn ? "Your turn!" : `${currentPlayer?.name}'s turn`}
                    </div>
                )}

                {gameOver && (
                    <div className="game-over">
                        <h2>
                            {gameOver.winner === 'draw'
                                ? "It's a Draw!"
                                : `${gameOver.winnerName} Wins!`}
                        </h2>
                        <button className="btn-primary" onClick={resetGame}>
                            Back to Home
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <div className="game-board">
                        <div className="board-grid">
                            {Array.from({ length: 7 }).map((_, col) => (
                                <div key={col} className="board-column">
                                    {Array.from({ length: 6 }).map((_, row) => {
                                        const cellValue = room.board[row][col];
                                        return (
                                            <div
                                                key={`${row}-${col}`}
                                                className={`board-cell ${cellValue !== null ? 'filled' : ''}`}
                                                onClick={() => !gameOver && isMyTurn && handleMove(col)}
                                            >
                                                {cellValue !== null && (
                                                    <div className={`piece p${cellValue}`}></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {!gameOver && (
                    <button className="btn-back" onClick={resetGame}>
                        Leave Game
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="container">
            <div className="game-container">
                {gameState === 'home' && renderHome()}
                {gameState === 'create' && renderCreate()}
                {gameState === 'join' && renderJoin()}
                {gameState === 'waiting' && renderWaiting()}
                {gameState === 'playing' && renderPlaying()}
            </div>
        </div>
    );
}
