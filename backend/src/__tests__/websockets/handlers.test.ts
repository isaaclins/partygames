import { Server, Socket } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  CreateLobbyData,
  JoinLobbyData,
  LobbyResponse,
  TwoTruthsGameAction,
  WouldYouRatherGameAction,
  QuickDrawGameAction,
} from '../../../../shared/types/index.js';
import { setupWebSocketHandlers } from '../../websockets/handlers';
import { lobbyService } from '../../services/LobbyService';
import { TwoTruthsAndALieGame } from '../../games/TwoTruthsAndALie';
import { WouldYouRatherGame } from '../../games/WouldYouRather';
import { QuickDrawGame } from '../../games/QuickDraw';

// Mock the services and games
jest.mock('../../services/LobbyService');
jest.mock('../../games/TwoTruthsAndALie');
jest.mock('../../games/WouldYouRather');
jest.mock('../../games/QuickDraw');

describe('WebSocket Handlers', () => {
  let mockIo: jest.Mocked<Server<ClientToServerEvents, ServerToClientEvents>>;
  let mockSocket: jest.Mocked<
    Socket<ClientToServerEvents, ServerToClientEvents>
  >;
  let mockLobbyService: jest.Mocked<typeof lobbyService>;

  // Mock event callbacks
  const eventHandlers: Record<string, any> = {};

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Socket.IO server
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    // Mock Socket.IO socket
    mockSocket = {
      id: 'test-socket-id',
      on: jest.fn((event, handler) => {
        eventHandlers[event] = handler;
      }),
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    // Mock lobby service
    mockLobbyService = lobbyService as jest.Mocked<typeof lobbyService>;

    // Setup handlers
    setupWebSocketHandlers(mockIo, mockSocket);
  });

  describe('Connection Setup', () => {
    test('should register all event handlers', () => {
      expect(mockSocket.on).toHaveBeenCalledWith(
        'lobby:create',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'lobby:join',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'lobby:leave',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'lobby:updatePlayer',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'lobby:toggleReady',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'game:start',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'game:action',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith('ping', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function)
      );
    });
  });

  describe('Lobby Creation', () => {
    const mockCreateLobbyData: CreateLobbyData = {
      hostName: 'Test Host',
      gameType: 'two-truths-and-a-lie',
      maxPlayers: 4,
    };

    const mockLobby = {
      lobbyId: 'TEST123',
      hostId: 'host-player-id',
      players: [
        {
          id: 'host-player-id',
          name: 'Test Host',
          isHost: true,
          isReady: true,
        },
      ],
      gameType: 'two-truths-and-a-lie' as const,
      status: 'waiting' as const,
      maxPlayers: 4,
      createdAt: new Date(),
    };

    test('should handle successful lobby creation', async () => {
      const mockCallback = jest.fn();
      mockLobbyService.createLobby.mockReturnValue({
        lobby: mockLobby,
        playerId: 'host-player-id',
      });

      await eventHandlers['lobby:create'](mockCreateLobbyData, mockCallback);

      expect(mockLobbyService.createLobby).toHaveBeenCalledWith(
        mockCreateLobbyData
      );
      expect(mockSocket.join).toHaveBeenCalledWith('TEST123');
      expect(mockCallback).toHaveBeenCalledWith({
        success: true,
        lobby: mockLobby,
        playerId: 'host-player-id',
      });
      expect(mockIo.to).toHaveBeenCalledWith('TEST123');
      expect(mockIo.emit).toHaveBeenCalledWith('lobby:updated', mockLobby);
    });

    test('should handle lobby creation error', async () => {
      const mockCallback = jest.fn();
      const errorMessage = 'Failed to create lobby';
      mockLobbyService.createLobby.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await eventHandlers['lobby:create'](mockCreateLobbyData, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        success: false,
        error: errorMessage,
      });
      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(mockIo.emit).not.toHaveBeenCalled();
    });
  });

  describe('Lobby Joining', () => {
    const mockJoinLobbyData: JoinLobbyData = {
      lobbyId: 'TEST123',
      playerName: 'Test Player',
    };

    const mockLobby = {
      lobbyId: 'TEST123',
      hostId: 'host-player-id',
      players: [
        {
          id: 'host-player-id',
          name: 'Test Host',
          isHost: true,
          isReady: true,
        },
        {
          id: 'new-player-id',
          name: 'Test Player',
          isHost: false,
          isReady: false,
        },
      ],
      gameType: 'two-truths-and-a-lie' as const,
      status: 'waiting' as const,
      maxPlayers: 4,
      createdAt: new Date(),
    };

    test('should handle successful lobby joining', async () => {
      const mockCallback = jest.fn();
      mockLobbyService.joinLobby.mockReturnValue({
        lobby: mockLobby,
        playerId: 'new-player-id',
      });

      await eventHandlers['lobby:join'](mockJoinLobbyData, mockCallback);

      expect(mockLobbyService.joinLobby).toHaveBeenCalledWith(
        mockJoinLobbyData
      );
      expect(mockSocket.join).toHaveBeenCalledWith('TEST123');
      expect(mockCallback).toHaveBeenCalledWith({
        success: true,
        lobby: mockLobby,
        playerId: 'new-player-id',
      });
      expect(mockSocket.to).toHaveBeenCalledWith('TEST123');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'lobby:playerJoined',
        mockLobby.players[1]
      );
      expect(mockIo.to).toHaveBeenCalledWith('TEST123');
      expect(mockIo.emit).toHaveBeenCalledWith('lobby:updated', mockLobby);
    });

    test('should handle lobby joining error', async () => {
      const mockCallback = jest.fn();
      const errorMessage = 'Lobby not found';
      mockLobbyService.joinLobby.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await eventHandlers['lobby:join'](mockJoinLobbyData, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        success: false,
        error: errorMessage,
      });
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('Lobby Leaving', () => {
    beforeEach(() => {
      // Setup socket-to-player mapping
      require('../../websockets/handlers').__setSocketToPlayer(
        'test-socket-id',
        'test-player-id'
      );
    });

    test('should handle successful lobby leaving', async () => {
      const mockCallback = jest.fn();
      const mockLobbyBefore = {
        lobbyId: 'TEST123',
        players: [{ id: 'test-player-id' }, { id: 'other-player-id' }],
      };
      const mockLobbyAfter = {
        lobbyId: 'TEST123',
        players: [{ id: 'other-player-id' }],
      };

      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobbyBefore as any);
      mockLobbyService.leaveLobby.mockReturnValue({
        lobby: mockLobbyAfter as any,
        wasHost: false,
      });

      await eventHandlers['lobby:leave'](mockCallback);

      expect(mockLobbyService.leaveLobby).toHaveBeenCalledWith(
        'test-player-id'
      );
      expect(mockSocket.leave).toHaveBeenCalledWith('TEST123');
      expect(mockCallback).toHaveBeenCalledWith({ success: true });
      expect(mockSocket.to).toHaveBeenCalledWith('TEST123');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'lobby:playerLeft',
        'test-player-id'
      );
      expect(mockIo.to).toHaveBeenCalledWith('TEST123');
      expect(mockIo.emit).toHaveBeenCalledWith('lobby:updated', mockLobbyAfter);
    });

    test('should handle lobby disbanding when last player leaves', async () => {
      const mockCallback = jest.fn();
      const mockLobbyBefore = {
        lobbyId: 'TEST123',
        players: [{ id: 'test-player-id' }],
      };

      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobbyBefore as any);
      mockLobbyService.leaveLobby.mockReturnValue({
        lobby: null,
        wasHost: true,
      });

      await eventHandlers['lobby:leave'](mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({ success: true });
      expect(mockIo.to).toHaveBeenCalledWith('TEST123');
      expect(mockIo.emit).toHaveBeenCalledWith(
        'lobby:disbanded',
        'Host left and lobby is empty'
      );
    });

    test('should handle leaving error when player not found', async () => {
      const mockCallback = jest.fn();
      // Clear socket-to-player mapping to simulate player not found
      require('../../websockets/handlers').__clearSocketToPlayer(
        'test-socket-id'
      );

      await eventHandlers['lobby:leave'](mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        success: false,
        error: 'Player not found',
      });
    });
  });

  describe('Player Updates', () => {
    beforeEach(() => {
      require('../../websockets/handlers').__setSocketToPlayer(
        'test-socket-id',
        'test-player-id'
      );
    });

    test('should handle successful player update', async () => {
      const mockCallback = jest.fn();
      const updates = { name: 'Updated Name' };
      const mockLobby = {
        lobbyId: 'TEST123',
        players: [
          {
            id: 'test-player-id',
            name: 'Updated Name',
            isHost: false,
            isReady: false,
          },
        ],
      };

      mockLobbyService.updatePlayer.mockReturnValue(mockLobby as any);

      await eventHandlers['lobby:updatePlayer'](updates, mockCallback);

      expect(mockLobbyService.updatePlayer).toHaveBeenCalledWith(
        'test-player-id',
        updates
      );
      expect(mockCallback).toHaveBeenCalledWith({ success: true });
      expect(mockIo.to).toHaveBeenCalledWith('TEST123');
      expect(mockIo.emit).toHaveBeenCalledWith(
        'lobby:playerUpdated',
        mockLobby.players[0]
      );
      expect(mockIo.emit).toHaveBeenCalledWith('lobby:updated', mockLobby);
    });

    test('should handle ready toggle', async () => {
      const mockCallback = jest.fn();
      const mockLobby = {
        lobbyId: 'TEST123',
        players: [
          {
            id: 'test-player-id',
            name: 'Test Player',
            isHost: false,
            isReady: true,
          },
        ],
      };

      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobby as any);
      mockLobbyService.togglePlayerReady.mockReturnValue(mockLobby as any);

      await eventHandlers['lobby:toggleReady'](mockCallback);

      expect(mockLobbyService.togglePlayerReady).toHaveBeenCalledWith(
        'test-player-id'
      );
      expect(mockCallback).toHaveBeenCalledWith({ success: true });
      expect(mockIo.to).toHaveBeenCalledWith('TEST123');
      expect(mockIo.emit).toHaveBeenCalledWith(
        'lobby:playerUpdated',
        mockLobby.players[0]
      );
      expect(mockIo.emit).toHaveBeenCalledWith('lobby:updated', mockLobby);
    });
  });

  describe('Game Starting', () => {
    beforeEach(() => {
      require('../../websockets/handlers').__setSocketToPlayer(
        'test-socket-id',
        'host-player-id'
      );
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should handle game start for Two Truths and a Lie', async () => {
      const mockCallback = jest.fn();
      const mockLobby = {
        lobbyId: 'TEST123',
        gameType: 'two-truths-and-a-lie' as const,
        status: 'waiting' as const,
        players: [{ id: 'host-player-id', isHost: true }],
      };

      mockLobbyService.startGame.mockReturnValue(mockLobby as any);

      await eventHandlers['game:start'](mockCallback);

      expect(mockLobbyService.startGame).toHaveBeenCalledWith('host-player-id');
      expect(mockCallback).toHaveBeenCalledWith({ success: true });
      expect(mockIo.to).toHaveBeenCalledWith('TEST123');
      expect(mockIo.emit).toHaveBeenCalledWith('game:starting', 3);

      // Fast-forward countdown
      jest.advanceTimersByTime(3000);

      expect(TwoTruthsAndALieGame).toHaveBeenCalledWith(mockLobby);
      expect(mockIo.emit).toHaveBeenCalledWith('game:started');
      expect(mockIo.emit).toHaveBeenCalledWith(
        'lobby:updated',
        expect.objectContaining({
          status: 'playing',
        })
      );
    });

    test('should handle game start for Would You Rather', async () => {
      const mockCallback = jest.fn();
      const mockLobby = {
        lobbyId: 'TEST123',
        gameType: 'would-you-rather' as const,
        status: 'waiting' as const,
        players: [{ id: 'host-player-id', isHost: true }],
      };

      const mockGameInstance = {
        getGameState: jest.fn().mockReturnValue({ phase: 'submitting' }),
      };
      (WouldYouRatherGame as jest.Mock).mockImplementation(
        () => mockGameInstance
      );

      mockLobbyService.startGame.mockReturnValue(mockLobby as any);

      await eventHandlers['game:start'](mockCallback);

      // Fast-forward countdown
      jest.advanceTimersByTime(3000);

      expect(WouldYouRatherGame).toHaveBeenCalledWith(mockLobby);
      expect(mockIo.emit).toHaveBeenCalledWith('game:stateUpdate', {
        phase: 'submitting',
      });
    });

    test('should handle game start for Quick Draw', async () => {
      const mockCallback = jest.fn();
      const mockLobby = {
        lobbyId: 'TEST123',
        gameType: 'quick-draw' as const,
        status: 'waiting' as const,
        players: [{ id: 'host-player-id', isHost: true }],
      };

      const mockGameInstance = {
        getGameState: jest.fn().mockReturnValue({ gamePhase: 'setup' }),
      };
      (QuickDrawGame as jest.Mock).mockImplementation(() => mockGameInstance);

      mockLobbyService.startGame.mockReturnValue(mockLobby as any);

      await eventHandlers['game:start'](mockCallback);

      // Fast-forward countdown
      jest.advanceTimersByTime(3000);

      expect(QuickDrawGame).toHaveBeenCalledWith(mockLobby);
      expect(mockIo.emit).toHaveBeenCalledWith('game:stateUpdate', {
        gamePhase: 'setup',
      });
    });

    test('should handle game start error', async () => {
      const mockCallback = jest.fn();
      const errorMessage = 'Not enough players';
      mockLobbyService.startGame.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await eventHandlers['game:start'](mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        success: false,
        error: errorMessage,
      });
    });
  });

  describe('Game Actions', () => {
    beforeEach(() => {
      require('../../websockets/handlers').__setSocketToPlayer(
        'test-socket-id',
        'test-player-id'
      );
    });

    test('should handle Two Truths and a Lie game action', async () => {
      const mockCallback = jest.fn();
      const mockAction: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['Truth 1', 'Truth 2', 'Lie 1'] },
        playerId: 'test-player-id',
        timestamp: new Date(),
      };

      const mockLobby = {
        lobbyId: 'TEST123',
        gameType: 'two-truths-and-a-lie' as const,
        status: 'playing' as const,
        currentRound: 1,
        totalRounds: 1,
      };

      const mockGameInstance = {
        handleAction: jest.fn().mockReturnValue({ success: true }),
        getCurrentState: jest.fn().mockReturnValue({ phase: 'submitting' }),
        isComplete: jest.fn().mockReturnValue(false),
      };

      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobby as any);
      require('../../websockets/handlers').__setActiveGame(
        'TEST123',
        mockGameInstance
      );

      await eventHandlers['game:action'](mockAction, mockCallback);

      expect(mockGameInstance.handleAction).toHaveBeenCalledWith({
        ...mockAction,
        playerId: 'test-player-id',
      });
      expect(mockCallback).toHaveBeenCalledWith({ success: true });
      expect(mockIo.to).toHaveBeenCalledWith('TEST123');
      expect(mockIo.emit).toHaveBeenCalledWith('game:stateUpdate', {
        phase: 'submitting',
      });
    });

    test('should handle game action error', async () => {
      const mockCallback = jest.fn();
      const mockAction: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['Truth 1', 'Truth 2'] }, // Invalid: only 2 statements
        playerId: 'test-player-id',
        timestamp: new Date(),
      };

      const mockLobby = {
        lobbyId: 'TEST123',
        gameType: 'two-truths-and-a-lie' as const,
        status: 'playing' as const,
      };

      const mockGameInstance = {
        handleAction: jest.fn().mockReturnValue({
          success: false,
          error: 'Must submit exactly 3 statements',
        }),
      };

      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobby as any);
      require('../../websockets/handlers').__setActiveGame(
        'TEST123',
        mockGameInstance
      );

      await eventHandlers['game:action'](mockAction, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        success: false,
        error: 'Must submit exactly 3 statements',
      });
    });

    test('should handle Would You Rather game action', async () => {
      const mockCallback = jest.fn();
      const mockAction: WouldYouRatherGameAction = {
        type: 'submit_scenario',
        data: { optionA: 'Option A', optionB: 'Option B' },
        playerId: 'test-player-id',
        timestamp: new Date(),
      };

      const mockLobby = {
        lobbyId: 'TEST123',
        gameType: 'would-you-rather' as const,
        status: 'playing' as const,
      };

      const mockGameInstance = {
        handleAction: jest.fn().mockReturnValue({ phase: 'submitting' }),
        isGameComplete: jest.fn().mockReturnValue(false),
      };

      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobby as any);
      require('../../websockets/handlers').__setActiveGame(
        'TEST123',
        mockGameInstance
      );

      await eventHandlers['game:action'](mockAction, mockCallback);

      expect(mockGameInstance.handleAction).toHaveBeenCalledWith({
        ...mockAction,
        playerId: 'test-player-id',
      });
      expect(mockCallback).toHaveBeenCalledWith({ success: true });
      expect(mockIo.to).toHaveBeenCalledWith('TEST123');
      expect(mockIo.emit).toHaveBeenCalledWith('game:stateUpdate', {
        phase: 'submitting',
      });
    });

    test('should handle Quick Draw game action', async () => {
      const mockCallback = jest.fn();
      const mockAction: QuickDrawGameAction = {
        type: 'start_drawing',
        data: {},
        playerId: 'test-player-id',
        timestamp: new Date(),
      };

      const mockLobby = {
        lobbyId: 'TEST123',
        gameType: 'quick-draw' as const,
        status: 'playing' as const,
      };

      const mockGameInstance = {
        handleAction: jest.fn().mockReturnValue({ gamePhase: 'playing' }),
        isGameComplete: jest.fn().mockReturnValue(false),
        cleanup: jest.fn(),
      };

      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobby as any);
      require('../../websockets/handlers').__setActiveGame(
        'TEST123',
        mockGameInstance
      );

      await eventHandlers['game:action'](mockAction, mockCallback);

      expect(mockGameInstance.handleAction).toHaveBeenCalledWith({
        ...mockAction,
        playerId: 'test-player-id',
      });
      expect(mockCallback).toHaveBeenCalledWith({ success: true });
      expect(mockIo.to).toHaveBeenCalledWith('TEST123');
      expect(mockIo.emit).toHaveBeenCalledWith('game:stateUpdate', {
        gamePhase: 'playing',
      });
    });

    test('should handle game completion', async () => {
      const mockCallback = jest.fn();
      const mockAction: TwoTruthsGameAction = {
        type: 'submit_vote',
        data: { selectedStatementId: 'stmt-1', targetPlayerId: 'target-id' },
        playerId: 'test-player-id',
        timestamp: new Date(),
      };

      const mockLobby = {
        lobbyId: 'TEST123',
        gameType: 'two-truths-and-a-lie' as const,
        status: 'playing' as const,
        currentRound: 1,
        totalRounds: 1,
      };

      const mockGameInstance = {
        handleAction: jest.fn().mockReturnValue({ success: true }),
        getCurrentState: jest.fn().mockReturnValue({ phase: 'results' }),
        isComplete: jest.fn().mockReturnValue(true),
        getRoundResults: jest
          .fn()
          .mockReturnValue({ roundNumber: 1, scores: {} }),
        getGameResults: jest
          .fn()
          .mockReturnValue({ finalScores: {}, winner: 'player-1' }),
      };

      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobby as any);
      require('../../websockets/handlers').__setActiveGame(
        'TEST123',
        mockGameInstance
      );

      await eventHandlers['game:action'](mockAction, mockCallback);

      expect(mockIo.emit).toHaveBeenCalledWith('game:roundEnded', {
        roundNumber: 1,
        scores: {},
      });
      expect(mockIo.emit).toHaveBeenCalledWith('game:ended', {
        finalScores: {},
        winner: 'player-1',
      });
      expect(mockIo.emit).toHaveBeenCalledWith(
        'lobby:updated',
        expect.objectContaining({
          status: 'finished',
        })
      );
    });

    test('should handle unsupported game type', async () => {
      const mockCallback = jest.fn();
      const mockAction = {
        type: 'some_action',
        data: {},
        playerId: 'test-player-id',
        timestamp: new Date(),
      };

      const mockLobby = {
        lobbyId: 'TEST123',
        gameType: 'unsupported-game' as any,
        status: 'playing' as const,
      };

      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobby as any);

      await eventHandlers['game:action'](mockAction, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        success: false,
        error: 'Unsupported game type',
      });
    });

    test('should handle missing game instance', async () => {
      const mockCallback = jest.fn();
      const mockAction: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['Truth 1', 'Truth 2', 'Lie 1'] },
        playerId: 'test-player-id',
        timestamp: new Date(),
      };

      const mockLobby = {
        lobbyId: 'TEST123',
        gameType: 'two-truths-and-a-lie' as const,
        status: 'playing' as const,
      };

      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobby as any);
      // Don't set active game instance

      await eventHandlers['game:action'](mockAction, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        success: false,
        error: 'Game instance not found',
      });
    });
  });

  describe('Ping Handler', () => {
    test('should respond to ping with timestamp', async () => {
      const mockCallback = jest.fn();
      const beforeTime = Date.now();

      await eventHandlers['ping'](mockCallback);

      const afterTime = Date.now();
      expect(mockCallback).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
      });

      const callArgs = mockCallback.mock.calls[0][0];
      expect(callArgs.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Disconnect Handler', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      require('../../websockets/handlers').__setSocketToPlayer(
        'test-socket-id',
        'test-player-id'
      );
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should handle player disconnect', async () => {
      const mockLobby = {
        lobbyId: 'TEST123',
        players: [
          { id: 'test-player-id', name: 'Test Player', isConnected: false },
        ],
      };

      mockLobbyService.setPlayerConnection.mockReturnValue(mockLobby as any);
      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobby as any);

      await eventHandlers['disconnect']();

      expect(mockLobbyService.setPlayerConnection).toHaveBeenCalledWith(
        'test-player-id',
        false
      );
      expect(mockSocket.to).toHaveBeenCalledWith('TEST123');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'lobby:playerUpdated',
        mockLobby.players[0]
      );
      expect(mockIo.to).toHaveBeenCalledWith('TEST123');
      expect(mockIo.emit).toHaveBeenCalledWith('lobby:updated', mockLobby);

      // Fast-forward timeout
      jest.advanceTimersByTime(30000);

      expect(mockLobbyService.leaveLobby).toHaveBeenCalledWith(
        'test-player-id'
      );
    });

    test('should not remove player if they reconnected within timeout', async () => {
      const mockLobby = {
        lobbyId: 'TEST123',
        players: [
          { id: 'test-player-id', name: 'Test Player', isConnected: true }, // Reconnected
        ],
      };

      mockLobbyService.setPlayerConnection.mockReturnValue(mockLobby as any);
      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobby as any);

      await eventHandlers['disconnect']();

      // Fast-forward timeout
      jest.advanceTimersByTime(30000);

      // Should not call leaveLobby since player reconnected
      expect(mockLobbyService.leaveLobby).not.toHaveBeenCalled();
    });

    test('should handle disconnect when player not in lobby', async () => {
      mockLobbyService.setPlayerConnection.mockReturnValue(null);

      await eventHandlers['disconnect']();

      expect(mockLobbyService.setPlayerConnection).toHaveBeenCalledWith(
        'test-player-id',
        false
      );
      expect(mockSocket.to).not.toHaveBeenCalled();
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      require('../../websockets/handlers').__setSocketToPlayer(
        'test-socket-id',
        'test-player-id'
      );
    });

    test('should handle errors when player not found', async () => {
      const mockCallback = jest.fn();
      // Clear socket-to-player mapping
      require('../../websockets/handlers').__clearSocketToPlayer(
        'test-socket-id'
      );

      await eventHandlers['lobby:updatePlayer'](
        { name: 'New Name' },
        mockCallback
      );

      expect(mockCallback).toHaveBeenCalledWith({
        success: false,
        error: 'Player not found',
      });
    });

    test('should handle errors when lobby not found', async () => {
      const mockCallback = jest.fn();
      mockLobbyService.getLobbyByPlayer.mockReturnValue(null);

      await eventHandlers['lobby:toggleReady'](mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        success: false,
        error: 'Lobby not found',
      });
    });

    test('should handle errors when game not playing', async () => {
      const mockCallback = jest.fn();
      const mockAction: TwoTruthsGameAction = {
        type: 'submit_statements',
        data: { statements: ['Truth 1', 'Truth 2', 'Lie 1'] },
        playerId: 'test-player-id',
        timestamp: new Date(),
      };

      const mockLobby = {
        lobbyId: 'TEST123',
        gameType: 'two-truths-and-a-lie' as const,
        status: 'waiting' as const, // Not playing
      };

      mockLobbyService.getLobbyByPlayer.mockReturnValue(mockLobby as any);

      await eventHandlers['game:action'](mockAction, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        success: false,
        error: 'Game is not currently playing',
      });
    });
  });
});

// Helper functions for testing (these would be exposed by the handlers module)
declare module '../../websockets/handlers' {
  export function __setSocketToPlayer(socketId: string, playerId: string): void;
  export function __clearSocketToPlayer(socketId: string): void;
  export function __setActiveGame(lobbyId: string, gameInstance: any): void;
}
