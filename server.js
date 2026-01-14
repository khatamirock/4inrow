const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const http = require('http');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Helper function to make internal API calls
function makeInternalApiCall(path, method = 'POST', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

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

      try {
        // Make internal API call to process the move
        const result = await makeInternalApiCall('/api/games/move', 'POST', {
          roomId,
          playerId,
          column,
        });

        if (result.success) {
          console.log(`Move successful: ${result.message}`);
          // The API route already handles emitting room-updated events, so we don't need to do anything else
        } else {
          console.log(`Move failed: ${result.error || result.message}`);
          // Emit error to the specific player who tried to make the invalid move
          socket.emit('move-error', {
            message: result.error || result.message || 'Move failed',
            column,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error processing move:', error);
        socket.emit('move-error', {
          message: 'Internal server error',
          column,
          timestamp: Date.now()
        });
      }
    });

    // Handle game reset
    socket.on('reset-game', async (data) => {
      const { roomId } = data;
      console.log(`Game reset in room ${roomId}`);

      try {
        // Make internal API call to reset the game
        const result = await makeInternalApiCall('/api/games/reset', 'POST', {
          roomId,
        });

        if (result.success) {
          console.log(`Game reset successful for room ${roomId}`);
          // The API route already handles emitting room-updated events, so we don't need to do anything else
        } else {
          console.error(`Game reset failed for room ${roomId}`);
          socket.emit('reset-error', {
            message: 'Failed to reset game',
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error resetting game:', error);
        socket.emit('reset-error', {
          message: 'Internal server error',
          timestamp: Date.now()
        });
      }
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
