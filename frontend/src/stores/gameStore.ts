import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  score?: number;
}

interface GameState {
  // Lobby state
  lobbyId: string | null;
  players: Player[];
  maxPlayers: number;
  gameType: string | null;
  
  // Game session state
  gameStatus: 'waiting' | 'starting' | 'playing' | 'paused' | 'finished';
  currentRound: number;
  totalRounds: number;
  roundTimeLimit: number | null;
  roundTimeRemaining: number | null;
  
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  
  // Actions
  setLobbyInfo: (lobbyId: string, gameType: string, maxPlayers: number) => void;
  updatePlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  setGameStatus: (status: GameState['gameStatus']) => void;
  setRoundInfo: (round: number, totalRounds: number, timeLimit?: number) => void;
  setRoundTimeRemaining: (time: number | null) => void;
  setConnectionStatus: (connected: boolean, error?: string | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, _get) => ({
    // Initial state
    lobbyId: null,
    players: [],
    maxPlayers: 8,
    gameType: null,
    gameStatus: 'waiting',
    currentRound: 0,
    totalRounds: 0,
    roundTimeLimit: null,
    roundTimeRemaining: null,
    isConnected: false,
    connectionError: null,

    // Actions
    setLobbyInfo: (lobbyId: string, gameType: string, maxPlayers: number) => {
      set({ lobbyId, gameType, maxPlayers });
    },

    updatePlayers: (players: Player[]) => {
      set({ players });
    },

    addPlayer: (player: Player) => {
      set((state) => ({
        players: [...state.players, player],
      }));
    },

    removePlayer: (playerId: string) => {
      set((state) => ({
        players: state.players.filter((p) => p.id !== playerId),
      }));
    },

    updatePlayer: (playerId: string, updates: Partial<Player>) => {
      set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, ...updates } : p
        ),
      }));
    },

    setGameStatus: (gameStatus: GameState['gameStatus']) => {
      set({ gameStatus });
    },

    setRoundInfo: (currentRound: number, totalRounds: number, roundTimeLimit?: number) => {
      set({ 
        currentRound, 
        totalRounds, 
        roundTimeLimit: roundTimeLimit ?? null,
        roundTimeRemaining: roundTimeLimit ?? null 
      });
    },

    setRoundTimeRemaining: (roundTimeRemaining: number | null) => {
      set({ roundTimeRemaining });
    },

    setConnectionStatus: (isConnected: boolean, connectionError?: string | null) => {
      set({ isConnected, connectionError: connectionError ?? null });
    },

    resetGame: () => {
      set({
        lobbyId: null,
        players: [],
        maxPlayers: 8,
        gameType: null,
        gameStatus: 'waiting',
        currentRound: 0,
        totalRounds: 0,
        roundTimeLimit: null,
        roundTimeRemaining: null,
        isConnected: false,
        connectionError: null,
      });
    },
  }))
);

// Selectors for commonly used derived state
export const useGameSelectors = () => {
  const gameStore = useGameStore();
  
  return {
    ...gameStore,
    isHost: gameStore.players.find(p => p.isHost)?.id === gameStore.players[0]?.id,
    allPlayersReady: gameStore.players.length >= 3 && gameStore.players.every(p => p.isReady),
    connectedPlayersCount: gameStore.players.filter(p => p.isConnected).length,
    currentPlayer: gameStore.players[0], // Assuming first player is current user
  };
}; 
