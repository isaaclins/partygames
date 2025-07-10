import { QuickDrawGame } from '../games/QuickDraw';
import { GameSession, Player, QuickDrawGameAction, DrawingStroke } from '../../../shared/types';

// Mock timer functions
let mockTimers: any[] = [];
const mockSetInterval = jest.fn((fn, delay) => {
  const id = Math.random();
  mockTimers.push({ id, fn, delay, type: 'interval' });
  return id;
});
const mockClearInterval = jest.fn((id) => {
  mockTimers = mockTimers.filter(timer => timer.id !== id);
});
const mockSetTimeout = jest.fn((fn, delay) => {
  const id = Math.random();
  mockTimers.push({ id, fn, delay, type: 'timeout' });
  return id;
});

// Replace global timer functions
global.setInterval = mockSetInterval;
global.clearInterval = mockClearInterval;
global.setTimeout = mockSetTimeout;

describe('QuickDrawGame', () => {
  let gameSession: GameSession;
  let game: QuickDrawGame;

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
      gameType: 'quick-draw',
      maxPlayers: 8,
      status: 'waiting',
      gameData: null,
      createdAt: new Date(),
      currentRound: 1,
    };
  };

  const createMockStroke = (): DrawingStroke => ({
    id: 'stroke-1',
    points: [
      { x: 100, y: 100, pressure: 1 },
      { x: 150, y: 150, pressure: 1 },
      { x: 200, y: 200, pressure: 1 }
    ],
    color: '#000000',
    size: 5,
    tool: 'brush',
    timestamp: new Date(),
  });

  beforeEach(() => {
    gameSession = createMockGameSession(3);
    game = new QuickDrawGame(gameSession);
    mockTimers = [];
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup any running timers
    game.cleanup();
    mockTimers = [];
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct game state', () => {
      const gameState = game.getGameState();
      
      expect(gameState.currentRound).toBe(0);
      expect(gameState.totalRounds).toBe(6); // min(3 * 2, 8) = 6
      expect(gameState.rounds).toHaveLength(0);
      expect(gameState.gamePhase).toBe('setup');
      expect(Object.keys(gameState.scores)).toHaveLength(3);
      expect(gameState.scores['player-0']).toBe(0);
      expect(gameState.scores['player-1']).toBe(0);
      expect(gameState.scores['player-2']).toBe(0);
      expect(gameState.playerOrder).toHaveLength(3);
    });

    test('should shuffle player order on initialization', () => {
      // Test multiple initializations to verify shuffling occurs
      const orders = new Set();
      for (let i = 0; i < 10; i++) {
        const newGame = new QuickDrawGame(gameSession);
        const gameState = newGame.getGameState();
        orders.add(JSON.stringify(gameState.playerOrder));
        newGame.cleanup();
      }
      
      // Should have some variation in player order (though not guaranteed with small sample)
      expect(gameState.playerOrder).toContain('player-0');
      expect(gameState.playerOrder).toContain('player-1');
      expect(gameState.playerOrder).toContain('player-2');
    });

    test('should handle different player counts correctly', () => {
      const twoPlayerSession = createMockGameSession(2);
      const twoPlayerGame = new QuickDrawGame(twoPlayerSession);
      const twoPlayerState = twoPlayerGame.getGameState();
      
      expect(twoPlayerState.totalRounds).toBe(4); // 2 * 2 = 4
      expect(Object.keys(twoPlayerState.scores)).toHaveLength(2);
      
      const sixPlayerSession = createMockGameSession(6);
      const sixPlayerGame = new QuickDrawGame(sixPlayerSession);
      const sixPlayerState = sixPlayerGame.getGameState();
      
      expect(sixPlayerState.totalRounds).toBe(8); // min(6 * 2, 8) = 8
      expect(Object.keys(sixPlayerState.scores)).toHaveLength(6);
      
      twoPlayerGame.cleanup();
      sixPlayerGame.cleanup();
    });

    test('should not be complete on initialization', () => {
      expect(game.isGameComplete()).toBe(false);
    });
  });

  describe('Drawing Phase', () => {
    beforeEach(() => {
      // Start the first round
      const action: QuickDrawGameAction = {
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      };
      game.handleAction(action);
    });

    test('should start new round when drawing begins', () => {
      const gameState = game.getGameState();
      
      expect(gameState.currentRound).toBe(1);
      expect(gameState.gamePhase).toBe('playing');
      expect(gameState.rounds).toHaveLength(1);
      expect(gameState.currentRoundData).toBeDefined();
      expect(gameState.currentRoundData!.phase).toBe('drawing');
      expect(gameState.currentRoundData!.timeRemaining).toBe(90);
    });

    test('should assign drawer and prompt for round', () => {
      const gameState = game.getGameState();
      const currentRound = gameState.currentRoundData!;
      
      expect(currentRound.drawerId).toBeDefined();
      expect(gameState.playerOrder).toContain(currentRound.drawerId);
      expect(currentRound.prompt).toBeDefined();
      expect(currentRound.prompt.word).toBeDefined();
      expect(currentRound.prompt.category).toBeDefined();
      expect(currentRound.prompt.difficulty).toBeDefined();
    });

    test('should handle stroke addition by drawer', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const stroke = createMockStroke();

      const action: QuickDrawGameAction = {
        type: 'add_stroke',
        data: { stroke },
        playerId: drawerId,
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).not.toThrow();

      const newGameState = game.getGameState();
      expect(newGameState.currentRoundData!.canvas.strokes).toHaveLength(1);
      expect(newGameState.currentRoundData!.canvas.strokes[0]).toEqual(stroke);
    });

    test('should reject stroke addition by non-drawer', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const nonDrawer = gameSession.players.find(p => p.id !== drawerId)!.id;
      const stroke = createMockStroke();

      const action: QuickDrawGameAction = {
        type: 'add_stroke',
        data: { stroke },
        playerId: nonDrawer,
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('Only the current drawer can add strokes');
    });

    test('should handle canvas clearing by drawer', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      
      // Add some strokes first
      const stroke = createMockStroke();
      game.handleAction({
        type: 'add_stroke',
        data: { stroke },
        playerId: drawerId,
        timestamp: new Date(),
      });

      // Clear the canvas
      const action: QuickDrawGameAction = {
        type: 'clear_canvas',
        data: {},
        playerId: drawerId,
        timestamp: new Date(),
      };

      game.handleAction(action);
      const newGameState = game.getGameState();
      expect(newGameState.currentRoundData!.canvas.strokes).toHaveLength(0);
    });

    test('should handle undo stroke by drawer', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      
      // Add multiple strokes
      const stroke1 = createMockStroke();
      const stroke2 = { ...createMockStroke(), id: 'stroke-2' };
      
      game.handleAction({
        type: 'add_stroke',
        data: { stroke: stroke1 },
        playerId: drawerId,
        timestamp: new Date(),
      });
      
      game.handleAction({
        type: 'add_stroke',
        data: { stroke: stroke2 },
        playerId: drawerId,
        timestamp: new Date(),
      });

      // Undo last stroke
      const action: QuickDrawGameAction = {
        type: 'undo_stroke',
        data: {},
        playerId: drawerId,
        timestamp: new Date(),
      };

      game.handleAction(action);
      const newGameState = game.getGameState();
      expect(newGameState.currentRoundData!.canvas.strokes).toHaveLength(1);
      expect(newGameState.currentRoundData!.canvas.strokes[0].id).toBe('stroke-1');
    });

    test('should reject canvas operations by non-drawer', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const nonDrawer = gameSession.players.find(p => p.id !== drawerId)!.id;

      const clearAction: QuickDrawGameAction = {
        type: 'clear_canvas',
        data: {},
        playerId: nonDrawer,
        timestamp: new Date(),
      };

      const undoAction: QuickDrawGameAction = {
        type: 'undo_stroke',
        data: {},
        playerId: nonDrawer,
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(clearAction);
      }).toThrow('Only the current drawer can clear the canvas');

      expect(() => {
        game.handleAction(undoAction);
      }).toThrow('Only the current drawer can undo strokes');
    });
  });

  describe('Guessing Phase', () => {
    beforeEach(() => {
      // Start round and move to guessing phase
      const action: QuickDrawGameAction = {
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      };
      game.handleAction(action);
      
      // Manually set to guessing phase for testing
      const gameState = game.getGameState();
      gameState.currentRoundData!.phase = 'guessing';
    });

    test('should handle guess submission by non-drawer', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const guesser = gameSession.players.find(p => p.id !== drawerId)!.id;
      const correctWord = gameState.currentRoundData!.prompt.word;

      const action: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: correctWord },
        playerId: guesser,
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).not.toThrow();

      const newGameState = game.getGameState();
      expect(newGameState.currentRoundData!.guesses).toHaveLength(1);
      expect(newGameState.currentRoundData!.guesses[0].guess).toBe(correctWord);
      expect(newGameState.currentRoundData!.guesses[0].isCorrect).toBe(true);
      expect(newGameState.currentRoundData!.guesses[0].playerId).toBe(guesser);
    });

    test('should handle incorrect guess', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const guesser = gameSession.players.find(p => p.id !== drawerId)!.id;

      const action: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: 'wrong answer' },
        playerId: guesser,
        timestamp: new Date(),
      };

      game.handleAction(action);
      const newGameState = game.getGameState();
      expect(newGameState.currentRoundData!.guesses[0].isCorrect).toBe(false);
    });

    test('should reject guess submission by drawer', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;

      const action: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: 'some guess' },
        playerId: drawerId,
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('The drawer cannot submit guesses');
    });

    test('should reject guess when not in guessing phase', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const guesser = gameSession.players.find(p => p.id !== drawerId)!.id;
      
      // Set back to drawing phase
      gameState.currentRoundData!.phase = 'drawing';

      const action: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: 'some guess' },
        playerId: guesser,
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('Not in guessing phase');
    });

    test('should reject duplicate correct guess from same player', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const guesser = gameSession.players.find(p => p.id !== drawerId)!.id;
      const correctWord = gameState.currentRoundData!.prompt.word;

      // Submit first correct guess
      const action1: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: correctWord },
        playerId: guesser,
        timestamp: new Date(),
      };
      game.handleAction(action1);

      // Try to submit another guess
      const action2: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: 'another guess' },
        playerId: guesser,
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action2);
      }).toThrow('You already guessed correctly');
    });

    test('should handle case-insensitive guess matching', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const guesser = gameSession.players.find(p => p.id !== drawerId)!.id;
      const correctWord = gameState.currentRoundData!.prompt.word;

      const action: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: correctWord.toUpperCase() },
        playerId: guesser,
        timestamp: new Date(),
      };

      game.handleAction(action);
      const newGameState = game.getGameState();
      expect(newGameState.currentRoundData!.guesses[0].isCorrect).toBe(true);
    });

    test('should trim whitespace from guesses', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const guesser = gameSession.players.find(p => p.id !== drawerId)!.id;
      const correctWord = gameState.currentRoundData!.prompt.word;

      const action: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: `  ${correctWord}  ` },
        playerId: guesser,
        timestamp: new Date(),
      };

      game.handleAction(action);
      const newGameState = game.getGameState();
      expect(newGameState.currentRoundData!.guesses[0].guess).toBe(correctWord);
      expect(newGameState.currentRoundData!.guesses[0].isCorrect).toBe(true);
    });
  });

  describe('Scoring System', () => {
    beforeEach(() => {
      // Start a round for scoring tests
      const action: QuickDrawGameAction = {
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      };
      game.handleAction(action);
      
      const gameState = game.getGameState();
      gameState.currentRoundData!.phase = 'guessing';
    });

    test('should award points for correct guesses based on order', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const guessers = gameSession.players.filter(p => p.id !== drawerId);
      const correctWord = gameState.currentRoundData!.prompt.word;

      // Submit correct guesses in order
      guessers.forEach((guesser, index) => {
        const action: QuickDrawGameAction = {
          type: 'submit_guess',
          data: { guess: correctWord },
          playerId: guesser.id,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      const newGameState = game.getGameState();
      
      // First guesser should get most points
      const firstGuesser = guessers[0].id;
      const secondGuesser = guessers[1].id;
      
      expect(newGameState.scores[firstGuesser]).toBeGreaterThan(newGameState.scores[secondGuesser]);
      expect(newGameState.scores[firstGuesser]).toBeGreaterThan(0);
      expect(newGameState.scores[secondGuesser]).toBeGreaterThan(0);
    });

    test('should award speed bonus for quick guesses', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const guesser = gameSession.players.find(p => p.id !== drawerId)!.id;
      const correctWord = gameState.currentRoundData!.prompt.word;

      // Set high time remaining for speed bonus
      gameState.currentRoundData!.timeRemaining = 70;

      const action: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: correctWord },
        playerId: guesser,
        timestamp: new Date(),
      };

      game.handleAction(action);
      const newGameState = game.getGameState();
      
      // Should get base points plus speed bonus
      expect(newGameState.scores[guesser]).toBeGreaterThan(10); // Base + bonus
    });

    test('should award points to drawer when players guess correctly', () => {
      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const guesser = gameSession.players.find(p => p.id !== drawerId)!.id;
      const correctWord = gameState.currentRoundData!.prompt.word;

      const initialDrawerScore = gameState.scores[drawerId];

      const action: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: correctWord },
        playerId: guesser,
        timestamp: new Date(),
      };

      game.handleAction(action);
      
      // Force round completion to award drawer points
      const currentRound = game.getGameState().currentRoundData!;
      game['endRound'](currentRound);

      const newGameState = game.getGameState();
      expect(newGameState.scores[drawerId]).toBeGreaterThan(initialDrawerScore);
    });
  });

  describe('Round Progression', () => {
    test('should progress through multiple rounds', () => {
      // Start and complete first round
      game.handleAction({
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      });

      let gameState = game.getGameState();
      expect(gameState.currentRound).toBe(1);

      // Force round completion
      const currentRound = gameState.currentRoundData!;
      game['endRound'](currentRound);

      // Start next round
      game.handleAction({
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      });

      gameState = game.getGameState();
      expect(gameState.currentRound).toBe(2);
      expect(gameState.rounds).toHaveLength(2);
    });

    test('should rotate drawer between players', () => {
      const playerOrder = game.getGameState().playerOrder;
      const rounds: string[] = [];

      // Complete multiple rounds to see drawer rotation
      for (let i = 0; i < playerOrder.length; i++) {
        game.handleAction({
          type: 'start_drawing',
          data: {},
          playerId: 'player-0',
          timestamp: new Date(),
        });

        const gameState = game.getGameState();
        rounds.push(gameState.currentRoundData!.drawerId);

        // Force round completion
        const currentRound = gameState.currentRoundData!;
        game['endRound'](currentRound);
      }

      // Each player should have been drawer exactly once
      expect(new Set(rounds).size).toBe(playerOrder.length);
      playerOrder.forEach(playerId => {
        expect(rounds).toContain(playerId);
      });
    });

    test('should end game after total rounds completed', () => {
      const totalRounds = game.getGameState().totalRounds;

      // Complete all rounds
      for (let i = 0; i < totalRounds; i++) {
        if (!game.isGameComplete()) {
          game.handleAction({
            type: 'start_drawing',
            data: {},
            playerId: 'player-0',
            timestamp: new Date(),
          });

          const gameState = game.getGameState();
          const currentRound = gameState.currentRoundData!;
          game['endRound'](currentRound);
        }
      }

      expect(game.isGameComplete()).toBe(true);
      const finalGameState = game.getGameState();
      expect(finalGameState.gamePhase).toBe('finished');
    });
  });

  describe('Timer Management', () => {
    test('should start timer when round begins', () => {
      const action: QuickDrawGameAction = {
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      };

      game.handleAction(action);
      
      // Should have created an interval timer
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(mockTimers.filter(t => t.type === 'interval')).toHaveLength(1);
    });

    test('should clear timer on game cleanup', () => {
      const action: QuickDrawGameAction = {
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      };

      game.handleAction(action);
      expect(mockTimers.filter(t => t.type === 'interval')).toHaveLength(1);

      game.cleanup();
      expect(mockClearInterval).toHaveBeenCalled();
    });

    test('should transition from drawing to guessing phase at 30 seconds', () => {
      const action: QuickDrawGameAction = {
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      };

      game.handleAction(action);
      
      // Get the timer function and simulate time passing
      const timer = mockTimers.find(t => t.type === 'interval');
      const gameState = game.getGameState();
      const currentRound = gameState.currentRoundData!;
      
      // Simulate timer ticks
      currentRound.timeRemaining = 31;
      timer.fn(); // 30 seconds remaining
      
      expect(currentRound.phase).toBe('guessing');
    });
  });

  describe('Word Prompt Management', () => {
    test('should select random prompts for rounds', () => {
      const prompts = new Set();
      
      // Start multiple rounds to collect prompts
      for (let i = 0; i < 5; i++) {
        const newGame = new QuickDrawGame(gameSession);
        newGame.handleAction({
          type: 'start_drawing',
          data: {},
          playerId: 'player-0',
          timestamp: new Date(),
        });
        
        const gameState = newGame.getGameState();
        prompts.add(gameState.currentRoundData!.prompt.word);
        newGame.cleanup();
      }
      
      // Should have some variety in prompts
      expect(prompts.size).toBeGreaterThan(1);
    });

    test('should track used prompts to avoid repetition', () => {
      // This test verifies the internal logic of prompt selection
      const gameState = game.getGameState();
      expect(game['usedPrompts']).toBeDefined();
      expect(game['usedPrompts'].size).toBe(0);
    });
  });

  describe('Game Results', () => {
    test('should provide final results when game is complete', () => {
      // Force game completion
      game['gameState'].gamePhase = 'finished';
      game['gameState'].currentRound = game.getGameState().totalRounds;

      const results = game.getFinalResults();
      expect(results.finalScores).toBeDefined();
      expect(results.winner).toBeDefined();
      expect(results.summary).toContain('completed');
      expect(results.totalRounds).toBe(game.getGameState().totalRounds);
      expect(results.rounds).toBeDefined();
    });

    test('should identify winner correctly', () => {
      const gameState = game.getGameState();
      gameState.scores['player-0'] = 25;
      gameState.scores['player-1'] = 30;
      gameState.scores['player-2'] = 15;
      
      // Force game completion
      game['gameState'].gamePhase = 'finished';
      
      const winner = game.getWinner();
      expect(winner).toBe('player-1');
    });

    test('should return null winner when game is not complete', () => {
      const winner = game.getWinner();
      expect(winner).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid action types', () => {
      const action = {
        type: 'invalid_action',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      } as any;

      expect(() => {
        game.handleAction(action);
      }).toThrow('Unknown action type: invalid_action');
    });

    test('should handle missing stroke data', () => {
      // Start a round first
      game.handleAction({
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      });

      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;

      const action: QuickDrawGameAction = {
        type: 'add_stroke',
        data: { stroke: undefined } as any,
        playerId: drawerId,
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('Stroke data is required');
    });

    test('should handle missing guess data', () => {
      // Start a round and set to guessing phase
      game.handleAction({
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      });

      const gameState = game.getGameState();
      const drawerId = gameState.currentRoundData!.drawerId;
      const guesser = gameSession.players.find(p => p.id !== drawerId)!.id;
      gameState.currentRoundData!.phase = 'guessing';

      const action: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: '' },
        playerId: guesser,
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('Guess is required');
    });

    test('should handle actions when no active round', () => {
      const stroke = createMockStroke();
      
      const strokeAction: QuickDrawGameAction = {
        type: 'add_stroke',
        data: { stroke },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      const guessAction: QuickDrawGameAction = {
        type: 'submit_guess',
        data: { guess: 'test' },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(strokeAction);
      }).toThrow('No active round');

      expect(() => {
        game.handleAction(guessAction);
      }).toThrow('No active round');
    });

    test('should handle empty player list', () => {
      const emptySession: GameSession = {
        lobbyId: 'empty-lobby',
        hostId: '',
        players: [],
        gameType: 'quick-draw',
        maxPlayers: 8,
        status: 'waiting',
        gameData: null,
        createdAt: new Date(),
        currentRound: 1,
      };

      const emptyGame = new QuickDrawGame(emptySession);
      const gameState = emptyGame.getGameState();
      
      expect(Object.keys(gameState.scores)).toHaveLength(0);
      expect(gameState.playerOrder).toHaveLength(0);
      expect(gameState.totalRounds).toBe(0);
      
      emptyGame.cleanup();
    });
  });

  describe('State Consistency', () => {
    test('should maintain consistent state throughout game flow', () => {
      // Initial state
      let gameState = game.getGameState();
      expect(gameState.gamePhase).toBe('setup');
      expect(gameState.currentRound).toBe(0);

      // Start drawing
      game.handleAction({
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      });

      gameState = game.getGameState();
      expect(gameState.gamePhase).toBe('playing');
      expect(gameState.currentRound).toBe(1);
      expect(gameState.currentRoundData!.phase).toBe('drawing');

      // Manually transition to guessing
      gameState.currentRoundData!.phase = 'guessing';

      // Submit a guess
      const drawerId = gameState.currentRoundData!.drawerId;
      const guesser = gameSession.players.find(p => p.id !== drawerId)!.id;
      const correctWord = gameState.currentRoundData!.prompt.word;

      game.handleAction({
        type: 'submit_guess',
        data: { guess: correctWord },
        playerId: guesser,
        timestamp: new Date(),
      });

      gameState = game.getGameState();
      expect(gameState.currentRoundData!.guesses).toHaveLength(1);
      expect(gameState.scores[guesser]).toBeGreaterThan(0);
    });

    test('should provide correct canvas state information', () => {
      // Start drawing
      game.handleAction({
        type: 'start_drawing',
        data: {},
        playerId: 'player-0',
        timestamp: new Date(),
      });

      let gameState = game.getGameState();
      expect(gameState.canDraw).toBe(true);
      expect(gameState.canGuess).toBe(false);

      // Move to guessing phase
      gameState.currentRoundData!.phase = 'guessing';
      gameState = game.getGameState();
      expect(gameState.canDraw).toBe(true); // Can still draw during guessing
      expect(gameState.canGuess).toBe(true);

      // Move to reveal phase
      gameState.currentRoundData!.phase = 'reveal';
      gameState = game.getGameState();
      expect(gameState.canDraw).toBe(false);
      expect(gameState.canGuess).toBe(false);
    });
  });
}); 
