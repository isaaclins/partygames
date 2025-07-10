/// <reference types="vite/client" />
import { io, Socket } from 'socket.io-client';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  CreateLobbyData,
  JoinLobbyData,
  GameSession,
  Player,
  BaseResponse,
  LobbyResponse,
  GameAction,
} from '../../../shared/types';

export class WebSocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event callbacks
  private eventCallbacks: Record<string, Function[]> = {};

  constructor() {
    this.connect();
  }

  /**
   * Connect to the WebSocket server
   */
  private connect() {
    if (this.isConnecting || this.socket?.connected) {
      return;
    }

    this.isConnecting = true;
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: false,
    });

    this.setupEventListeners();
    this.isConnecting = false;
  }

  /**
   * Set up WebSocket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.emit('disconnected', reason);

      // Auto-reconnect logic
      if (reason === 'io server disconnect') {
        // Server-initiated disconnect, don't reconnect
        return;
      }

      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.emit('connectionError', error);
      this.handleReconnection();
    });

    // Lobby events
    this.socket.on('lobby:updated', (lobby: GameSession) => {
      this.emit('lobby:updated', lobby);
    });

    this.socket.on('lobby:playerJoined', (player: Player) => {
      this.emit('lobby:playerJoined', player);
    });

    this.socket.on('lobby:playerLeft', (playerId: string) => {
      this.emit('lobby:playerLeft', playerId);
    });

    this.socket.on('lobby:playerUpdated', (player: Player) => {
      this.emit('lobby:playerUpdated', player);
    });

    this.socket.on('lobby:disbanded', (reason: string) => {
      this.emit('lobby:disbanded', reason);
    });

    // Game events
    this.socket.on('game:starting', (countdown: number) => {
      this.emit('game:starting', countdown);
    });

    this.socket.on('game:started', () => {
      this.emit('game:started');
    });

    this.socket.on('game:roundStarted', (round: number, timeLimit?: number) => {
      this.emit('game:roundStarted', { round, timeLimit });
    });

    this.socket.on('game:roundEnded', (results) => {
      this.emit('game:roundEnded', results);
    });

    this.socket.on('game:timeUpdate', (timeRemaining: number) => {
      this.emit('game:timeUpdate', timeRemaining);
    });

    this.socket.on('game:ended', (finalResults) => {
      this.emit('game:ended', finalResults);
    });

    this.socket.on('game:paused', (reason: string) => {
      this.emit('game:paused', reason);
    });

    this.socket.on('game:resumed', () => {
      this.emit('game:resumed');
    });

    this.socket.on('game:stateUpdate', (gameState) => {
      this.emit('game:stateUpdate', gameState);
    });

    // Error events
    this.socket.on('error', (error) => {
      this.emit('error', error);
    });

    this.socket.on('connectionError', (error: string) => {
      this.emit('connectionError', error);
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.socket?.connected) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Event emitter pattern for internal events
   */
  private emit(event: string, ...args: any[]) {
    const callbacks = this.eventCallbacks[event] || [];
    callbacks.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in ${event} callback:`, error);
      }
    });
  }

  /**
   * Subscribe to internal events
   */
  on(event: string, callback: Function) {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    this.eventCallbacks[event].push(callback);
  }

  /**
   * Unsubscribe from internal events
   */
  off(event: string, callback: Function) {
    if (!this.eventCallbacks[event]) return;
    const index = this.eventCallbacks[event].indexOf(callback);
    if (index > -1) {
      this.eventCallbacks[event].splice(index, 1);
    }
  }

  /**
   * Create a new lobby
   */
  async createLobby(data: CreateLobbyData): Promise<LobbyResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('lobby:create', data, (response: LobbyResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to create lobby'));
        }
      });
    });
  }

  /**
   * Join an existing lobby
   */
  async joinLobby(data: JoinLobbyData): Promise<LobbyResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('lobby:join', data, (response: LobbyResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to join lobby'));
        }
      });
    });
  }

  /**
   * Leave current lobby
   */
  async leaveLobby(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('lobby:leave', (response: BaseResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to leave lobby'));
        }
      });
    });
  }

  /**
   * Update player information
   */
  async updatePlayer(updates: Partial<Player>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit(
        'lobby:updatePlayer',
        updates,
        (response: BaseResponse) => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || 'Failed to update player'));
          }
        }
      );
    });
  }

  /**
   * Toggle ready status
   */
  async toggleReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('lobby:toggleReady', (response: BaseResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to toggle ready'));
        }
      });
    });
  }

  /**
   * Start the game (host only)
   */
  async startGame(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('game:start', (response: BaseResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to start game'));
        }
      });
    });
  }

  /**
   * Send a game action
   */
  async sendGameAction(action: GameAction): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('game:action', action, (response: BaseResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to send game action'));
        }
      });
    });
  }

  /**
   * Ping the server for connection testing
   */
  async ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      const startTime = Date.now();
      this.socket.emit('ping', (_response: { timestamp: number }) => {
        const latency = Date.now() - startTime;
        resolve(latency);
      });
    });
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventCallbacks = {};
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
