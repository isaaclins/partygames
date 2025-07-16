import { useState } from 'react';
import { Users, Plus, X, Play } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { validatePlayerNames } from '../../../shared/utils/offlineSpyfall.js';

interface PlayerSetupProps {
  onPlayersReady: (players: string[]) => void;
}

export default function PlayerSetup({ onPlayersReady }: PlayerSetupProps) {
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setInputError('Player name cannot be empty');
      return;
    }

    // Check if name already exists (case insensitive)
    const trimmedName = playerName.trim();
    const nameExists = players.some(
      existingName => existingName.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      setInputError('This player name already exists');
      return;
    }

    // Check if we've reached maximum players
    if (players.length >= 16) {
      setInputError('Maximum 16 players allowed');
      return;
    }

    // Add player and clear input
    setPlayers(prev => [...prev, trimmedName]);
    setPlayerName('');
    setInputError(null);
  };

  const handleRemovePlayer = (indexToRemove: number) => {
    setPlayers(prev => prev.filter((_, index) => index !== indexToRemove));
    setInputError(null);
  };

  const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
    if (inputError) {
      setInputError(null);
    }
  };

  const handleStartGame = () => {
    const validation = validatePlayerNames(players);
    if (validation.isValid) {
      onPlayersReady(players);
    }
  };

  // Validate current player list
  const validation = validatePlayerNames(players);
  const canStartGame = validation.isValid;
  const canAddPlayers = players.length < 16;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <div className='w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
          <Users className='w-8 h-8 text-orange-600' />
        </div>
        <h1 className='text-2xl font-bold text-slate-900 mb-2'>
          Setup Players
        </h1>
        <p className='text-slate-600'>
          Add player names for your offline Spyfall game.
        </p>
      </div>

      {/* Add Player Form */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-6'>
        <form onSubmit={handleAddPlayer} className='space-y-4'>
          <Input
            label='Player Name'
            value={playerName}
            onChange={handlePlayerNameChange}
            placeholder='Enter player name'
            error={inputError || undefined}
            disabled={!canAddPlayers}
            helperText={`${players.length}/16 players`}
            maxLength={20}
          />
          
          <Button
            type='submit'
            variant='secondary'
            className='w-full'
            disabled={!canAddPlayers}
            leftIcon={<Plus className='w-4 h-4' />}
          >
            {canAddPlayers ? 'Add Player' : 'Maximum Players Reached'}
          </Button>
        </form>
      </div>

      {/* Player List */}
      {players.length > 0 && (
        <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-slate-900'>
              Players ({players.length})
            </h3>
            <span className={`text-sm px-2 py-1 rounded ${
              canStartGame 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {canStartGame ? 'Ready to start' : `Need ${3 - players.length} more`}
            </span>
          </div>
          
          <div className='space-y-2'>
            {players.map((player, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'
              >
                <div className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center'>
                    <span className='text-primary-600 font-medium text-sm'>
                      {index + 1}
                    </span>
                  </div>
                  <span className='font-medium text-slate-900'>{player}</span>
                </div>
                <button
                  onClick={() => handleRemovePlayer(index)}
                  className='p-1 text-slate-400 hover:text-red-600 transition-colors rounded'
                  aria-label={`Remove ${player}`}
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {!validation.isValid && players.length > 0 && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <h4 className='font-medium text-red-800 mb-2'>Setup Requirements</h4>
          <ul className='text-sm text-red-700 space-y-1'>
            {validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Start Game Button */}
      <Button
        onClick={handleStartGame}
        variant='primary'
        size='lg'
        className='w-full'
        disabled={!canStartGame}
        leftIcon={<Play className='w-5 h-5' />}
      >
        {canStartGame ? 'Start Game' : 'Add More Players'}
      </Button>

      {/* Instructions */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <h3 className='font-medium text-blue-900 mb-1'>How it works</h3>
        <ul className='text-sm text-blue-700 space-y-1'>
          <li>• Add 3-16 player names to get started</li>
          <li>• Each player will view their role card one by one</li>
          <li>• Pass the device between players during role reveals</li>
          <li>• One player will secretly be the spy!</li>
        </ul>
      </div>
    </div>
  );
} 
