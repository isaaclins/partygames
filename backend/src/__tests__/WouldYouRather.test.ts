import { WouldYouRatherGame } from '../games/WouldYouRather';
import {
  GameSession,
  Player,
  WouldYouRatherGameAction,
} from '../../../shared/types/index.js';

describe('WouldYouRatherGame', () => {
  let gameSession: GameSession;
  let game: WouldYouRatherGame;

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
      gameType: 'would-you-rather',
      maxPlayers: 8,
      status: 'waiting',
      gameData: null,
      createdAt: new Date(),
      currentRound: 1,
    };
  };

  beforeEach(() => {
    gameSession = createMockGameSession(3);
    game = new WouldYouRatherGame(gameSession);
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct game state', () => {
      const gameState = game.getGameState();

      expect(gameState.currentPhase).toBe('submitting');
      expect(gameState.currentRound).toBe(1);
      expect(gameState.maxRounds).toBe(3);
      expect(gameState.scenarios).toHaveLength(0);
      expect(gameState.votes).toHaveLength(0);
      expect(gameState.currentScenarioIndex).toBe(0);
      expect(Object.keys(gameState.scores)).toHaveLength(3);
      expect(gameState.scores['player-0']).toBe(0);
      expect(gameState.scores['player-1']).toBe(0);
      expect(gameState.scores['player-2']).toBe(0);
    });

    test('should initialize with correct player count', () => {
      const fourPlayerSession = createMockGameSession(4);
      const fourPlayerGame = new WouldYouRatherGame(fourPlayerSession);
      const gameState = fourPlayerGame.getGameState();

      expect(Object.keys(gameState.scores)).toHaveLength(4);
    });

    test('should handle single player initialization', () => {
      const singlePlayerSession = createMockGameSession(1);
      const singlePlayerGame = new WouldYouRatherGame(singlePlayerSession);
      const gameState = singlePlayerGame.getGameState();

      expect(Object.keys(gameState.scores)).toHaveLength(1);
    });

    test('should not be complete on initialization', () => {
      expect(game.isGameComplete()).toBe(false);
    });
  });

  describe('Scenario Submission', () => {
    test('should handle valid scenario submission', () => {
      const action: WouldYouRatherGameAction = {
        type: 'submit_scenario',
        data: {
          optionA: 'Have the ability to fly',
          optionB: 'Have the ability to become invisible',
        },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).not.toThrow();

      const gameState = game.getGameState();
      expect(gameState.scenarios).toHaveLength(1);
      expect(gameState.scenarios[0].optionA).toBe('Have the ability to fly');
      expect(gameState.scenarios[0].optionB).toBe(
        'Have the ability to become invisible'
      );
      expect(gameState.scenarios[0].submittedBy).toBe('player-0');
      expect(gameState.scenarios[0].round).toBe(1);
    });

    test('should reject submission when not in submitting phase', () => {
      // Submit scenarios for all players to move to voting phase
      ['player-0', 'player-1', 'player-2'].forEach((playerId, index) => {
        const action: WouldYouRatherGameAction = {
          type: 'submit_scenario',
          data: {
            optionA: `Option A${index}`,
            optionB: `Option B${index}`,
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      // Now game should be in voting phase
      const action: WouldYouRatherGameAction = {
        type: 'submit_scenario',
        data: {
          optionA: 'New Option A',
          optionB: 'New Option B',
        },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('Not in submission phase');
    });

    test('should reject submission with missing option A', () => {
      const action: WouldYouRatherGameAction = {
        type: 'submit_scenario',
        data: {
          optionA: '',
          optionB: 'Have the ability to become invisible',
        },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('Both options are required');
    });

    test('should reject submission with missing option B', () => {
      const action: WouldYouRatherGameAction = {
        type: 'submit_scenario',
        data: {
          optionA: 'Have the ability to fly',
          optionB: '',
        },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('Both options are required');
    });

    test('should reject duplicate submission from same player in same round', () => {
      const action: WouldYouRatherGameAction = {
        type: 'submit_scenario',
        data: {
          optionA: 'Have the ability to fly',
          optionB: 'Have the ability to become invisible',
        },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      game.handleAction(action);

      expect(() => {
        game.handleAction(action);
      }).toThrow('Already submitted a scenario for this round');
    });

    test('should trim whitespace from options', () => {
      const action: WouldYouRatherGameAction = {
        type: 'submit_scenario',
        data: {
          optionA: '  Have the ability to fly  ',
          optionB: '  Have the ability to become invisible  ',
        },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      game.handleAction(action);
      const gameState = game.getGameState();

      expect(gameState.scenarios[0].optionA).toBe('Have the ability to fly');
      expect(gameState.scenarios[0].optionB).toBe(
        'Have the ability to become invisible'
      );
    });

    test('should transition to voting phase when all players submit', () => {
      const players = ['player-0', 'player-1', 'player-2'];

      players.forEach((playerId, index) => {
        const action: WouldYouRatherGameAction = {
          type: 'submit_scenario',
          data: {
            optionA: `Option A${index}`,
            optionB: `Option B${index}`,
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      const gameState = game.getGameState();
      expect(gameState.currentPhase).toBe('voting');
      expect(gameState.currentScenarioIndex).toBe(0);
      expect(gameState.currentScenario).toBeDefined();
    });

    test('should generate unique IDs for scenarios', () => {
      const actions = ['player-0', 'player-1'].map((playerId, index) => ({
        type: 'submit_scenario' as const,
        data: {
          optionA: `Option A${index}`,
          optionB: `Option B${index}`,
        },
        playerId,
        timestamp: new Date(),
      }));

      actions.forEach((action) => game.handleAction(action));

      const gameState = game.getGameState();
      const ids = gameState.scenarios.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length); // All IDs should be unique
    });
  });

  describe('Voting Phase', () => {
    beforeEach(() => {
      // Submit scenarios for all players to reach voting phase
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: WouldYouRatherGameAction = {
          type: 'submit_scenario',
          data: {
            optionA: `Option A${index}`,
            optionB: `Option B${index}`,
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });
    });

    test('should handle valid vote submission', () => {
      const gameState = game.getGameState();
      const currentScenario = gameState.currentScenario!;

      const action: WouldYouRatherGameAction = {
        type: 'submit_vote',
        data: {
          scenarioId: currentScenario.id,
          choice: 'A',
        },
        playerId: 'player-1', // Not the scenario creator
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).not.toThrow();

      const newGameState = game.getGameState();
      expect(newGameState.votes).toHaveLength(1);
      expect(newGameState.votes[0].choice).toBe('A');
      expect(newGameState.votes[0].voterId).toBe('player-1');
    });

    test('should reject vote when not in voting phase', () => {
      // Create new game in submission phase
      const newGame = new WouldYouRatherGame(gameSession);

      const action: WouldYouRatherGameAction = {
        type: 'submit_vote',
        data: {
          scenarioId: 'some-id',
          choice: 'A',
        },
        playerId: 'player-1',
        timestamp: new Date(),
      };

      expect(() => {
        newGame.handleAction(action);
      }).toThrow('Not in voting phase');
    });

    test('should reject vote with invalid choice', () => {
      const gameState = game.getGameState();
      const currentScenario = gameState.currentScenario!;

      const action: WouldYouRatherGameAction = {
        type: 'submit_vote',
        data: {
          scenarioId: currentScenario.id,
          choice: 'C' as any, // Invalid choice
        },
        playerId: 'player-1',
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('Choice must be A or B');
    });

    test('should reject vote for non-existent scenario', () => {
      const action: WouldYouRatherGameAction = {
        type: 'submit_vote',
        data: {
          scenarioId: 'non-existent-id',
          choice: 'A',
        },
        playerId: 'player-1',
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('Scenario not found');
    });

    test('should reject duplicate vote for same scenario', () => {
      const gameState = game.getGameState();
      const currentScenario = gameState.currentScenario!;

      const action: WouldYouRatherGameAction = {
        type: 'submit_vote',
        data: {
          scenarioId: currentScenario.id,
          choice: 'A',
        },
        playerId: 'player-1',
        timestamp: new Date(),
      };

      game.handleAction(action);

      expect(() => {
        game.handleAction(action);
      }).toThrow('Already voted for this scenario');
    });

    test('should move to next scenario when all eligible players vote', () => {
      const gameState = game.getGameState();
      const currentScenario = gameState.currentScenario!;

      // All players except scenario creator should vote
      const voters = gameSession.players.filter(
        (p) => p.id !== currentScenario.submittedBy
      );

      voters.forEach((voter) => {
        const action: WouldYouRatherGameAction = {
          type: 'submit_vote',
          data: {
            scenarioId: currentScenario.id,
            choice: 'A',
          },
          playerId: voter.id,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      const newGameState = game.getGameState();
      expect(newGameState.currentScenarioIndex).toBe(1);
    });

    test('should provide voting progress information', () => {
      const gameState = game.getGameState();
      expect(gameState.votingProgress).toBeDefined();
      expect(gameState.votingProgress!.voted).toBe(0);
      expect(gameState.votingProgress!.total).toBe(2); // 3 players - 1 creator
    });
  });

  describe('Round Progression', () => {
    beforeEach(() => {
      // Setup a complete round scenario
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: WouldYouRatherGameAction = {
          type: 'submit_scenario',
          data: {
            optionA: `Option A${index}`,
            optionB: `Option B${index}`,
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });
    });

    test('should complete voting on all scenarios in a round', () => {
      const gameState = game.getGameState();
      const scenarios = gameState.scenarios.filter((s) => s.round === 1);

      // Vote on all scenarios
      scenarios.forEach((scenario) => {
        const voters = gameSession.players.filter(
          (p) => p.id !== scenario.submittedBy
        );
        voters.forEach((voter) => {
          const action: WouldYouRatherGameAction = {
            type: 'submit_vote',
            data: {
              scenarioId: scenario.id,
              choice: 'A',
            },
            playerId: voter.id,
            timestamp: new Date(),
          };
          game.handleAction(action);
        });
      });

      const finalGameState = game.getGameState();
      expect(finalGameState.currentRound).toBe(2);
      expect(finalGameState.currentPhase).toBe('submitting');
    });

    test('should end game after max rounds', () => {
      // Complete 3 rounds
      for (let round = 1; round <= 3; round++) {
        // Submit scenarios if in submission phase
        if (game.getGameState().currentPhase === 'submitting') {
          const players = ['player-0', 'player-1', 'player-2'];
          players.forEach((playerId, index) => {
            const action: WouldYouRatherGameAction = {
              type: 'submit_scenario',
              data: {
                optionA: `Round ${round} Option A${index}`,
                optionB: `Round ${round} Option B${index}`,
              },
              playerId,
              timestamp: new Date(),
            };
            game.handleAction(action);
          });
        }

        // Vote on all scenarios in the round
        const gameState = game.getGameState();
        const scenarios = gameState.scenarios.filter((s) => s.round === round);

        scenarios.forEach((scenario) => {
          const voters = gameSession.players.filter(
            (p) => p.id !== scenario.submittedBy
          );
          voters.forEach((voter) => {
            const action: WouldYouRatherGameAction = {
              type: 'submit_vote',
              data: {
                scenarioId: scenario.id,
                choice: 'A',
              },
              playerId: voter.id,
              timestamp: new Date(),
            };
            game.handleAction(action);
          });
        });
      }

      expect(game.isGameComplete()).toBe(true);
      const finalGameState = game.getGameState();
      expect(finalGameState.currentPhase).toBe('results');
    });
  });

  describe('Scoring System', () => {
    beforeEach(() => {
      // Setup game for scoring tests
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: WouldYouRatherGameAction = {
          type: 'submit_scenario',
          data: {
            optionA: `Option A${index}`,
            optionB: `Option B${index}`,
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });
    });

    test('should award points for scenario creation and voting', () => {
      const gameState = game.getGameState();
      const firstScenario = gameState.scenarios[0];

      // Vote on first scenario
      const voters = gameSession.players.filter(
        (p) => p.id !== firstScenario.submittedBy
      );
      voters.forEach((voter) => {
        const action: WouldYouRatherGameAction = {
          type: 'submit_vote',
          data: {
            scenarioId: firstScenario.id,
            choice: 'A',
          },
          playerId: voter.id,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      const newGameState = game.getGameState();

      // Scenario creator should get points for votes received
      expect(newGameState.scores[firstScenario.submittedBy]).toBeGreaterThan(0);

      // Voters should get points for participating
      voters.forEach((voter) => {
        expect(newGameState.scores[voter.id]).toBeGreaterThan(0);
      });
    });

    test('should accumulate scores across multiple scenarios', () => {
      const gameState = game.getGameState();

      // Vote on all scenarios
      gameState.scenarios.forEach((scenario) => {
        const voters = gameSession.players.filter(
          (p) => p.id !== scenario.submittedBy
        );
        voters.forEach((voter) => {
          const action: WouldYouRatherGameAction = {
            type: 'submit_vote',
            data: {
              scenarioId: scenario.id,
              choice: 'A',
            },
            playerId: voter.id,
            timestamp: new Date(),
          };
          game.handleAction(action);
        });
      });

      const finalGameState = game.getGameState();

      // All players should have some points
      Object.values(finalGameState.scores).forEach((score) => {
        expect(score).toBeGreaterThan(0);
      });
    });
  });

  describe('Game Results', () => {
    test('should provide final results when game is complete', () => {
      // Complete the game
      for (let round = 1; round <= 3; round++) {
        if (game.getGameState().currentPhase === 'submitting') {
          const players = ['player-0', 'player-1', 'player-2'];
          players.forEach((playerId, index) => {
            const action: WouldYouRatherGameAction = {
              type: 'submit_scenario',
              data: {
                optionA: `Round ${round} Option A${index}`,
                optionB: `Round ${round} Option B${index}`,
              },
              playerId,
              timestamp: new Date(),
            };
            game.handleAction(action);
          });
        }

        const gameState = game.getGameState();
        const scenarios = gameState.scenarios.filter((s) => s.round === round);

        scenarios.forEach((scenario) => {
          const voters = gameSession.players.filter(
            (p) => p.id !== scenario.submittedBy
          );
          voters.forEach((voter) => {
            const action: WouldYouRatherGameAction = {
              type: 'submit_vote',
              data: {
                scenarioId: scenario.id,
                choice: 'A',
              },
              playerId: voter.id,
              timestamp: new Date(),
            };
            game.handleAction(action);
          });
        });
      }

      const results = game.getFinalResults();
      expect(results.finalScores).toBeDefined();
      expect(results.winner).toBeDefined();
      expect(results.summary).toContain('completed after 3 rounds');
      expect(results.totalScenarios).toBe(9); // 3 rounds × 3 players
    });

    test('should identify winner correctly', () => {
      // Manually set scores to test winner selection
      const gameState = game.getGameState();
      gameState.scores['player-0'] = 10;
      gameState.scores['player-1'] = 15;
      gameState.scores['player-2'] = 5;

      // Force game to complete
      game['gameState'].currentPhase = 'results';

      const winner = game.getWinner();
      expect(winner).toBe('player-1');
    });

    test('should return null winner when game is not complete', () => {
      const winner = game.getWinner();
      expect(winner).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid action type', () => {
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

    test('should handle missing scenario ID in vote', () => {
      // Setup voting phase
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: WouldYouRatherGameAction = {
          type: 'submit_scenario',
          data: {
            optionA: `Option A${index}`,
            optionB: `Option B${index}`,
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      const action: WouldYouRatherGameAction = {
        type: 'submit_vote',
        data: {
          scenarioId: '',
          choice: 'A',
        },
        playerId: 'player-1',
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('Scenario ID and choice are required');
    });

    test('should handle missing choice in vote', () => {
      // Setup voting phase
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: WouldYouRatherGameAction = {
          type: 'submit_scenario',
          data: {
            optionA: `Option A${index}`,
            optionB: `Option B${index}`,
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      const gameState = game.getGameState();
      const action: WouldYouRatherGameAction = {
        type: 'submit_vote',
        data: {
          scenarioId: gameState.currentScenario!.id,
          choice: '' as any,
        },
        playerId: 'player-1',
        timestamp: new Date(),
      };

      expect(() => {
        game.handleAction(action);
      }).toThrow('Scenario ID and choice are required');
    });

    test('should handle empty player list', () => {
      const emptySession: GameSession = {
        lobbyId: 'empty-lobby',
        hostId: '',
        players: [],
        gameType: 'would-you-rather',
        maxPlayers: 8,
        status: 'waiting',
        gameData: null,
        createdAt: new Date(),
        currentRound: 1,
      };

      const emptyGame = new WouldYouRatherGame(emptySession);
      const gameState = emptyGame.getGameState();

      expect(Object.keys(gameState.scores)).toHaveLength(0);
      expect(gameState.scenarios).toHaveLength(0);
    });
  });

  describe('State Consistency', () => {
    test('should maintain consistent state throughout game flow', () => {
      // Track state consistency through complete round
      let gameState = game.getGameState();
      expect(gameState.currentPhase).toBe('submitting');
      expect(gameState.currentRound).toBe(1);

      // Submit scenarios
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: WouldYouRatherGameAction = {
          type: 'submit_scenario',
          data: {
            optionA: `Option A${index}`,
            optionB: `Option B${index}`,
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      gameState = game.getGameState();
      expect(gameState.currentPhase).toBe('voting');
      expect(gameState.scenarios).toHaveLength(3);
      expect(gameState.currentScenario).toBeDefined();

      // Complete voting on all scenarios
      gameState.scenarios.forEach((scenario) => {
        const voters = gameSession.players.filter(
          (p) => p.id !== scenario.submittedBy
        );
        voters.forEach((voter) => {
          const action: WouldYouRatherGameAction = {
            type: 'submit_vote',
            data: {
              scenarioId: scenario.id,
              choice: 'A',
            },
            playerId: voter.id,
            timestamp: new Date(),
          };
          game.handleAction(action);
        });
      });

      gameState = game.getGameState();
      expect(gameState.currentRound).toBe(2);
      expect(gameState.currentPhase).toBe('submitting');
    });

    test('should track voting progress accurately', () => {
      // Setup voting phase
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: WouldYouRatherGameAction = {
          type: 'submit_scenario',
          data: {
            optionA: `Option A${index}`,
            optionB: `Option B${index}`,
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      let gameState = game.getGameState();
      expect(gameState.votingProgress!.voted).toBe(0);
      expect(gameState.votingProgress!.total).toBe(2);

      // Submit one vote
      const action: WouldYouRatherGameAction = {
        type: 'submit_vote',
        data: {
          scenarioId: gameState.currentScenario!.id,
          choice: 'A',
        },
        playerId: 'player-1',
        timestamp: new Date(),
      };
      game.handleAction(action);

      gameState = game.getGameState();
      expect(gameState.votingProgress!.voted).toBe(1);
      expect(gameState.votingProgress!.total).toBe(2);
    });
  });
});
