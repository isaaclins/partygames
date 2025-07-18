// Shared types and interfaces for Party Games

// User and Player types
export interface User {
  id: string;
  name: string;
}

export interface Player extends User {
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  score?: number;
  joinedAt: Date;
}

// Game session types
export interface GameSession {
  id: string;
  lobbyId: string;
  gameType: string;
  status: 'waiting' | 'starting' | 'playing' | 'paused' | 'finished';
  players: Player[];
  maxPlayers: number;
  currentRound: number;
  totalRounds: number;
  roundTimeLimit?: number;
  roundTimeRemaining?: number;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  hostId: string;
}

// Game types
export interface GameType {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number; // in minutes
  category: 'drawing' | 'social' | 'trivia' | 'word' | 'strategy';
  available: boolean;
}

// WebSocket Communication Types
export interface ServerToClientEvents {
  // Lobby events
  'lobby:updated': (lobby: GameSession) => void;
  'lobby:playerJoined': (player: Player) => void;
  'lobby:playerLeft': (playerId: string) => void;
  'lobby:playerUpdated': (player: Player) => void;
  'lobby:disbanded': (reason: string) => void;

  // Game events
  'game:starting': (countdown: number) => void;
  'game:started': () => void;
  'game:stateUpdate': (gameState: any) => void;
  'game:roundStarted': (round: number, timeLimit?: number) => void;
  'game:roundEnded': (results: RoundResults) => void;
  'game:timeUpdate': (timeRemaining: number) => void;
  'game:ended': (finalResults: GameResults) => void;
  'game:paused': (reason: string) => void;
  'game:resumed': () => void;

  // Error events
  error: (error: ErrorResponse) => void;
  connectionError: (error: string) => void;
}

export interface ClientToServerEvents {
  // Lobby events
  'lobby:create': (
    data: CreateLobbyData,
    callback: (response: LobbyResponse) => void
  ) => void;
  'lobby:join': (
    data: JoinLobbyData,
    callback: (response: LobbyResponse) => void
  ) => void;
  'lobby:leave': (callback: (response: BaseResponse) => void) => void;
  'lobby:updatePlayer': (
    updates: Partial<Player>,
    callback: (response: BaseResponse) => void
  ) => void;
  'lobby:toggleReady': (callback: (response: BaseResponse) => void) => void;

  // Game events
  'game:start': (callback: (response: BaseResponse) => void) => void;
  'game:action': (
    action: GameAction,
    callback: (response: BaseResponse) => void
  ) => void;
  'game:pause': (callback: (response: BaseResponse) => void) => void;
  'game:resume': (callback: (response: BaseResponse) => void) => void;

  // Connection events
  ping: (callback: (response: { timestamp: number }) => void) => void;
}

// Request/Response types
export interface CreateLobbyData {
  hostName: string;
  gameType: string;
  maxPlayers: number;
}

export interface JoinLobbyData {
  lobbyId: string;
  playerName: string;
}

export interface BaseResponse {
  success: boolean;
  error?: string;
}

