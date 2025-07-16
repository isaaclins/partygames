import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OfflineGameResults, { OfflineGameResultsProps, OfflinePlayerRole } from '../../games/OfflineGameResults';

describe('OfflineGameResults', () => {
  const roles: OfflinePlayerRole[] = [
    { playerName: 'Alice', location: 'Beach', role: 'Lifeguard', isSpy: false },
    { playerName: 'Bob', location: null, role: null, isSpy: true },
    { playerName: 'Charlie', location: 'Beach', role: 'Tourist', isSpy: false },
  ];

  const baseProps: OfflineGameResultsProps = {
    results: {
      votedOutPlayer: 'Charlie',
      voteCounts: { Alice: 1, Bob: 1, Charlie: 2 },
      spyName: 'Bob',
      location: 'Beach',
      winner: 'non-spies',
      isTie: false,
      roles,
    },
    onRestart: vi.fn(),
    onReturnToDiscussion: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders vote tally and voted out player', () => {
    render(<OfflineGameResults {...baseProps} />);
    expect(screen.getByTestId('vote-tally')).toBeInTheDocument();
    expect(screen.getByTestId('voted-out')).toHaveTextContent('Charlie was voted out.');
  });

  it('shows non-spies win message with correct color', () => {
    render(<OfflineGameResults {...baseProps} />);
    const winner = screen.getByTestId('winner-announcement');
    expect(winner).toHaveTextContent('The Non-Spies Win!');
    expect(winner.className).toMatch(/text-green-600/);
  });

  it('shows spy win message with correct color', () => {
    render(
      <OfflineGameResults
        {...baseProps}
        results={{ ...baseProps.results, winner: 'spy', votedOutPlayer: 'Alice' }}
      />
    );
    const winner = screen.getByTestId('winner-announcement');
    expect(winner).toHaveTextContent('The Spy Wins!');
    expect(winner.className).toMatch(/text-red-600/);
  });

  it('renders all player roles with correct info', () => {
    render(<OfflineGameResults {...baseProps} />);
    roles.forEach((role) => {
      const card = screen.getByTestId(`role-card-${role.playerName}`);
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent(role.playerName);
      if (role.isSpy) {
        expect(card).toHaveTextContent('Spy');
      } else {
        expect(card).toHaveTextContent(role.role!);
        expect(card).toHaveTextContent(role.location!);
      }
    });
  });

  it('calls onRestart when restart button is clicked', () => {
    render(<OfflineGameResults {...baseProps} />);
    fireEvent.click(screen.getByTestId('restart-game'));
    expect(baseProps.onRestart).toHaveBeenCalled();
  });

  it('shows tie message and return to discussion button if isTie', () => {
    render(
      <OfflineGameResults
        {...baseProps}
        results={{ ...baseProps.results, isTie: true }}
      />
    );
    expect(screen.getByTestId('tie-message')).toBeInTheDocument();
    expect(screen.getByTestId('return-to-discussion')).toBeInTheDocument();
  });

  it('calls onReturnToDiscussion when return button is clicked', () => {
    render(
      <OfflineGameResults
        {...baseProps}
        results={{ ...baseProps.results, isTie: true }}
      />
    );
    fireEvent.click(screen.getByTestId('return-to-discussion'));
    expect(baseProps.onReturnToDiscussion).toHaveBeenCalled();
  });
}); 
