import React, { useState } from 'react';
import { Eye, EyeOff, Users, Clock, Crown, AlertCircle } from 'lucide-react';
import { useGameSession } from '../hooks/useGameSession';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SpyfallGameAction } from '../../../shared/types/index.js';

interface SpyfallGameState {
  phase: 'playing' | 'voting' | 'spy_guess' | 'finished';
  votes: Array<{ voterId: string; targetPlayerId: string; submittedAt: Date }>;
  votedOutPlayerId?: string;
  winner?: 'spy' | 'non_spies';
  locationGuess?: {
    spyId: string;
    guessedLocation: string;
    submittedAt: Date;
    isCorrect: boolean;
  };
  playersReadyToVote: number;
  totalPlayers: number;
  gameStartedAt: Date;
  location?: string; // Only available when game is finished
  spyId?: string; // Only available when game is finished
  playerRole?: {
    location: string | null;
    role: string | null;
    isSpy: boolean;
  };
}

export const SpyfallGame: React.FC = () => {
  const { game, playerId, sendGameAction } = useGameSession();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [locationGuess, setLocationGuess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roleHidden, setRoleHidden] = useState(false);

  // Get game state from the store
  const gameState = game.gameData as SpyfallGameState | null;

  const handleReadyToVote = async () => {
    setIsLoading(true);
    try {
      await sendGameAction({
        type: 'ready_to_vote',
        data: {},
        playerId: playerId!,
        timestamp: new Date(),
      } as SpyfallGameAction);
    } catch (error) {
      console.error('Error marking ready to vote:', error);
      alert('Failed to mark ready. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedPlayerId) {
      alert('Please select a player to vote for');
      return;
    }

    setIsLoading(true);
    try {
      await sendGameAction({
        type: 'submit_vote',
        data: { targetPlayerId: selectedPlayerId },
        playerId: playerId!,
        timestamp: new Date(),
      } as SpyfallGameAction);
      setSelectedPlayerId('');
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuessLocation = async () => {
    if (!locationGuess.trim()) {
      alert('Please enter your location guess');
      return;
    }

    setIsLoading(true);
    try {
      await sendGameAction({
        type: 'guess_location',
        data: { guessedLocation: locationGuess.trim() },
        playerId: playerId!,
        timestamp: new Date(),
      } as SpyfallGameAction);
    } catch (error) {
      console.error('Error submitting location guess:', error);
      alert('Failed to submit guess. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlayerName = (playerId: string): string => {
    const player = game.players.find(p => p.id === playerId);
    return player?.name || 'Unknown Player';
  };

  const hasPlayerVoted = (playerId: string): boolean => {
    return gameState?.votes.some(vote => vote.voterId === playerId) || false;
  };

  if (!gameState) {
    return (
      <div className='text-center py-12'>
        <div className='animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4'></div>
        <p className='text-slate-600'>Loading game...</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Game Header */}
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-blue-600 mb-2'>Spyfall</h2>
        <p className='text-gray-600'>
          {gameState.phase === 'playing' && 'Ask questions to find the spy!'}
          {gameState.phase === 'voting' && 'Vote to eliminate the spy!'}
          {gameState.phase === 'spy_guess' && 'Spy is guessing the location...'}
          {gameState.phase === 'finished' && 'Game Complete!'}
        </p>
      </div>

      {/* Game Status */}
      <div className='bg-slate-50 rounded-lg p-4'>
        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center space-x-2'>
            <Users className='w-4 h-4 text-slate-500' />
            <span className='text-slate-600'>
              {game.players.length} players
            </span>
          </div>
          <div className='flex items-center space-x-2'>
            <Clock className='w-4 h-4 text-slate-500' />
            <span className='text-slate-600'>
              {Math.floor((Date.now() - new Date(gameState.gameStartedAt).getTime()) / 60000)} min
            </span>
          </div>
        </div>
      </div>

      {/* Player Role Display */}
      {gameState.phase !== 'finished' && gameState.playerRole && (
        <div className='bg-white rounded-lg border-2 border-primary-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-slate-900'>Your Role</h3>
            <button
              onClick={() => setRoleHidden(!roleHidden)}
              className='text-slate-500 hover:text-slate-700'
            >
              {roleHidden ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
            </button>
          </div>
          
          {!roleHidden && (
            <div className='space-y-3'>
              {gameState.playerRole.isSpy ? (
                <div className='text-center'>
                  <div className='inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-3'>
                    <Crown className='w-8 h-8 text-red-600' />
                  </div>
                  <h4 className='text-xl font-bold text-red-600 mb-2'>You are the SPY!</h4>
                  <p className='text-slate-600'>
                    Listen carefully to figure out the location. Blend in and don't get caught!
                  </p>
                </div>
              ) : (
                <div className='text-center'>
                  <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3'>
                    <Users className='w-8 h-8 text-blue-600' />
                  </div>
                  <h4 className='text-xl font-bold text-blue-600 mb-2'>
                    {gameState.playerRole.location}
                  </h4>
                  <p className='text-lg text-slate-700 mb-2'>
                    You are: <strong>{gameState.playerRole.role}</strong>
                  </p>
                  <p className='text-slate-600'>
                    Ask questions to find the spy without revealing the location!
                  </p>
                </div>
              )}
            </div>
          )}

          {roleHidden && (
            <div className='text-center py-8 text-slate-500'>
              <EyeOff className='w-8 h-8 mx-auto mb-2' />
              <p>Role hidden for privacy</p>
            </div>
          )}
        </div>
      )}

      {/* Playing Phase */}
      {gameState.phase === 'playing' && (
        <div className='space-y-4'>
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
            <div className='flex items-start space-x-3'>
              <AlertCircle className='w-5 h-5 text-amber-600 mt-0.5' />
              <div>
                <h4 className='font-medium text-amber-800'>Game in Progress</h4>
                <p className='text-sm text-amber-700 mt-1'>
                  Ask questions in person to figure out who the spy is. When everyone is ready, 
                  click the button below to start voting.
                </p>
              </div>
            </div>
          </div>

          <div className='text-center'>
            <p className='text-sm text-slate-600 mb-4'>
              {gameState.playersReadyToVote} of {gameState.totalPlayers} players ready to vote
            </p>
            <Button
              onClick={handleReadyToVote}
              disabled={isLoading}
              className='w-full'
            >
              {isLoading ? 'Marking Ready...' : 'Ready to Vote'}
            </Button>
          </div>
        </div>
      )}

      {/* Voting Phase */}
      {gameState.phase === 'voting' && (
        <div className='space-y-4'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <h4 className='font-medium text-red-800 mb-2'>Voting Phase</h4>
            <p className='text-sm text-red-700'>
              Vote to eliminate the player you think is the spy!
            </p>
          </div>

          <div className='space-y-3'>
            <h4 className='font-medium text-slate-900'>Select a player to vote out:</h4>
            <div className='grid grid-cols-1 gap-2'>
              {game.players
                .filter(player => player.id !== playerId)
                .map(player => (
                  <label
                    key={player.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPlayerId === player.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type='radio'
                      name='vote'
                      value={player.id}
                      checked={selectedPlayerId === player.id}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      className='text-primary-600'
                      disabled={hasPlayerVoted(playerId!)}
                    />
                    <div className='flex-1'>
                      <span className='font-medium text-slate-900'>{player.name}</span>
                      {hasPlayerVoted(player.id) && (
                        <span className='ml-2 text-xs text-green-600'>✓ Voted</span>
                      )}
                    </div>
                  </label>
                ))}
            </div>

            {hasPlayerVoted(playerId!) ? (
              <div className='text-center py-4'>
                <p className='text-green-600 font-medium'>✓ You have voted</p>
                <p className='text-sm text-slate-600 mt-1'>
                  Waiting for other players... ({gameState.votes.length}/{gameState.totalPlayers})
                </p>
              </div>
            ) : (
              <Button
                onClick={handleSubmitVote}
                disabled={!selectedPlayerId || isLoading}
                className='w-full'
              >
                {isLoading ? 'Submitting Vote...' : 'Submit Vote'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Spy Guess Phase */}
      {gameState.phase === 'spy_guess' && (
        <div className='space-y-4'>
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <h4 className='font-medium text-yellow-800 mb-2'>Spy's Last Chance</h4>
            <p className='text-sm text-yellow-700'>
              {gameState.votedOutPlayerId === playerId
                ? 'You were voted out! Guess the location to win the game.'
                : `${getPlayerName(gameState.votedOutPlayerId!)} was voted out and is the spy! They can still win by guessing the location.`}
            </p>
          </div>

          {gameState.votedOutPlayerId === playerId && (
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  Guess the location:
                </label>
                <Input
                  value={locationGuess}
                  onChange={(e) => setLocationGuess(e.target.value)}
                  placeholder='Enter your location guess...'
                  className='w-full'
                />
              </div>
              <Button
                onClick={handleGuessLocation}
                disabled={!locationGuess.trim() || isLoading}
                className='w-full'
              >
                {isLoading ? 'Submitting Guess...' : 'Submit Guess'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Game Results */}
      {gameState.phase === 'finished' && (
        <div className='space-y-4'>
          <div className={`rounded-lg p-6 text-center ${
            gameState.winner === 'spy' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
          }`}>
            <Crown className={`w-12 h-12 mx-auto mb-3 ${
              gameState.winner === 'spy' ? 'text-red-600' : 'text-blue-600'
            }`} />
            <h3 className={`text-2xl font-bold mb-2 ${
              gameState.winner === 'spy' ? 'text-red-600' : 'text-blue-600'
            }`}>
              🎉 Game Over! 🎉
            </h3>
            <div className={`text-xl font-semibold mb-2 ${
              gameState.winner === 'spy' ? 'text-red-700' : 'text-blue-700'
            }`}>
              {gameState.winner === 'spy' 
                ? `Winner: ${getPlayerName(gameState.spyId!)} (The Spy)` 
                : `Winners: ${game.players.filter(p => p.id !== gameState.spyId).map(p => p.name).join(', ')} (Non-Spies)`}
            </div>
            <p className='text-lg text-slate-700 mb-4'>
              {gameState.locationGuess?.isCorrect
                ? `The spy correctly guessed: ${gameState.locationGuess.guessedLocation}`
                : gameState.winner === 'spy'
                ? 'The wrong player was voted out!'
                : 'The spy failed to guess the location correctly.'}
            </p>
          </div>

          {/* Game Reveal */}
          <div className='bg-white rounded-lg border border-slate-200 p-4'>
            <h4 className='font-medium text-slate-900 mb-3'>Game Reveal</h4>
            <div className='space-y-2 text-sm'>
              <div>
                <strong>Location:</strong> {gameState.location}
              </div>
              <div>
                <strong>Spy:</strong> {getPlayerName(gameState.spyId!)}
              </div>
              {gameState.votedOutPlayerId && (
                <div>
                  <strong>Voted Out:</strong> {getPlayerName(gameState.votedOutPlayerId)}
                </div>
              )}
              {gameState.locationGuess && (
                <div>
                  <strong>Spy's Guess:</strong> {gameState.locationGuess.guessedLocation}
                  <span className={`ml-2 ${gameState.locationGuess.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {gameState.locationGuess.isCorrect ? '✓ Correct' : '✗ Wrong'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
