import React, { useState } from 'react';
import { Button, Input, LoadingSpinner } from '../components/ui';
import { useGameSession } from '../hooks/useGameSession';

interface WouldYouRatherScenario {
  id: string;
  optionA: string;
  optionB: string;
  submittedBy: string;
  round: number;
}

interface WouldYouRatherVote {
  voterId: string;
  scenarioId: string;
  choice: 'A' | 'B';
  submittedAt: Date;
}

interface WouldYouRatherGameState {
  scenarios: WouldYouRatherScenario[];
  votes: WouldYouRatherVote[];
  currentPhase: 'submitting' | 'voting' | 'results';
  currentScenarioIndex: number;
  currentRound: number;
  maxRounds: number;
  scores: Record<string, number>;
  currentScenario?: WouldYouRatherScenario;
  votingProgress?: { voted: number; total: number };
}

export const WouldYouRatherGame: React.FC = () => {
  const { game, playerId, sendGameAction } = useGameSession();
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get game state from the store
  const gameState = game.gameData as WouldYouRatherGameState | null;

  const handleSubmitScenario = async () => {
    if (!optionA.trim() || !optionB.trim()) {
      alert('Please fill in both options');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendGameAction({
        type: 'submit_scenario',
        data: {
          optionA: optionA.trim(),
          optionB: optionB.trim(),
        },
        playerId: playerId!,
        timestamp: new Date(),
      });

      // Clear form after successful submission
      setOptionA('');
      setOptionB('');
    } catch (error) {
      console.error('Error submitting scenario:', error);
      alert('Failed to submit scenario. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVote = async (choice: 'A' | 'B') => {
    if (!gameState?.currentScenario) return;

    setIsSubmitting(true);
    try {
      await sendGameAction({
        type: 'submit_vote',
        data: {
          scenarioId: gameState.currentScenario.id,
          choice: choice,
        },
        playerId: playerId!,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlayerName = (playerId: string) => {
    return (
      game.players.find((p) => p.id === playerId)?.name || 'Unknown Player'
    );
  };

  const hasPlayerSubmittedScenario = () => {
    if (!gameState) return false;
    return gameState.scenarios.some(
      (s) => s.submittedBy === playerId && s.round === gameState.currentRound
    );
  };

  const hasPlayerVotedForCurrentScenario = () => {
    if (!gameState?.currentScenario) return false;
    return gameState.votes.some(
      (v) =>
        v.voterId === playerId && v.scenarioId === gameState.currentScenario!.id
    );
  };

  const isCurrentScenarioCreator = () => {
    return gameState?.currentScenario?.submittedBy === playerId;
  };

  // Removed unused getVotesForCurrentScenario function

  if (!gameState) {
    return (
      <div className='flex flex-col items-center justify-center min-h-64 space-y-4'>
        <LoadingSpinner />
        <p className='text-gray-600'>Initializing game...</p>
      </div>
    );
  }

  // Submission Phase
  if (gameState.currentPhase === 'submitting') {
    const hasSubmitted = hasPlayerSubmittedScenario();
    const submittedCount = gameState.scenarios.filter(
      (s) => s.round === gameState.currentRound
    ).length;

    if (hasSubmitted) {
      return (
        <div className='space-y-6'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-purple-600 mb-2'>
              Scenario Submitted!
            </h2>
            <p className='text-gray-600'>
              Waiting for other players to submit their scenarios...
            </p>
          </div>

          <div className='bg-purple-50 p-4 rounded-lg'>
            <h3 className='font-semibold mb-2'>
              Round {gameState.currentRound} of {gameState.maxRounds}
            </h3>
            <div className='text-center'>
              <LoadingSpinner />
              <p className='text-sm text-gray-500 mt-2'>
                {submittedCount} / {game.players.length} players have submitted
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-purple-600 mb-2'>
            Would You Rather
          </h2>
          <p className='text-gray-600 mb-1'>
            Create a challenging "Would You Rather" scenario for other players!
          </p>
          <p className='text-sm text-purple-600'>
            Round {gameState.currentRound} of {gameState.maxRounds}
          </p>
        </div>

        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Option A
            </label>
            <Input
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              placeholder='Would you rather...'
              className='w-full'
            />
          </div>

          <div className='text-center text-gray-500 font-medium'>OR</div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Option B
            </label>
            <Input
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              placeholder='Would you rather...'
              className='w-full'
            />
          </div>
        </div>

        <Button
          onClick={handleSubmitScenario}
          disabled={isSubmitting || !optionA.trim() || !optionB.trim()}
          className='w-full'
        >
          {isSubmitting ? 'Submitting...' : 'Submit Scenario'}
        </Button>
      </div>
    );
  }

  // Voting Phase
  if (gameState.currentPhase === 'voting') {
    if (!gameState.currentScenario) {
      return (
        <div className='text-center'>
          <LoadingSpinner />
          <p className='text-gray-600'>Loading voting phase...</p>
        </div>
      );
    }

    // If voting on your own scenario, show waiting message
    if (isCurrentScenarioCreator()) {
      return (
        <div className='text-center space-y-4'>
          <h2 className='text-2xl font-bold text-purple-600'>
            Other players are voting on your scenario!
          </h2>
          <div className='bg-purple-50 p-4 rounded-lg'>
            <h3 className='font-semibold mb-2'>Your Scenario:</h3>
            <div className='space-y-2'>
              <p className='p-2 bg-white rounded border'>
                <span className='font-medium text-purple-600'>A:</span>{' '}
                {gameState.currentScenario.optionA}
              </p>
              <p className='p-2 bg-white rounded border'>
                <span className='font-medium text-purple-600'>B:</span>{' '}
                {gameState.currentScenario.optionB}
              </p>
            </div>
          </div>
          <LoadingSpinner />
          <p className='text-gray-600'>
            {gameState.votingProgress?.voted || 0} /{' '}
            {gameState.votingProgress?.total || 0} players have voted
          </p>
        </div>
      );
    }

    // Check if already voted for current scenario
    const hasVoted = hasPlayerVotedForCurrentScenario();
    const scenarioCreator = getPlayerName(
      gameState.currentScenario.submittedBy
    );

    if (hasVoted) {
      return (
        <div className='text-center space-y-4'>
          <h2 className='text-2xl font-bold text-green-600'>Vote Submitted!</h2>
          <p className='text-gray-600'>
            Waiting for other players to vote on {scenarioCreator}'s scenario...
          </p>
          <LoadingSpinner />
          <p className='text-sm text-gray-500'>
            {gameState.votingProgress?.voted || 0} /{' '}
            {gameState.votingProgress?.total || 0} players have voted
          </p>
        </div>
      );
    }

    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-purple-600'>
            Vote on {scenarioCreator}'s Scenario
          </h2>
          <p className='text-gray-600'>Which would you rather do?</p>
        </div>

        <div className='space-y-3'>
          <button
            onClick={() => handleSubmitVote('A')}
            disabled={isSubmitting}
            className='w-full p-4 text-left bg-white border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50'
          >
            <span className='font-bold text-purple-600 text-lg'>A:</span>
            <span className='ml-2'>{gameState.currentScenario.optionA}</span>
          </button>

          <button
            onClick={() => handleSubmitVote('B')}
            disabled={isSubmitting}
            className='w-full p-4 text-left bg-white border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50'
          >
            <span className='font-bold text-purple-600 text-lg'>B:</span>
            <span className='ml-2'>{gameState.currentScenario.optionB}</span>
          </button>
        </div>

        {isSubmitting && (
          <div className='text-center'>
            <LoadingSpinner />
            <p className='text-gray-600'>Submitting vote...</p>
          </div>
        )}
      </div>
    );
  }

  // Results Phase
  if (gameState.currentPhase === 'results') {
    const sortedScores = Object.entries(gameState.scores).sort(
      ([, a], [, b]) => b - a
    );

    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-green-600 mb-2'>
            Game Complete!
          </h2>
          <p className='text-gray-600'>Here's how everyone did:</p>
        </div>

        <div className='bg-green-50 p-4 rounded-lg'>
          <h3 className='font-semibold text-lg mb-3'>Final Scores</h3>
          <div className='space-y-2'>
            {sortedScores.map(([playerId, score], index) => (
              <div key={playerId} className='flex justify-between items-center'>
                <span className='font-medium'>
                  {index === 0 && '👑 '}
                  {getPlayerName(playerId)}
                </span>
                <span className='text-green-600 font-bold'>{score} points</span>
              </div>
            ))}
          </div>
        </div>

        <div className='space-y-4'>
          <h3 className='font-semibold text-lg'>Scenario Results</h3>
          {gameState.scenarios.map((scenario) => {
            const scenarioVotes = gameState.votes.filter(
              (v) => v.scenarioId === scenario.id
            );
            const votesA = scenarioVotes.filter((v) => v.choice === 'A').length;
            const votesB = scenarioVotes.filter((v) => v.choice === 'B').length;
            const totalVotes = votesA + votesB;

            return (
              <div key={scenario.id} className='bg-white p-4 rounded-lg border'>
                <h4 className='font-semibold mb-2'>
                  {getPlayerName(scenario.submittedBy)}'s Scenario
                </h4>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between p-2 bg-purple-50 rounded'>
                    <span>
                      <strong>A:</strong> {scenario.optionA}
                    </span>
                    <span className='text-sm text-purple-600'>
                      {votesA} vote{votesA !== 1 ? 's' : ''}
                      {totalVotes > 0 &&
                        ` (${Math.round((votesA / totalVotes) * 100)}%)`}
                    </span>
                  </div>
                  <div className='flex items-center justify-between p-2 bg-purple-50 rounded'>
                    <span>
                      <strong>B:</strong> {scenario.optionB}
                    </span>
                    <span className='text-sm text-purple-600'>
                      {votesB} vote{votesB !== 1 ? 's' : ''}
                      {totalVotes > 0 &&
                        ` (${Math.round((votesB / totalVotes) * 100)}%)`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className='text-center'>
      <p className='text-gray-600'>Unknown game phase...</p>
    </div>
  );
};

// Also export as WouldYouRather for consistency
export const WouldYouRather = WouldYouRatherGame;
export default WouldYouRatherGame;