export interface LobbyResponse extends BaseResponse {
  lobby?: GameSession;
  playerId?: string;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

// Game-specific types
export interface GameAction {
  type: string;
  data: any;
  playerId: string;
  timestamp: Date;
}

// Spyfall specific types
export interface SpyfallLocation {
  name: string;
  roles: string[];
}

export interface SpyfallPlayerRole {
  playerId: string;
  location: string | null; // null for spy
  role: string | null; // null for spy
  isSpy: boolean;
}

export interface SpyfallVote {
  voterId: string;
  targetPlayerId: string;
  submittedAt: Date;
}

export interface SpyfallLocationGuess {
  spyId: string;
  guessedLocation: string;
  submittedAt: Date;
  isCorrect: boolean;
}

export interface SpyfallGameState {
  phase: 'playing' | 'voting' | 'spy_guess' | 'finished';
  location: string;
  spyId: string;
  playerRoles: SpyfallPlayerRole[];
  votes: SpyfallVote[];
  locationGuess?: SpyfallLocationGuess;
  timeRemaining?: number;
  votedOutPlayerId?: string;
  winner?: 'spy' | 'non_spies';
  gameStartedAt: Date;
}

export interface SpyfallGameAction extends GameAction {
  type: 'ready_to_vote' | 'submit_vote' | 'guess_location';
  data: {
    targetPlayerId?: string; // For submit_vote
    guessedLocation?: string; // For guess_location
  };
}

export interface RoundResults {
  roundNumber: number;
  scores: Record<string, number>;
  summary?: string;
  details?: any;
}

export interface GameResults {
  finalScores: Record<string, number>;
  winner?: string;
  summary: string;
  gameStats?: any;
}

// Utility types
export type GameStatus = GameSession['status'];
export type PlayerUpdates = Partial<Pick<Player, 'name' | 'isReady'>>;

// Constants
export const GAME_CONFIG = {
  LOBBY_CODE_LENGTH: 6,
  MIN_PLAYERS_TO_START: 3,
  MAX_LOBBY_IDLE_TIME: 30 * 60 * 1000, // 30 minutes
  HEARTBEAT_INTERVAL: 30 * 1000, // 30 seconds
  ROUND_COUNTDOWN_DURATION: 3, // seconds
} as const;

export const ERROR_CODES = {
  LOBBY_NOT_FOUND: 'LOBBY_NOT_FOUND',
  LOBBY_FULL: 'LOBBY_FULL',
  GAME_IN_PROGRESS: 'GAME_IN_PROGRESS',
  NOT_HOST: 'NOT_HOST',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  INVALID_GAME_TYPE: 'INVALID_GAME_TYPE',
  NOT_ENOUGH_PLAYERS: 'NOT_ENOUGH_PLAYERS',
  ALREADY_IN_LOBBY: 'ALREADY_IN_LOBBY',
} as const;

// Spyfall locations and roles
// Offline Spyfall specific types
export interface OfflinePlayerRole {
  playerName: string;
  location: string | null; // null for spy
  role: string | null; // null for spy
  isSpy: boolean;
}

export interface OfflineVote {
  voterName: string;
  targetName: string;
}

export interface OfflineGameResults {
  votedOutPlayer: string;
  voteCounts: Record<string, number>;
  spyName: string;
  location: string;
  winner: 'spy' | 'non-spies';
  isTie: boolean;
}

export interface OfflineGameState {
  phase: 'setup' | 'role-reveal' | 'discussion' | 'voting' | 'results';
  players: string[];
  roles: OfflinePlayerRole[];
  currentCardIndex: number;
  votes: OfflineVote[];
  currentVoterIndex: number;
  gameResults?: OfflineGameResults;
}

export const SPYFALL_LOCATIONS: SpyfallLocation[] = [
  {
    name: 'Pirate Ship',
    roles: [
      'Captain',
      'First Mate',
      'Navigator',
      'Gunner',
      'Sailor',
      'Cook',
      'Cabin Boy',
      'Lookout',
    ],
  },
  {
    name: 'Space Station',
    roles: [
      'Commander',
      'Scientist',
      'Engineer',
      'Pilot',
      'Medical Officer',
      'Communications',
      'Security',
      'Maintenance',
    ],
  },
  {
    name: 'Casino',
    roles: [
      'Dealer',
      'Pit Boss',
      'Security Guard',
      'Waitress',
      'Gambler',
      'Bartender',
      'Manager',
      'VIP Guest',
    ],
  },
  {
    name: 'Hospital',
    roles: [
      'Doctor',
      'Nurse',
      'Surgeon',
      'Patient',
      'Receptionist',
      'Orderly',
      'Pharmacist',
      'Visitor',
    ],
  },
  {
    name: 'School',
    roles: [
      'Teacher',
      'Student',
      'Principal',
      'Janitor',
      'Librarian',
      'Coach',
      'Secretary',
      'Parent',
    ],
  },
  {
    name: 'Movie Theater',
    roles: [
      'Projectionist',
      'Usher',
      'Concession Worker',
      'Manager',
      'Customer',
      'Ticket Booth',
      'Cleaner',
      'Security',
    ],
  },
  {
    name: 'Bank',
    roles: [
      'Manager',
      'Security Guard',
      'Customer',
      'Loan Officer',
      'Vault Technician',
      'Accountant',
      'Janitor',
    ],
  },
  {
    name: 'Restaurant',
    roles: [
      'Chef',
      'Waiter',
      'Customer',
      'Manager',
      'Busboy',
      'Host',
      'Dishwasher',
      'Food Critic',
    ],
  },
  {
    name: 'Hotel',
    roles: [
      'Receptionist',
      'Bellhop',
      'Guest',
      'Manager',
      'Housekeeper',
      'Security',
      'Concierge',
      'Room Service',
    ],
  },
  {
    name: 'Airplane',
    roles: [
      'Pilot',
      'Flight Attendant',
      'Passenger',
      'Co-pilot',
      'Air Marshal',
      'Child',
      'Tourist',
      'Business Traveler',
    ],
  },
  {
    name: 'Submarine',
    roles: [
      'Captain',
      'Sonar Operator',
      'Engineer',
      'Cook',
      'Sailor',
      'Radio Operator',
      'Torpedo Operator',
      'Medic',
    ],
  },
  {
    name: 'Art Museum',
    roles: [
      'Curator',
      'Security Guard',
      'Visitor',
      'Tour Guide',
      'Artist',
      'Student',
      'Critic',
      'Donor',
    ],
  },
  {
    name: 'Circus',
    roles: [
      'Ringmaster',
      'Clown',
      'Acrobat',
      'Animal Trainer',
      'Spectator',
      'Juggler',
      'Ticket Seller',
      'Strongman',
    ],
  },
  {
    name: 'Military Base',
    roles: [
      'General',
      'Soldier',
      'Medic',
      'Engineer',
      'Pilot',
      'Mechanic',
      'Intelligence Officer',
      'Recruit',
    ],
  },
  {
    name: 'University',
    roles: [
      'Professor',
      'Student',
      'Dean',
      'Librarian',
      'Researcher',
      'Teaching Assistant',
      'Campus Security',
      'Alumni',
    ],
  },
];
