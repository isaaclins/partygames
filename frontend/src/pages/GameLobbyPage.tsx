import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Share,
  Settings,
  Play,
  Crown,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { useGameSession } from '../hooks/useGameSession';

export default function GameLobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const [gameStarting, setGameStarting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const {
    game,
    user,
    isHost,
    isReady,
    canStartGame,
    allPlayersReady,
    connectionStatus,
    toggleReady,
    startGame,
    leaveGame,
  } = useGameSession();

  // Check if we're in the right lobby
  useEffect(() => {
    if (
      lobbyId &&
      user.currentLobbyId &&
      lobbyId.toUpperCase() !== user.currentLobbyId
    ) {
      // Wrong lobby, redirect home
      navigate('/');
    }
  }, [lobbyId, user.currentLobbyId, navigate]);

  // Handle game status updates for UI state
  useEffect(() => {
    if (game.gameStatus === 'starting') {
      setGameStarting(true);
      // You could set countdown here if passed from server
    } else if (game.gameStatus === 'playing') {
      setGameStarting(false);
      setCountdown(null);
      // Navigate to the game page
      navigate(`/game/${lobbyId}`);
    } else {
      setGameStarting(false);
      setCountdown(null);
    }
  }, [game.gameStatus]);

  // Auto-redirect if not in game
  if (!user.currentLobbyId || !game.lobbyId) {
    return (
      <div className='text-center py-12'>
        <AlertCircle className='w-12 h-12 text-yellow-500 mx-auto mb-4' />
        <h2 className='text-xl font-semibold text-slate-900 mb-2'>
          Not in a lobby
        </h2>
        <p className='text-slate-600 mb-4'>
          You need to join or create a lobby first.
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

  const copyRoomCode = async () => {
    if (game.lobbyId) {
      try {
        await navigator.clipboard.writeText(game.lobbyId);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const shareRoomCode = async () => {
    if (navigator.share && game.lobbyId) {
      try {
        await navigator.share({
          title: 'Join my Party Game!',
          text: `Join my game with room code: ${game.lobbyId}`,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to copy
        copyRoomCode();
      }
    } else {
      copyRoomCode();
    }
  };

  const handleToggleReady = async () => {
    try {
      await toggleReady();
    } catch (error: any) {
      console.error('Failed to toggle ready:', error);
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch (error: any) {
      console.error('Failed to start game:', error);
    }
  };

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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <div className='w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
          <Users className='w-8 h-8 text-green-600' />
        </div>
        <h1 className='text-2xl font-bold text-slate-900 mb-2'>Game Lobby</h1>
        <p className='text-slate-600'>
          {game.gameStatus === 'waiting'
            ? 'Waiting for players to join...'
            : game.gameStatus === 'starting'
              ? 'Game is starting!'
              : 'Game in progress'}
        </p>
      </div>

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

      {/* Game Starting Countdown */}
      {gameStarting && countdown !== null && (
        <div className='bg-primary-50 border border-primary-200 rounded-lg p-6 text-center'>
          <h3 className='text-xl font-bold text-primary-900 mb-2'>
            Game Starting!
          </h3>
          <div className='text-4xl font-mono font-bold text-primary-600'>
            {countdown}
          </div>
        </div>
      )}

      {/* Room Code */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-6'>
        <div className='text-center'>
          <h3 className='text-sm font-medium text-slate-700 mb-2'>Room Code</h3>
          <div className='text-3xl font-mono font-bold text-slate-900 tracking-wider mb-4'>
            {game.lobbyId}
          </div>
          <div className='flex gap-3'>
            <button
              onClick={copyRoomCode}
              className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${
                copySuccess ? 'bg-green-100 text-green-700' : ''
              }`}
            >
              <Copy className='w-4 h-4' />
              {copySuccess ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={shareRoomCode}
              className='btn-secondary flex-1 flex items-center justify-center gap-2'
            >
              <Share className='w-4 h-4' />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-medium text-slate-900'>
            Players ({game.players.length}/{game.maxPlayers})
          </h3>
          {isHost && (
            <button className='p-2 text-slate-600 hover:text-slate-900 transition-colors'>
              <Settings className='w-5 h-5' />
            </button>
          )}
        </div>
        <div className='space-y-3'>
          {game.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                player.isConnected ? 'bg-slate-50' : 'bg-red-50'
              }`}
            >
              <div className='flex items-center space-x-3'>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    player.isConnected ? 'bg-primary-600' : 'bg-gray-400'
                  }`}
                >
                  <span className='text-white text-sm font-medium'>
                    {player.name[0].toUpperCase()}
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <span
                    className={`font-medium ${
                      player.isConnected ? 'text-slate-900' : 'text-gray-500'
                    }`}
                  >
                    {player.name}
                    {player.id === user.playerId && ' (You)'}
                  </span>
                  {player.isHost && (
                    <Crown className='w-4 h-4 text-yellow-500' />
                  )}
                  {!player.isConnected && (
                    <span className='text-xs text-red-600'>(Disconnected)</span>
                  )}
                </div>
              </div>
              <div className='flex items-center space-x-2'>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    player.isReady
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {player.isReady ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Controls */}
      <div className='space-y-3'>
        {!isHost ? (
          <button
            onClick={handleToggleReady}
            disabled={!connectionStatus.isConnected || gameStarting}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isReady
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {isReady ? 'Ready!' : 'Mark as Ready'}
          </button>
        ) : (
          <button
            onClick={handleStartGame}
            disabled={
              !canStartGame || gameStarting || !connectionStatus.isConnected
            }
            className='btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {gameStarting ? (
              <>
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner' />
                <span>Starting Game...</span>
              </>
            ) : (
              <>
                <Play className='w-4 h-4' />
                <span>Start Game</span>
              </>
            )}
          </button>
        )}

        {/* Leave Lobby Button */}
        <button
          onClick={handleLeaveLobby}
          className='w-full py-2 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
        >
          Leave Lobby
        </button>

        {/* Status Messages */}
        {isHost && !allPlayersReady && (
          <div className='text-center text-sm text-slate-600'>
            {game.players.length < 3
              ? `Need ${3 - game.players.length} more players to start`
              : 'Waiting for all players to be ready...'}
          </div>
        )}

        {!isHost && allPlayersReady && (
          <div className='text-center text-sm text-green-600'>
            All players ready! Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
