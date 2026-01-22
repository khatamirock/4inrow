# 4 in a Row - Online Multiplayer Game

A real-time multiplayer Connect-4 style game built with Next.js, Socket.io, and TypeScript. Play with 3 players using simple 3-digit room codes.

## Features

- 🎮 **3-Player Gameplay**: Connect-4 mechanics adapted for 3 players
- 🔐 **Room System**: Create or join games using 3-digit room codes (000-999)
- ⚡ **Real-time**: Powered by Socket.io for instant updates
- 🎨 **Modern UI**: Beautiful gradients, smooth animations, and responsive design
- 🚀 **Vercel Ready**: Optimized for Vercel deployment

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

### Option 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts and your app will be live!

### Option 2: Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Vercel will automatically detect Next.js and deploy

### Important Notes for Vercel

- The app uses a custom server (`server.js`) for Socket.io integration
- WebSocket connections are supported on Vercel with proper configuration
- The `vercel.json` file is already configured for optimal deployment
- No environment variables required for basic setup

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Custom Node.js server with Socket.io
- **Styling**: CSS with modern gradients and animations
- **Real-time**: Socket.io for WebSocket communication
- **Deployment**: Vercel-compatible configuration

## Project Structure

```
4inrow/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main game component
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   └── types/
│       └── game.ts           # TypeScript interfaces
├── server.js                 # Custom Socket.io server
├── package.json
├── tsconfig.json
├── next.config.js
└── vercel.json              # Vercel configuration
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
PORT=3001 npm run dev
```

### WebSocket Connection Issues
- Ensure no firewall is blocking WebSocket connections
- On Vercel, WebSocket connections should work automatically
- Check browser console for connection errors

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
