import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Users, Copy, Share, Settings, Play, Crown } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
}

export default function GameLobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'You', isHost: true, isReady: true },
  ]);
  const [isReady, setIsReady] = useState(true);
  const [gameStarting, setGameStarting] = useState(false);

  useEffect(() => {
    // TODO: Connect to WebSocket and load lobby data
    // This is placeholder data
    const mockPlayers: Player[] = [
      { id: '1', name: 'You', isHost: true, isReady: true },
      { id: '2', name: 'Alice', isHost: false, isReady: true },
      { id: '3', name: 'Bob', isHost: false, isReady: false },
    ];
    setPlayers(mockPlayers);
  }, [lobbyId]);

  const copyRoomCode = async () => {
    if (lobbyId) {
      await navigator.clipboard.writeText(lobbyId);
      // TODO: Show toast notification
    }
  };

  const shareRoomCode = async () => {
    if (navigator.share && lobbyId) {
      try {
        await navigator.share({
          title: 'Join my Party Game!',
          text: `Join my game with room code: ${lobbyId}`,
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

  const toggleReady = () => {
    setIsReady(!isReady);
    // TODO: Send ready state to server
  };

  const startGame = () => {
    setGameStarting(true);
    // TODO: Start the game
    setTimeout(() => {
      // Navigate to game (placeholder)
      navigate('/game/quick-draw'); // This would be the actual game route
    }, 2000);
  };

  const allPlayersReady = players.length >= 3 && players.every(p => p.isReady);
  const isHost = players.find(p => p.id === '1')?.isHost ?? false;

  if (!lobbyId) {
    return <div>Invalid lobby ID</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Game Lobby</h1>
        <p className="text-slate-600">Waiting for players to join...</p>
      </div>

      {/* Room Code */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="text-center">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Room Code</h3>
          <div className="text-3xl font-mono font-bold text-slate-900 tracking-wider mb-4">
            {lobbyId}
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyRoomCode}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Code
            </button>
            <button
              onClick={shareRoomCode}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Share className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-slate-900">
            Players ({players.length}/8)
          </h3>
          {isHost && (
            <button className="p-2 text-slate-600 hover:text-slate-900 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {player.name[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-slate-900">{player.name}</span>
                  {player.isHost && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
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
      <div className="space-y-3">
        {!isHost ? (
          <button
            onClick={toggleReady}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              isReady
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {isReady ? 'Ready!' : 'Mark as Ready'}
          </button>
        ) : (
          <button
            onClick={startGame}
            disabled={!allPlayersReady || gameStarting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {gameStarting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner" />
                <span>Starting Game...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Game</span>
              </>
            )}
          </button>
        )}

        {/* Status Messages */}
        {isHost && !allPlayersReady && (
          <div className="text-center text-sm text-slate-600">
            {players.length < 3
              ? 'Waiting for more players to join (minimum 3)'
              : 'Waiting for all players to be ready'}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-1">Share with friends</h3>
        <p className="text-sm text-blue-700">
          Share the room code "{lobbyId}" with your friends so they can join the game.
        </p>
      </div>
    </div>
  );
} 
