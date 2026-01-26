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
    const [numPlayers, setNumPlayers] = useState<number>(2);
    const [winCondition, setWinCondition] = useState<number>(4);
    const [gravity, setGravity] = useState<boolean>(true);
    const [gridCols, setGridCols] = useState<number>(7);
    const [gridRows, setGridRows] = useState<number>(6);
    const [timeLimit, setTimeLimit] = useState<number>(0);
    const [powerMovesEnabled, setPowerMovesEnabled] = useState<boolean>(false);
    const [activePowerMove, setActivePowerMove] = useState<'remove' | 'swap' | null>(null);

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
        const rows = board.length;
        const cols = board[0].length;
        const winNeeded = room?.winCondition || 4;

        // Check horizontal
        let count = 1;
        for (let c = col - 1; c >= 0 && board[row][c] === player; c--) count++;
        for (let c = col + 1; c < cols && board[row][c] === player; c++) count++;
        if (count >= winNeeded) return true;

        // Check vertical
        count = 1;
        for (let r = row - 1; r >= 0 && board[r][col] === player; r--) count++;
        for (let r = row + 1; r < rows && board[r][col] === player; r++) count++;
        if (count >= winNeeded) return true;

        // Check diagonal (top-left to bottom-right)
        count = 1;
        for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && board[r][c] === player; r--, c--) count++;
        for (let r = row + 1, c = col + 1; r < rows && c < cols && board[r][c] === player; r++, c++) count++;
        if (count >= winNeeded) return true;

        // Check diagonal (top-right to bottom-left)
        count = 1;
        for (let r = row - 1, c = col + 1; r >= 0 && c < cols && board[r][c] === player; r--, c++) count++;
        for (let r = row + 1, c = col - 1; r < rows && c >= 0 && board[r][c] === player; r++, c--) count++;
        if (count >= winNeeded) return true;

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
            board: Array(gridRows).fill(null).map(() => Array(gridCols).fill(null)),
            currentTurn: 1,
            gameStarted: false,
            winner: null,
            maxPlayers: numPlayers,
            winCondition: winCondition,
            gravity,
            gridSize: { rows: gridRows, cols: gridCols },
            timeLimit,
            powerMoves: {
                remove: powerMovesEnabled ? 1 : 0,
                swap: powerMovesEnabled ? 1 : 0
            },
            turnDeadline: timeLimit > 0 ? Date.now() + timeLimit * 1000 : undefined
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

            channel.bind('game-reset', (data: { room: Room }) => {
                setRoom(data.room);
                setGameOver(null);
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

        if (currentRoom.players.length >= (currentRoom.maxPlayers || 3)) {
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
        if (currentRoom.players.length === (currentRoom.maxPlayers || 3)) {
            currentRoom.gameStarted = true;
        }

        // Save updated room state to server
        await fetch(`/api/room/${roomCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentRoom)
        });

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

        channel.bind('game-reset', (data: { room: Room }) => {
            setRoom(data.room);
            setGameOver(null);
        });
    };

    const handlePlayAgain = async () => {
        if (!room) return;

        const updatedRoom: Room = {
            ...room,
            board: Array(6).fill(null).map(() => Array(7).fill(null)),
            winner: null,
            // Optionally rotate starting player or keep winner's turn
            // For now, let's keep it simple and reset to player 1 or alternate
            currentTurn: (room.currentTurn % (room.maxPlayers || 3)) + 1 // Rotate start turn
        };

        setRoom(updatedRoom);
        setGameOver(null);

        // Update server
        await fetch(`/api/room/${roomCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedRoom)
        });

        // Notify other players
        await triggerEvent(`room-${roomCode}`, 'game-reset', { room: updatedRoom });
    };

    const handleMove = async (col: number, explicitRow?: number) => {
        if (!room || !room.gameStarted || gameOver) return;
        if (myPlayerNumber !== room.currentTurn) return;

        let row = -1;

        if (room.gravity) {
            // Find the lowest empty row in the column
            for (let r = room.board.length - 1; r >= 0; r--) {
                if (room.board[r][col] === null) {
                    row = r;
                    break;
                }
            }
        } else {
            // Gravity Off: Use the clicked cell
            if (explicitRow !== undefined && room.board[explicitRow][col] === null) {
                row = explicitRow;
            }
        }

        if (row === -1) return; // Invalid move

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
                updatedRoom.currentTurn = (room.currentTurn % (room.maxPlayers || 3)) + 1;
            }
        }

        if (updatedRoom.timeLimit > 0 && !updatedRoom.winner) {
            updatedRoom.turnDeadline = Date.now() + updatedRoom.timeLimit * 1000;
        }

        setRoom(updatedRoom);
        await triggerEvent(`room-${roomCode}`, 'game-update', { room: updatedRoom });
    };

    const handlePowerMoveAction = async (col: number, row: number) => {
        if (!room || !room.gameStarted || gameOver || !activePowerMove) return;

        const newBoard = room.board.map(r => [...r]);
        const newPowerMoves = { ...room.powerMoves };
        let moveSuccessful = false;

        if (activePowerMove === 'remove') {
            if (newPowerMoves.remove <= 0) return;
            if (newBoard[row][col] === null) return; // Must target a piece

            // Remove piece
            newBoard[row][col] = null;

            // Apply gravity if enabled
            if (room.gravity) {
                // Shift pieces down in this column
                for (let r = row; r > 0; r--) {
                    newBoard[r][col] = newBoard[r - 1][col];
                }
                newBoard[0][col] = null; // Top becomes empty
            }

            newPowerMoves.remove--;
            moveSuccessful = true;
        } else if (activePowerMove === 'swap') {
            if (newPowerMoves.swap <= 0) return;

            const col1 = col;
            const col2 = (col + 1) % room.gridSize.cols; // Wrap around

            // Swap columns
            for (let r = 0; r < room.gridSize.rows; r++) {
                const temp = newBoard[r][col1];
                newBoard[r][col1] = newBoard[r][col2];
                newBoard[r][col2] = temp;
            }

            newPowerMoves.swap--;
            moveSuccessful = true;
        }

        if (moveSuccessful) {
            const updatedRoom = {
                ...room,
                board: newBoard,
                powerMoves: newPowerMoves,
                currentTurn: (room.currentTurn % (room.maxPlayers || 3)) + 1
            };

            if (updatedRoom.timeLimit > 0) {
                updatedRoom.turnDeadline = Date.now() + updatedRoom.timeLimit * 1000;
            }

            setRoom(updatedRoom);
            setActivePowerMove(null);
            await triggerEvent(`room-${roomCode}`, 'game-update', { room: updatedRoom });

            // Check win condition after power move? 
            // Typically power moves might cause a win (e.g. Gravity shift makes 4 connect).
            // Let's do a quick check for the current player? Or maybe the previous player?
            // Actually, if I remove a piece, I might win or opponent might win.
            // For simplicity, let's NOT check win immediately, or check for BOTH.
            // But usually you assume the move ends turn.
        }
    };

    const handlePassTurn = async () => {
        if (!room) return;
        const updatedRoom = { ...room };
        updatedRoom.currentTurn = (room.currentTurn % (room.maxPlayers || 3)) + 1;
        if (updatedRoom.timeLimit > 0) {
            updatedRoom.turnDeadline = Date.now() + updatedRoom.timeLimit * 1000;
        }
        setRoom(updatedRoom);
        await triggerEvent(`room-${roomCode}`, 'game-update', { room: updatedRoom });
    };

    useEffect(() => {
        if (!room?.gameStarted || !room.timeLimit || gameOver) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const deadline = room.turnDeadline || 0;
            if (now > deadline && myPlayerNumber === room.currentTurn) {
                handlePassTurn();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [room, gameOver, myPlayerNumber]);

    const resetGame = () => {
        if (pusher && roomCode) {
            pusher.unsubscribe(`room-${roomCode}`);
        }
        setGameState('home');
        setNumPlayers(2);
        setWinCondition(4);
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

            <div className="input-group">
                <label>Number of Players</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    {[2, 3, 4].map(num => (
                        <button
                            key={num}
                            className={`btn-select ${numPlayers === num ? 'selected' : ''}`}
                            onClick={() => setNumPlayers(num)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: numPlayers === num ? '#667eea' : '#e2e8f0',
                                color: numPlayers === num ? 'white' : '#4a5568',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer'
                            }}
                        >
                            {num} Players
                        </button>
                    ))}
                </div>
            </div>

            <div className="input-group">
                <label>Win Condition</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    {[3, 4, 5].map(num => (
                        <button
                            key={num}
                            className={`btn-select ${winCondition === num ? 'selected' : ''}`}
                            onClick={() => setWinCondition(num)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: winCondition === num ? '#667eea' : '#e2e8f0',
                                color: winCondition === num ? 'white' : '#4a5568',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer'
                            }}
                        >
                            Connect {num}
                        </button>
                    ))}
                </div>
            </div>

            <div className="input-group">
                <label>Grid Size</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button
                        className={`btn-select ${gridCols === 7 && gridRows === 6 ? 'selected' : ''}`}
                        onClick={() => { setGridCols(7); setGridRows(6); }}
                        style={{ flex: 1, padding: '0.5rem', background: gridCols === 7 ? '#667eea' : '#e2e8f0', color: gridCols === 7 ? 'white' : '#4a5568', borderRadius: '0.25rem' }}
                    >
                        Standard (7x6)
                    </button>
                    <button
                        className={`btn-select ${gridCols === 10 && gridRows === 10 ? 'selected' : ''}`}
                        onClick={() => { setGridCols(10); setGridRows(10); }}
                        style={{ flex: 1, padding: '0.5rem', background: gridCols === 10 ? '#667eea' : '#e2e8f0', color: gridCols === 10 ? 'white' : '#4a5568', borderRadius: '0.25rem' }}
                    >
                        Large (10x10)
                    </button>
                </div>
            </div>

            <div className="input-group">
                <label>Game Modifiers</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={gravity} onChange={(e) => setGravity(e.target.checked)} />
                        Gravity On
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={powerMovesEnabled} onChange={(e) => setPowerMovesEnabled(e.target.checked)} />
                        Enable Power Moves
                    </label>
                </div>
            </div>

            <div className="input-group">
                <label>Turn Timer</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    {[0, 15, 30].map(seconds => (
                        <button
                            key={seconds}
                            className={`btn-select ${timeLimit === seconds ? 'selected' : ''}`}
                            onClick={() => setTimeLimit(seconds)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: timeLimit === seconds ? '#667eea' : '#e2e8f0',
                                color: timeLimit === seconds ? 'white' : '#4a5568',
                                borderRadius: '0.25rem'
                            }}
                        >
                            {seconds === 0 ? 'Off' : `${seconds}s`}
                        </button>
                    ))}
                </div>
            </div>

            <button className="btn-primary" onClick={handleCreateRoom} style={{ marginTop: '1rem' }}>
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
                    Waiting for {(room.maxPlayers || 3) - room.players.length} more player(s)...
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
                        <div style={{ fontSize: '1.2em', marginBottom: '0.5rem' }}>
                            {isMyTurn ? "Your turn!" : `${currentPlayer?.name}'s turn`}
                        </div>
                        {room.timeLimit > 0 && room.turnDeadline && (
                            <div className="timer" style={{ color: '#e53e3e', fontWeight: 'bold' }}>
                                Time left: {Math.max(0, Math.ceil((room.turnDeadline - Date.now()) / 1000))}s
                            </div>
                        )}
                        {isMyTurn && room.powerMoves && (
                            <div className="power-moves" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                {room.powerMoves.remove > 0 && (
                                    <button
                                        className={`btn-secondary ${activePowerMove === 'remove' ? 'active' : ''}`}
                                        onClick={() => setActivePowerMove(activePowerMove === 'remove' ? null : 'remove')}
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: activePowerMove === 'remove' ? '#ed8936' : undefined }}
                                    >
                                        💣 Remove ({room.powerMoves.remove})
                                    </button>
                                )}
                                {room.powerMoves.swap > 0 && (
                                    <button
                                        className={`btn-secondary ${activePowerMove === 'swap' ? 'active' : ''}`}
                                        onClick={() => setActivePowerMove(activePowerMove === 'swap' ? null : 'swap')}
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: activePowerMove === 'swap' ? '#48bb78' : undefined }}
                                    >
                                        ↔️ Swap Col ({room.powerMoves.swap})
                                    </button>
                                )}
                            </div>
                        )}
                        {activePowerMove && (
                            <div style={{ color: '#ed8936', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                {activePowerMove === 'remove' ? 'Select a piece to remove' : 'Select a column to swap'}
                            </div>
                        )}
                    </div>
                )}

                {gameOver && (
                    <div className="game-over">
                        <h2>
                            {gameOver.winner === 'draw'
                                ? "It's a Draw!"
                                : `${gameOver.winnerName} Wins!`}
                        </h2>
                        <button className="btn-primary" onClick={handlePlayAgain} style={{ marginRight: '1rem' }}>
                            Play Again
                        </button>
                        <button className="btn-secondary" onClick={resetGame}>
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
                                                onClick={() => {
                                                    if (!gameOver && isMyTurn) {
                                                        if (activePowerMove) {
                                                            handlePowerMoveAction(col, row);
                                                        } else {
                                                            handleMove(col, row);
                                                        }
                                                    }
                                                }}
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
