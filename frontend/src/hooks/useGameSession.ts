import { useEffect, useCallback } from 'react';
import { useUserStore } from '../stores/userStore';
import { useGameSelectors } from '../stores/gameStore';
import { webSocketService } from '../services/WebSocketService';
import { GameSession, Player, GameAction } from '../../../shared/types';

export function useGameSession() {
  const userStore = useUserStore();
  const gameSelectors = useGameSelectors();

  // Set up WebSocket event listeners
  useEffect(() => {
    const handleLobbyUpdated = (lobby: GameSession) => {
      console.log('Lobby updated:', lobby);

      // Update game store with lobby data
      gameSelectors.setLobbyInfo(
        lobby.lobbyId,
        lobby.gameType,
        lobby.maxPlayers
      );
      gameSelectors.updatePlayers(lobby.players);
      gameSelectors.setGameStatus(lobby.status);
      gameSelectors.setRoundInfo(
        lobby.currentRound,
        lobby.totalRounds,
        lobby.roundTimeLimit || undefined
      );
      gameSelectors.setRoundTimeRemaining(lobby.roundTimeRemaining || null);
      gameSelectors.setConnectionStatus(true);

      // Update user store if we're in this lobby
      if (userStore.playerId) {
        const currentPlayer = lobby.players.find(
          (p) => p.id === userStore.playerId
        );
        if (currentPlayer) {
          userStore.setCurrentLobby(lobby.lobbyId, currentPlayer.isHost);
        }
      }
    };

    const handlePlayerJoined = (player: Player) => {
      console.log('Player joined:', player.name);
      gameSelectors.addPlayer(player);
    };

    const handlePlayerLeft = (playerId: string) => {
      console.log('Player left:', playerId);
      gameSelectors.removePlayer(playerId);
    };

    const handlePlayerUpdated = (player: Player) => {
      console.log('Player updated:', player.name);
      gameSelectors.updatePlayer(player.id, player);
    };

    const handleLobbyDisbanded = (reason: string) => {
      console.log('Lobby disbanded:', reason);
      gameSelectors.resetGame();
      userStore.setCurrentLobby(null);
      // Could show a notification here
    };

    const handleGameStarting = (countdown: number) => {
      console.log('Game starting in:', countdown);
      gameSelectors.setGameStatus('starting');
    };

    const handleGameStarted = () => {
      console.log('Game started!');
      gameSelectors.setGameStatus('playing');
    };

    const handleGameStateUpdate = (gameState: any) => {
      console.log('Game state updated:', gameState);
      gameSelectors.setGameState(gameState);
    };

    const handleConnectionStatus = (connected: boolean) => {
      gameSelectors.setConnectionStatus(connected);
    };

    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      gameSelectors.setConnectionStatus(
        false,
        error.message || 'Connection error'
      );
    };

    // Subscribe to WebSocket events
    webSocketService.on('lobby:updated', handleLobbyUpdated);
    webSocketService.on('lobby:playerJoined', handlePlayerJoined);
    webSocketService.on('lobby:playerLeft', handlePlayerLeft);
    webSocketService.on('lobby:playerUpdated', handlePlayerUpdated);
    webSocketService.on('lobby:disbanded', handleLobbyDisbanded);
    webSocketService.on('game:starting', handleGameStarting);
    webSocketService.on('game:started', handleGameStarted);
    webSocketService.on('game:stateUpdate', handleGameStateUpdate);
    webSocketService.on('connected', () => handleConnectionStatus(true));
    webSocketService.on('disconnected', () => handleConnectionStatus(false));
    webSocketService.on('error', handleError);

    // Cleanup on unmount
    return () => {
      webSocketService.off('lobby:updated', handleLobbyUpdated);
      webSocketService.off('lobby:playerJoined', handlePlayerJoined);
      webSocketService.off('lobby:playerLeft', handlePlayerLeft);
      webSocketService.off('lobby:playerUpdated', handlePlayerUpdated);
      webSocketService.off('lobby:disbanded', handleLobbyDisbanded);
      webSocketService.off('game:starting', handleGameStarting);
      webSocketService.off('game:started', handleGameStarted);
      webSocketService.off('game:stateUpdate', handleGameStateUpdate);
      webSocketService.off('connected', () => handleConnectionStatus(true));
      webSocketService.off('disconnected', () => handleConnectionStatus(false));
      webSocketService.off('error', handleError);
    };
  }, [gameSelectors, userStore]);

  // Create game function using WebSocket
  const createGame = useCallback(
    async (gameType: string, hostName: string, maxPlayers: number) => {
      try {
        const response = await webSocketService.createLobby({
          hostName,
          gameType,
          maxPlayers,
        });

        if (response.lobby && response.playerId) {
          // Update user store
          userStore.setPlayerInfo(response.playerId, hostName);
          userStore.setCurrentLobby(response.lobby.lobbyId, true);

          return {
            lobbyId: response.lobby.lobbyId,
            playerId: response.playerId,
          };
        }

        throw new Error('Invalid response from server');
      } catch (error: any) {
        console.error('Failed to create game:', error);
        gameSelectors.setConnectionStatus(false, error.message);
        throw error;
      }
    },
    [userStore, gameSelectors]
  );

  // Join game function using WebSocket
  const joinGame = useCallback(
    async (lobbyId: string, playerName: string) => {
      try {
        const response = await webSocketService.joinLobby({
          lobbyId: lobbyId.toUpperCase(),
          playerName,
        });

        if (response.lobby && response.playerId) {
          // Update user store
          userStore.setPlayerInfo(response.playerId, playerName);
          userStore.setCurrentLobby(response.lobby.lobbyId, false);

          return response.playerId;
        }

        throw new Error('Invalid response from server');
      } catch (error: any) {
        console.error('Failed to join game:', error);
        gameSelectors.setConnectionStatus(false, error.message);
        throw error;
      }
    },
    [userStore, gameSelectors]
  );

  // Leave game function using WebSocket
  const leaveGame = useCallback(async () => {
    try {
      await webSocketService.leaveLobby();

      // Clear local state
      userStore.setCurrentLobby(null);
      gameSelectors.resetGame();
    } catch (error: any) {
      console.error('Failed to leave game:', error);
      // Clear local state anyway
      userStore.setCurrentLobby(null);
      gameSelectors.resetGame();
      throw error;
    }
  }, [userStore, gameSelectors]);

  // Toggle ready status using WebSocket
  const toggleReady = useCallback(async () => {
    try {
      await webSocketService.toggleReady();
    } catch (error: any) {
      console.error('Failed to toggle ready:', error);
      gameSelectors.setConnectionStatus(false, error.message);
      throw error;
    }
  }, [gameSelectors]);

  // Start game using WebSocket
  const startGame = useCallback(async () => {
    try {
      await webSocketService.startGame();
    } catch (error: any) {
      console.error('Failed to start game:', error);
      gameSelectors.setConnectionStatus(false, error.message);
      throw error;
    }
  }, [gameSelectors]);

  // Send game action using WebSocket
  const sendGameAction = useCallback(async (action: GameAction) => {
    try {
      await webSocketService.sendGameAction(action);
    } catch (error: any) {
      console.error('Failed to send game action:', error);
      gameSelectors.setConnectionStatus(false, error.message);
      throw error;
    }
  }, [gameSelectors]);

  // Update player name
  const updatePlayerName = useCallback(
    async (newName: string) => {
      try {
        await webSocketService.updatePlayer({ name: newName });
        userStore.setPlayerInfo(userStore.playerId!, newName);
      } catch (error: any) {
        console.error('Failed to update player name:', error);
        gameSelectors.setConnectionStatus(false, error.message);
        throw error;
      }
    },
    [userStore, gameSelectors]
  );

  // Get current player
  const currentPlayer = gameSelectors.players.find(
    (p) => p.id === userStore.playerId
  );

  // Check if all players are ready
  const allPlayersReady =
    gameSelectors.players.length >= 3 &&
    gameSelectors.players.every((p) => p.isReady);

  // Check if current user can start the game
  const canStartGame =
    currentPlayer?.isHost &&
    allPlayersReady &&
    gameSelectors.gameStatus === 'waiting';

  return {
    // Combined state
    user: userStore,
    game: gameSelectors,
    lobbyId: gameSelectors.lobbyId,
    players: gameSelectors.players,
    playerId: userStore.playerId,

    // Actions
    createGame,
    joinGame,
    leaveGame,
    toggleReady,
    startGame,
    sendGameAction,
    updatePlayerName,

    // Computed state
    isInGame: !!userStore.currentLobbyId && gameSelectors.isConnected,
    isHost: currentPlayer?.isHost || false,
    isReady: currentPlayer?.isReady || false,
    canStartGame,
    allPlayersReady,
    currentPlayer,
    connectionStatus: {
      isConnected: gameSelectors.isConnected,
      error: gameSelectors.connectionError,
    },

    // WebSocket utilities
    ping: webSocketService.ping.bind(webSocketService),
    socketId: webSocketService.socketId,
  };
}
