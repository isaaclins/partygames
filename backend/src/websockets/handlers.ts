import { Socket, Server } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  CreateLobbyData,
  JoinLobbyData,
  LobbyResponse,
  GameAction,
  SpyfallGameAction,
} from '../../../shared/types/index.js';
import { lobbyService } from '../services/LobbyService.js';
import { SpyfallGame } from '../games/Spyfall.js';

// Track socket to player mapping
const socketToPlayer = new Map<string, string>(); // socketId -> playerId
const playerToSocket = new Map<string, string>(); // playerId -> socketId

// Track active game instances
const activeGames = new Map<string, SpyfallGame>(); // lobbyId -> gameInstance

export function setupWebSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) {
  console.log(`WebSocket client connected: ${socket.id}`);

  // Handle lobby creation
  socket.on('lobby:create', (data: CreateLobbyData, callback) => {
    try {
      const { lobby, playerId } = lobbyService.createLobby(data);

      // Track this socket/player relationship
      socketToPlayer.set(socket.id, playerId);
      playerToSocket.set(playerId, socket.id);

      // Join the lobby room
      socket.join(lobby.lobbyId);

      console.log(
        `Player ${playerId} created and joined lobby ${lobby.lobbyId}`
      );

      callback({
        success: true,
        lobby,
        playerId,
      } as LobbyResponse);

      // Broadcast to room (currently just the creator)
      io.to(lobby.lobbyId).emit('lobby:updated', lobby);
    } catch (error: any) {
      console.error('Error creating lobby:', error.message);
      callback({
        success: false,
        error: error.message,
      } as LobbyResponse);
    }
  });

  // Handle lobby joining
  socket.on('lobby:join', (data: JoinLobbyData, callback) => {
    try {
      const { lobby, playerId } = lobbyService.joinLobby(data);

      // Track this socket/player relationship
      socketToPlayer.set(socket.id, playerId);
      playerToSocket.set(playerId, socket.id);

      // Join the lobby room
      socket.join(lobby.lobbyId);

      const newPlayer = lobby.players.find((p) => p.id === playerId)!;

      console.log(`Player ${playerId} joined lobby ${lobby.lobbyId}`);

      callback({
        success: true,
        lobby,
        playerId,
      } as LobbyResponse);

      // Broadcast player joined to all others in the room
      socket.to(lobby.lobbyId).emit('lobby:playerJoined', newPlayer);

      // Send updated lobby to everyone
      io.to(lobby.lobbyId).emit('lobby:updated', lobby);
    } catch (error: any) {
      console.error('Error joining lobby:', error.message);
      callback({
        success: false,
        error: error.message,
      } as LobbyResponse);
    }
  });

  // Handle lobby leaving
  socket.on('lobby:leave', (callback) => {
    try {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) {
        callback({ success: false, error: 'Player not found' });
        return;
      }

      const lobbyBeforeLeave = lobbyService.getLobbyByPlayer(playerId);
      const { lobby: updatedLobby } = lobbyService.leaveLobby(playerId);

      // Clean up tracking
      socketToPlayer.delete(socket.id);
      playerToSocket.delete(playerId);

      if (lobbyBeforeLeave) {
        // Leave the socket room
        socket.leave(lobbyBeforeLeave.lobbyId);

        // If lobby still exists, notify remaining players
        if (updatedLobby) {
          socket
            .to(lobbyBeforeLeave.lobbyId)
            .emit('lobby:playerLeft', playerId);
          io.to(lobbyBeforeLeave.lobbyId).emit('lobby:updated', updatedLobby);
        } else {
          // Lobby was deleted, notify any remaining clients
          io.to(lobbyBeforeLeave.lobbyId).emit(
            'lobby:disbanded',
            'Host left and lobby is empty'
          );
        }
      }

      console.log(`Player ${playerId} left lobby`);
      callback({ success: true });
    } catch (error: any) {
      console.error('Error leaving lobby:', error.message);
      callback({ success: false, error: error.message });
    }
  });

  // Handle player updates
  socket.on('lobby:updatePlayer', (updates, callback) => {
    try {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) {
        callback({ success: false, error: 'Player not found' });
        return;
      }

      const lobby = lobbyService.updatePlayer(playerId, updates);
      const updatedPlayer = lobby.players.find((p) => p.id === playerId)!;

      callback({ success: true });

      // Broadcast player update to all in room
      io.to(lobby.lobbyId).emit('lobby:playerUpdated', updatedPlayer);
      io.to(lobby.lobbyId).emit('lobby:updated', lobby);
    } catch (error: any) {
      console.error('Error updating player:', error.message);
      callback({ success: false, error: error.message });
    }
  });

  // Handle ready toggle
  socket.on('lobby:toggleReady', (callback) => {
    try {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) {
        callback({ success: false, error: 'Player not found' });
        return;
      }

      const lobby = lobbyService.getLobbyByPlayer(playerId);
      if (!lobby) {
        callback({ success: false, error: 'Lobby not found' });
        return;
      }

      const player = lobby.players.find((p) => p.id === playerId);
      if (!player) {
        callback({ success: false, error: 'Player not found in lobby' });
        return;
      }

      // Toggle ready status
      const updatedLobby = lobbyService.togglePlayerReady(playerId);
      const updatedPlayer = updatedLobby.players.find(
        (p) => p.id === playerId
      )!;

      callback({ success: true });

      // Broadcast to all in room
      io.to(lobby.lobbyId).emit('lobby:playerUpdated', updatedPlayer);
      io.to(lobby.lobbyId).emit('lobby:updated', updatedLobby);
    } catch (error: any) {
      console.error('Error toggling ready:', error.message);
      callback({ success: false, error: error.message });
    }
  });

  // Handle game start
  socket.on('game:start', (callback) => {
    try {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) {
        callback({ success: false, error: 'Player not found' });
        return;
      }

      const lobby = lobbyService.startGame(playerId);

      callback({ success: true });

      // Broadcast game starting to all players
      io.to(lobby.lobbyId).emit('game:starting', 3); // 3 second countdown

      // Start countdown
      let countdown = 3;
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          io.to(lobby.lobbyId).emit('game:starting', countdown);
        } else {
          clearInterval(countdownInterval);

          // Update lobby status and emit game started
          lobby.status = 'playing';

          // Create game instance based on game type
          if (lobby.gameType === 'spyfall') {
            const gameInstance = new SpyfallGame(lobby);
            activeGames.set(lobby.lobbyId, gameInstance);

            // Emit game started with initial game state for each player
            lobby.players.forEach(player => {
              const playerSocket = playerToSocket.get(player.id);
              if (playerSocket) {
                const playerSpecificState = gameInstance.getPlayerSpecificState(player.id);
                io.to(playerSocket).emit('game:stateUpdate', playerSpecificState);
              }
            });

            // Emit general game started events
            io.to(lobby.lobbyId).emit('game:started');
            io.to(lobby.lobbyId).emit('lobby:updated', lobby);

            console.log(`Spyfall game started in lobby ${lobby.lobbyId}`);
          } else {
            io.to(lobby.lobbyId).emit('game:started');
            io.to(lobby.lobbyId).emit('lobby:updated', lobby);
            console.log(`Game started in lobby ${lobby.lobbyId}`);
          }
        }
      }, 1000);
    } catch (error: any) {
      console.error('Error starting game:', error.message);
      callback({ success: false, error: error.message });
    }
  });

  // Handle game actions
  socket.on('game:action', (action: GameAction, callback) => {
    try {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) {
        callback({ success: false, error: 'Player not found' });
        return;
      }

      const lobby = lobbyService.getLobbyByPlayer(playerId);
      if (!lobby) {
        callback({ success: false, error: 'Lobby not found' });
        return;
      }

      if (lobby.status !== 'playing') {
        callback({ success: false, error: 'Game is not currently playing' });
        return;
      }

      // Handle game actions based on game type
      if (lobby.gameType === 'spyfall') {
        const gameInstance = activeGames.get(lobby.lobbyId) as SpyfallGame;
        if (!gameInstance) {
          callback({ success: false, error: 'Game instance not found' });
          return;
        }

        const gameAction = action as SpyfallGameAction;
        gameAction.playerId = playerId; // Ensure playerId is set from socket

        const result = gameInstance.handleAction(gameAction);

        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }

        callback({ success: true });

        // If there's a game state update, send player-specific states
        if (result.gameStateUpdate) {
          lobby.players.forEach(player => {
            const playerSocket = playerToSocket.get(player.id);
            if (playerSocket) {
              const playerSpecificState = gameInstance.getPlayerSpecificState(player.id);
              io.to(playerSocket).emit('game:stateUpdate', playerSpecificState);
            }
          });
        }

        // Check if game is complete
        if (gameInstance.isComplete()) {
          lobby.status = 'finished';
          const gameResults = gameInstance.getGameResults();
          io.to(lobby.lobbyId).emit('game:ended', gameResults);
          io.to(lobby.lobbyId).emit('lobby:updated', lobby);

          // Clean up game instance
          activeGames.delete(lobby.lobbyId);
          console.log(`Spyfall game completed in lobby ${lobby.lobbyId}`);
        }
      } else {
        callback({ success: false, error: 'Unsupported game type' });
      }
    } catch (error: any) {
      console.error('Error handling game action:', error.message);
      callback({ success: false, error: error.message });
    }
  });

  // Handle ping for connection testing
  socket.on('ping', (callback) => {
    callback({ timestamp: Date.now() });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const playerId = socketToPlayer.get(socket.id);
    if (playerId) {
      // Mark player as disconnected but don't remove them immediately
      const lobby = lobbyService.setPlayerConnection(playerId, false);

      if (lobby) {
        console.log(
          `Player ${playerId} disconnected from lobby ${lobby.lobbyId}`
        );

        // Broadcast disconnection to other players
        const disconnectedPlayer = lobby.players.find((p) => p.id === playerId);
        if (disconnectedPlayer) {
          socket
            .to(lobby.lobbyId)
            .emit('lobby:playerUpdated', disconnectedPlayer);
          io.to(lobby.lobbyId).emit('lobby:updated', lobby);
        }

        // Clean up after a delay to allow reconnection
        setTimeout(() => {
          const currentLobby = lobbyService.getLobbyByPlayer(playerId);
          const currentPlayer = currentLobby?.players.find(
            (p) => p.id === playerId
          );

          // If still disconnected after timeout, remove from lobby
          if (currentPlayer && !currentPlayer.isConnected) {
            try {
              lobbyService.leaveLobby(playerId);
              console.log(
                `Removed disconnected player ${playerId} after timeout`
              );
            } catch (error) {
              // Player might have already been removed
            }
          }
        }, 30000); // 30 second grace period
      }

      // Clean up tracking
      socketToPlayer.delete(socket.id);
      playerToSocket.delete(playerId);
    }

    console.log(`WebSocket client disconnected: ${socket.id}`);
  });
}

// Cleanup function for inactive lobbies (call periodically)
export function cleanupInactiveLobbies() {
  const cleaned = lobbyService.cleanupInactiveLobbies();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} inactive lobbies`);
  }
}

// Test helper functions (only for testing)
export function __setSocketToPlayer(socketId: string, playerId: string): void {
  socketToPlayer.set(socketId, playerId);
  playerToSocket.set(playerId, socketId);
}

export function __clearSocketToPlayer(socketId: string): void {
  const playerId = socketToPlayer.get(socketId);
  if (playerId) {
    playerToSocket.delete(playerId);
  }
  socketToPlayer.delete(socketId);
}

export function __setActiveGame(lobbyId: string, gameInstance: any): void {
  activeGames.set(lobbyId, gameInstance);
}
