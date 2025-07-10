import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, User } from 'lucide-react';
import { useGameSession } from '../hooks/useGameSession';
import { Button, Input } from '../components/ui';

export default function JoinGamePage() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { joinGame } = useGameSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) return;

    setIsLoading(true);
    
    try {
      // Use state management to join game
      joinGame(roomCode.toUpperCase(), playerName.trim());
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to lobby
      navigate(`/lobby/${roomCode.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to join game:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Join Game</h1>
        <p className="text-slate-600">
          Enter the room code shared by your friend to join their game.
        </p>
      </div>

      {/* Join Form */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your Name"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            leftIcon={<User className="w-4 h-4" />}
            maxLength={20}
            required
          />

          <Input
            label="Room Code"
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            className="text-center text-lg font-mono tracking-wider"
            helperText="Room codes are usually 4-6 characters long"
            maxLength={6}
            required
          />

          <Button
            type="submit"
            disabled={!roomCode.trim() || !playerName.trim()}
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            Join Game
          </Button>
        </form>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-1">Need a room code?</h3>
        <p className="text-sm text-blue-700">
          Ask the game host to share their room code with you. It's usually displayed 
          in their lobby screen.
        </p>
      </div>
    </div>
  );
} 
