import { useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { useGameSelectors } from '../stores/gameStore';

export function useGameSession() {
  const userStore = useUserStore();
  const gameSelectors = useGameSelectors();
  
  // Auto-sync user info with game store when available
  useEffect(() => {
    if (userStore.playerId && userStore.playerName && gameSelectors.lobbyId) {
      // Ensure current user is in the players list
      const currentPlayer = gameSelectors.players.find(p => p.id === userStore.playerId);
      if (!currentPlayer) {
        gameSelectors.addPlayer({
          id: userStore.playerId,
          name: userStore.playerName,
          isHost: userStore.isHost,
          isReady: false,
          isConnected: true,
        });
      }
    }
  }, [userStore.playerId, userStore.playerName, gameSelectors.lobbyId]);

  // Cleanup session when leaving lobby
  const leaveGame = () => {
    userStore.setCurrentLobby(null);
    gameSelectors.resetGame();
  };

  // Join game function that updates both stores
  const joinGame = (lobbyId: string, playerName: string, playerId?: string) => {
    const finalPlayerId = playerId || generatePlayerId();
    
    userStore.setPlayerInfo(finalPlayerId, playerName);
    userStore.setCurrentLobby(lobbyId);
    
    // Game store will be updated via WebSocket or API call
    return finalPlayerId;
  };

  // Create game function
  const createGame = (gameType: string, hostName: string, maxPlayers: number) => {
    const lobbyId = generateLobbyId();
    const playerId = generatePlayerId();
    
    userStore.setPlayerInfo(playerId, hostName);
    userStore.setCurrentLobby(lobbyId, true);
    
    gameSelectors.setLobbyInfo(lobbyId, gameType, maxPlayers);
    gameSelectors.addPlayer({
      id: playerId,
      name: hostName,
      isHost: true,
      isReady: true,
      isConnected: true,
    });
    
    return { lobbyId, playerId };
  };

  return {
    // Combined state
    user: userStore,
    game: gameSelectors,
    
    // Actions
    joinGame,
    createGame,
    leaveGame,
    
    // Computed state
    isInGame: !!userStore.currentLobbyId,
    isHost: userStore.isHost,
    canStartGame: gameSelectors.isHost && gameSelectors.allPlayersReady,
  };
}

// Utility functions
function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateLobbyId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
} 
