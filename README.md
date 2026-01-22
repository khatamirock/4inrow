# 4 in a Row - Online Multiplayer Game

A real-time multiplayer Connect-4 style game built with Next.js, Socket.io, and TypeScript. Play with 3 players using simple 3-digit room codes.

## Features

- 🎮 **3-Player Gameplay**: Connect-4 mechanics adapted for 3 players  
- 🔐 **Room System**: Create or join games using 3-digit room codes (000-999)
- ⚡ **Real-time**: Powered by Socket.io for instant updates
- 🎨 **Modern UI**: Beautiful gradients, smooth animations, and responsive design
- 🚀 **Vercel Ready**: Optimized for Vercel deployment with API routes

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## How to Play

1. **Create a Room**: Enter your name and click "Create Room" to get a 3-digit room code
2. **Share the Code**: Share the room code with 2 friends
3. **Join the Game**: Friends enter the room code to join
4. **Play**: Take turns dropping pieces - first to get 4 in a row wins!

## Game Rules

- **Players**: Exactly 3 players required to start
- **Board**: 7 columns × 6 rows
- **Objective**: First player to get 4 pieces in a row (horizontal, vertical, or diagonal) wins
- **Turns**: Players take turns in order (Player 1 → Player 2 → Player 3)
- **Colors**: 
  - Player 1: Red 🔴
  - Player 2: Yellow 🟡
  - Player 3: Green 🟢

## Deploying to Vercel

### Option 1: GitHub Integration (Recommended)

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit: 4-in-a-row game"
git remote add origin <your-repo-url>
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy" - your app will be live in seconds!

### Option 2: Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from project directory
vercel

# Follow the prompts
```

### Important: Vercel Configuration

This app uses **Socket.io with API routes** for Vercel compatibility. The Socket.io server runs on `/api/socket` as a Next.js API route, which works perfectly with Vercel's serverless functions.

No environment variables or special configuration needed!

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes with Socket.io
- **Styling**: CSS with modern gradients and animations
- **Real-time**: Socket.io (API route compatible)
- **Deployment**: Vercel-optimized

## Project Structure

```
4inrow/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main game component
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── pages/
│   │   └── api/
│   │       └── socket.ts     # Socket.io API route
│   └── types/
│       ├── game.ts           # Game type definitions
│       └── socket.ts         # Socket type definitions
├── package.json
├── tsconfig.json
├── next.config.js
└── vercel.json              # Vercel configuration
```

## How It Works

### Socket.io on Vercel

Unlike traditional Socket.io setups that require a persistent server, this implementation uses:

1. **API Route**: `/api/socket.ts` initializes Socket.io server
2. **Client Connection**: Connects to `/api/socket` path
3. **Stateful Server**: Socket.io maintains connections even on serverless

This approach is fully compatible with Vercel's infrastructure!

## Troubleshooting

### Socket.io Not Connecting

If you see 404 errors for `/socket.io`:
- Make sure you've pushed the latest code
- Verify `/src/pages/api/socket.ts` exists
- Redeploy on Vercel

### Local Development Issues

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Restart dev server
npm run dev
```

## Future Enhancements

- Add chat functionality
- Implement player statistics
- Add sound effects
- Support for different board sizes
- Spectator mode
- Game replay system

## License

MIT

## Author

Built with ❤️ using Next.js and Socket.io
