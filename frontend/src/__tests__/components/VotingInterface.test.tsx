import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VotingInterface, { VotingInterfaceProps } from '../../components/VotingInterface';
import { vi } from 'vitest';

describe('VotingInterface', () => {
  const baseProps: VotingInterfaceProps = {
    currentVoter: 'Alice',
    otherPlayers: ['Bob', 'Charlie', 'Dana'],
    onVote: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders current voter and instructions', () => {
    render(<VotingInterface {...baseProps} />);
    expect(screen.getByTestId('voter-name')).toHaveTextContent('Alice');
    expect(screen.getByTestId('voting-instructions')).toBeInTheDocument();
  });

  it('renders a button for each other player', () => {
    render(<VotingInterface {...baseProps} />);
    baseProps.otherPlayers.forEach((player) => {
      expect(screen.getByTestId(`player-button-${player}`)).toBeInTheDocument();
    });
  });

  it('does not render a button for the current voter', () => {
    render(<VotingInterface {...baseProps} />);
    expect(screen.queryByTestId('player-button-Alice')).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when a player is selected', () => {
    render(<VotingInterface {...baseProps} />);
    fireEvent.click(screen.getByTestId('player-button-Bob'));
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    // Use function matcher to match text across element boundaries
    expect(
      screen.getByText((content, node) => {
        const hasText = (node: Element | null) =>
          node?.textContent === 'Vote for Bob?';
        const nodeHasText = hasText(node as Element);
        const childrenDontHaveText = Array.from(node?.children || []).every(
          (child) => !hasText(child as Element)
        );
        return nodeHasText && childrenDontHaveText;
      })
    ).toBeInTheDocument();
  });

  it('calls onVote with selected player when confirmed', () => {
    const onVote = vi.fn();
    render(<VotingInterface {...baseProps} onVote={onVote} />);
    fireEvent.click(screen.getByTestId('player-button-Charlie'));
    fireEvent.click(screen.getByTestId('confirm-vote'));
    expect(onVote).toHaveBeenCalledWith('Charlie');
  });

  it('does not call onVote if vote is cancelled', () => {
    const onVote = vi.fn();
    render(<VotingInterface {...baseProps} onVote={onVote} />);
    fireEvent.click(screen.getByTestId('player-button-Dana'));
    fireEvent.click(screen.getByTestId('cancel-vote'));
    expect(onVote).not.toHaveBeenCalled();
    // Dialog should close
    expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
  });

  it('disables player buttons while confirmation dialog is open', () => {
    render(<VotingInterface {...baseProps} />);
    fireEvent.click(screen.getByTestId('player-button-Bob'));
    baseProps.otherPlayers.forEach((player) => {
      expect(screen.getByTestId(`player-button-${player}`)).toBeDisabled();
    });
  });

  it('allows voting for any player except self', () => {
    render(<VotingInterface {...baseProps} />);
    baseProps.otherPlayers.forEach((player) => {
      expect(screen.getByTestId(`player-button-${player}`)).toBeEnabled();
    });
    // No button for self
    expect(screen.queryByTestId('player-button-Alice')).not.toBeInTheDocument();
  });

  it('shows correct player name in confirmation dialog', () => {
    render(<VotingInterface {...baseProps} />);
    fireEvent.click(screen.getByTestId('player-button-Charlie'));
    // Use function matcher to match text across element boundaries
    expect(
      screen.getByText((content, node) => {
        const hasText = (node: Element | null) =>
          node?.textContent === 'Vote for Charlie?';
        const nodeHasText = hasText(node as Element);
        const childrenDontHaveText = Array.from(node?.children || []).every(
          (child) => !hasText(child as Element)
        );
        return nodeHasText && childrenDontHaveText;
      })
    ).toBeInTheDocument();
  });

  it('resets selection after vote or cancel', () => {
    render(<VotingInterface {...baseProps} />);
    fireEvent.click(screen.getByTestId('player-button-Bob'));
    fireEvent.click(screen.getByTestId('cancel-vote'));
    expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
    // Select again
    fireEvent.click(screen.getByTestId('player-button-Charlie'));
    fireEvent.click(screen.getByTestId('confirm-vote'));
    expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
  });
}); 
