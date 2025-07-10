import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import { useGameSession } from '../hooks/useGameSession';

interface GameType {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

const gameTypes: GameType[] = [
  {
    id: 'two-truths-and-a-lie',
    name: 'Two Truths and a Lie',
    description: 'Social deduction game where players guess the lies',
    minPlayers: 3,
    maxPlayers: 10,
    icon: Users,
    available: true,
  },
  {
    id: 'would-you-rather',
    name: 'Would You Rather',
    description: 'Choose between challenging scenarios and see what others pick',
    minPlayers: 3,
    maxPlayers: 8,
    icon: Plus,
    available: true,
  },
  {
    id: 'quick-draw',
    name: 'Quick Draw',
    description: 'Drawing and guessing game with real-time canvas sharing',
    minPlayers: 3,
    maxPlayers: 8,
    icon: Zap,
    available: false,
  },
];

export default function CreateGamePage() {
  const [hostName, setHostName] = useState('');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { createGame, connectionStatus } = useGameSession();

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim() || !selectedGame) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create game using WebSocket
      const { lobbyId } = await createGame(
        selectedGame,
        hostName.trim(),
        maxPlayers
      );

      // Navigate to lobby
      navigate(`/lobby/${lobbyId}`);
    } catch (error: any) {
      console.error('Failed to create game:', error);
      setError(error.message || 'Failed to create game. Please try again.');
      setIsLoading(false);
    }
  };

  const selectedGameType = gameTypes.find((game) => game.id === selectedGame);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <div className='w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
          <Plus className='w-8 h-8 text-primary-600' />
        </div>
        <h1 className='text-2xl font-bold text-slate-900 mb-2'>Create Game</h1>
        <p className='text-slate-600'>
          Set up a new game lobby and invite your friends to join.
        </p>
      </div>

      {/* Connection Status */}
      {!connectionStatus.isConnected && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex items-center space-x-2'>
            <AlertCircle className='w-5 h-5 text-yellow-600' />
            <div>
              <p className='text-sm font-medium text-yellow-800'>
                Connection Issue
              </p>
              <p className='text-sm text-yellow-700'>
                {connectionStatus.error || 'Connecting to server...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center space-x-2'>
            <AlertCircle className='w-5 h-5 text-red-600' />
            <p className='text-sm text-red-800'>{error}</p>
          </div>
        </div>
      )}

      {/* Create Form */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-6'>
        <form onSubmit={handleCreateGame} className='space-y-6'>
          {/* Host Name */}
          <div>
            <label
              htmlFor='hostName'
              className='block text-sm font-medium text-slate-700 mb-2'
            >
              Your Name (Host)
            </label>
            <input
              type='text'
              id='hostName'
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder='Enter your name'
              className='input-field'
              maxLength={20}
              required
              disabled={isLoading}
            />
          </div>

          {/* Game Selection */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-3'>
              Choose Game Type
            </label>
            <div className='space-y-3'>
              {gameTypes.map((game) => {
                const Icon = game.icon;
                return (
                  <div
                    key={game.id}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedGame === game.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    } ${!game.available || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() =>
                      game.available && !isLoading && setSelectedGame(game.id)
                    }
                  >
                    <div className='flex items-start space-x-3'>
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedGame === game.id
                            ? 'bg-primary-600'
                            : 'bg-slate-100'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            selectedGame === game.id
                              ? 'text-white'
                              : 'text-slate-600'
                          }`}
                        />
                      </div>
                      <div className='flex-1'>
                        <h3 className='font-medium text-slate-900'>
                          {game.name}
                        </h3>
                        <p className='text-sm text-slate-600 mb-2'>
                          {game.description}
                        </p>
                        <div className='text-xs text-slate-500'>
                          {game.minPlayers}-{game.maxPlayers} players
                        </div>
                      </div>
                      {!game.available && (
                        <span className='text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded'>
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Max Players */}
          {selectedGameType && (
            <div>
              <label
                htmlFor='maxPlayers'
                className='block text-sm font-medium text-slate-700 mb-2'
              >
                Maximum Players ({selectedGameType.minPlayers}-
                {selectedGameType.maxPlayers})
              </label>
              <select
                id='maxPlayers'
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className='input-field'
                disabled={isLoading}
              >
                {Array.from(
                  {
                    length:
                      selectedGameType.maxPlayers -
                      selectedGameType.minPlayers +
                      1,
                  },
                  (_, i) => selectedGameType.minPlayers + i
                ).map((num) => (
                  <option key={num} value={num}>
                    {num} players
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type='submit'
            disabled={
              !hostName.trim() ||
              !selectedGame ||
              isLoading ||
              !selectedGameType?.available ||
              !connectionStatus.isConnected
            }
            className='btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? (
              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner' />
            ) : (
              <>
                <span>Create Game Lobby</span>
                <ArrowRight className='w-4 h-4' />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Info Box */}
      <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
        <h3 className='font-medium text-green-900 mb-1'>How it works</h3>
        <p className='text-sm text-green-700'>
          Once you create a lobby, you'll get a room code to share with friends.
          They can join using the "Join Game" feature.
        </p>
      </div>
    </div>
  );
}
