const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? "http://localhost:3000" : false,
      methods: ["GET", "POST"]
    }
  });

  // Store active socket connections by room
  const roomSockets = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);

      // Add socket to room tracking
      if (!roomSockets.has(roomId)) {
        roomSockets.set(roomId, new Set());
      }
      roomSockets.get(roomId).add(socket.id);

      // Send current room state to the new user
      socket.emit('room-joined', { roomId });
    });

    // Handle player moves
    socket.on('make-move', async (data) => {
      const { roomId, playerId, column } = data;
      console.log(`Move attempt in room ${roomId} by player ${playerId}: column ${column}`);

      // Broadcast the move to all clients in the room
      io.to(roomId).emit('move-made', {
        playerId,
        column,
        timestamp: Date.now()
      });
    });

    // Handle game reset
    socket.on('reset-game', (data) => {
      const { roomId } = data;
      console.log(`Game reset in room ${roomId}`);

      // Broadcast reset to all clients in the room
      io.to(roomId).emit('game-reset', {
        timestamp: Date.now()
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);

      // Remove socket from room tracking
      for (const [roomId, sockets] of roomSockets.entries()) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          roomSockets.delete(roomId);
        }
      }
    });
  });

  // Store io instance globally for use in API routes
  global.io = io;

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
