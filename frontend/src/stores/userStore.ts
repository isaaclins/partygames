import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  // User session data
  playerId: string | null;
  playerName: string | null;
  currentLobbyId: string | null;
  isHost: boolean;

  // User preferences (persisted)
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  vibrationEnabled: boolean;

  // Actions
  setPlayerInfo: (playerId: string, playerName: string) => void;
  setCurrentLobby: (lobbyId: string | null, isHost?: boolean) => void;
  updatePreferences: (
    preferences: Partial<
      Pick<UserState, 'theme' | 'soundEnabled' | 'vibrationEnabled'>
    >
  ) => void;
  clearSession: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, _get) => ({
      // Initial state
      playerId: null,
      playerName: null,
      currentLobbyId: null,
      isHost: false,
      theme: 'light',
      soundEnabled: true,
      vibrationEnabled: true,

      // Actions
      setPlayerInfo: (playerId: string, playerName: string) => {
        set({ playerId, playerName });
      },

      setCurrentLobby: (lobbyId: string | null, isHost: boolean = false) => {
        set({ currentLobbyId: lobbyId, isHost });
      },

      updatePreferences: (preferences) => {
        set((state) => ({
          ...state,
          ...preferences,
        }));
      },

      clearSession: () => {
        set({
          playerId: null,
          playerName: null,
          currentLobbyId: null,
          isHost: false,
        });
      },
    }),
    {
      name: 'party-games-user', // localStorage key
      partialize: (state) => ({
        // Only persist preferences, not session data
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        vibrationEnabled: state.vibrationEnabled,
      }),
    }
  )
);
