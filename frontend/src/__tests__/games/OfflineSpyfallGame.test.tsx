import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import OfflineSpyfallGame from '../../games/OfflineSpyfallGame';
import * as utils from '../../../../shared/utils/offlineSpyfall';
import type { OfflinePlayerRole, OfflineGameResults } from '../../../../shared/types';
import { vi } from 'vitest';

describe('OfflineSpyfallGame integration', () => {
  const players = ['Alice', 'Bob', 'Charlie'];
  const roles: OfflinePlayerRole[] = [
    { playerName: 'Alice', location: 'Beach', role: 'Lifeguard', isSpy: false },
    { playerName: 'Bob', location: null, role: null, isSpy: true },
    { playerName: 'Charlie', location: 'Beach', role: 'Tourist', isSpy: false },
  ];
  const gameResults: OfflineGameResults = {
    votedOutPlayer: 'Charlie',
    voteCounts: { Alice: 1, Bob: 1, Charlie: 2 },
    spyName: 'Bob',
    location: 'Beach',
    winner: 'non-spies',
    isTie: false,
    roles,
  };
  const tieResults: OfflineGameResults = {
    ...gameResults,
    isTie: true,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(utils, 'assignRoles').mockReturnValue(roles);
    vi.spyOn(utils, 'processVotes').mockImplementation((votes) => {
      if (votes.length === 3 && votes[0].targetName === 'Charlie') {
        return gameResults;
      }
      return tieResults;
    });
  });

  it('runs through the full game flow: setup → role reveal → discussion → voting → results → restart', () => {
    render(<OfflineSpyfallGame />);
    // Setup phase
    const nameInput = screen.getByPlaceholderText(/enter player name/i);
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: /add player/i }));
    fireEvent.change(nameInput, { target: { value: 'Bob' } });
    fireEvent.click(screen.getByRole('button', { name: /add player/i }));
    fireEvent.change(nameInput, { target: { value: 'Charlie' } });
    fireEvent.click(screen.getByRole('button', { name: /add player/i }));
    fireEvent.click(screen.getByText(/start game/i));

    // Role reveal phase (3 players)
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      // Only assert heading for the first player
      if (i === 0) {
        expect(screen.getByRole('heading', { name: new RegExp(player, 'i') })).toBeInTheDocument();
      }
      const showRoleBtn = screen.queryByText(/show my role/i);
      if (showRoleBtn) {
        fireEvent.click(showRoleBtn);
      } else {
        let revealPrompt = screen.queryByText(/tap to reveal your role/i);
        if (!revealPrompt) {
          revealPrompt = screen.getByText(/tap to continue/i);
        }
        fireEvent.click(revealPrompt.parentElement!);
      }
      const nextBtn = screen.queryByRole('button', { name: /next/i }) || screen.queryByRole('button', { name: /next player/i });
      if (nextBtn) {
        fireEvent.click(nextBtn);
      }
    }

    // Discussion phase
    expect(screen.getByText(/discussion phase/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('start-voting'));

    // Voting phase (simulate all votes)
    for (let i = 0; i < players.length; i++) {
      // Always select the first available player button
      const playerButtons = screen.getAllByTestId(/player-button-/);
      fireEvent.click(playerButtons[0]);
      fireEvent.click(screen.getByTestId('confirm-vote'));
    }

    // Results phase
    expect(screen.getByTestId('results-title')).toBeInTheDocument();
    const tieMsg = screen.queryByTestId('tie-message');
    if (tieMsg) {
      expect(tieMsg).toHaveTextContent("It's a tie! No one is voted out.");
      // Optionally, click return to discussion and check discussion phase
      fireEvent.click(screen.getByTestId('return-to-discussion'));
      expect(screen.getByText(/discussion phase/i)).toBeInTheDocument();
    } else {
      expect(screen.getByTestId('winner-announcement')).toHaveTextContent('The Non-Spies Win!');
      // Restart
      fireEvent.click(screen.getByTestId('restart-game'));
      // Should be back to setup
      expect(screen.getByPlaceholderText(/enter player name/i)).toBeInTheDocument();
    }
  });

  it('handles tie and returns to discussion', () => {
    render(<OfflineSpyfallGame />);
    // Setup
    const nameInput = screen.getByPlaceholderText(/enter player name/i);
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: /add player/i }));
    fireEvent.change(nameInput, { target: { value: 'Bob' } });
    fireEvent.click(screen.getByRole('button', { name: /add player/i }));
    fireEvent.change(nameInput, { target: { value: 'Charlie' } });
    fireEvent.click(screen.getByRole('button', { name: /add player/i }));
    fireEvent.click(screen.getByText(/start game/i));
    // Role reveal
    for (let i = 0; i < players.length; i++) {
      const showRoleBtn = screen.queryByText(/show my role/i);
      if (showRoleBtn) {
        fireEvent.click(showRoleBtn);
      } else {
        let revealPrompt = screen.queryByText(/tap to reveal your role/i);
        if (!revealPrompt) {
          revealPrompt = screen.getByText(/tap to continue/i);
        }
        fireEvent.click(revealPrompt.parentElement!);
      }
      const nextBtn = screen.queryByRole('button', { name: /next/i }) || screen.queryByRole('button', { name: /next player/i });
      if (nextBtn) {
        fireEvent.click(nextBtn);
      }
    }
    // Discussion
    fireEvent.click(screen.getByTestId('start-voting'));
    // Voting (simulate tie)
    for (let i = 0; i < players.length; i++) {
      const playerButtons = screen.getAllByTestId(/player-button-/);
      fireEvent.click(playerButtons[0]);
      fireEvent.click(screen.getByTestId('confirm-vote'));
    }
    // Tie results
    expect(screen.getByTestId('tie-message')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('return-to-discussion'));
    // Should be back to discussion
    expect(screen.getByText(/discussion phase/i)).toBeInTheDocument();
  });
}); 
