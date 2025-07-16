import { describe, test, expect, beforeEach } from '@jest/globals';
import { SpyfallGame } from '../games/Spyfall.js';
import { GameSession, Player, SpyfallGameAction } from '../../../shared/types/index.js';

describe('SpyfallGame', () => {
  let spyfallGame: SpyfallGame;
  let mockLobby: GameSession;
  let mockPlayers: Player[];

  beforeEach(() => {
    // Create mock players
    mockPlayers = [
      {
        id: 'player1',
        name: 'Alice',
        isHost: true,
        isReady: true,
        isConnected: true,
        joinedAt: new Date(),
      },
      {
        id: 'player2',
        name: 'Bob',
        isHost: false,
        isReady: true,
        isConnected: true,
        joinedAt: new Date(),
      },
      {
        id: 'player3',
        name: 'Charlie',
        isHost: false,
        isReady: true,
        isConnected: true,
        joinedAt: new Date(),
      },
    ];

    // Create mock lobby
    mockLobby = {
      id: 'test-session-1',
      lobbyId: 'ABC123',
      gameType: 'spyfall',
      status: 'playing',
      players: mockPlayers,
      maxPlayers: 8,
      currentRound: 1,
      totalRounds: 1,
      createdAt: new Date(),
      hostId: 'player1',
    };

    // Create game instance
    spyfallGame = new SpyfallGame(mockLobby);
  });

  describe('Game Initialization', () => {
    test('should initialize with correct game state', () => {
      const publicState = spyfallGame.getPublicGameState();
      
      expect(publicState.phase).toBe('playing');
      expect(publicState.totalPlayers).toBe(3);
      expect(publicState.playersReadyToVote).toBe(0);
      expect(publicState.votes).toHaveLength(0);
      expect(publicState.gameStartedAt).toBeDefined();
    });

    test('should assign one spy and assign roles to non-spies', () => {
      let spyCount = 0;
      let nonSpyWithRole = 0;

      mockPlayers.forEach(player => {
        const playerState = spyfallGame.getPlayerSpecificState(player.id);
        if (playerState.playerRole.isSpy) {
          spyCount++;
          expect(playerState.playerRole.location).toBeNull();
          expect(playerState.playerRole.role).toBeNull();
        } else {
          nonSpyWithRole++;
          expect(playerState.playerRole.location).toBeTruthy();
          expect(playerState.playerRole.role).toBeTruthy();
        }
      });

      expect(spyCount).toBe(1);
      expect(nonSpyWithRole).toBe(2);
    });

    test('should assign same location to all non-spies', () => {
      const nonSpyLocations = mockPlayers
        .map(player => spyfallGame.getPlayerSpecificState(player.id))
        .filter(state => !state.playerRole.isSpy)
        .map(state => state.playerRole.location);

      expect(nonSpyLocations.length).toBe(2);
      expect(nonSpyLocations[0]).toBe(nonSpyLocations[1]);
    });
  });

  describe('Ready to Vote Phase', () => {
    test('should track players ready to vote', () => {
      const action: SpyfallGameAction = {
        type: 'ready_to_vote',
        data: {},
        playerId: 'player1',
        timestamp: new Date(),
      };

      const result = spyfallGame.handleAction(action);
      
      expect(result.success).toBe(true);
      expect(spyfallGame.isPlayerReadyToVote('player1')).toBe(true);
      expect(spyfallGame.isPlayerReadyToVote('player2')).toBe(false);
    });

    test('should transition to voting when all players ready', () => {
      // Mark all players ready
      mockPlayers.forEach(player => {
        const action: SpyfallGameAction = {
          type: 'ready_to_vote',
          data: {},
          playerId: player.id,
          timestamp: new Date(),
        };
        spyfallGame.handleAction(action);
      });

      const publicState = spyfallGame.getPublicGameState();
      expect(publicState.phase).toBe('voting');
    });

    test('should not allow ready action when not in playing phase', () => {
      // First transition to voting
      mockPlayers.forEach(player => {
        const action: SpyfallGameAction = {
          type: 'ready_to_vote',
          data: {},
          playerId: player.id,
          timestamp: new Date(),
        };
        spyfallGame.handleAction(action);
      });

      // Try to ready again
      const action: SpyfallGameAction = {
        type: 'ready_to_vote',
        data: {},
        playerId: 'player1',
        timestamp: new Date(),
      };

      const result = spyfallGame.handleAction(action);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in playing phase');
    });
  });

  describe('Voting Phase', () => {
    beforeEach(() => {
      // Transition to voting phase
      mockPlayers.forEach(player => {
        const action: SpyfallGameAction = {
          type: 'ready_to_vote',
          data: {},
          playerId: player.id,
          timestamp: new Date(),
        };
        spyfallGame.handleAction(action);
      });
    });

    test('should allow players to vote', () => {
      const action: SpyfallGameAction = {
        type: 'submit_vote',
        data: { targetPlayerId: 'player2' },
        playerId: 'player1',
        timestamp: new Date(),
      };

      const result = spyfallGame.handleAction(action);
      
      expect(result.success).toBe(true);
      expect(spyfallGame.hasPlayerVoted('player1')).toBe(true);
    });

    test('should not allow duplicate votes', () => {
      // First vote
      const action1: SpyfallGameAction = {
        type: 'submit_vote',
        data: { targetPlayerId: 'player2' },
        playerId: 'player1',
        timestamp: new Date(),
      };
      spyfallGame.handleAction(action1);

      // Second vote (should fail)
      const action2: SpyfallGameAction = {
        type: 'submit_vote',
        data: { targetPlayerId: 'player3' },
        playerId: 'player1',
        timestamp: new Date(),
      };

      const result = spyfallGame.handleAction(action2);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already voted');
    });

    test('should not allow voting for non-existent player', () => {
      const action: SpyfallGameAction = {
        type: 'submit_vote',
        data: { targetPlayerId: 'nonexistent' },
        playerId: 'player1',
        timestamp: new Date(),
      };

      const result = spyfallGame.handleAction(action);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Target player not found');
    });

    test('should process voting results when all players voted', () => {
      // All players vote for player2
      mockPlayers.forEach(player => {
        const action: SpyfallGameAction = {
          type: 'submit_vote',
          data: { targetPlayerId: 'player2' },
          playerId: player.id,
          timestamp: new Date(),
        };
        spyfallGame.handleAction(action);
      });

      const publicState = spyfallGame.getPublicGameState();
      expect(publicState.votedOutPlayerId).toBe('player2');
    });
  });

  describe('Spy Guess Phase', () => {
    let spyId: string;

    beforeEach(() => {
      // Find the spy
      mockPlayers.forEach(player => {
        const playerState = spyfallGame.getPlayerSpecificState(player.id);
        if (playerState.playerRole.isSpy) {
          spyId = player.id;
        }
      });

      // Transition to voting phase
      mockPlayers.forEach(player => {
        const action: SpyfallGameAction = {
          type: 'ready_to_vote',
          data: {},
          playerId: player.id,
          timestamp: new Date(),
        };
        spyfallGame.handleAction(action);
      });

      // Vote out the spy to trigger spy guess phase
      mockPlayers.forEach(player => {
        const action: SpyfallGameAction = {
          type: 'submit_vote',
          data: { targetPlayerId: spyId },
          playerId: player.id,
          timestamp: new Date(),
        };
        spyfallGame.handleAction(action);
      });
    });

    test('should transition to spy_guess when spy is voted out', () => {
      const publicState = spyfallGame.getPublicGameState();
      expect(publicState.phase).toBe('spy_guess');
      expect(publicState.votedOutPlayerId).toBe(spyId);
    });

    test('should allow spy to guess location', () => {
      const action: SpyfallGameAction = {
        type: 'guess_location',
        data: { guessedLocation: 'Pirate Ship' },
        playerId: spyId,
        timestamp: new Date(),
      };

      const result = spyfallGame.handleAction(action);
      expect(result.success).toBe(true);
    });

    test('should not allow non-spy to guess location', () => {
      const nonSpyId = mockPlayers.find(p => p.id !== spyId)!.id;
      
      const action: SpyfallGameAction = {
        type: 'guess_location',
        data: { guessedLocation: 'Pirate Ship' },
        playerId: nonSpyId,
        timestamp: new Date(),
      };

      const result = spyfallGame.handleAction(action);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Only the spy can guess the location');
    });

    test('should end game after spy guess', () => {
      const action: SpyfallGameAction = {
        type: 'guess_location',
        data: { guessedLocation: 'Wrong Location' },
        playerId: spyId,
        timestamp: new Date(),
      };

      spyfallGame.handleAction(action);

      const publicState = spyfallGame.getPublicGameState();
      expect(publicState.phase).toBe('finished');
      expect(spyfallGame.isComplete()).toBe(true);
    });
  });

  describe('Game Completion Scenarios', () => {
    let spyId: string;
    let nonSpyId: string;

    beforeEach(() => {
      // Find spy and non-spy
      mockPlayers.forEach(player => {
        const playerState = spyfallGame.getPlayerSpecificState(player.id);
        if (playerState.playerRole.isSpy) {
          spyId = player.id;
        } else if (!nonSpyId) {
          nonSpyId = player.id;
        }
      });

      // Transition to voting
      mockPlayers.forEach(player => {
        const action: SpyfallGameAction = {
          type: 'ready_to_vote',
          data: {},
          playerId: player.id,
          timestamp: new Date(),
        };
        spyfallGame.handleAction(action);
      });
    });

    test('should end game with spy win when non-spy voted out', () => {
      // Vote out non-spy
      mockPlayers.forEach(player => {
        const action: SpyfallGameAction = {
          type: 'submit_vote',
          data: { targetPlayerId: nonSpyId },
          playerId: player.id,
          timestamp: new Date(),
        };
        spyfallGame.handleAction(action);
      });

      const publicState = spyfallGame.getPublicGameState();
      expect(publicState.phase).toBe('finished');
      expect(publicState.winner).toBe('spy');
    });

    test('should award correct scores when spy wins', () => {
      // Vote out non-spy
      mockPlayers.forEach(player => {
        const action: SpyfallGameAction = {
          type: 'submit_vote',
          data: { targetPlayerId: nonSpyId },
          playerId: player.id,
          timestamp: new Date(),
        };
        spyfallGame.handleAction(action);
      });

      const gameResults = spyfallGame.getGameResults();
      expect(gameResults.finalScores[spyId]).toBe(3); // Spy gets 3 points
      expect(gameResults.finalScores[nonSpyId]).toBe(0); // Non-spy gets 0 points
    });

    test('should award correct scores when non-spies win', () => {
      // Vote out spy
      mockPlayers.forEach(player => {
        const action: SpyfallGameAction = {
          type: 'submit_vote',
          data: { targetPlayerId: spyId },
          playerId: player.id,
          timestamp: new Date(),
        };
        spyfallGame.handleAction(action);
      });

      // Spy makes wrong guess
      const guessAction: SpyfallGameAction = {
        type: 'guess_location',
        data: { guessedLocation: 'Wrong Location' },
        playerId: spyId,
        timestamp: new Date(),
      };
      spyfallGame.handleAction(guessAction);

      const gameResults = spyfallGame.getGameResults();
      expect(gameResults.finalScores[spyId]).toBe(0); // Spy gets 0 points
      expect(gameResults.finalScores[nonSpyId]).toBe(2); // Non-spy gets 2 points
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid action types', () => {
      const action = {
        type: 'invalid_action',
        data: {},
        playerId: 'player1',
        timestamp: new Date(),
      } as any;

      const result = spyfallGame.handleAction(action);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid action type');
    });

    test('should require target player for voting', () => {
      // Transition to voting
      mockPlayers.forEach(player => {
        const action: SpyfallGameAction = {
          type: 'ready_to_vote',
          data: {},
          playerId: player.id,
          timestamp: new Date(),
        };
        spyfallGame.handleAction(action);
      });

      const action: SpyfallGameAction = {
        type: 'submit_vote',
        data: {}, // Missing targetPlayerId
        playerId: 'player1',
        timestamp: new Date(),
      };

      const result = spyfallGame.handleAction(action);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Must specify target player');
    });

    test('should require location guess for spy guess action', () => {
      // Set up spy guess phase by voting out spy
      const spyId = mockPlayers.find(player => {
        const state = spyfallGame.getPlayerSpecificState(player.id);
        return state.playerRole.isSpy;
      })!.id;

      mockPlayers.forEach(player => {
        spyfallGame.handleAction({
          type: 'ready_to_vote',
          data: {},
          playerId: player.id,
          timestamp: new Date(),
        });
      });

      mockPlayers.forEach(player => {
        spyfallGame.handleAction({
          type: 'submit_vote',
          data: { targetPlayerId: spyId },
          playerId: player.id,
          timestamp: new Date(),
        });
      });

      const action: SpyfallGameAction = {
        type: 'guess_location',
        data: {}, // Missing guessedLocation
        playerId: spyId,
        timestamp: new Date(),
      };

      const result = spyfallGame.handleAction(action);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Must provide location guess');
    });
  });

  describe('Game Results', () => {
    test('should provide complete game results', () => {
      const results = spyfallGame.getGameResults();
      
      expect(results).toHaveProperty('finalScores');
      expect(results).toHaveProperty('winner');
      expect(results).toHaveProperty('summary');
      expect(results).toHaveProperty('gameStats');
      expect(results.gameStats).toHaveProperty('location');
      expect(results.gameStats).toHaveProperty('spyId');
    });

    test('should provide round results', () => {
      const results = spyfallGame.getRoundResults();
      
      expect(results).toHaveProperty('roundNumber');
      expect(results).toHaveProperty('scores');
      expect(results).toHaveProperty('summary');
      expect(results).toHaveProperty('details');
      expect(results.roundNumber).toBe(1);
    });
  });
}); 
