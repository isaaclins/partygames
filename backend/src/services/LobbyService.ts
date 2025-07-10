import {
  GameSession,
  Player,
  CreateLobbyData,
  JoinLobbyData,
  GAME_CONFIG,
  ERROR_CODES,
} from '../../../shared/types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class LobbyService {
  private lobbies = new Map<string, GameSession>();
  private playerToLobby = new Map<string, string>(); // playerId -> lobbyId

  /**
   * Generate a unique lobby code
   */
  private generateLobbyCode(): string {
    let code: string;
    do {
      code = Math.random()
        .toString(36)
        .substring(2, 2 + GAME_CONFIG.LOBBY_CODE_LENGTH)
        .toUpperCase();
    } while (this.lobbies.has(code));
    return code;
  }

  /**
   * Generate a unique player ID
   */
  private generatePlayerId(): string {
    return uuidv4();
  }

  /**
   * Create a new game lobby
   */
  createLobby(data: CreateLobbyData): { lobby: GameSession; playerId: string } {
    const lobbyId = this.generateLobbyCode();
    const playerId = this.generatePlayerId();
    const now = new Date();

    const host: Player = {
      id: playerId,
      name: data.hostName,
      isHost: true,
      isReady: true,
      isConnected: true,
      joinedAt: now,
    };

    const lobby: GameSession = {
      id: uuidv4(),
      lobbyId,
      gameType: data.gameType,
      status: 'waiting',
      players: [host],
      maxPlayers: data.maxPlayers,
      currentRound: 0,
      totalRounds: 0,
      createdAt: now,
      hostId: playerId,
    };

    this.lobbies.set(lobbyId, lobby);
    this.playerToLobby.set(playerId, lobbyId);

    console.log(`Created lobby ${lobbyId} with host ${data.hostName}`);
    return { lobby, playerId };
  }

  /**
   * Join an existing lobby
   */
  joinLobby(data: JoinLobbyData): { lobby: GameSession; playerId: string } {
    const lobby = this.lobbies.get(data.lobbyId);

    if (!lobby) {
      throw new Error(ERROR_CODES.LOBBY_NOT_FOUND);
    }

    if (lobby.status !== 'waiting') {
      throw new Error(ERROR_CODES.GAME_IN_PROGRESS);
    }

    if (lobby.players.length >= lobby.maxPlayers) {
      throw new Error(ERROR_CODES.LOBBY_FULL);
    }

    // Check if player name is already taken
    if (
      lobby.players.some(
        (p) => p.name.toLowerCase() === data.playerName.toLowerCase()
      )
    ) {
      throw new Error('Player name already taken');
    }

    const playerId = this.generatePlayerId();
    const player: Player = {
      id: playerId,
      name: data.playerName,
      isHost: false,
      isReady: false,
      isConnected: true,
      joinedAt: new Date(),
    };

    lobby.players.push(player);
    this.playerToLobby.set(playerId, data.lobbyId);

    console.log(`Player ${data.playerName} joined lobby ${data.lobbyId}`);
    return { lobby, playerId };
  }

  /**
   * Remove a player from their lobby
   */
  leaveLobby(playerId: string): {
    lobby: GameSession | null;
    wasHost: boolean;
  } {
    const lobbyId = this.playerToLobby.get(playerId);
    if (!lobbyId) {
      throw new Error(ERROR_CODES.PLAYER_NOT_FOUND);
    }

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) {
      throw new Error(ERROR_CODES.LOBBY_NOT_FOUND);
    }

    const playerIndex = lobby.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) {
      throw new Error(ERROR_CODES.PLAYER_NOT_FOUND);
    }

    const player = lobby.players[playerIndex];
    if (!player) {
      throw new Error(ERROR_CODES.PLAYER_NOT_FOUND);
    }

    const wasHost = player.isHost;

    // Remove player
    lobby.players.splice(playerIndex, 1);
    this.playerToLobby.delete(playerId);

    // If lobby is empty, delete it
    if (lobby.players.length === 0) {
      this.lobbies.delete(lobbyId);
      console.log(`Deleted empty lobby ${lobbyId}`);
      return { lobby: null, wasHost };
    }

    // If host left, assign new host
    if (wasHost && lobby.players.length > 0 && lobby.players[0]) {
      lobby.players[0].isHost = true;
      lobby.hostId = lobby.players[0].id;
      console.log(`${lobby.players[0].name} is now host of lobby ${lobbyId}`);
    }

    console.log(`Player ${player.name} left lobby ${lobbyId}`);
    return { lobby, wasHost };
  }

  /**
   * Update player information
   */
  updatePlayer(playerId: string, updates: Partial<Player>): GameSession {
    const lobbyId = this.playerToLobby.get(playerId);
    if (!lobbyId) {
      throw new Error(ERROR_CODES.PLAYER_NOT_FOUND);
    }

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) {
      throw new Error(ERROR_CODES.LOBBY_NOT_FOUND);
    }

    const player = lobby.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error(ERROR_CODES.PLAYER_NOT_FOUND);
    }

    // Apply updates (with restrictions)
    Object.assign(player, {
      ...updates,
      id: player.id, // Don't allow ID changes
      isHost: player.isHost, // Don't allow host status changes
      joinedAt: player.joinedAt, // Don't allow join time changes
    });

    return lobby;
  }

  /**
   * Toggle player ready status
   */
  togglePlayerReady(playerId: string): GameSession {
    const lobbyId = this.playerToLobby.get(playerId);
    if (!lobbyId) {
      throw new Error(ERROR_CODES.PLAYER_NOT_FOUND);
    }

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) {
      throw new Error(ERROR_CODES.LOBBY_NOT_FOUND);
    }

    const player = lobby.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error(ERROR_CODES.PLAYER_NOT_FOUND);
    }

    player.isReady = !player.isReady;
    return lobby;
  }

  /**
   * Set player connection status
   */
  setPlayerConnection(
    playerId: string,
    isConnected: boolean
  ): GameSession | null {
    const lobbyId = this.playerToLobby.get(playerId);
    if (!lobbyId) {
      return null;
    }

    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) {
      return null;
    }

    const player = lobby.players.find((p) => p.id === playerId);
    if (!player) {
      return null;
    }

    player.isConnected = isConnected;
    return lobby;
  }

  /**
   * Get lobby by ID
   */
  getLobby(lobbyId: string): GameSession | null {
    return this.lobbies.get(lobbyId) || null;
  }

  /**
   * Get lobby by player ID
   */
  getLobbyByPlayer(playerId: string): GameSession | null {
    const lobbyId = this.playerToLobby.get(playerId);
    return lobbyId ? this.lobbies.get(lobbyId) || null : null;
  }

  /**
   * Start a game (only host can do this)
   */
  startGame(playerId: string): GameSession {
    const lobby = this.getLobbyByPlayer(playerId);
    if (!lobby) {
      throw new Error(ERROR_CODES.LOBBY_NOT_FOUND);
    }

    const player = lobby.players.find((p) => p.id === playerId);
    if (!player?.isHost) {
      throw new Error(ERROR_CODES.NOT_HOST);
    }

    if (lobby.players.length < GAME_CONFIG.MIN_PLAYERS_TO_START) {
      throw new Error(ERROR_CODES.NOT_ENOUGH_PLAYERS);
    }

    const allReady = lobby.players.every((p) => p.isReady);
    if (!allReady) {
      throw new Error('Not all players are ready');
    }

    lobby.status = 'starting';
    lobby.startedAt = new Date();

    console.log(`Game starting in lobby ${lobby.lobbyId}`);
    return lobby;
  }

  /**
   * Get all active lobbies (for debugging)
   */
  getAllLobbies(): GameSession[] {
    return Array.from(this.lobbies.values());
  }

  /**
   * Clean up inactive lobbies
   */
  cleanupInactiveLobbies(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [lobbyId, lobby] of this.lobbies.entries()) {
      const lobbyAge = now - lobby.createdAt.getTime();
      const hasConnectedPlayers = lobby.players.some((p) => p.isConnected);

      if (lobbyAge > GAME_CONFIG.MAX_LOBBY_IDLE_TIME || !hasConnectedPlayers) {
        // Remove all players from tracking
        lobby.players.forEach((player) => {
          this.playerToLobby.delete(player.id);
        });

        this.lobbies.delete(lobbyId);
        cleaned++;
        console.log(`Cleaned up inactive lobby ${lobbyId}`);
      }
    }

    return cleaned;
  }
}

// Singleton instance
export const lobbyService = new LobbyService();
