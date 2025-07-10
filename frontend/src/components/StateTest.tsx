import { useUserStore } from '../stores/userStore';
import { useGameSession } from '../hooks/useGameSession';

export function StateTest() {
  const userStore = useUserStore();
  const { game, isInGame } = useGameSession();

  const testStateUpdates = () => {
    // Test user preferences persistence
    userStore.updatePreferences({
      theme: userStore.theme === 'light' ? 'dark' : 'light',
      soundEnabled: !userStore.soundEnabled,
    });
  };

  const clearState = () => {
    userStore.clearSession();
  };

  return (
    <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4'>
      <h3 className='text-lg font-medium text-slate-900 mb-4'>
        State Management Test
      </h3>

      <div className='space-y-3 text-sm'>
        <div>
          <strong>Player ID:</strong> {userStore.playerId || 'None'}
        </div>
        <div>
          <strong>Player Name:</strong> {userStore.playerName || 'None'}
        </div>
        <div>
          <strong>Current Lobby:</strong> {userStore.currentLobbyId || 'None'}
        </div>
        <div>
          <strong>Is Host:</strong> {userStore.isHost ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Theme:</strong> {userStore.theme}
        </div>
        <div>
          <strong>Sound Enabled:</strong>{' '}
          {userStore.soundEnabled ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>In Game:</strong> {isInGame ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Game Players:</strong> {game.players.length}
        </div>
      </div>

      <div className='mt-4 space-y-2'>
        <button
          onClick={testStateUpdates}
          className='btn-secondary w-full text-sm'
        >
          Toggle Preferences (Test Persistence)
        </button>
        <button onClick={clearState} className='btn-secondary w-full text-sm'>
          Clear Session
        </button>
      </div>

      <p className='text-xs text-slate-500 mt-3'>
        Refresh the page to test persistence - theme and sound settings should
        remain.
      </p>
    </div>
  );
}
