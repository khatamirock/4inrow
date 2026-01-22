const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Game state
const rooms = new Map();

// Generate random 3-digit room code
function generateRoomCode() {
    return Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

// Check for win condition
function checkWin(board, row, col, player) {
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
}

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('createRoom', (playerName, callback) => {
            let roomCode = generateRoomCode();
            while (rooms.has(roomCode)) {
                roomCode = generateRoomCode();
            }

            const room = {
                code: roomCode,
                players: [{
                    id: socket.id,
                    name: playerName,
                    playerNumber: 1
                }],
                board: Array(6).fill(null).map(() => Array(7).fill(null)),
                currentTurn: 1,
                gameStarted: false,
                winner: null
            };

            rooms.set(roomCode, room);
            socket.join(roomCode);

            callback({ success: true, roomCode });
            io.to(roomCode).emit('roomUpdate', room);
        });

        socket.on('joinRoom', (roomCode, playerName, callback) => {
            const room = rooms.get(roomCode);

            if (!room) {
                callback({ success: false, error: 'Room not found' });
                return;
            }

            if (room.players.length >= 3) {
                callback({ success: false, error: 'Room is full' });
                return;
            }

            if (room.gameStarted) {
                callback({ success: false, error: 'Game already started' });
                return;
            }

            const playerNumber = room.players.length + 1;
            room.players.push({
                id: socket.id,
                name: playerName,
                playerNumber
            });

            socket.join(roomCode);

            if (room.players.length === 3) {
                room.gameStarted = true;
            }

            callback({ success: true, roomCode, playerNumber });
            io.to(roomCode).emit('roomUpdate', room);
        });

        socket.on('makeMove', (roomCode, col) => {
            const room = rooms.get(roomCode);
            if (!room || !room.gameStarted || room.winner) return;

            const player = room.players.find(p => p.id === socket.id);
            if (!player || player.playerNumber !== room.currentTurn) return;

            // Find the lowest empty row in the column
            let row = -1;
            for (let r = 5; r >= 0; r--) {
                if (room.board[r][col] === null) {
                    row = r;
                    break;
                }
            }

            if (row === -1) return; // Column is full

            room.board[row][col] = player.playerNumber;

            // Check for win
            if (checkWin(room.board, row, col, player.playerNumber)) {
                room.winner = player.playerNumber;
                io.to(roomCode).emit('gameOver', {
                    winner: player.playerNumber,
                    winnerName: player.name
                });
            } else {
                // Check for draw
                const isFull = room.board[0].every(cell => cell !== null);
                if (isFull) {
                    room.winner = 'draw';
                    io.to(roomCode).emit('gameOver', { winner: 'draw' });
                } else {
                    // Next turn
                    room.currentTurn = (room.currentTurn % 3) + 1;
                }
            }

            io.to(roomCode).emit('roomUpdate', room);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            // Find and update rooms where this player was
            rooms.forEach((room, roomCode) => {
                const playerIndex = room.players.findIndex(p => p.id === socket.id);
                if (playerIndex !== -1) {
                    room.players.splice(playerIndex, 1);

                    if (room.players.length === 0) {
                        rooms.delete(roomCode);
                    } else {
                        io.to(roomCode).emit('playerLeft', socket.id);
                        io.to(roomCode).emit('roomUpdate', room);
                    }
                }
            });
        });
    });

    httpServer
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
