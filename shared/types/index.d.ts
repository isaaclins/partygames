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
export interface GameType {
    id: string;
    name: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
    estimatedDuration: number;
    category: 'drawing' | 'social' | 'trivia' | 'word' | 'strategy';
    available: boolean;
}
export interface ServerToClientEvents {
    'lobby:updated': (lobby: GameSession) => void;
    'lobby:playerJoined': (player: Player) => void;
    'lobby:playerLeft': (playerId: string) => void;
    'lobby:playerUpdated': (player: Player) => void;
    'lobby:disbanded': (reason: string) => void;
    'game:starting': (countdown: number) => void;
    'game:started': () => void;
    'game:stateUpdate': (gameState: any) => void;
    'game:roundStarted': (round: number, timeLimit?: number) => void;
    'game:roundEnded': (results: RoundResults) => void;
    'game:timeUpdate': (timeRemaining: number) => void;
    'game:ended': (finalResults: GameResults) => void;
    'game:paused': (reason: string) => void;
    'game:resumed': () => void;
    error: (error: ErrorResponse) => void;
    connectionError: (error: string) => void;
}
export interface ClientToServerEvents {
    'lobby:create': (data: CreateLobbyData, callback: (response: LobbyResponse) => void) => void;
    'lobby:join': (data: JoinLobbyData, callback: (response: LobbyResponse) => void) => void;
    'lobby:leave': (callback: (response: BaseResponse) => void) => void;
    'lobby:updatePlayer': (updates: Partial<Player>, callback: (response: BaseResponse) => void) => void;
    'lobby:toggleReady': (callback: (response: BaseResponse) => void) => void;
    'game:start': (callback: (response: BaseResponse) => void) => void;
    'game:action': (action: GameAction, callback: (response: BaseResponse) => void) => void;
    'game:pause': (callback: (response: BaseResponse) => void) => void;
    'game:resume': (callback: (response: BaseResponse) => void) => void;
    ping: (callback: (response: {
        timestamp: number;
    }) => void) => void;
}
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
export interface GameAction {
    type: string;
    data: any;
    playerId: string;
    timestamp: Date;
}
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
    currentTargetPlayerId?: string;
}
export interface TwoTruthsGameAction extends GameAction {
    type: 'submit_statements' | 'submit_vote';
    data: {
        statements?: string[];
        selectedStatementId?: string;
        targetPlayerId?: string;
    };
}
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
        optionA?: string;
        optionB?: string;
        scenarioId?: string;
        choice?: 'A' | 'B';
    };
}
export interface DrawingPoint {
    x: number;
    y: number;
    pressure?: number;
}
export interface DrawingStroke {
    id: string;
    points: DrawingPoint[];
    color: string;
    width: number;
    timestamp: Date;
}
export interface DrawingCanvas {
    strokes: DrawingStroke[];
    width: number;
    height: number;
    backgroundColor: string;
}
export interface QuickDrawGuess {
    playerId: string;
    guess: string;
    timestamp: Date;
    isCorrect: boolean;
}
export interface QuickDrawPrompt {
    id: string;
    word: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    hints?: string[];
}
export interface QuickDrawRound {
    roundNumber: number;
    drawerId: string;
    prompt: QuickDrawPrompt;
    canvas: DrawingCanvas;
    guesses: QuickDrawGuess[];
    timeLimit: number;
    timeRemaining: number;
    phase: 'waiting' | 'drawing' | 'guessing' | 'reveal' | 'complete';
    startedAt?: Date;
    completedAt?: Date;
}
export interface QuickDrawGameState {
    currentRound: number;
    totalRounds: number;
    rounds: QuickDrawRound[];
    scores: Record<string, number>;
    playerOrder: string[];
    gamePhase: 'setup' | 'playing' | 'finished';
}
export interface QuickDrawGameAction extends GameAction {
    type: 'start_drawing' | 'add_stroke' | 'submit_guess' | 'clear_canvas' | 'undo_stroke';
    data: {
        stroke?: DrawingStroke;
        guess?: string;
        strokeId?: string;
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
export type GameStatus = GameSession['status'];
export type PlayerUpdates = Partial<Pick<Player, 'name' | 'isReady'>>;
export declare const GAME_CONFIG: {
    readonly LOBBY_CODE_LENGTH: 6;
    readonly MIN_PLAYERS_TO_START: 3;
    readonly MAX_LOBBY_IDLE_TIME: number;
    readonly HEARTBEAT_INTERVAL: number;
    readonly ROUND_COUNTDOWN_DURATION: 3;
};
export declare const ERROR_CODES: {
    readonly LOBBY_NOT_FOUND: "LOBBY_NOT_FOUND";
    readonly LOBBY_FULL: "LOBBY_FULL";
    readonly GAME_IN_PROGRESS: "GAME_IN_PROGRESS";
    readonly NOT_HOST: "NOT_HOST";
    readonly PLAYER_NOT_FOUND: "PLAYER_NOT_FOUND";
    readonly INVALID_GAME_TYPE: "INVALID_GAME_TYPE";
    readonly NOT_ENOUGH_PLAYERS: "NOT_ENOUGH_PLAYERS";
    readonly ALREADY_IN_LOBBY: "ALREADY_IN_LOBBY";
};
//# sourceMappingURL=index.d.ts.map