# Testing the Party Games Implementation

## Quick Start

### 1. Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

The server will start on http://localhost:3001

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on http://localhost:5173

## Testing Real-time Multiplayer

### Single Machine Testing

1. Open multiple browser tabs/windows to http://localhost:5173
2. In first tab: Click "Create Game" → Enter your name → Select "Two Truths and a Lie" → Create
   lobby
3. Copy the lobby code (e.g., "ABC123")
4. In second tab: Click "Join Game" → Enter different name → Enter lobby code → Join
5. Test ready/unready functionality in both tabs
6. As host, start the game when all players are ready

### Features to Test

#### ✅ Lobby Management

- [x] Create game lobby
- [x] Join game with lobby code
- [x] Real-time player list updates
- [x] Host/non-host role management
- [x] Ready/unready status toggling
- [x] Game start with countdown
- [x] Leave lobby functionality

#### ✅ Real-time Communication

- [x] WebSocket connection status
- [x] Player join/leave notifications
- [x] Ready status updates
- [x] Host migration when host leaves
- [x] Connection lost/reconnection handling

#### ✅ Error Handling

- [x] Invalid lobby codes
- [x] Duplicate player names
- [x] Connection errors
- [x] Full lobby handling
- [x] Game in progress prevention

### Expected Behavior

**Creating a Game:**

- Generates 6-character lobby code
- Host is automatically ready
- Lobby shows on game lobby page
- Room code is shareable

**Joining a Game:**

- Validates lobby code format
- Checks if lobby exists and has space
- Prevents duplicate names
- Adds player to real-time lobby

**Game Start:**

- Requires minimum 3 players
- All players must be ready
- Only host can start
- 3-second countdown before start
- Game status updates in real-time

### WebSocket Events (for debugging)

Open browser console to see real-time WebSocket events:

- `lobby:updated` - Lobby state changes
- `lobby:playerJoined` - New player joins
- `lobby:playerLeft` - Player leaves
- `lobby:playerUpdated` - Player ready status changes
- `game:starting` - Game countdown
- `game:started` - Game begins

### Known Limitations

1. **Game Implementation**: Currently only lobby system is implemented. Actual games (like "Two
   Truths and a Lie") need to be built.

2. **Persistence**: Lobbies exist only in memory. Server restart clears all lobbies.

3. **Authentication**: No user accounts - players are anonymous with session-based IDs.

### Next Steps

- [ ] Implement actual party games (Two Truths and a Lie, Quick Draw, etc.)
- [ ] Add game scoring and results system
- [ ] Implement spectator mode
- [ ] Add chat functionality
- [ ] Create user profiles and history
