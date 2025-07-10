import React, { useState } from 'react';
import { Button, Input, LoadingSpinner } from '../components/ui';
import { DrawingCanvas } from '../components/ui';
import { useGameSession } from '../hooks/useGameSession';
import { Timer, Users, Trophy } from 'lucide-react';

interface QuickDrawGameState {
  currentRound: number;
  totalRounds: number;
  rounds: any[];
  scores: Record<string, number>;
  playerOrder: string[];
  gamePhase: 'setup' | 'playing' | 'finished';
  currentRoundData?: any;
  canDraw: boolean;
  canGuess: boolean;
}

export const QuickDrawGame: React.FC = () => {
  const { game, playerId, sendGameAction } = useGameSession();
  const [guess, setGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const gameState = game.gameData as QuickDrawGameState | null;

  const handleStartGame = async () => {
    setIsSubmitting(true);
    try {
      await sendGameAction({
        type: 'start_drawing',
        data: {},
        playerId: playerId!,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStrokeAdded = async (stroke: any) => {
    try {
      await sendGameAction({
        type: 'add_stroke',
        data: { stroke },
        playerId: playerId!,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error adding stroke:', error);
    }
  };

  const handleSubmitGuess = async () => {
    if (!guess.trim()) return;

    setIsSubmitting(true);
    try {
      await sendGameAction({
        type: 'submit_guess',
        data: { guess: guess.trim() },
        playerId: playerId!,
        timestamp: new Date(),
      });
      setGuess('');
    } catch (error) {
      console.error('Error submitting guess:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearCanvas = async () => {
    try {
      await sendGameAction({
        type: 'clear_canvas',
        data: {},
        playerId: playerId!,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error clearing canvas:', error);
    }
  };

  const handleUndoStroke = async () => {
    try {
      await sendGameAction({
        type: 'undo_stroke',
        data: {},
        playerId: playerId!,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error undoing stroke:', error);
    }
  };

  const getPlayerName = (playerId: string) => {
    return game.players.find(p => p.id === playerId)?.name || 'Unknown Player';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
        <LoadingSpinner />
        <p className="text-gray-600">Initializing Quick Draw...</p>
      </div>
    );
  }

  // Setup phase
  if (gameState.gamePhase === 'setup') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Timer className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-orange-600 mb-2">Quick Draw!</h2>
          <p className="text-gray-600 mb-4">
            Draw the prompt and others will guess what it is. Be fast and creative!
          </p>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Game Rules</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Each player takes turns drawing a secret word</li>
            <li>• You have 60 seconds to draw, then 30 seconds for guessing</li>
            <li>• Correct guesses earn points based on speed</li>
            <li>• Drawers get points when others guess correctly</li>
          </ul>
        </div>

        <Button
          onClick={handleStartGame}
          disabled={isSubmitting}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {isSubmitting ? 'Starting...' : 'Start Game'}
        </Button>
      </div>
    );
  }

  // Game finished
  if (gameState.gamePhase === 'finished') {
    const sortedScores = Object.entries(gameState.scores)
      .sort(([,a], [,b]) => b - a);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-600 mb-2">Game Complete!</h2>
          <p className="text-gray-600">Great drawings everyone!</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Final Scores</h3>
          <div className="space-y-2">
            {sortedScores.map(([playerId, score], index) => (
              <div key={playerId} className="flex justify-between items-center">
                <span className="font-medium">
                  {index === 0 && '👑 '}{getPlayerName(playerId)}
                </span>
                <span className="text-green-600 font-bold">{score} points</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Playing phase
  const currentRoundData = gameState.currentRoundData;
  if (!currentRoundData) {
    return (
      <div className="text-center">
        <LoadingSpinner />
        <p className="text-gray-600">Loading round...</p>
      </div>
    );
  }

  const isDrawer = currentRoundData.drawerId === playerId;
  const drawerName = getPlayerName(currentRoundData.drawerId);

  return (
    <div className="space-y-6">
      {/* Round Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-orange-600">
            Round {currentRoundData.roundNumber} of {gameState.totalRounds}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Timer className="w-4 h-4" />
              <span>{formatTime(currentRoundData.timeRemaining)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{game.players.length} players</span>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          {isDrawer ? (
            <div>
              <p className="text-lg font-medium">Your word: <span className="text-orange-600">{currentRoundData.prompt.word}</span></p>
              <p className="text-sm text-gray-600">Draw it for others to guess!</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium">{drawerName} is drawing</p>
              <p className="text-sm text-gray-600">Guess what they're drawing!</p>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <DrawingCanvas
        width={currentRoundData.canvas.width}
        height={currentRoundData.canvas.height}
        strokes={currentRoundData.canvas.strokes}
        canDraw={isDrawer && gameState.canDraw}
        onStrokeAdded={handleStrokeAdded}
        onClearCanvas={handleClearCanvas}
        onUndoStroke={handleUndoStroke}
      />

      {/* Guessing Interface */}
      {!isDrawer && gameState.canGuess && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex space-x-2">
            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Type your guess..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitGuess()}
              disabled={isSubmitting}
            />
            <Button
              onClick={handleSubmitGuess}
              disabled={isSubmitting || !guess.trim()}
            >
              {isSubmitting ? 'Guessing...' : 'Guess'}
            </Button>
          </div>
        </div>
      )}

      {/* Recent Guesses */}
      {currentRoundData.guesses && currentRoundData.guesses.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-2">Recent Guesses</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {currentRoundData.guesses.slice(-5).reverse().map((guessData: any, index: number) => (
              <div key={index} className={`text-sm ${guessData.isCorrect ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
                <span className="font-medium">{getPlayerName(guessData.playerId)}:</span> {guessData.guess}
                {guessData.isCorrect && ' ✓'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Scores */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-2">Current Scores</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(gameState.scores)
            .sort(([,a], [,b]) => b - a)
            .map(([playerId, score]) => (
              <div key={playerId} className="flex justify-between">
                <span className="text-sm">{getPlayerName(playerId)}</span>
                <span className="text-sm font-semibold">{score}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export const QuickDraw = QuickDrawGame;
export default QuickDrawGame; 
