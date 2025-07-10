import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { useGameStore, useGameSelectors } from '../../stores/gameStore';
import { renderHook, act } from '@testing-library/react';

// Mock player data for testing
const mockPlayer1 = {
  id: 'player-1',
  name: 'Player 1',
  isHost: true,
  isReady: true,
  isConnected: true,
  score: 0,
};

const mockPlayer2 = {
  id: 'player-2',
  name: 'Player 2',
  isHost: false,
  isReady: false,
  isConnected: true,
  score: 0,
};

const mockPlayer3 = {
  id: 'player-3',
  name: 'Player 3',
  isHost: false,
  isReady: true,
  isConnected: false,
  score: 0,
};

describe('GameStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useGameStore.setState(useGameStore.getInitialState());
  });

  afterEach(() => {
    // Clean up after each test
    useGameStore.setState(useGameStore.getInitialState());
  });

  describe('Initial State', () => {
    test('has correct initial state', () => {
      const { result } = renderHook(() => useGameStore());
      
      expect(result.current.lobbyId).toBeNull();
      expect(result.current.players).toEqual([]);
      expect(result.current.maxPlayers).toBe(8);
      expect(result.current.gameType).toBeNull();
      expect(result.current.gameStatus).toBe('waiting');
      expect(result.current.currentRound).toBe(0);
      expect(result.current.totalRounds).toBe(0);
      expect(result.current.roundTimeLimit).toBeNull();
      expect(result.current.roundTimeRemaining).toBeNull();
      expect(result.current.gameData).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionError).toBeNull();
    });
  });

  describe('Lobby Management', () => {
    test('setLobbyInfo updates lobby information correctly', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setLobbyInfo('ABCD12', 'two-truths-and-a-lie', 6);
      });
      
      expect(result.current.lobbyId).toBe('ABCD12');
      expect(result.current.gameType).toBe('two-truths-and-a-lie');
      expect(result.current.maxPlayers).toBe(6);
    });

    test('setLobbyInfo handles edge cases', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setLobbyInfo('', '', 0);
      });
      
      expect(result.current.lobbyId).toBe('');
      expect(result.current.gameType).toBe('');
      expect(result.current.maxPlayers).toBe(0);
    });
  });

  describe('Player Management', () => {
    test('updatePlayers replaces entire players array', () => {
      const { result } = renderHook(() => useGameStore());
      const players = [mockPlayer1, mockPlayer2];
      
      act(() => {
        result.current.updatePlayers(players);
      });
      
      expect(result.current.players).toEqual(players);
      expect(result.current.players.length).toBe(2);
    });

    test('addPlayer adds a new player to the array', () => {
      const { result } = renderHook(() => useGameStore());
      
      // Start with one player
      act(() => {
        result.current.updatePlayers([mockPlayer1]);
      });
      
      expect(result.current.players.length).toBe(1);
      
      // Add another player
      act(() => {
        result.current.addPlayer(mockPlayer2);
      });
      
      expect(result.current.players.length).toBe(2);
      expect(result.current.players).toContain(mockPlayer1);
      expect(result.current.players).toContain(mockPlayer2);
    });

    test('addPlayer preserves existing players', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.updatePlayers([mockPlayer1, mockPlayer2]);
        result.current.addPlayer(mockPlayer3);
      });
      
      expect(result.current.players.length).toBe(3);
      expect(result.current.players[0]).toEqual(mockPlayer1);
      expect(result.current.players[1]).toEqual(mockPlayer2);
      expect(result.current.players[2]).toEqual(mockPlayer3);
    });

    test('removePlayer removes the correct player', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.updatePlayers([mockPlayer1, mockPlayer2, mockPlayer3]);
      });
      
      expect(result.current.players.length).toBe(3);
      
      act(() => {
        result.current.removePlayer('player-2');
      });
      
      expect(result.current.players.length).toBe(2);
      expect(result.current.players.find(p => p.id === 'player-2')).toBeUndefined();
      expect(result.current.players.find(p => p.id === 'player-1')).toBeDefined();
      expect(result.current.players.find(p => p.id === 'player-3')).toBeDefined();
    });

    test('removePlayer handles non-existent player gracefully', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.updatePlayers([mockPlayer1, mockPlayer2]);
      });
      
      expect(result.current.players.length).toBe(2);
      
      act(() => {
        result.current.removePlayer('non-existent-player');
      });
      
      expect(result.current.players.length).toBe(2);
      expect(result.current.players).toEqual([mockPlayer1, mockPlayer2]);
    });

    test('updatePlayer updates specific player properties', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.updatePlayers([mockPlayer1, mockPlayer2]);
      });
      
      act(() => {
        result.current.updatePlayer('player-2', { isReady: true, score: 100 });
      });
      
      const updatedPlayer = result.current.players.find(p => p.id === 'player-2');
      expect(updatedPlayer?.isReady).toBe(true);
      expect(updatedPlayer?.score).toBe(100);
      expect(updatedPlayer?.name).toBe('Player 2'); // Unchanged
      expect(updatedPlayer?.isHost).toBe(false); // Unchanged
    });

    test('updatePlayer handles partial updates correctly', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.updatePlayers([mockPlayer1]);
      });
      
      act(() => {
        result.current.updatePlayer('player-1', { isConnected: false });
      });
      
      const updatedPlayer = result.current.players.find(p => p.id === 'player-1');
      expect(updatedPlayer?.isConnected).toBe(false);
      expect(updatedPlayer?.isHost).toBe(true); // Unchanged
      expect(updatedPlayer?.name).toBe('Player 1'); // Unchanged
    });

    test('updatePlayer handles non-existent player gracefully', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.updatePlayers([mockPlayer1]);
      });
      
      act(() => {
        result.current.updatePlayer('non-existent-player', { isReady: true });
      });
      
      expect(result.current.players.length).toBe(1);
      expect(result.current.players[0]).toEqual(mockPlayer1);
    });
  });

  describe('Game Status Management', () => {
    test('setGameStatus updates game status correctly', () => {
      const { result } = renderHook(() => useGameStore());
      
      expect(result.current.gameStatus).toBe('waiting');
      
      act(() => {
        result.current.setGameStatus('starting');
      });
      
      expect(result.current.gameStatus).toBe('starting');
      
      act(() => {
        result.current.setGameStatus('playing');
      });
      
      expect(result.current.gameStatus).toBe('playing');
      
      act(() => {
        result.current.setGameStatus('finished');
      });
      
      expect(result.current.gameStatus).toBe('finished');
    });

    test('setGameStatus handles all valid statuses', () => {
      const { result } = renderHook(() => useGameStore());
      const validStatuses = ['waiting', 'starting', 'playing', 'paused', 'finished'] as const;
      
      validStatuses.forEach(status => {
        act(() => {
          result.current.setGameStatus(status);
        });
        expect(result.current.gameStatus).toBe(status);
      });
    });
  });

  describe('Round Management', () => {
    test('setRoundInfo updates round information correctly', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setRoundInfo(2, 5, 60);
      });
      
      expect(result.current.currentRound).toBe(2);
      expect(result.current.totalRounds).toBe(5);
      expect(result.current.roundTimeLimit).toBe(60);
      expect(result.current.roundTimeRemaining).toBe(60);
    });

    test('setRoundInfo without time limit sets null for time fields', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setRoundInfo(1, 3);
      });
      
      expect(result.current.currentRound).toBe(1);
      expect(result.current.totalRounds).toBe(3);
      expect(result.current.roundTimeLimit).toBeNull();
      expect(result.current.roundTimeRemaining).toBeNull();
    });

    test('setRoundTimeRemaining updates remaining time', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setRoundTimeRemaining(30);
      });
      
      expect(result.current.roundTimeRemaining).toBe(30);
      
      act(() => {
        result.current.setRoundTimeRemaining(0);
      });
      
      expect(result.current.roundTimeRemaining).toBe(0);
      
      act(() => {
        result.current.setRoundTimeRemaining(null);
      });
      
      expect(result.current.roundTimeRemaining).toBeNull();
    });
  });

  describe('Game Data Management', () => {
    test('setGameState updates game data correctly', () => {
      const { result } = renderHook(() => useGameStore());
      
      const gameData = {
        phase: 'submission',
        submissions: ['truth1', 'truth2', 'lie1'],
        currentGuesser: 'player-1',
      };
      
      act(() => {
        result.current.setGameState(gameData);
      });
      
      expect(result.current.gameData).toEqual(gameData);
    });

    test('setGameState handles null and undefined', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setGameState(null);
      });
      
      expect(result.current.gameData).toBeNull();
      
      act(() => {
        result.current.setGameState(undefined);
      });
      
      expect(result.current.gameData).toBeUndefined();
    });

    test('setGameState handles complex objects', () => {
      const { result } = renderHook(() => useGameStore());
      
      const complexGameData = {
        phase: 'guessing',
        players: [
          { id: 'p1', statements: ['truth', 'truth', 'lie'] },
          { id: 'p2', statements: ['lie', 'truth', 'truth'] },
        ],
        currentRound: 1,
        scores: { p1: 10, p2: 5 },
        metadata: { startTime: Date.now() },
      };
      
      act(() => {
        result.current.setGameState(complexGameData);
      });
      
      expect(result.current.gameData).toEqual(complexGameData);
    });
  });

  describe('Connection Management', () => {
    test('setConnectionStatus updates connection state correctly', () => {
      const { result } = renderHook(() => useGameStore());
      
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionError).toBeNull();
      
      act(() => {
        result.current.setConnectionStatus(true);
      });
      
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionError).toBeNull();
    });

    test('setConnectionStatus handles connection errors', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setConnectionStatus(false, 'Connection failed');
      });
      
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionError).toBe('Connection failed');
    });

    test('setConnectionStatus clears error when connected', () => {
      const { result } = renderHook(() => useGameStore());
      
      // Set error first
      act(() => {
        result.current.setConnectionStatus(false, 'Connection failed');
      });
      
      expect(result.current.connectionError).toBe('Connection failed');
      
      // Connect successfully
      act(() => {
        result.current.setConnectionStatus(true);
      });
      
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionError).toBeNull();
    });
  });

  describe('Reset Functionality', () => {
    test('resetGame restores initial state', () => {
      const { result } = renderHook(() => useGameStore());
      
      // Modify all state properties
      act(() => {
        result.current.setLobbyInfo('TEST123', 'quick-draw', 4);
        result.current.updatePlayers([mockPlayer1, mockPlayer2]);
        result.current.setGameStatus('playing');
        result.current.setRoundInfo(3, 5, 120);
        result.current.setGameState({ phase: 'test' });
        result.current.setConnectionStatus(true);
      });
      
      // Verify state is modified
      expect(result.current.lobbyId).toBe('TEST123');
      expect(result.current.players.length).toBe(2);
      expect(result.current.gameStatus).toBe('playing');
      
      // Reset
      act(() => {
        result.current.resetGame();
      });
      
      // Verify all state is reset to initial values
      expect(result.current.lobbyId).toBeNull();
      expect(result.current.players).toEqual([]);
      expect(result.current.maxPlayers).toBe(8);
      expect(result.current.gameType).toBeNull();
      expect(result.current.gameStatus).toBe('waiting');
      expect(result.current.currentRound).toBe(0);
      expect(result.current.totalRounds).toBe(0);
      expect(result.current.roundTimeLimit).toBeNull();
      expect(result.current.roundTimeRemaining).toBeNull();
      expect(result.current.gameData).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionError).toBeNull();
    });
  });

  describe('State Persistence and Subscriptions', () => {
    test('multiple updates to same property work correctly', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setGameStatus('starting');
        result.current.setGameStatus('playing');
        result.current.setGameStatus('paused');
        result.current.setGameStatus('finished');
      });
      
      expect(result.current.gameStatus).toBe('finished');
    });

    test('state updates are atomic', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setLobbyInfo('LOBBY1', 'game1', 5);
        result.current.updatePlayers([mockPlayer1]);
        result.current.setGameStatus('playing');
      });
      
      // All updates should be applied
      expect(result.current.lobbyId).toBe('LOBBY1');
      expect(result.current.gameType).toBe('game1');
      expect(result.current.maxPlayers).toBe(5);
      expect(result.current.players.length).toBe(1);
      expect(result.current.gameStatus).toBe('playing');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles empty arrays correctly', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.updatePlayers([]);
      });
      
      expect(result.current.players).toEqual([]);
    });

    test('handles operations on empty player list', () => {
      const { result } = renderHook(() => useGameStore());
      
      // These should not throw errors
      act(() => {
        result.current.removePlayer('any-id');
        result.current.updatePlayer('any-id', { isReady: true });
      });
      
      expect(result.current.players).toEqual([]);
    });

    test('handles large numbers correctly', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setRoundInfo(999, 1000, 999999);
      });
      
      expect(result.current.currentRound).toBe(999);
      expect(result.current.totalRounds).toBe(1000);
      expect(result.current.roundTimeLimit).toBe(999999);
    });

    test('handles negative numbers correctly', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setRoundInfo(-1, -1, -1);
        result.current.setRoundTimeRemaining(-1);
      });
      
      expect(result.current.currentRound).toBe(-1);
      expect(result.current.totalRounds).toBe(-1);
      expect(result.current.roundTimeLimit).toBe(-1);
      expect(result.current.roundTimeRemaining).toBe(-1);
    });
  });
});

