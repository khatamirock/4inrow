'use client';

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { Room } from '@/types/game';

type GameState = 'home' | 'create' | 'join' | 'waiting' | 'playing';

export default function Home() {
    const [pusher, setPusher] = useState<Pusher | null>(null);
    const [gameState, setGameState] = useState<GameState>('home');
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [room, setRoom] = useState<Room | null>(null);
    const [myPlayerNumber, setMyPlayerNumber] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [gameOver, setGameOver] = useState<{ winner: number | 'draw', winnerName?: string } | null>(null);

    useEffect(() => {
        const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });
        setPusher(pusherClient);

        return () => {
            pusherClient.disconnect();
        };
    }, []);

    const triggerEvent = async (channel: string, event: string, data: any) => {
        await fetch('/api/pusher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel, event, data })
        });
    };

    const generateRoomCode = () => {
        return Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    };

    const checkWin = (board: (number | null)[][], row: number, col: number, player: number) => {
        const rows = 6;
        const cols = 7;

        // Check horizontal
        let count = 1;
        for (let c = col - 1; c >= 0 && board[row][c] === player; c--) count++;
        for (let c = col + 1; c < cols && board[row][c] === player; c++) count++;
        if (count >= 4) return true;

        // Check vertical
        count = 1;
        for (let r = row - 1; r >= 0 && board[r][col] === player; r--) count++;
        for (let r = row + 1; r < rows && board[r][col] === player; r++) count++;
        if (count >= 4) return true;

        // Check diagonal (top-left to bottom-right)
        count = 1;
        for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && board[r][c] === player; r--, c--) count++;
        for (let r = row + 1, c = col + 1; r < rows && c < cols && board[r][c] === player; r++, c++) count++;
        if (count >= 4) return true;

        // Check diagonal (top-right to bottom-left)
        count = 1;
        for (let r = row - 1, c = col + 1; r >= 0 && c < cols && board[r][c] === player; r--, c++) count++;
        for (let r = row + 1, c = col - 1; r < rows && c >= 0 && board[r][c] === player; r++, c--) count++;
        if (count >= 4) return true;

        return false;
    };

    const handleCreateRoom = () => {
        if (!playerName.trim()) {
            setError('Please enter your name');
            return;
        }

        const code = generateRoomCode();
        const newRoom: Room = {
            code,
            players: [{
                id: 'p1',
                name: playerName,
                playerNumber: 1
            }],
            board: Array(6).fill(null).map(() => Array(7).fill(null)),
            currentTurn: 1,
            gameStarted: false,
            winner: null
        };

        setRoomCode(code);
        setMyPlayerNumber(1);
        setRoom(newRoom);
        setGameState('waiting');
        setError('');

        // Subscribe to room channel
        if (pusher) {
            const channel = pusher.subscribe(`room-${code}`);

            channel.bind('player-joined', (data: { player: any, room: Room }) => {
                setRoom(data.room);
                if (data.room.gameStarted) {
                    setGameState('playing');
                }
            });

            channel.bind('game-update', (data: { room: Room }) => {
                setRoom(data.room);
            });

            channel.bind('game-over', (data: { winner: number | 'draw', winnerName?: string }) => {
                setGameOver(data);
            });

            channel.bind('player-left', () => {
                setError('A player has left the game');
            });
        }

        // Store room on server for others to join
        fetch(`/api/room/${code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRoom)
        });
    };

    const handleJoinRoom = async () => {
        if (!playerName.trim()) {
            setError('Please enter your name');
            return;
        }

        if (roomCode.length !== 3) {
            setError('Room code must be 3 digits');
            return;
        }

        if (!pusher) return;

        // Subscribe to room channel
        const channel = pusher.subscribe(`room-${roomCode}`);

        // Request current room state
        const response = await fetch(`/api/room/${roomCode}`);

        if (!response.ok) {
            setError('Room not found');
            return;
        }

        const currentRoom: Room = await response.json();

        if (currentRoom.players.length >= 3) {
            setError('Room is full');
            return;
        }

        if (currentRoom.gameStarted) {
            setError('Game already started');
            return;
        }

        const playerNumber = currentRoom.players.length + 1;
        const newPlayer = {
            id: `p${playerNumber}`,
            name: playerName,
            playerNumber
        };

        currentRoom.players.push(newPlayer);
        if (currentRoom.players.length === 3) {
            currentRoom.gameStarted = true;
        }

        setMyPlayerNumber(playerNumber);
        setRoom(currentRoom);
        setGameState(currentRoom.gameStarted ? 'playing' : 'waiting');
        setError('');

        // Broadcast player joined
        await triggerEvent(`room-${roomCode}`, 'player-joined', { player: newPlayer, room: currentRoom });

        // Listen to game events
        channel.bind('player-joined', (data: { player: any, room: Room }) => {
            setRoom(data.room);
            if (data.room.gameStarted) {
                setGameState('playing');
            }
        });

        channel.bind('game-update', (data: { room: Room }) => {
            setRoom(data.room);
        });

        channel.bind('game-over', (data: { winner: number | 'draw', winnerName?: string }) => {
            setGameOver(data);
        });

        channel.bind('player-left', () => {
            setError('A player has left the game');
        });
    };

    const handleMove = async (col: number) => {
        if (!room || !room.gameStarted || gameOver) return;
        if (myPlayerNumber !== room.currentTurn) return;

        // Find the lowest empty row in the column
        let row = -1;
        for (let r = 5; r >= 0; r--) {
            if (room.board[r][col] === null) {
                row = r;
                break;
            }
        }

        if (row === -1) return; // Column is full

        const newBoard = room.board.map(r => [...r]);
        newBoard[row][col] = myPlayerNumber;

        const updatedRoom = { ...room, board: newBoard };

        // Check for win
        if (checkWin(newBoard, row, col, myPlayerNumber!)) {
            updatedRoom.winner = myPlayerNumber!;
            const player = room.players.find(p => p.playerNumber === myPlayerNumber);
            await triggerEvent(`room-${roomCode}`, 'game-over', {
                winner: myPlayerNumber,
                winnerName: player?.name
            });
            setGameOver({ winner: myPlayerNumber!, winnerName: player?.name });
        } else {
            // Check for draw
            const isFull = newBoard[0].every(cell => cell !== null);
            if (isFull) {
                updatedRoom.winner = 'draw';
                await triggerEvent(`room-${roomCode}`, 'game-over', { winner: 'draw' });
                setGameOver({ winner: 'draw' });
            } else {
                // Next turn
                updatedRoom.currentTurn = (room.currentTurn % 3) + 1;
            }
        }

        setRoom(updatedRoom);
        await triggerEvent(`room-${roomCode}`, 'game-update', { room: updatedRoom });
    };

    const resetGame = () => {
        if (pusher && roomCode) {
            pusher.unsubscribe(`room-${roomCode}`);
        }
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
