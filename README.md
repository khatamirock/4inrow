# 4 in a Row - Multiplayer Game

A real-time multiplayer 4 in a row (Connect Four style) game built with Next.js and fully Vercel-compatible with persistent state using Vercel KV.

## Features

✨ **3-Player Multiplayer** - Play with up to 3 players simultaneously
🔑 **Room System** - Create rooms with auto-generated room keys
👁️ **Spectators** - Others can watch ongoing games
🎮 **Real-Time Updates** - Optimized polling (2s intervals) for Vercel compatibility
📦 **Persistent State** - Uses Vercel KV on production, in-memory for local dev
🚀 **Vercel Ready** - Deploy directly to Vercel with automatic KV integration

## Tech Stack

- **Frontend**: Next.js 15+ with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Backend**: Next.js API Routes
- **Storage**: Vercel KV (Redis) for production, In-Memory for local dev
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

## Deployment to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "4 in a row game ready for vercel"
git push
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repo
4. Click "Deploy"

### Step 3: Add KV Storage (Automatic)
Vercel will detect the `@vercel/kv` package and prompt you to add KV storage:
1. Click "Create Database" → "KV Store"
2. Choose a region
3. Vercel automatically sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` env variables
4. Redeploy

### That's it! 🚀
Your game is now live and uses Vercel KV for persistent state storage.

## Local Development

For local development without KV:
```bash
npm run dev
```

The app automatically detects the absence of KV env variables and uses in-memory storage. This works perfectly fine for testing locally.

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
├── .env.example
├── package.json
└── README.md
```

## Storage Architecture

The app uses an intelligent storage system:

- **Production (Vercel)**: Uses Vercel KV (Redis)
  - Automatic expiry of rooms after 24 hours
  - Persistent state across function invocations
  - Perfect for serverless environments

- **Local Dev**: Uses in-memory Map
  - Instant, no setup needed
  - Resets on server restart (fine for dev)
  - Same API as production

## Game Rules

- 7 columns × 6 rows board
- Players take turns dropping pieces
- 4 in a row (horizontal, vertical, or diagonal) wins
- Pieces fall to the lowest available position in a column
- Maximum 3 players per game
- Extra players join as spectators
- Rooms auto-expire after 24 hours on production

## Troubleshooting

### Build Fails on Vercel
- Check that all dependencies are in `package.json`
- Verify TypeScript configuration in `tsconfig.json`
- Check for any import path issues (use `@/` aliases)

### Game State Lost After Deploy
- Make sure Vercel KV is connected
- Check `KV_REST_API_URL` env variable is set

### Local Testing Issues
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Run `npm run dev` again

## License

MIT