describe('GameStore Selectors', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
  });

  describe('useGameSelectors', () => {
    test('provides all base store properties', () => {
      const { result } = renderHook(() => useGameSelectors());
      
      expect(result.current.lobbyId).toBeDefined();
      expect(result.current.players).toBeDefined();
      expect(result.current.gameStatus).toBeDefined();
      expect(typeof result.current.setLobbyInfo).toBe('function');
    });

    test('calculates isHost correctly when user is host', () => {
      const { result: storeResult } = renderHook(() => useGameStore());
      const { result: selectorResult } = renderHook(() => useGameSelectors());
      
      act(() => {
        storeResult.current.updatePlayers([mockPlayer1, mockPlayer2]);
      });
      
      // First player is host
      expect(selectorResult.current.isHost).toBe(true);
    });

    test('calculates isHost correctly when user is not host', () => {
      const { result: storeResult } = renderHook(() => useGameStore());
      const { result: selectorResult } = renderHook(() => useGameSelectors());
      
      act(() => {
        storeResult.current.updatePlayers([mockPlayer2, mockPlayer1]);
      });
      
      // First player is not host
      expect(selectorResult.current.isHost).toBe(false);
    });

    test('calculates allPlayersReady correctly when all ready', () => {
      const { result: storeResult } = renderHook(() => useGameStore());
      const { result: selectorResult } = renderHook(() => useGameSelectors());
      
      const readyPlayers = [
        { ...mockPlayer1, isReady: true },
        { ...mockPlayer2, isReady: true },
        { ...mockPlayer3, isReady: true },
      ];
      
      act(() => {
        storeResult.current.updatePlayers(readyPlayers);
      });
      
      expect(selectorResult.current.allPlayersReady).toBe(true);
    });

    test('calculates allPlayersReady correctly when not all ready', () => {
      const { result: storeResult } = renderHook(() => useGameStore());
      const { result: selectorResult } = renderHook(() => useGameSelectors());
      
      act(() => {
        storeResult.current.updatePlayers([mockPlayer1, mockPlayer2]);
      });
      
      expect(selectorResult.current.allPlayersReady).toBe(false);
    });

    test('calculates allPlayersReady correctly with insufficient players', () => {
      const { result: storeResult } = renderHook(() => useGameStore());
      const { result: selectorResult } = renderHook(() => useGameSelectors());
      
      act(() => {
        storeResult.current.updatePlayers([mockPlayer1]);
      });
      
      expect(selectorResult.current.allPlayersReady).toBe(false);
    });

    test('calculates connectedPlayersCount correctly', () => {
      const { result: storeResult } = renderHook(() => useGameStore());
      const { result: selectorResult } = renderHook(() => useGameSelectors());
      
      act(() => {
        storeResult.current.updatePlayers([mockPlayer1, mockPlayer2, mockPlayer3]);
      });
      
      // mockPlayer1 and mockPlayer2 are connected, mockPlayer3 is not
      expect(selectorResult.current.connectedPlayersCount).toBe(2);
    });

    test('calculates connectedPlayersCount with no connected players', () => {
      const { result: storeResult } = renderHook(() => useGameStore());
      const { result: selectorResult } = renderHook(() => useGameSelectors());
      
      const disconnectedPlayers = [
        { ...mockPlayer1, isConnected: false },
        { ...mockPlayer2, isConnected: false },
      ];
      
      act(() => {
        storeResult.current.updatePlayers(disconnectedPlayers);
      });
      
      expect(selectorResult.current.connectedPlayersCount).toBe(0);
    });

    test('provides currentPlayer as first player', () => {
      const { result: storeResult } = renderHook(() => useGameStore());
      const { result: selectorResult } = renderHook(() => useGameSelectors());
      
      act(() => {
        storeResult.current.updatePlayers([mockPlayer1, mockPlayer2]);
      });
      
      expect(selectorResult.current.currentPlayer).toEqual(mockPlayer1);
    });

    test('handles empty players array for currentPlayer', () => {
      const { result: selectorResult } = renderHook(() => useGameSelectors());
      
      expect(selectorResult.current.currentPlayer).toBeUndefined();
    });
  });

  describe('Selector Performance', () => {
    test('selectors update when underlying state changes', () => {
      const { result: storeResult } = renderHook(() => useGameStore());
      const { result: selectorResult } = renderHook(() => useGameSelectors());
      
      expect(selectorResult.current.connectedPlayersCount).toBe(0);
      
      act(() => {
        storeResult.current.updatePlayers([mockPlayer1]);
      });
      
      expect(selectorResult.current.connectedPlayersCount).toBe(1);
    });

    test('selectors work with rapid state changes', () => {
      const { result: storeResult } = renderHook(() => useGameStore());
      const { result: selectorResult } = renderHook(() => useGameSelectors());
      
      act(() => {
        storeResult.current.updatePlayers([mockPlayer1]);
        storeResult.current.addPlayer(mockPlayer2);
        storeResult.current.removePlayer('player-1');
      });
      
      expect(selectorResult.current.connectedPlayersCount).toBe(1);
      expect(selectorResult.current.currentPlayer).toEqual(mockPlayer2);
    });
  });
}); 
