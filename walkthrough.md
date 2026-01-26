# 4 in a Row Project Walkthrough

This project is a real-time multiplayer "4 in a Row" game built with **Next.js 14** and **Pusher**.

## 🏗️ Project Organization

The project follows a standard Next.js structure with a mix of App Router and Pages Router:

- **`src/app/`**: Contains the frontend UI using the Next.js App Router.
  - [page.tsx](file:///d:/DEVs/4inrow/src/app/page.tsx): The main entry point and "brain" of the game.
  - [layout.tsx](file:///d:/DEVs/4inrow/src/app/layout.tsx): Root layout with global styles.
- **`src/pages/api/`**: Contains backend API routes using the Next.js Pages Router.
  - [room/\[code\].ts](file:///d:/DEVs/4inrow/src/pages/api/room/%5Bcode%5D.ts): Manages room state storage (in-memory).
  - [pusher.ts](file:///d:/DEVs/4inrow/src/pages/api/pusher.ts): Handles triggering real-time events.
- **`src/types/`**: Shared TypeScript definitions.
  - [game.ts](file:///d:/DEVs/4inrow/src/types/game.ts): Defines `Room` and `Player` structures.

## 🔄 Core Logic & Code Flow

### 1. Initialization
When you open the app, [page.tsx](file:///d:/DEVs/4inrow/src/app/page.tsx) initializes the **Pusher** client in a `useEffect` hook. This allows the browser to listen for real-time updates from the server.

### 2. Room Management
- **Creating a Room**: The `handleCreateRoom` function generates a random 3-digit code, sets up the initial game state (empty board, player 1), and saves it to the server via `/api/room/[code]`.
- **Joining a Room**: The `handleJoinRoom` function fetches the room data from the server, adds the new player, and updates the server. It then broadcasts a `player-joined` event via Pusher so other players know someone joined.

### 3. Multiplayer Sync (Pusher)
Real-time communication is the backbone of the game. The app uses Pusher events to keep all players in sync:
- `player-joined`: Sent when a new player enters.
- `game-update`: Sent after every move to sync the board state.
- `game-over`: Sent when someone wins or the game is a draw.
- `game-reset`: Sent when players choose to play again.

### 4. Game Mechanics
- **Turn Logic**: The board is a 2D array. `handleMove` finds the lowest available slot in a column.
- **Win Detection**: The `checkWin` function (in `page.tsx`) runs after every move, checking horizontally, vertically, and diagonally for the required number of pieces (Connect 3 or 4, depending on settings).

## 🛠️ Tech Stack Highlights
- **Framework**: Next.js (React)
- **Real-time**: Pusher Channels
- **State Management**: React `useState` and `useEffect`
- **Styling**: Vanilla CSS (defined in `layout.tsx` or globals)

## 🐍 Django vs. 🚀 Next.js (This Project)

If you're coming from Django, here's how to find what you're looking for:

| Django Concept | This Project's Equivalent | Location |
| :--- | :--- | :--- |
| **Models** | TypeScript Interfaces | [game.ts](file:///d:/DEVs/4inrow/src/types/game.ts) |
| **Database** | In-Memory `Map` (for now) | [\[code\].ts](file:///d:/DEVs/4inrow/src/pages/api/room/%5Bcode%5D.ts#L5) |
| **URLs / Routes** | File-based Routing | `src/app/` (UI) & `src/pages/api/` (Backend) |
| **Views / Logic** | Component Hooks & API Handlers | `src/app/page.tsx` & `src/pages/api/` |
| **Templates** | React JSX | `src/app/page.tsx` (render functions) |

### 🔍 Where is the "Logic"?
In this project, the logic is **highly decentralized**:
- **Game Rules** (like `checkWin`): Inside `src/app/page.tsx` because it's a client-side heavy game.
- **Multicasting**: Handled via Pusher in `src/pages/api/pusher.ts`.
- **State Persistence**: Minimal persistence in `src/pages/api/room/[code].ts`.

> [!NOTE]
> Unlike Django's "Fat Models, Thin Views" approach, Next.js (especially for real-time apps) often pushes a lot of logic to the **Client (Frontend)** to make things feel snappy.
