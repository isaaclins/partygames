import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useGameSession } from '../hooks/useGameSession';
import { TwoTruthsAndALie } from '../games/TwoTruthsAndALie';
import { WouldYouRather } from '../games/WouldYouRather';
import { QuickDraw } from '../games/QuickDraw';

export default function GamePage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();

  const { game, user, connectionStatus, leaveGame } = useGameSession();

  // Check if we're in the right lobby and game is active
  useEffect(() => {
    if (
      lobbyId &&
      user.currentLobbyId &&
      lobbyId.toUpperCase() !== user.currentLobbyId
    ) {
      // Wrong lobby, redirect home
      navigate('/');
    } else if (game.gameStatus !== 'playing') {
      // Game not active, redirect to lobby
      navigate(`/lobby/${lobbyId}`);
    }
  }, [lobbyId, user.currentLobbyId, game.gameStatus, navigate]);

  // Auto-redirect if not in game
  if (!user.currentLobbyId || !game.lobbyId || game.gameStatus !== 'playing') {
    return (
      <div className='text-center py-12'>
        <AlertCircle className='w-12 h-12 text-yellow-500 mx-auto mb-4' />
        <h2 className='text-xl font-semibold text-slate-900 mb-2'>
          Game not active
        </h2>
        <p className='text-slate-600 mb-4'>
          The game is not currently active or you're not in a lobby.
        </p>
        <button
          onClick={() => navigate('/')}
          className='btn-primary flex items-center gap-2 mx-auto'
        >
          <ArrowLeft className='w-4 h-4' />
          Go Home
        </button>
      </div>
    );
  }

  const handleLeaveLobby = async () => {
    try {
      await leaveGame();
      navigate('/');
    } catch (error: any) {
      console.error('Failed to leave lobby:', error);
      // Navigate anyway
      navigate('/');
    }
  };

  // Render the appropriate game component based on game type
  const renderGameComponent = () => {
    switch (game.gameType) {
      case 'two-truths-and-a-lie':
        return <TwoTruthsAndALie />;
      case 'would-you-rather':
        return <WouldYouRather />;
      case 'quick-draw':
        return <QuickDraw />;
      default:
        return (
          <div className='text-center py-12'>
            <AlertCircle className='w-12 h-12 text-yellow-500 mx-auto mb-4' />
            <h2 className='text-xl font-semibold text-slate-900 mb-2'>
              Unknown game type
            </h2>
            <p className='text-slate-600 mb-4'>
              Game type "{game.gameType}" is not implemented yet.
            </p>
            <button
              onClick={handleLeaveLobby}
              className='btn-primary flex items-center gap-2 mx-auto'
            >
              <ArrowLeft className='w-4 h-4' />
              Leave Game
            </button>
          </div>
        );
    }
  };

  return (
    <div className='space-y-6'>
      {/* Connection Status */}
      {!connectionStatus.isConnected && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center space-x-2'>
            <AlertCircle className='w-5 h-5 text-red-600' />
            <div>
              <p className='text-sm font-medium text-red-800'>
                Connection Lost
              </p>
              <p className='text-sm text-red-700'>
                {connectionStatus.error || 'Trying to reconnect...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Game Component */}
      {renderGameComponent()}

      {/* Leave Game Button */}
      <div className='text-center pt-4'>
        <button
          onClick={handleLeaveLobby}
          className='btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50'
        >
          Leave Game
        </button>
      </div>
    </div>
  );
}
