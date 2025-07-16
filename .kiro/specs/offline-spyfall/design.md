# Design Document

## Overview

The offline Spyfall feature extends the existing online Spyfall game to work without internet
connectivity on a single device. The design integrates seamlessly with the current architecture by
adding a new routing path and offline-specific components while reusing existing game logic and UI
patterns.

## Architecture

### High-Level Flow

1. **Game Selection**: Modify existing Spyfall selection to show Online/Offline mode choice
2. **Offline Setup**: New component for entering player names (minimum 3 players)
3. **Role Distribution**: Sequential card-based role reveal system
4. **Voting System**: Turn-based voting interface with player grid selection
5. **Results**: Game outcome display with option to restart

### Integration Points

- **Routing**: Add new `/spyfall/offline` route alongside existing game routes
- **Components**: Create offline-specific components that mirror online UI patterns
- **State Management**: Use local React state instead of WebSocket/Zustand for offline mode
- **Game Logic**: Adapt existing Spyfall logic for local single-device play

## Components and Interfaces

### New Components

#### `SpyfallModeSelection`

- **Purpose**: Choose between Online and Offline modes
- **Location**: `/frontend/src/games/SpyfallModeSelection.tsx`
- **Props**: None
- **State**: None (navigation only)
- **UI**: Two large buttons for mode selection

#### `OfflineSpyfallGame`

- **Purpose**: Main offline game orchestrator
- **Location**: `/frontend/src/games/OfflineSpyfallGame.tsx`
- **State**:
  ```typescript
  interface OfflineGameState {
    phase: 'setup' | 'role-reveal' | 'discussion' | 'voting' | 'results';
    players: string[];
    roles: OfflinePlayerRole[];
    currentCardIndex: number;
    votes: OfflineVote[];
    currentVoterIndex: number;
    gameResults?: OfflineGameResults;
  }
  ```

#### `PlayerSetup`

- **Purpose**: Collect player names for offline game
- **Props**: `onPlayersReady: (players: string[]) => void`
- **State**: Player name list, validation
- **UI**: Input field, player list, start game button

#### `RoleRevealCard`

- **Purpose**: Display individual player role cards
- **Props**: `playerName: string, role: OfflinePlayerRole, onNext: () => void`
- **State**: Card revealed state
- **UI**: Card flip animation, privacy instructions

#### `VotingInterface`

- **Purpose**: Handle turn-based voting
- **Props**: `currentVoter: string, otherPlayers: string[], onVote: (target: string) => void`
- **State**: Selected target, confirmation
- **UI**: Player grid, vote confirmation

#### `OfflineGameResults`

- **Purpose**: Display voting results and game outcome
- **Props**: `results: OfflineGameResults, onRestart: () => void`
- **State**: None
- **UI**: Vote tallies, winner announcement, role reveals

### Modified Components

#### `CreateGamePage`

- **Modification**: Update Spyfall selection to navigate to mode selection instead of direct lobby
  creation
- **Change**: Replace direct spyfall game creation with navigation to `/spyfall/mode-select`

### New Types and Interfaces

```typescript
interface OfflinePlayerRole {
  playerName: string;
  location: string | null; // null for spy
  role: string | null; // null for spy
  isSpy: boolean;
}

interface OfflineVote {
  voterName: string;
  targetName: string;
}

interface OfflineGameResults {
  votedOutPlayer: string;
  voteCounts: Record<string, number>;
  spyName: string;
  location: string;
  winner: 'spy' | 'non-spies';
  isTie: boolean;
}

interface OfflineSpyfallLocation {
  name: string;
  roles: string[];
}
```

## Data Models

### Game State Management

- **Local State**: Use React useState for all game state (no WebSocket or global state)
- **Persistence**: No persistence required - games are ephemeral
- **Location Data**: Reuse existing `SPYFALL_LOCATIONS` constant from shared types

### Role Assignment Algorithm

```typescript
function assignRoles(playerNames: string[]): OfflinePlayerRole[] {
  const location = getRandomLocation();
  const spyIndex = Math.floor(Math.random() * playerNames.length);

  return playerNames.map((name, index) => ({
    playerName: name,
    location: index === spyIndex ? null : location.name,
    role: index === spyIndex ? null : getRandomRole(location),
    isSpy: index === spyIndex,
  }));
}
```

### Voting Logic

```typescript
function processVotes(votes: OfflineVote[]): OfflineGameResults {
  const voteCounts = votes.reduce(
    (acc, vote) => {
      acc[vote.targetName] = (acc[vote.targetName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const maxVotes = Math.max(...Object.values(voteCounts));
  const playersWithMaxVotes = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([name]) => name);

  const isTie = playersWithMaxVotes.length > 1;
  // ... rest of logic
}
```

## Error Handling

### Input Validation

- **Player Names**: Minimum 3 players, maximum 16 players, no duplicate names
- **Empty Names**: Trim whitespace, reject empty strings
- **Special Characters**: Allow all characters for international names

### Game State Errors

- **Invalid Transitions**: Prevent invalid phase transitions
- **Missing Data**: Handle missing player/role data gracefully
- **Vote Validation**: Ensure votes are for valid players

### User Experience

- **Clear Error Messages**: Show specific validation errors
- **Recovery Options**: Allow users to go back and fix issues
- **Graceful Degradation**: Handle edge cases without crashes

## Testing Strategy

### Unit Tests

- **Role Assignment**: Test random role distribution and spy selection
- **Vote Processing**: Test vote counting, tie detection, winner determination
- **Game State**: Test phase transitions and state updates
- **Validation**: Test input validation and error handling

### Component Tests

- **PlayerSetup**: Test name entry, validation, player list management
- **RoleRevealCard**: Test card reveal interaction, privacy features
- **VotingInterface**: Test player selection, vote confirmation
- **Results**: Test result display, restart functionality

### Integration Tests

- **Full Game Flow**: Test complete offline game from setup to results
- **Navigation**: Test routing between online/offline modes
- **State Persistence**: Test state management throughout game phases

### Manual Testing Scenarios

- **Single Device Usage**: Test passing device between players
- **Privacy**: Verify role information is properly hidden/revealed
- **Voting Ties**: Test tie scenarios and return to discussion
- **Edge Cases**: Test with minimum/maximum players, unusual names

## UI/UX Considerations

### Mobile-First Design

- **Large Touch Targets**: Easy tapping for card reveals and voting
- **Clear Typography**: Readable text for role information
- **Privacy Indicators**: Clear visual cues for when to hide screen

### Accessibility

- **Screen Reader Support**: Proper ARIA labels for game state
- **High Contrast**: Ensure visibility in various lighting conditions
- **Touch Accessibility**: Support for different touch patterns

### User Flow Optimization

- **Clear Instructions**: Step-by-step guidance for single-device play
- **Progress Indicators**: Show current phase and next steps
- **Confirmation Dialogs**: Prevent accidental actions during voting

### Visual Design

- **Consistent Styling**: Match existing online game UI patterns
- **Card Animations**: Smooth transitions for role reveals
- **Status Indicators**: Clear visual feedback for game state
- **Color Coding**: Consistent color scheme for different game phases
