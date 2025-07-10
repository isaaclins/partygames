import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, User, AlertCircle } from 'lucide-react';
import { useGameSession } from '../hooks/useGameSession';
import { Button, Input } from '../components/ui';

export default function JoinGamePage() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { joinGame, connectionStatus } = useGameSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use WebSocket to join game
      await joinGame(roomCode.toUpperCase(), playerName.trim());

      // Navigate to lobby
      navigate(`/lobby/${roomCode.toUpperCase()}`);
    } catch (error: any) {
      console.error('Failed to join game:', error);
      setError(
        error.message ||
          'Failed to join game. Please check the room code and try again.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <div className='w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4'>
          <Users className='w-8 h-8 text-green-600' />
        </div>
        <h1 className='text-2xl font-bold text-slate-900 mb-2'>Join Game</h1>
        <p className='text-slate-600'>
          Enter the room code shared by your friend to join their game.
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

      {/* Join Form */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-6'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <Input
            label='Your Name'
            type='text'
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder='Enter your name'
            leftIcon={<User className='w-4 h-4' />}
            maxLength={20}
            required
            disabled={isLoading}
          />

          <Input
            label='Room Code'
            type='text'
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder='e.g. ABC123'
            className='text-center text-lg font-mono tracking-wider'
            helperText='Room codes are usually 4-6 characters long'
            maxLength={6}
            required
            disabled={isLoading}
          />

          <Button
            type='submit'
            disabled={
              !roomCode.trim() ||
              !playerName.trim() ||
              isLoading ||
              !connectionStatus.isConnected
            }
            isLoading={isLoading}
            rightIcon={<ArrowRight className='w-4 h-4' />}
            className='w-full'
          >
            Join Game
          </Button>
        </form>
      </div>

      {/* Help Text */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <h3 className='font-medium text-blue-900 mb-1'>Need a room code?</h3>
        <p className='text-sm text-blue-700'>
          Ask the game host to share their room code with you. It's usually
          displayed in their lobby screen.
        </p>
      </div>
    </div>
  );
}
