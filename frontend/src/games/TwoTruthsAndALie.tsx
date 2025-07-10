import React, { useState } from 'react';
import { Button, Input, LoadingSpinner } from '../components/ui';
import { useGameSession } from '../hooks/useGameSession';

interface TwoTruthsStatement {
  id: string;
  text: string;
  isLie?: boolean;
}

interface TwoTruthsPlayerSubmission {
  playerId: string;
  statements: TwoTruthsStatement[];
  submittedAt: Date;
}

interface TwoTruthsGameState {
  phase: 'submitting' | 'voting' | 'results';
  currentTargetPlayer?: string;
  submissions: TwoTruthsPlayerSubmission[];
  votes: any[];
  scores: Record<string, number>;
}

export const TwoTruthsAndALieGame: React.FC = () => {
  const { game, playerId, sendGameAction } = useGameSession();
  const [statements, setStatements] = useState(['', '', '']);
  // Removed unused selectedStatement state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get game state from the store
  const gameState = game.gameData as TwoTruthsGameState | null;

  const handleSubmitStatements = async () => {
    if (statements.some((s) => s.trim().length === 0)) {
      alert('Please fill in all three statements');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendGameAction({
        type: 'submit_statements',
        data: { statements: statements.map((s) => s.trim()) },
        playerId: playerId!,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error submitting statements:', error);
      alert('Failed to submit statements. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVote = async (
    statementId: string,
    targetPlayerId: string
  ) => {
    setIsSubmitting(true);
    try {
      await sendGameAction({
        type: 'submit_vote',
        data: {
          selectedStatementId: statementId,
          targetPlayerId: targetPlayerId,
        },
        playerId: playerId!,
        timestamp: new Date(),
      });
      // Removed setSelectedStatement call
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentPlayerSubmission = () => {
    return gameState?.submissions.find((s) => s.playerId === playerId);
  };

  const getCurrentTargetSubmission = () => {
    if (!gameState?.currentTargetPlayer) return null;
    return gameState.submissions.find(
      (s) => s.playerId === gameState.currentTargetPlayer
    );
  };

  const getPlayerName = (playerId: string) => {
    return (
      game.players.find((p) => p.id === playerId)?.name || 'Unknown Player'
    );
  };

  const hasPlayerVoted = (targetPlayerId: string) => {
    return gameState?.votes.some(
      (v) => v.voterId === playerId && v.targetPlayerId === targetPlayerId
    );
  };

  if (!gameState) {
    return (
      <div className='flex flex-col items-center justify-center min-h-64 space-y-4'>
        <LoadingSpinner />
        <p className='text-gray-600'>Initializing game...</p>
      </div>
    );
  }

  // Submission Phase
  if (gameState.phase === 'submitting') {
    const hasSubmitted = getCurrentPlayerSubmission();

    if (hasSubmitted) {
      return (
        <div className='space-y-6'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-blue-600 mb-2'>
              Statements Submitted!
            </h2>
            <p className='text-gray-600'>
              Waiting for other players to submit their statements...
            </p>
          </div>

          <div className='bg-blue-50 p-4 rounded-lg'>
            <h3 className='font-semibold mb-2'>Your Statements:</h3>
            <ul className='space-y-2'>
              {hasSubmitted.statements.map((statement, index) => (
                <li key={statement.id} className='p-2 bg-white rounded border'>
                  {index + 1}. {statement.text}
                </li>
              ))}
            </ul>
          </div>

          <div className='text-center'>
            <LoadingSpinner />
            <p className='text-sm text-gray-500 mt-2'>
              {gameState.submissions.length} / {game.players.length} players
              have submitted
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-blue-600 mb-2'>
            Two Truths and a Lie
          </h2>
          <p className='text-gray-600'>
            Write three statements about yourself: two that are true and one
            that is a lie. Other players will try to guess which one is the lie!
          </p>
        </div>

        <div className='space-y-4'>
          {statements.map((statement, index) => (
            <div key={index}>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Statement {index + 1}
              </label>
              <Input
                value={statement}
                onChange={(e) => {
                  const newStatements = [...statements];
                  newStatements[index] = e.target.value;
                  setStatements(newStatements);
                }}
                placeholder={`Enter statement ${index + 1}...`}
                className='w-full'
              />
            </div>
          ))}
        </div>

        <Button
          onClick={handleSubmitStatements}
          disabled={
            isSubmitting || statements.some((s) => s.trim().length === 0)
          }
          className='w-full'
        >
          {isSubmitting ? 'Submitting...' : 'Submit Statements'}
        </Button>
      </div>
    );
  }

  // Voting Phase
  if (gameState.phase === 'voting') {
    const currentTargetSubmission = getCurrentTargetSubmission();
    const currentTargetName = gameState.currentTargetPlayer
      ? getPlayerName(gameState.currentTargetPlayer)
      : '';

    if (!currentTargetSubmission) {
      return (
        <div className='text-center'>
          <LoadingSpinner />
          <p className='text-gray-600'>Loading voting phase...</p>
        </div>
      );
    }

    // If voting on yourself, show waiting message
    if (gameState.currentTargetPlayer === playerId) {
      return (
        <div className='text-center space-y-4'>
          <h2 className='text-2xl font-bold text-blue-600'>
            Other players are voting on your statements!
          </h2>
          <div className='bg-blue-50 p-4 rounded-lg'>
            <h3 className='font-semibold mb-2'>Your Statements:</h3>
            <ul className='space-y-2'>
              {currentTargetSubmission.statements.map((statement, index) => (
                <li key={statement.id} className='p-2 bg-white rounded border'>
                  {index + 1}. {statement.text}
                </li>
              ))}
            </ul>
          </div>
          <LoadingSpinner />
          <p className='text-gray-600'>Waiting for other players to vote...</p>
        </div>
      );
    }

    // Check if already voted for current target
    const hasVoted = hasPlayerVoted(gameState.currentTargetPlayer!);

    if (hasVoted) {
      return (
        <div className='text-center space-y-4'>
          <h2 className='text-2xl font-bold text-green-600'>Vote Submitted!</h2>
          <p className='text-gray-600'>
            Waiting for other players to vote on {currentTargetName}'s
            statements...
          </p>
          <LoadingSpinner />
        </div>
      );
    }

    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-blue-600'>
            Vote on {currentTargetName}'s Statements
          </h2>
          <p className='text-gray-600'>
            Which statement do you think is the lie?
          </p>
        </div>

        <div className='space-y-3'>
          {currentTargetSubmission.statements.map((statement, index) => (
            <button
              key={statement.id}
              onClick={() =>
                handleSubmitVote(statement.id, gameState.currentTargetPlayer!)
              }
              disabled={isSubmitting}
              className='w-full p-4 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50'
            >
              <span className='font-medium text-blue-600'>{index + 1}.</span>{' '}
              {statement.text}
            </button>
          ))}
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
  if (gameState.phase === 'results') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-green-600 mb-2'>
            Round Results!
          </h2>
          <p className='text-gray-600'>Here's how everyone did:</p>
        </div>

        <div className='space-y-4'>
          {gameState.submissions.map((submission) => {
            const playerName = getPlayerName(submission.playerId);
            const votesForPlayer = gameState.votes.filter(
              (v) => v.targetPlayerId === submission.playerId
            );

            return (
              <div
                key={submission.playerId}
                className='bg-white p-4 rounded-lg border'
              >
                <h3 className='font-semibold text-lg mb-3'>
                  {playerName}'s Statements
                </h3>
                <div className='space-y-2'>
                  {submission.statements.map((statement, index) => {
                    const votesForStatement = votesForPlayer.filter(
                      (v) => v.selectedStatementId === statement.id
                    );
                    const isLie = statement.isLie;

                    return (
                      <div
                        key={statement.id}
                        className={`p-3 rounded border-l-4 ${
                          isLie
                            ? 'border-red-500 bg-red-50'
                            : 'border-green-500 bg-green-50'
                        }`}
                      >
                        <div className='flex justify-between items-start'>
                          <span className='flex-1'>
                            <span className='font-medium'>
                              {index + 1}. {statement.text}
                            </span>
                            {isLie && (
                              <span className='text-red-600 font-bold ml-2'>
                                (LIE)
                              </span>
                            )}
                          </span>
                          <span className='text-sm text-gray-600'>
                            {votesForStatement.length} vote
                            {votesForStatement.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className='bg-blue-50 p-4 rounded-lg'>
          <h3 className='font-semibold text-lg mb-3'>Current Scores</h3>
          <div className='space-y-2'>
            {Object.entries(gameState.scores)
              .sort(([, a], [, b]) => b - a)
              .map(([playerId, score]) => (
                <div
                  key={playerId}
                  className='flex justify-between items-center'
                >
                  <span className='font-medium'>{getPlayerName(playerId)}</span>
                  <span className='text-blue-600 font-bold'>
                    {score} points
                  </span>
                </div>
              ))}
          </div>
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

// Also export as TwoTruthsAndALie for consistency
export const TwoTruthsAndALie = TwoTruthsAndALieGame;
export default TwoTruthsAndALieGame;
