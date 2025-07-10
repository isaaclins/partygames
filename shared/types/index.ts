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

// Two Truths and a Lie specific types
export interface TwoTruthsStatement {
  id: string;
  text: string;
  isLie: boolean;
}

export interface TwoTruthsPlayerSubmission {
  playerId: string;
  statements: TwoTruthsStatement[];
  submittedAt: Date;
}

export interface TwoTruthsVote {
  voterId: string;
  targetPlayerId: string;
  selectedStatementId: string;
  submittedAt: Date;
}

export interface TwoTruthsRoundData {
  submissions: TwoTruthsPlayerSubmission[];
  votes: TwoTruthsVote[];
  currentPhase: 'submitting' | 'voting' | 'results';
  currentTargetPlayerId?: string; // For voting phase
}

export interface TwoTruthsGameAction extends GameAction {
  type: 'submit_statements' | 'submit_vote';
  data: {
    statements?: string[]; // For submit_statements
    selectedStatementId?: string; // For submit_vote
    targetPlayerId?: string; // For submit_vote
  };
}

// Would You Rather specific types
export interface WouldYouRatherScenario {
  id: string;
  optionA: string;
  optionB: string;
  submittedBy: string;
  round: number;
}

export interface WouldYouRatherVote {
  voterId: string;
  scenarioId: string;
  choice: 'A' | 'B';
  submittedAt: Date;
}

export interface WouldYouRatherRoundData {
  scenarios: WouldYouRatherScenario[];
  votes: WouldYouRatherVote[];
  currentPhase: 'submitting' | 'voting' | 'results';
  currentScenarioIndex: number;
}

export interface WouldYouRatherGameAction extends GameAction {
  type: 'submit_scenario' | 'submit_vote';
  data: {
    optionA?: string; // For submit_scenario
    optionB?: string; // For submit_scenario
    scenarioId?: string; // For submit_vote
    choice?: 'A' | 'B'; // For submit_vote
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
