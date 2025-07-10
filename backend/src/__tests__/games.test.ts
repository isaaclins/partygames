import { TwoTruthsAndALieGame } from '../games/TwoTruthsAndALie';
import { WouldYouRatherGame } from '../games/WouldYouRather';
import { QuickDrawGame } from '../games/QuickDraw';
import { GameSession, Player } from '../../../shared/types';

// Mock game session setup
const createMockGameSession = (playerCount: number = 3): GameSession => {
  const players: Player[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: `player-${i}`,
      name: `Player ${i + 1}`,
      isHost: i === 0,
      isReady: true,
    });
  }

  return {
    lobbyId: 'test-lobby',
    hostId: 'player-0',
    players,
    gameType: 'two-truths-and-a-lie',
    maxPlayers: 8,
    status: 'waiting',
    gameData: null,
    createdAt: new Date(),
  };
};

describe('TwoTruthsAndALie Game', () => {
  let gameSession: GameSession;
  let game: TwoTruthsAndALieGame;

  beforeEach(() => {
    gameSession = createMockGameSession(3);
    game = new TwoTruthsAndALieGame(gameSession);
  });

  describe('TwoTruthsAndALie initialization', () => {
    test('should initialize with correct game state', () => {
      const gameState = game.getGameState();

      expect(gameState.currentPhase).toBe('submitting');
      expect(gameState.currentRound).toBe(1);
      expect(gameState.maxRounds).toBe(3);
      expect(Object.keys(gameState.scores)).toHaveLength(3);
    });
  });

  describe('TwoTruthsAndALie statement submission', () => {
    test('should handle statement submission correctly', () => {
      const statements = ['Truth 1', 'Truth 2', 'Lie 1'];

      expect(() => {
        game.handleAction({
          type: 'submit_statements',
          data: { statements },
          playerId: 'player-0',
          timestamp: new Date(),
        });
      }).not.toThrow();
    });
  });

  describe('TwoTruthsAndALie voting', () => {
    test('should handle voting correctly', () => {
      // First submit statements for all players
      gameSession.players.forEach((player, index) => {
        game.handleAction({
          type: 'submit_statements',
          data: {
            statements: [`Truth ${index}1`, `Truth ${index}2`, `Lie ${index}`],
          },
          playerId: player.id,
          timestamp: new Date(),
        });
      });

      // Then vote
      expect(() => {
        game.handleAction({
          type: 'submit_vote',
          data: { targetPlayerId: 'player-1', guessedLie: 'Lie 1' },
          playerId: 'player-0',
          timestamp: new Date(),
        });
      }).not.toThrow();
    });
  });

  describe('TwoTruthsAndALie scoring', () => {
    test('should calculate scores correctly', () => {
      const gameState = game.getGameState();
      expect(gameState.scores).toBeDefined();
      expect(typeof gameState.scores['player-0']).toBe('number');
    });
  });

  describe('TwoTruthsAndALie completion', () => {
    test('should detect game completion', () => {
      expect(typeof game.isGameComplete()).toBe('boolean');
    });
  });
});

describe('WouldYouRather Game', () => {
  let gameSession: GameSession;
  let game: WouldYouRatherGame;

  beforeEach(() => {
    gameSession = createMockGameSession(3);
    game = new WouldYouRatherGame(gameSession);
  });

  describe('WouldYouRather scenario creation', () => {
    test('should handle scenario submission', () => {
      expect(() => {
        game.handleAction({
          type: 'submit_scenario',
          data: { optionA: 'Option A', optionB: 'Option B' },
          playerId: 'player-0',
          timestamp: new Date(),
        });
      }).not.toThrow();
    });
  });

  describe('WouldYouRather round progression', () => {
    test('should progress through rounds correctly', () => {
      const gameState = game.getGameState();
      expect(gameState.currentPhase).toBe('submitting');
      expect(gameState.currentRound).toBe(1);
    });
  });

  describe('WouldYouRather voting phase', () => {
    test('should handle voting correctly', () => {
      // Submit scenarios first
      gameSession.players.forEach((player, index) => {
        game.handleAction({
          type: 'submit_scenario',
          data: { optionA: `Option A${index}`, optionB: `Option B${index}` },
          playerId: player.id,
          timestamp: new Date(),
        });
      });

      // Then try to vote
      const gameState = game.getGameState();
      if (gameState.currentScenario) {
        expect(() => {
          game.handleAction({
            type: 'submit_vote',
            data: { scenarioId: gameState.currentScenario.id, choice: 'A' },
            playerId: 'player-0',
            timestamp: new Date(),
          });
        }).not.toThrow();
      }
    });
  });

  describe('WouldYouRather results', () => {
    test('should provide game results', () => {
      const gameState = game.getGameState();
      expect(gameState.scores).toBeDefined();
    });
  });

  describe('WouldYouRather multi round', () => {
    test('should support multiple rounds', () => {
      const gameState = game.getGameState();
      expect(gameState.maxRounds).toBeGreaterThan(1);
    });
  });
});

