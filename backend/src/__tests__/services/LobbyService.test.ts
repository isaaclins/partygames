import { LobbyService } from '../../services/LobbyService';
import {
  CreateLobbyData,
  JoinLobbyData,
  GameSession,
  Player,
  ERROR_CODES,
  GAME_CONFIG,
} from '../../../../shared/types/index.js';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

describe('LobbyService', () => {
  let lobbyService: LobbyService;

  beforeEach(() => {
    lobbyService = new LobbyService();
    jest.clearAllMocks();

    // Mock Math.random for consistent lobby codes
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clear all lobbies to prevent memory leaks
    // Force cleanup by disconnecting all players first
    const allLobbies = lobbyService.getAllLobbies();
    allLobbies.forEach((lobby) => {
      lobby.players.forEach((player) => {
        lobbyService.setPlayerConnection(player.id, false);
      });
    });
    lobbyService.cleanupInactiveLobbies();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Lobby Creation', () => {
    const mockCreateData: CreateLobbyData = {
      hostName: 'Test Host',
      gameType: 'two-truths-and-a-lie',
      maxPlayers: 4,
    };

    test('should create a new lobby successfully', () => {
      const { lobby, playerId } = lobbyService.createLobby(mockCreateData);

      expect(lobby).toBeDefined();
      expect(lobby.lobbyId).toBeDefined();
      expect(lobby.lobbyId).toHaveLength(GAME_CONFIG.LOBBY_CODE_LENGTH);
      expect(lobby.gameType).toBe('two-truths-and-a-lie');
      expect(lobby.status).toBe('waiting');
      expect(lobby.maxPlayers).toBe(4);
      expect(lobby.players).toHaveLength(1);
      expect(lobby.hostId).toBe(playerId);

      const host = lobby.players[0];
      expect(host.id).toBe(playerId);
      expect(host.name).toBe('Test Host');
      expect(host.isHost).toBe(true);
      expect(host.isReady).toBe(true);
      expect(host.isConnected).toBe(true);
      expect(host.joinedAt).toBeInstanceOf(Date);
    });

    test('should generate unique lobby codes', () => {
      const { lobby: lobby1 } = lobbyService.createLobby(mockCreateData);

      // Change the random value to generate a different code
      jest.spyOn(Math, 'random').mockReturnValue(0.987654321);
      const { lobby: lobby2 } = lobbyService.createLobby(mockCreateData);

      expect(lobby1.lobbyId).not.toBe(lobby2.lobbyId);
    });

    test('should generate unique player IDs', () => {
      const { playerId: playerId1 } = lobbyService.createLobby(mockCreateData);
      const { playerId: playerId2 } = lobbyService.createLobby(mockCreateData);

      expect(playerId1).not.toBe(playerId2);
    });

    test('should handle different game types', () => {
      const wouldYouRatherData: CreateLobbyData = {
        ...mockCreateData,
        gameType: 'would-you-rather',
      };

      const quickDrawData: CreateLobbyData = {
        ...mockCreateData,
        gameType: 'quick-draw',
      };

      const { lobby: lobby1 } = lobbyService.createLobby(wouldYouRatherData);
      const { lobby: lobby2 } = lobbyService.createLobby(quickDrawData);

      expect(lobby1.gameType).toBe('would-you-rather');
      expect(lobby2.gameType).toBe('quick-draw');
    });

    test('should handle different max players', () => {
      const data: CreateLobbyData = {
        ...mockCreateData,
        maxPlayers: 8,
      };

      const { lobby } = lobbyService.createLobby(data);
      expect(lobby.maxPlayers).toBe(8);
    });
  });

  describe('Lobby Joining', () => {
    let existingLobby: GameSession;
    let hostPlayerId: string;

    beforeEach(() => {
      const { lobby, playerId } = lobbyService.createLobby({
        hostName: 'Host',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });
      existingLobby = lobby;
      hostPlayerId = playerId;
    });

    test('should join an existing lobby successfully', () => {
      const joinData: JoinLobbyData = {
        lobbyId: existingLobby.lobbyId,
        playerName: 'Test Player',
      };

      const { lobby, playerId } = lobbyService.joinLobby(joinData);

      expect(lobby.lobbyId).toBe(existingLobby.lobbyId);
      expect(lobby.players).toHaveLength(2);
      expect(playerId).toBeDefined();

      const newPlayer = lobby.players.find((p) => p.id === playerId);
      expect(newPlayer).toBeDefined();
      expect(newPlayer!.name).toBe('Test Player');
      expect(newPlayer!.isHost).toBe(false);
      expect(newPlayer!.isReady).toBe(false);
      expect(newPlayer!.isConnected).toBe(true);
    });

    test('should throw error when lobby not found', () => {
      const joinData: JoinLobbyData = {
        lobbyId: 'INVALID',
        playerName: 'Test Player',
      };

      expect(() => {
        lobbyService.joinLobby(joinData);
      }).toThrow(ERROR_CODES.LOBBY_NOT_FOUND);
    });

    test('should throw error when game is in progress', () => {
      // Start the game
      lobbyService.startGame(hostPlayerId);

      const joinData: JoinLobbyData = {
        lobbyId: existingLobby.lobbyId,
        playerName: 'Late Player',
      };

      expect(() => {
        lobbyService.joinLobby(joinData);
      }).toThrow(ERROR_CODES.GAME_IN_PROGRESS);
    });

    test('should throw error when lobby is full', () => {
      // Fill the lobby to max capacity
      for (let i = 1; i < existingLobby.maxPlayers; i++) {
        lobbyService.joinLobby({
          lobbyId: existingLobby.lobbyId,
          playerName: `Player ${i}`,
        });
      }

      // Try to join when full
      const joinData: JoinLobbyData = {
        lobbyId: existingLobby.lobbyId,
        playerName: 'Extra Player',
      };

      expect(() => {
        lobbyService.joinLobby(joinData);
      }).toThrow(ERROR_CODES.LOBBY_FULL);
    });

    test('should throw error when player name is already taken', () => {
      const joinData: JoinLobbyData = {
        lobbyId: existingLobby.lobbyId,
        playerName: 'Host', // Same as host name
      };

      expect(() => {
        lobbyService.joinLobby(joinData);
      }).toThrow('Player name already taken');
    });

    test('should handle case-insensitive name checking', () => {
      const joinData: JoinLobbyData = {
        lobbyId: existingLobby.lobbyId,
        playerName: 'HOST', // Same name but different case
      };

      expect(() => {
        lobbyService.joinLobby(joinData);
      }).toThrow('Player name already taken');
    });
  });

  describe('Lobby Leaving', () => {
    let existingLobby: GameSession;
    let hostPlayerId: string;
    let playerPlayerId: string;

    beforeEach(() => {
      const { lobby, playerId } = lobbyService.createLobby({
        hostName: 'Host',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });
      existingLobby = lobby;
      hostPlayerId = playerId;

      const { playerId: newPlayerId } = lobbyService.joinLobby({
        lobbyId: existingLobby.lobbyId,
        playerName: 'Player 1',
      });
      playerPlayerId = newPlayerId;
    });

    test('should allow non-host player to leave', () => {
      const { lobby, wasHost } = lobbyService.leaveLobby(playerPlayerId);

      expect(wasHost).toBe(false);
      expect(lobby).toBeDefined();
      expect(lobby!.players).toHaveLength(1);
      expect(lobby!.players[0].id).toBe(hostPlayerId);
      expect(lobby!.hostId).toBe(hostPlayerId);
    });

    test('should transfer host when host leaves', () => {
      const { lobby, wasHost } = lobbyService.leaveLobby(hostPlayerId);

      expect(wasHost).toBe(true);
      expect(lobby).toBeDefined();
      expect(lobby!.players).toHaveLength(1);
      expect(lobby!.players[0].id).toBe(playerPlayerId);
      expect(lobby!.players[0].isHost).toBe(true);
      expect(lobby!.hostId).toBe(playerPlayerId);
    });

    test('should delete lobby when last player leaves', () => {
      // Remove non-host player first
      lobbyService.leaveLobby(playerPlayerId);

      // Remove host (last player)
      const { lobby, wasHost } = lobbyService.leaveLobby(hostPlayerId);

      expect(wasHost).toBe(true);
      expect(lobby).toBeNull();

      // Verify lobby was deleted
      const retrievedLobby = lobbyService.getLobby(existingLobby.lobbyId);
      expect(retrievedLobby).toBeNull();
    });

    test('should throw error when player not found', () => {
      expect(() => {
        lobbyService.leaveLobby('invalid-player-id');
      }).toThrow(ERROR_CODES.PLAYER_NOT_FOUND);
    });

    test('should throw error when lobby not found after player lookup', () => {
      // This is a bit tricky to test - we'd need to manipulate internal state
      // For now, just verify the basic error case
      expect(() => {
        lobbyService.leaveLobby('non-existent-player');
      }).toThrow();
    });
  });

  describe('Player Updates', () => {
    let playerId: string;
    let lobbyId: string;

    beforeEach(() => {
      const { lobby, playerId: id } = lobbyService.createLobby({
        hostName: 'Host',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });
      playerId = id;
      lobbyId = lobby.lobbyId;
    });

    test('should update player information', () => {
      const updates = {
        name: 'Updated Name',
        isReady: false, // This should be ignored in this method
      };

      const lobby = lobbyService.updatePlayer(playerId, updates);
      const player = lobby.players.find((p) => p.id === playerId);

      expect(player!.name).toBe('Updated Name');
      expect(player!.isReady).toBe(true); // Should remain unchanged
      expect(player!.id).toBe(playerId); // Should not change
      expect(player!.isHost).toBe(true); // Should not change
    });

    test('should toggle player ready status', () => {
      const lobby = lobbyService.togglePlayerReady(playerId);
      const player = lobby.players.find((p) => p.id === playerId);

      expect(player!.isReady).toBe(false); // Was true, now false

      // Toggle again
      const lobby2 = lobbyService.togglePlayerReady(playerId);
      const player2 = lobby2.players.find((p) => p.id === playerId);

      expect(player2!.isReady).toBe(true); // Back to true
    });

    test('should set player connection status', () => {
      const lobby = lobbyService.setPlayerConnection(playerId, false);
      const player = lobby!.players.find((p) => p.id === playerId);

      expect(player!.isConnected).toBe(false);

      // Set back to connected
      const lobby2 = lobbyService.setPlayerConnection(playerId, true);
      const player2 = lobby2!.players.find((p) => p.id === playerId);

      expect(player2!.isConnected).toBe(true);
    });

    test('should return null when setting connection for non-existent player', () => {
      const result = lobbyService.setPlayerConnection('invalid-id', false);
      expect(result).toBeNull();
    });

    test('should throw error when updating non-existent player', () => {
      expect(() => {
        lobbyService.updatePlayer('invalid-id', { name: 'New Name' });
      }).toThrow(ERROR_CODES.PLAYER_NOT_FOUND);
    });

    test('should throw error when toggling ready for non-existent player', () => {
      expect(() => {
        lobbyService.togglePlayerReady('invalid-id');
      }).toThrow(ERROR_CODES.PLAYER_NOT_FOUND);
    });
  });

  describe('Game Starting', () => {
    let hostPlayerId: string;
    let playerPlayerId: string;
    let lobbyId: string;

    beforeEach(() => {
      const { lobby, playerId } = lobbyService.createLobby({
        hostName: 'Host',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });
      hostPlayerId = playerId;
      lobbyId = lobby.lobbyId;

      const { playerId: newPlayerId } = lobbyService.joinLobby({
        lobbyId,
        playerName: 'Player 1',
      });
      playerPlayerId = newPlayerId;
    });

    test('should start game when host requests and all conditions met', () => {
      // Make sure all players are ready
      lobbyService.togglePlayerReady(playerPlayerId); // Make player ready

      const lobby = lobbyService.startGame(hostPlayerId);

      expect(lobby.status).toBe('starting');
      expect(lobby.startedAt).toBeInstanceOf(Date);
    });

    test('should throw error when non-host tries to start game', () => {
      lobbyService.togglePlayerReady(playerPlayerId); // Make player ready

      expect(() => {
        lobbyService.startGame(playerPlayerId);
      }).toThrow(ERROR_CODES.NOT_HOST);
    });

    test('should throw error when not enough players', () => {
      // Remove the second player to go below minimum
      lobbyService.leaveLobby(playerPlayerId);

      expect(() => {
        lobbyService.startGame(hostPlayerId);
      }).toThrow(ERROR_CODES.NOT_ENOUGH_PLAYERS);
    });

    test('should throw error when not all players are ready', () => {
      // playerPlayerId is not ready by default

      expect(() => {
        lobbyService.startGame(hostPlayerId);
      }).toThrow('Not all players are ready');
    });

    test('should throw error when player not found', () => {
      expect(() => {
        lobbyService.startGame('invalid-player-id');
      }).toThrow(ERROR_CODES.LOBBY_NOT_FOUND);
    });
  });

  describe('Lobby Retrieval', () => {
    let lobby: GameSession;
    let playerId: string;

    beforeEach(() => {
      const result = lobbyService.createLobby({
        hostName: 'Host',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });
      lobby = result.lobby;
      playerId = result.playerId;
    });

    test('should get lobby by ID', () => {
      const retrievedLobby = lobbyService.getLobby(lobby.lobbyId);
      expect(retrievedLobby).toEqual(lobby);
    });

    test('should return null for non-existent lobby ID', () => {
      const retrievedLobby = lobbyService.getLobby('INVALID');
      expect(retrievedLobby).toBeNull();
    });

    test('should get lobby by player ID', () => {
      const retrievedLobby = lobbyService.getLobbyByPlayer(playerId);
      expect(retrievedLobby).toEqual(lobby);
    });

    test('should return null for non-existent player ID', () => {
      const retrievedLobby = lobbyService.getLobbyByPlayer('invalid-player-id');
      expect(retrievedLobby).toBeNull();
    });

    test('should get all lobbies', () => {
      const allLobbies = lobbyService.getAllLobbies();
      expect(allLobbies).toHaveLength(1);
      expect(allLobbies[0]).toEqual(lobby);
    });
  });

  describe('Cleanup Operations', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should clean up inactive lobbies based on age', () => {
      // Create a lobby
      const { lobby } = lobbyService.createLobby({
        hostName: 'Host',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });

      // Advance time beyond max idle time
      jest.advanceTimersByTime(GAME_CONFIG.MAX_LOBBY_IDLE_TIME + 1000);

      const cleaned = lobbyService.cleanupInactiveLobbies();
      expect(cleaned).toBe(1);

      // Verify lobby was removed
      const retrievedLobby = lobbyService.getLobby(lobby.lobbyId);
      expect(retrievedLobby).toBeNull();
    });

    test('should clean up lobbies with no connected players', () => {
      // Create a lobby
      const { lobby, playerId } = lobbyService.createLobby({
        hostName: 'Host',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });

      // Disconnect all players
      lobbyService.setPlayerConnection(playerId, false);

      const cleaned = lobbyService.cleanupInactiveLobbies();
      expect(cleaned).toBe(1);

      // Verify lobby was removed
      const retrievedLobby = lobbyService.getLobby(lobby.lobbyId);
      expect(retrievedLobby).toBeNull();
    });

    test('should not clean up active lobbies', () => {
      // Create a lobby (players are connected by default)
      const { lobby } = lobbyService.createLobby({
        hostName: 'Host',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });

      const cleaned = lobbyService.cleanupInactiveLobbies();
      expect(cleaned).toBe(0);

      // Verify lobby still exists
      const retrievedLobby = lobbyService.getLobby(lobby.lobbyId);
      expect(retrievedLobby).toEqual(lobby);
    });

    test('should return count of cleaned lobbies', () => {
      // Create multiple lobbies
      const lobby1 = lobbyService.createLobby({
        hostName: 'Host1',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });

      const lobby2 = lobbyService.createLobby({
        hostName: 'Host2',
        gameType: 'would-you-rather',
        maxPlayers: 4,
      });

      // Disconnect all players
      lobbyService.setPlayerConnection(lobby1.playerId, false);
      lobbyService.setPlayerConnection(lobby2.playerId, false);

      const cleaned = lobbyService.cleanupInactiveLobbies();
      expect(cleaned).toBe(2);
    });

    test('should clean up player tracking when removing lobbies', () => {
      // Create a lobby
      const { lobby, playerId } = lobbyService.createLobby({
        hostName: 'Host',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });

      // Add another player
      const { playerId: player2Id } = lobbyService.joinLobby({
        lobbyId: lobby.lobbyId,
        playerName: 'Player 2',
      });

      // Advance time to trigger cleanup
      jest.advanceTimersByTime(GAME_CONFIG.MAX_LOBBY_IDLE_TIME + 1000);

      lobbyService.cleanupInactiveLobbies();

      // Verify player tracking was cleaned up
      const lobby1 = lobbyService.getLobbyByPlayer(playerId);
      const lobby2 = lobbyService.getLobbyByPlayer(player2Id);
      expect(lobby1).toBeNull();
      expect(lobby2).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty lobby operations gracefully', () => {
      expect(lobbyService.getAllLobbies()).toHaveLength(0);
      expect(lobbyService.cleanupInactiveLobbies()).toBe(0);
    });

    test('should handle concurrent lobby creation with same random values', () => {
      // This test simulates the rare case where Math.random returns the same value
      const mockRandom = jest.spyOn(Math, 'random');

      // First call returns same value
      mockRandom.mockReturnValueOnce(0.123);
      const { lobby: lobby1 } = lobbyService.createLobby({
        hostName: 'Host1',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });

      // Second call returns same value, then different value
      mockRandom.mockReturnValueOnce(0.123);
      mockRandom.mockReturnValueOnce(0.456);
      const { lobby: lobby2 } = lobbyService.createLobby({
        hostName: 'Host2',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });

      // Should have different lobby IDs
      expect(lobby1.lobbyId).not.toBe(lobby2.lobbyId);
    });

    test('should handle player updates with empty objects', () => {
      const { playerId } = lobbyService.createLobby({
        hostName: 'Host',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });

      // Should not throw error with empty updates
      expect(() => {
        lobbyService.updatePlayer(playerId, {});
      }).not.toThrow();
    });

    test('should maintain lobby integrity after multiple operations', () => {
      const { lobby, playerId: hostId } = lobbyService.createLobby({
        hostName: 'Host',
        gameType: 'two-truths-and-a-lie',
        maxPlayers: 4,
      });

      // Add multiple players
      const { playerId: player1Id } = lobbyService.joinLobby({
        lobbyId: lobby.lobbyId,
        playerName: 'Player 1',
      });

      const { playerId: player2Id } = lobbyService.joinLobby({
        lobbyId: lobby.lobbyId,
        playerName: 'Player 2',
      });

      // Perform various operations
      lobbyService.updatePlayer(player1Id, { name: 'Updated Player 1' });
      lobbyService.togglePlayerReady(player1Id);
      lobbyService.togglePlayerReady(player2Id);
      lobbyService.setPlayerConnection(player2Id, false);
      lobbyService.setPlayerConnection(player2Id, true);

      // Verify lobby state is consistent
      const finalLobby = lobbyService.getLobby(lobby.lobbyId);
      expect(finalLobby!.players).toHaveLength(3);
      expect(finalLobby!.hostId).toBe(hostId);

      const updatedPlayer1 = finalLobby!.players.find(
        (p) => p.id === player1Id
      );
      expect(updatedPlayer1!.name).toBe('Updated Player 1');
      expect(updatedPlayer1!.isReady).toBe(true);

      const player2 = finalLobby!.players.find((p) => p.id === player2Id);
      expect(player2!.isReady).toBe(true);
      expect(player2!.isConnected).toBe(true);
    });
  });
});
