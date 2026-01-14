# 4 in a Row - Multiplayer Game

A real-time multiplayer 4 in a row (Connect Four style) game built with Next.js and fully Vercel-compatible.

## Features

✨ **3-Player Multiplayer** - Play with up to 3 players simultaneously
🔑 **Room System** - Create rooms with auto-generated room keys
👁️ **Spectators** - Others can watch ongoing games
🎮 **Real-Time Updates** - Polling-based game state sync
🚀 **Vercel Ready** - Deploy directly to Vercel with no backend server needed

## Tech Stack

- **Frontend**: Next.js 15+ with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Backend**: Next.js API Routes (Express-compatible structure)
- **Real-time**: Polling mechanism

## How to Play

1. **Create a Room**:
   - Enter your name and click "Create Room"
   - Share the room key with other players

2. **Join a Room**:
   - Enter the room key and your name
   - Wait for other players to join (need 2+ to start)

3. **Gameplay**:
   - Take turns dropping pieces into columns
   - First to get 4 in a row (horizontal, vertical, or diagonal) wins
   - Draw if the board fills up

## Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints

- `POST /api/rooms/create` - Create a new game room
- `POST /api/rooms/join` - Join an existing room
- `GET /api/rooms/[roomId]` - Get room state
- `POST /api/games/move` - Make a move
- `POST /api/games/reset` - Reset the game

## Deployment

### Deploy to Vercel

```bash
vercel
```

The game will work seamlessly on Vercel since all game logic runs in Next.js API routes with in-memory state management.

### Important Notes

- Game state is stored in memory and will reset when the server restarts
- For production use with persistence, integrate a database (Firebase, PostgreSQL, etc.)
- For better real-time updates in production, consider WebSockets instead of polling

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── rooms/
│   │   │   │   ├── create/
│   │   │   │   ├── join/
│   │   │   │   └── [roomId]/
│   │   │   └── games/
│   │   │       ├── move/
│   │   │       └── reset/
│   │   ├── game/
│   │   │   └── [roomId]/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Board.tsx
│   │   ├── GameInfo.tsx
│   │   └── PlayerList.tsx
│   ├── lib/
│   │   ├── gameLogic.ts
│   │   └── gameRoomManager.ts
│   └── types/
│       └── game.ts
└── package.json
```

## Game Rules

- 7 columns × 6 rows board
- Players take turns dropping pieces
- 4 in a row (horizontal, vertical, or diagonal) wins
- Pieces fall to the lowest available position in a column
- Maximum 3 players per game
- Extra players join as spectators

## License

MIT
