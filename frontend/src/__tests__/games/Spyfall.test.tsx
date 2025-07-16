import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpyfallGame } from '../../games/Spyfall';

// Mock the useGameSession hook
const mockSendGameAction = vi.fn();
const mockGameSession = {
  game: {
    players: [
      { id: 'player1', name: 'Alice', isHost: true, isReady: true, isConnected: true },
      { id: 'player2', name: 'Bob', isHost: false, isReady: true, isConnected: true },
      { id: 'player3', name: 'Charlie', isHost: false, isReady: true, isConnected: true },
    ],
    gameData: {
      phase: 'playing',
      votes: [],
      playersReadyToVote: 0,
      totalPlayers: 3,
      gameStartedAt: new Date().toISOString(),
      playerRole: {
        location: 'Pirate Ship',
        role: 'Captain',
        isSpy: false,
      },
    },
  },
  playerId: 'player1',
  sendGameAction: mockSendGameAction,
};

vi.mock('../../hooks/useGameSession', () => ({
  useGameSession: () => mockGameSession,
}));

describe('SpyfallGame Component', () => {
  beforeEach(() => {
    mockSendGameAction.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Game Header and Status', () => {
    test('should display game title and instructions', () => {
      render(<SpyfallGame />);

      expect(screen.getByText('Spyfall')).toBeInTheDocument();
      expect(screen.getByText('Ask questions to find the spy!')).toBeInTheDocument();
    });

    test('should display player count and game time', () => {
      render(<SpyfallGame />);

      expect(screen.getByText('3 players')).toBeInTheDocument();
      expect(screen.getByText(/\d+ min/)).toBeInTheDocument();
    });
  });

  describe('Player Role Display', () => {
    test('should display non-spy role information', () => {
      render(<SpyfallGame />);

      expect(screen.getByText('Your Role')).toBeInTheDocument();
      expect(screen.getByText('Pirate Ship')).toBeInTheDocument();
      expect(screen.getByText('You are:')).toBeInTheDocument();
      expect(screen.getByText('Captain')).toBeInTheDocument();
      expect(screen.getByText('Ask questions to find the spy without revealing the location!')).toBeInTheDocument();
    });

    test('should display spy role information', () => {
      const spyGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            playerRole: {
              location: null,
              role: null,
              isSpy: true,
            },
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(spyGameSession);

      render(<SpyfallGame />);

      expect(screen.getByText('You are the SPY!')).toBeInTheDocument();
      expect(screen.getByText('Listen carefully to figure out the location. Blend in and don\'t get caught!')).toBeInTheDocument();
    });

    test('should allow hiding role information', () => {
      render(<SpyfallGame />);

      const hideButton = screen.getByRole('button');
      fireEvent.click(hideButton);

      expect(screen.getByText('Role hidden for privacy')).toBeInTheDocument();
      expect(screen.queryByText('Pirate Ship')).not.toBeInTheDocument();
    });
  });

  describe('Playing Phase', () => {
    test('should display game instructions during playing phase', () => {
      render(<SpyfallGame />);

      expect(screen.getByText('Game in Progress')).toBeInTheDocument();
      expect(screen.getByText(/Ask questions in person to figure out who the spy is/)).toBeInTheDocument();
    });

    test('should show ready to vote button', () => {
      render(<SpyfallGame />);

      const readyButton = screen.getByText('Ready to Vote');
      expect(readyButton).toBeInTheDocument();
      expect(readyButton).not.toBeDisabled();
    });

    test('should call sendGameAction when ready to vote clicked', async () => {
      render(<SpyfallGame />);

      const readyButton = screen.getByText('Ready to Vote');
      fireEvent.click(readyButton);

      await waitFor(() => {
        expect(mockSendGameAction).toHaveBeenCalledWith({
          type: 'ready_to_vote',
          data: {},
          playerId: 'player1',
          timestamp: expect.any(Date),
        });
      });
    });

    test('should show players ready count', () => {
      const gameSessionWithReadyPlayers = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            playersReadyToVote: 2,
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(gameSessionWithReadyPlayers);

      render(<SpyfallGame />);

      expect(screen.getByText('2 of 3 players ready to vote')).toBeInTheDocument();
    });
  });

  describe('Voting Phase', () => {
    beforeEach(() => {
      const votingGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            phase: 'voting',
            votes: [],
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(votingGameSession);
    });

    test('should display voting phase instructions', () => {
      render(<SpyfallGame />);

      expect(screen.getByText('Voting Phase')).toBeInTheDocument();
      expect(screen.getByText('Vote to eliminate the player you think is the spy!')).toBeInTheDocument();
    });

    test('should display voting options for other players', () => {
      render(<SpyfallGame />);

      expect(screen.getByText('Select a player to vote out:')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      // Current player should not be in voting options
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    test('should allow selecting a player to vote for', () => {
      render(<SpyfallGame />);

      const bobRadio = screen.getByDisplayValue('player2');
      fireEvent.click(bobRadio);

      expect(bobRadio).toBeChecked();
    });

    test('should submit vote when button clicked', async () => {
      render(<SpyfallGame />);

      // Select a player
      const bobRadio = screen.getByDisplayValue('player2');
      fireEvent.click(bobRadio);

      // Submit vote
      const submitButton = screen.getByText('Submit Vote');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSendGameAction).toHaveBeenCalledWith({
          type: 'submit_vote',
          data: { targetPlayerId: 'player2' },
          playerId: 'player1',
          timestamp: expect.any(Date),
        });
      });
    });

    test('should show voted status when player has voted', () => {
      const votedGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            phase: 'voting',
            votes: [{ voterId: 'player1', targetPlayerId: 'player2', submittedAt: new Date() }],
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(votedGameSession);

      render(<SpyfallGame />);

      expect(screen.getByText('✓ You have voted')).toBeInTheDocument();
      expect(screen.getByText('Waiting for other players... (1/3)')).toBeInTheDocument();
    });
  });

  describe('Spy Guess Phase', () => {
    beforeEach(() => {
      const spyGuessGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            phase: 'spy_guess',
            votedOutPlayerId: 'player2',
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(spyGuessGameSession);
    });

    test('should display spy guess phase information', () => {
      render(<SpyfallGame />);

      expect(screen.getByText('Spy\'s Last Chance')).toBeInTheDocument();
      expect(screen.getByText(/Bob was voted out and is the spy/)).toBeInTheDocument();
    });

    test('should show location guess input for voted out spy', () => {
      const spyGuessGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            phase: 'spy_guess',
            votedOutPlayerId: 'player1', // Current player is voted out
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(spyGuessGameSession);

      render(<SpyfallGame />);

      expect(screen.getByText('You were voted out! Guess the location to win the game.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your location guess...')).toBeInTheDocument();
      expect(screen.getByText('Submit Guess')).toBeInTheDocument();
    });

    test('should submit location guess', async () => {
      const spyGuessGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            phase: 'spy_guess',
            votedOutPlayerId: 'player1',
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(spyGuessGameSession);

      render(<SpyfallGame />);

      // Enter location guess
      const input = screen.getByPlaceholderText('Enter your location guess...');
      fireEvent.change(input, { target: { value: 'Space Station' } });

      // Submit guess
      const submitButton = screen.getByText('Submit Guess');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSendGameAction).toHaveBeenCalledWith({
          type: 'guess_location',
          data: { guessedLocation: 'Space Station' },
          playerId: 'player1',
          timestamp: expect.any(Date),
        });
      });
    });
  });

  describe('Game Results Phase', () => {
    test('should display spy wins result', () => {
      const finishedGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            phase: 'finished',
            winner: 'spy',
            location: 'Pirate Ship',
            spyId: 'player2',
            votedOutPlayerId: 'player3',
            locationGuess: {
              spyId: 'player2',
              guessedLocation: 'Pirate Ship',
              isCorrect: true,
            },
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(finishedGameSession);

      render(<SpyfallGame />);

      expect(screen.getByText('Spy Wins!')).toBeInTheDocument();
      expect(screen.getByText('The spy correctly guessed: Pirate Ship')).toBeInTheDocument();
    });

    test('should display non-spies win result', () => {
      const finishedGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            phase: 'finished',
            winner: 'non_spies',
            location: 'Pirate Ship',
            spyId: 'player2',
            votedOutPlayerId: 'player2',
            locationGuess: {
              spyId: 'player2',
              guessedLocation: 'Casino',
              isCorrect: false,
            },
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(finishedGameSession);

      render(<SpyfallGame />);

      expect(screen.getByText('Non-Spies Win!')).toBeInTheDocument();
      expect(screen.getByText('The spy failed to guess the location correctly.')).toBeInTheDocument();
    });

    test('should display game reveal information', () => {
      const finishedGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            phase: 'finished',
            winner: 'spy',
            location: 'Pirate Ship',
            spyId: 'player2',
            votedOutPlayerId: 'player3',
            locationGuess: {
              spyId: 'player2',
              guessedLocation: 'Pirate Ship',
              isCorrect: true,
            },
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(finishedGameSession);

      render(<SpyfallGame />);

      expect(screen.getByText('Game Reveal')).toBeInTheDocument();
      expect(screen.getByText('Location:')).toBeInTheDocument();
      expect(screen.getByText('Pirate Ship')).toBeInTheDocument();
      expect(screen.getByText('Spy:')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Voted Out:')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('Spy\'s Guess:')).toBeInTheDocument();
      expect(screen.getByText('✓ Correct')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('should display loading state when game data is null', () => {
      const loadingGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: null,
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(loadingGameSession);

      render(<SpyfallGame />);

      expect(screen.getByText('Loading game...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle empty vote selection', async () => {
      const votingGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            phase: 'voting',
            votes: [],
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(votingGameSession);

      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<SpyfallGame />);

      // Try to submit without selecting anyone
      const submitButton = screen.getByText('Submit Vote');
      fireEvent.click(submitButton);

      expect(alertSpy).toHaveBeenCalledWith('Please select a player to vote for');
      expect(mockSendGameAction).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    test('should handle empty location guess', async () => {
      const spyGuessGameSession = {
        ...mockGameSession,
        game: {
          ...mockGameSession.game,
          gameData: {
            ...mockGameSession.game.gameData,
            phase: 'spy_guess',
            votedOutPlayerId: 'player1',
          },
        },
      };

      vi.mocked(require('../../hooks/useGameSession').useGameSession).mockReturnValue(spyGuessGameSession);

      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<SpyfallGame />);

      // Try to submit empty guess
      const submitButton = screen.getByText('Submit Guess');
      fireEvent.click(submitButton);

      expect(alertSpy).toHaveBeenCalledWith('Please enter your location guess');
      expect(mockSendGameAction).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    test('should handle action errors', async () => {
      mockSendGameAction.mockRejectedValue(new Error('Network error'));

      // Mock console.error and window.alert
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<SpyfallGame />);

      const readyButton = screen.getByText('Ready to Vote');
      fireEvent.click(readyButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('Failed to mark ready. Please try again.');
      });

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });
}); 
