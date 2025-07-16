import React, { useState } from 'react';
import PlayerSetup from '../components/PlayerSetup';
import RoleRevealCard from '../components/RoleRevealCard';
import VotingInterface from '../components/VotingInterface';
import OfflineGameResults from './OfflineGameResults';
import { assignRoles, processVotes } from '../../../shared/utils/offlineSpyfall';
import type { OfflinePlayerRole, OfflineVote, OfflineGameResults as OfflineGameResultsType } from '../../../shared/types';

// Game phases
type Phase = 'setup' | 'role-reveal' | 'discussion' | 'voting' | 'results';

interface OfflineGameState {
  phase: Phase;
  players: string[];
  roles: OfflinePlayerRole[];
  currentCardIndex: number;
  votes: OfflineVote[];
  currentVoterIndex: number;
  gameResults?: OfflineGameResultsType;
}

const OfflineSpyfallGame: React.FC = () => {
  const [state, setState] = useState<OfflineGameState>({
    phase: 'setup',
    players: [],
    roles: [],
    currentCardIndex: 0,
    votes: [],
    currentVoterIndex: 0,
    gameResults: undefined,
  });
  // Add cardStep state: 0 = hidden, 1 = revealed
  const [cardStep, setCardStep] = useState(0);

  // --- Phase: Setup ---
  const handlePlayersReady = (players: string[]) => {
    const roles = assignRoles(players);
    setState((s) => ({
      ...s,
      players,
      roles,
      currentCardIndex: 0,
      phase: 'role-reveal',
    }));
    setCardStep(0);
  };

  // --- Phase: Role Reveal ---
  const handleCardTap = () => {
    if (cardStep === 0) {
      setCardStep(1);
    } else {
      // Move to next player or phase
      if (state.currentCardIndex < state.players.length - 1) {
        setState((s) => ({ ...s, currentCardIndex: s.currentCardIndex + 1 }));
        setCardStep(0);
      } else {
        setState((s) => ({ ...s, phase: 'discussion', currentCardIndex: 0 }));
        setCardStep(0);
      }
    }
  };

  // --- Phase: Discussion ---
  const handleStartVoting = () => {
    // Randomize voting order, but exclude self-voting in VotingInterface
    const firstVoterIndex = Math.floor(Math.random() * state.players.length);
    setState((s) => ({ ...s, phase: 'voting', currentVoterIndex: firstVoterIndex, votes: [] }));
  };

  // --- Phase: Voting ---
  const handleVote = (target: string) => {
    const voter = state.players[state.currentVoterIndex];
    const newVotes = [...state.votes, { voterName: voter, targetName: target }];
    if (newVotes.length < state.players.length) {
      // Next voter (skip already voted)
      let nextVoterIndex = state.currentVoterIndex;
      do {
        nextVoterIndex = (nextVoterIndex + 1) % state.players.length;
      } while (newVotes.some((v) => v.voterName === state.players[nextVoterIndex]));
      setState((s) => ({ ...s, votes: newVotes, currentVoterIndex: nextVoterIndex }));
    } else {
      // All have voted
      const results = processVotes(newVotes, state.roles);
      setState((s) => ({ ...s, votes: newVotes, phase: 'results', gameResults: { ...results, roles: state.roles } }));
    }
  };

  // --- Phase: Results ---
  const handleRestart = () => {
    setState({
      phase: 'setup',
      players: [],
      roles: [],
      currentCardIndex: 0,
      votes: [],
      currentVoterIndex: 0,
      gameResults: undefined,
    });
  };

  const handleReturnToDiscussion = () => {
    setState((s) => ({ ...s, phase: 'discussion', votes: [], currentVoterIndex: 0, gameResults: undefined }));
  };

  // --- Render by phase ---
  switch (state.phase) {
    case 'setup':
      return <PlayerSetup onPlayersReady={handlePlayersReady} />;
    case 'role-reveal': {
      const player = state.players[state.currentCardIndex];
      const role = state.roles[state.currentCardIndex];
      return (
        <RoleRevealCard
          playerName={player}
          role={role}
          isRevealed={cardStep === 1}
          onCardTap={handleCardTap}
        />
      );
    }
    case 'discussion':
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <h2 className="text-2xl font-bold mb-4">Discussion Phase</h2>
          <p className="mb-6 text-center text-gray-700">Discuss and try to identify the spy. When ready, start voting.</p>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 focus:outline-none"
            onClick={handleStartVoting}
            data-testid="start-voting"
          >
            Start Voting
          </button>
        </div>
      );
    case 'voting': {
      const currentVoter = state.players[state.currentVoterIndex];
      const otherPlayers = state.players.filter((p) => p !== currentVoter);
      return (
        <VotingInterface
          currentVoter={currentVoter}
          otherPlayers={otherPlayers}
          onVote={handleVote}
        />
      );
    }
    case 'results':
      if (!state.gameResults) return null;
      return (
        <OfflineGameResults
          results={state.gameResults}
          onRestart={handleRestart}
          onReturnToDiscussion={state.gameResults.isTie ? handleReturnToDiscussion : undefined}
        />
      );
    default:
      return null;
  }
};

export default OfflineSpyfallGame; 