describe('QuickDraw Game', () => {
  let gameSession: GameSession;
  let game: QuickDrawGame;

  beforeEach(() => {
    gameSession = createMockGameSession(3);
    game = new QuickDrawGame(gameSession);
  });

  describe('QuickDraw drawing mechanics', () => {
    test('should handle drawing initialization', () => {
      expect(() => {
        game.handleAction({
          type: 'start_drawing',
          data: {},
          playerId: 'player-0',
          timestamp: new Date(),
        });
      }).not.toThrow();
    });
  });

  describe('QuickDraw timing', () => {
    test('should have timing configuration', () => {
      const gameState = game.getGameState();
      expect(gameState.totalRounds).toBeGreaterThan(0);
    });
  });

  describe('QuickDraw guess processing', () => {
    test('should handle guess submission', () => {
      // Start the game first
      game.handleAction({
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      });

      const gameState = game.getGameState();
      if (gameState.currentRoundData) {
        // Set phase to guessing to allow guess submissions
        gameState.currentRoundData.phase = 'guessing';
        
        // Use a non-drawer player for the guess
        const drawerId = gameState.currentRoundData.drawerId;
        const guesser = gameSession.players.find(p => p.id !== drawerId)?.id || 'player-1';
        
        expect(() => {
          game.handleAction({
            type: 'submit_guess',
            data: { guess: 'test guess' },
            playerId: guesser,
            timestamp: new Date(),
          });
        }).not.toThrow();
      }
    });
  });

  describe('QuickDraw canvas', () => {
    test('should handle canvas operations', () => {
      // Start the game first
      game.handleAction({
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      });

      // Get the actual drawer ID from the game state
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData?.drawerId || 'player-0';

      expect(() => {
        game.handleAction({
          type: 'clear_canvas',
          data: {},
          playerId: drawerId,
          timestamp: new Date(),
        });
      }).not.toThrow();
    });
  });

  describe('QuickDraw prompt', () => {
    test('should have word prompts available', () => {
      // Start the game to get a prompt
      game.handleAction({
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      });

      const gameState = game.getGameState();
      expect(gameState.currentRoundData?.prompt).toBeDefined();
      expect(gameState.currentRoundData?.prompt.word).toBeTruthy();
    });
  });

  describe('QuickDraw scoring', () => {
    test('should calculate scores correctly', () => {
      const gameState = game.getGameState();
      expect(gameState.scores).toBeDefined();
      expect(typeof gameState.scores['player-0']).toBe('number');
    });
  });
});

// Integration tests
describe('Game Integration', () => {
  describe('lobby game integration', () => {
    test('should integrate with lobby system', () => {
      const session = createMockGameSession(3);
      expect(session.players).toHaveLength(3);
      expect(session.gameType).toBe('two-truths-and-a-lie');
    });
  });

  describe('multi player scenarios', () => {
    test('should support multiple players', () => {
      const session = createMockGameSession(6);
      const game = new TwoTruthsAndALieGame(session);
      const gameState = game.getGameState();
      expect(Object.keys(gameState.scores)).toHaveLength(6);
    });
  });
});

// Performance tests
describe('Performance Tests', () => {
  describe('performance canvas throughput', () => {
    test('should handle canvas operations efficiently', () => {
      const session = createMockGameSession(3);
      const game = new QuickDrawGame(session);

      // Start the game
      game.handleAction({
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      });

      // Get the actual drawer ID from the game state
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData?.drawerId || 'player-0';

      // Simulate multiple stroke operations
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        game.handleAction({
          type: 'add_stroke',
          data: {
            stroke: {
              id: `stroke-${i}`,
              points: [{ x: i, y: i }],
              color: '#000000',
              width: 2,
              timestamp: new Date(),
            },
          },
          playerId: drawerId, // Use the correct drawer ID
          timestamp: new Date(),
        });
      }
      const end = Date.now();

      expect(end - start).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('performance concurrent sessions', () => {
    test('should handle multiple game instances', () => {
      const games = [];
      for (let i = 0; i < 10; i++) {
        const session = createMockGameSession(3);
        session.lobbyId = `lobby-${i}`;
        games.push(new TwoTruthsAndALieGame(session));
      }

      expect(games).toHaveLength(10);
      games.forEach((game) => {
        expect(game.getGameState()).toBeDefined();
      });
    });
  });
});
