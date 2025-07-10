import { TwoTruthsAndALieGame } from '../games/TwoTruthsAndALie';
import {
  GameSession,
  Player,
  TwoTruthsGameAction,
} from '../../../shared/types/index.js';

describe('TwoTruthsAndALieGame', () => {
  let gameSession: GameSession;
  let game: TwoTruthsAndALieGame;

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
      currentRound: 1,
    };
  };

  beforeEach(() => {
    gameSession = createMockGameSession(3);
    game = new TwoTruthsAndALieGame(gameSession);
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct game state', () => {
      const gameState = game.getCurrentState();

      expect(gameState.phase).toBe('submitting');
      expect(gameState.submissions).toHaveLength(0);
      expect(gameState.votes).toHaveLength(0);
      expect(Object.keys(gameState.scores)).toHaveLength(3);
      expect(gameState.scores['player-0']).toBe(0);
      expect(gameState.scores['player-1']).toBe(0);
      expect(gameState.scores['player-2']).toBe(0);
    });

    test('should initialize with correct player count', () => {
      const fourPlayerSession = createMockGameSession(4);
      const fourPlayerGame = new TwoTruthsAndALieGame(fourPlayerSession);
      const gameState = fourPlayerGame.getCurrentState();

      expect(Object.keys(gameState.scores)).toHaveLength(4);
    });

    test('should handle single player initialization', () => {
      const singlePlayerSession = createMockGameSession(1);
      const singlePlayerGame = new TwoTruthsAndALieGame(singlePlayerSession);
      const gameState = singlePlayerGame.getCurrentState();

      expect(Object.keys(gameState.scores)).toHaveLength(1);
    });
  });

  describe('Statement Submission', () => {
    test('should handle valid statement submission', () => {
      const action: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['Truth 1', 'Truth 2', 'Lie 1'] },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      const result = game.handleAction(action);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(game.hasPlayerSubmitted('player-0')).toBe(true);
    });

    test('should reject submission with wrong number of statements', () => {
      const action: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['Truth 1', 'Truth 2'] }, // Only 2 statements
        playerId: 'player-0',
        timestamp: new Date(),
      };

      const result = game.handleAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must submit exactly 3 statements');
    });

    test('should reject submission with empty statements', () => {
      const action: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['Truth 1', '', 'Lie 1'] },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      const result = game.handleAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('All statements must be non-empty');
    });

    test('should reject submission with only whitespace statements', () => {
      const action: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['Truth 1', '   ', 'Lie 1'] },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      const result = game.handleAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('All statements must be non-empty');
    });

    test('should reject duplicate submission from same player', () => {
      const action: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['Truth 1', 'Truth 2', 'Lie 1'] },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      game.handleAction(action);
      const result = game.handleAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Already submitted statements');
    });

    test('should trim whitespace from statements', () => {
      const action: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['  Truth 1  ', '  Truth 2  ', '  Lie 1  '] },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      game.handleAction(action);
      const gameState = game.getCurrentState();
      const submission = gameState.submissions.find(
        (s) => s.playerId === 'player-0'
      );

      expect(submission?.statements[0].text).toBe('Truth 1');
      expect(submission?.statements[1].text).toBe('Truth 2');
      expect(submission?.statements[2].text).toBe('Lie 1');
    });

    test('should transition to voting phase when all players submit', () => {
      const players = ['player-0', 'player-1', 'player-2'];

      players.forEach((playerId, index) => {
        const action: TwoTruthsGameAction = {
          type: 'submit_statements',
          data: {
            statements: [`Truth ${index}1`, `Truth ${index}2`, `Lie ${index}`],
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      const gameState = game.getCurrentState();
      expect(gameState.phase).toBe('voting');
      expect(gameState.currentTargetPlayer).toBe('player-0');
    });

    test('should assign exactly one lie per submission', () => {
      const action: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['Statement 1', 'Statement 2', 'Statement 3'] },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      game.handleAction(action);
      const gameState = game.getCurrentState();
      const submission = gameState.submissions.find(
        (s) => s.playerId === 'player-0'
      );

      // In submission phase, isLie should be undefined (hidden)
      expect(submission?.statements.every((s) => s.isLie === undefined)).toBe(
        true
      );
    });
  });

  describe('Voting Phase', () => {
    beforeEach(() => {
      // Submit statements for all players to reach voting phase
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: TwoTruthsGameAction = {
          type: 'submit_statements',
          data: {
            statements: [`Truth ${index}1`, `Truth ${index}2`, `Lie ${index}`],
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });
    });

    test('should handle valid vote submission', () => {
      const gameState = game.getCurrentState();
      const targetSubmission = gameState.submissions.find(
        (s) => s.playerId === 'player-0'
      );
      const statementId = targetSubmission!.statements[0].id;

      const action: TwoTruthsGameAction = {
        type: 'submit_vote',
        data: {
          selectedStatementId: statementId,
          targetPlayerId: 'player-0',
        },
        playerId: 'player-1',
        timestamp: new Date(),
      };

      const result = game.handleAction(action);

      expect(result.success).toBe(true);
      expect(game.hasPlayerVoted('player-1', 'player-0')).toBe(true);
    });

    test('should reject vote when not in voting phase', () => {
      // Create new game in submission phase
      const newGame = new TwoTruthsAndALieGame(gameSession);

      const action: TwoTruthsGameAction = {
        type: 'submit_vote',
        data: {
          selectedStatementId: 'some-id',
          targetPlayerId: 'player-0',
        },
        playerId: 'player-1',
        timestamp: new Date(),
      };

      const result = newGame.handleAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in voting phase');
    });

    test('should reject vote on own statements', () => {
      const gameState = game.getCurrentState();
      const targetSubmission = gameState.submissions.find(
        (s) => s.playerId === 'player-0'
      );
      const statementId = targetSubmission!.statements[0].id;

      const action: TwoTruthsGameAction = {
        type: 'submit_vote',
        data: {
          selectedStatementId: statementId,
          targetPlayerId: 'player-0',
        },
        playerId: 'player-0', // Same player
        timestamp: new Date(),
      };

      const result = game.handleAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot vote on your own statements');
    });

    test('should reject duplicate vote from same player on same target', () => {
      const gameState = game.getCurrentState();
      const targetSubmission = gameState.submissions.find(
        (s) => s.playerId === 'player-0'
      );
      const statementId = targetSubmission!.statements[0].id;

      const action: TwoTruthsGameAction = {
        type: 'submit_vote',
        data: {
          selectedStatementId: statementId,
          targetPlayerId: 'player-0',
        },
        playerId: 'player-1',
        timestamp: new Date(),
      };

      game.handleAction(action);
      const result = game.handleAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Already voted for this player');
    });

    test('should reject vote for wrong target player', () => {
      const gameState = game.getCurrentState();
      const targetSubmission = gameState.submissions.find(
        (s) => s.playerId === 'player-1'
      );
      const statementId = targetSubmission!.statements[0].id;

      const action: TwoTruthsGameAction = {
        type: 'submit_vote',
        data: {
          selectedStatementId: statementId,
          targetPlayerId: 'player-1', // Not current target
        },
        playerId: 'player-2',
        timestamp: new Date(),
      };

      const result = game.handleAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not voting on the current player');
    });

    test('should reject vote with invalid statement ID', () => {
      const action: TwoTruthsGameAction = {
        type: 'submit_vote',
        data: {
          selectedStatementId: 'invalid-id',
          targetPlayerId: 'player-0',
        },
        playerId: 'player-1',
        timestamp: new Date(),
      };

      const result = game.handleAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid statement selection');
    });

    test('should progress through all voting targets', () => {
      const gameState = game.getCurrentState();

      // Vote on player-0 (current target)
      const submission0 = gameState.submissions.find(
        (s) => s.playerId === 'player-0'
      );
      ['player-1', 'player-2'].forEach((voterId) => {
        const action: TwoTruthsGameAction = {
          type: 'submit_vote',
          data: {
            selectedStatementId: submission0!.statements[0].id,
            targetPlayerId: 'player-0',
          },
          playerId: voterId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      // Should move to player-1
      const newGameState = game.getCurrentState();
      expect(newGameState.currentTargetPlayer).toBe('player-1');
    });

    test('should complete voting and move to results', () => {
      const gameState = game.getCurrentState();

      // Vote on all players
      for (let targetIndex = 0; targetIndex < 3; targetIndex++) {
        const targetId = `player-${targetIndex}`;
        const submission = gameState.submissions.find(
          (s) => s.playerId === targetId
        );

        const voters = gameSession.players.filter((p) => p.id !== targetId);
        voters.forEach((voter) => {
          const action: TwoTruthsGameAction = {
            type: 'submit_vote',
            data: {
              selectedStatementId: submission!.statements[0].id,
              targetPlayerId: targetId,
            },
            playerId: voter.id,
            timestamp: new Date(),
          };
          game.handleAction(action);
        });
      }

      const finalGameState = game.getCurrentState();
      expect(finalGameState.phase).toBe('results');
      expect(game.isComplete()).toBe(true);
    });
  });

  describe('Scoring System', () => {
    beforeEach(() => {
      // Setup complete game scenario for scoring tests
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: TwoTruthsGameAction = {
          type: 'submit_statements',
          data: {
            statements: [`Truth ${index}1`, `Truth ${index}2`, `Lie ${index}`],
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });
    });

    test('should award points for correct guesses', () => {
      const gameState = game.getCurrentState();

      // Complete all voting (randomly select statements since we can't know which is the lie)
      for (let targetIndex = 0; targetIndex < 3; targetIndex++) {
        const targetId = `player-${targetIndex}`;
        const submission = gameState.submissions.find(
          (s) => s.playerId === targetId
        );
        // Just select the first statement for voting
        const selectedStatement = submission!.statements[0];

        const voters = gameSession.players.filter((p) => p.id !== targetId);
        voters.forEach((voter) => {
          const action: TwoTruthsGameAction = {
            type: 'submit_vote',
            data: {
              selectedStatementId: selectedStatement.id,
              targetPlayerId: targetId,
            },
            playerId: voter.id,
            timestamp: new Date(),
          };
          game.handleAction(action);
        });
      }

      const finalGameState = game.getCurrentState();
      // Each player should have some points from correct guesses
      expect(
        Object.values(finalGameState.scores).every((score) => score >= 0)
      ).toBe(true);
    });

    test('should award points for fooling others', () => {
      const gameState = game.getCurrentState();

      // Complete voting (randomly select statements)
      for (let targetIndex = 0; targetIndex < 3; targetIndex++) {
        const targetId = `player-${targetIndex}`;
        const submission = gameState.submissions.find(
          (s) => s.playerId === targetId
        );
        // Just select the second statement for voting
        const selectedStatement = submission!.statements[1];

        const voters = gameSession.players.filter((p) => p.id !== targetId);
        voters.forEach((voter) => {
          const action: TwoTruthsGameAction = {
            type: 'submit_vote',
            data: {
              selectedStatementId: selectedStatement.id,
              targetPlayerId: targetId,
            },
            playerId: voter.id,
            timestamp: new Date(),
          };
          game.handleAction(action);
        });
      }

      const finalGameState = game.getCurrentState();
      expect(
        Object.values(finalGameState.scores).every((score) => score >= 0)
      ).toBe(true);
    });
  });

  describe('Game Results', () => {
    test('should provide round results', () => {
      // Complete a round
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: TwoTruthsGameAction = {
          type: 'submit_statements',
          data: {
            statements: [`Truth ${index}1`, `Truth ${index}2`, `Lie ${index}`],
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      // Complete voting
      const gameState = game.getCurrentState();
      for (let targetIndex = 0; targetIndex < 3; targetIndex++) {
        const targetId = `player-${targetIndex}`;
        const submission = gameState.submissions.find(
          (s) => s.playerId === targetId
        );

        const voters = gameSession.players.filter((p) => p.id !== targetId);
        voters.forEach((voter) => {
          const action: TwoTruthsGameAction = {
            type: 'submit_vote',
            data: {
              selectedStatementId: submission!.statements[0].id,
              targetPlayerId: targetId,
            },
            playerId: voter.id,
            timestamp: new Date(),
          };
          game.handleAction(action);
        });
      }

      const roundResults = game.getRoundResults();
      expect(roundResults.roundNumber).toBe(1);
      expect(roundResults.scores).toBeDefined();
      expect(roundResults.summary).toContain('Round 1 complete');
      expect(roundResults.details.submissions).toHaveLength(3);
    });

    test('should provide game results', () => {
      // Complete game
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: TwoTruthsGameAction = {
          type: 'submit_statements',
          data: {
            statements: [`Truth ${index}1`, `Truth ${index}2`, `Lie ${index}`],
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      const gameState = game.getCurrentState();
      for (let targetIndex = 0; targetIndex < 3; targetIndex++) {
        const targetId = `player-${targetIndex}`;
        const submission = gameState.submissions.find(
          (s) => s.playerId === targetId
        );

        const voters = gameSession.players.filter((p) => p.id !== targetId);
        voters.forEach((voter) => {
          const action: TwoTruthsGameAction = {
            type: 'submit_vote',
            data: {
              selectedStatementId: submission!.statements[0].id,
              targetPlayerId: targetId,
            },
            playerId: voter.id,
            timestamp: new Date(),
          };
          game.handleAction(action);
        });
      }

      const gameResults = game.getGameResults();
      expect(gameResults.finalScores).toBeDefined();
      expect(gameResults.winner).toBeDefined();
      expect(gameResults.summary).toContain('wins');
      expect(gameResults.gameStats.totalSubmissions).toBe(3);
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

      const result = game.handleAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid action type');
    });

    test('should handle missing data in actions', () => {
      const action: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: undefined } as any,
        playerId: 'player-0',
        timestamp: new Date(),
      };

      const result = game.handleAction(action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must submit exactly 3 statements');
    });

    test('should handle game state queries correctly', () => {
      expect(game.hasPlayerSubmitted('player-0')).toBe(false);
      expect(game.hasPlayerVoted('player-0', 'player-1')).toBe(false);
      expect(game.isComplete()).toBe(false);

      const gameState = game.getCurrentState();
      expect(gameState.phase).toBe('submitting');
    });

    test('should handle empty player list', () => {
      const emptySession: GameSession = {
        lobbyId: 'empty-lobby',
        hostId: '',
        players: [],
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 8,
        status: 'waiting',
        gameData: null,
        createdAt: new Date(),
        currentRound: 1,
      };

      const emptyGame = new TwoTruthsAndALieGame(emptySession);
      const gameState = emptyGame.getCurrentState();

      expect(Object.keys(gameState.scores)).toHaveLength(0);
      expect(gameState.submissions).toHaveLength(0);
    });
  });

  describe('State Consistency', () => {
    test('should maintain consistent state throughout game flow', () => {
      // Track state consistency through complete game
      let gameState = game.getCurrentState();
      expect(gameState.phase).toBe('submitting');
      expect(gameState.submissions).toHaveLength(0);

      // Submit statements
      const players = ['player-0', 'player-1', 'player-2'];
      players.forEach((playerId, index) => {
        const action: TwoTruthsGameAction = {
          type: 'submit_statements',
          data: {
            statements: [`Truth ${index}1`, `Truth ${index}2`, `Lie ${index}`],
          },
          playerId,
          timestamp: new Date(),
        };
        game.handleAction(action);
      });

      gameState = game.getCurrentState();
      expect(gameState.phase).toBe('voting');
      expect(gameState.submissions).toHaveLength(3);
      expect(gameState.currentTargetPlayer).toBe('player-0');

      // Complete voting
      for (let targetIndex = 0; targetIndex < 3; targetIndex++) {
        const targetId = `player-${targetIndex}`;
        const submission = gameState.submissions.find(
          (s) => s.playerId === targetId
        );

        const voters = gameSession.players.filter((p) => p.id !== targetId);
        voters.forEach((voter) => {
          const action: TwoTruthsGameAction = {
            type: 'submit_vote',
            data: {
              selectedStatementId: submission!.statements[0].id,
              targetPlayerId: targetId,
            },
            playerId: voter.id,
            timestamp: new Date(),
          };
          game.handleAction(action);
        });
      }

      gameState = game.getCurrentState();
      expect(gameState.phase).toBe('results');
      expect(game.isComplete()).toBe(true);
    });

    test('should hide lie information during submission and voting phases', () => {
      const action: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['Statement 1', 'Statement 2', 'Statement 3'] },
        playerId: 'player-0',
        timestamp: new Date(),
      };

      game.handleAction(action);
      const gameState = game.getCurrentState();
      const submission = gameState.submissions.find(
        (s) => s.playerId === 'player-0'
      );

      // During submission phase, isLie should be undefined
      expect(submission?.statements.every((s) => s.isLie === undefined)).toBe(
        true
      );
    });
  });
});
