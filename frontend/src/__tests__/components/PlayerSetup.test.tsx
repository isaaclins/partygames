import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PlayerSetup from '../../components/PlayerSetup';

// Mock the shared utilities
vi.mock('../../../../shared/utils/offlineSpyfall.js', () => ({
  validatePlayerNames: vi.fn()
}));

import { validatePlayerNames } from '../../../../shared/utils/offlineSpyfall.js';

const mockValidatePlayerNames = validatePlayerNames as vi.MockedFunction<typeof validatePlayerNames>;

describe('PlayerSetup', () => {
  const mockOnPlayersReady = vi.fn();

  beforeEach(() => {
    mockOnPlayersReady.mockClear();
    mockValidatePlayerNames.mockClear();
  });

  it('renders the component with correct title and description', () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: ['Minimum 3 players required'] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    expect(screen.getByText('Setup Players')).toBeInTheDocument();
    expect(screen.getByText('Add player names for your offline Spyfall game.')).toBeInTheDocument();
  });

  it('displays the add player form', () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: ['Minimum 3 players required'] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    expect(screen.getByLabelText('Player Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter player name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Player' })).toBeInTheDocument();
  });

  it('adds a player when form is submitted with valid name', async () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: ['Minimum 3 players required'] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    const input = screen.getByLabelText('Player Name');
    const addButton = screen.getByRole('button', { name: 'Add Player' });
    
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Players (1)')).toBeInTheDocument();
    });
    
    // Input should be cleared
    expect(input).toHaveValue('');
  });

  it('shows error for empty player name', async () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: ['Minimum 3 players required'] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    const addButton = screen.getByRole('button', { name: 'Add Player' });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Player name cannot be empty')).toBeInTheDocument();
    });
  });

  it('shows error for duplicate player names (case insensitive)', async () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: ['Minimum 3 players required'] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    const input = screen.getByLabelText('Player Name');
    const addButton = screen.getByRole('button', { name: 'Add Player' });
    
    // Add first player
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(addButton);
    
    // Try to add duplicate (different case)
    fireEvent.change(input, { target: { value: 'alice' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('This player name already exists')).toBeInTheDocument();
    });
  });

  it('removes a player when remove button is clicked', async () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: ['Minimum 3 players required'] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    const input = screen.getByLabelText('Player Name');
    const addButton = screen.getByRole('button', { name: 'Add Player' });
    
    // Add a player
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    
    // Remove the player
    const removeButton = screen.getByRole('button', { name: 'Remove Alice' });
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      expect(screen.queryByText('Players (1)')).not.toBeInTheDocument();
    });
  });

  it('disables add button when maximum players (16) is reached', async () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: true, errors: [] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    const input = screen.getByLabelText('Player Name');
    const addButton = screen.getByRole('button', { name: 'Add Player' });
    
    // Add 16 players
    for (let i = 1; i <= 16; i++) {
      fireEvent.change(input, { target: { value: `Player${i}` } });
      fireEvent.click(addButton);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Maximum Players Reached')).toBeInTheDocument();
      expect(screen.getByText('16/16 players')).toBeInTheDocument();
    });
    
    // Input and button should be disabled
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Maximum Players Reached' })).toBeDisabled();
  });

  it('shows player count and status badge', async () => {
    // Start with insufficient players
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: ['Minimum 3 players required'] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    const input = screen.getByLabelText('Player Name');
    const addButton = screen.getByRole('button', { name: 'Add Player' });
    
    // Add 2 players (insufficient)
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(addButton);
    fireEvent.change(input, { target: { value: 'Bob' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Players (2)')).toBeInTheDocument();
      expect(screen.getByText('Need 1 more')).toBeInTheDocument();
    });
    
    // Mock validation for 3 players (sufficient)
    mockValidatePlayerNames.mockReturnValue({ isValid: true, errors: [] });
    
    // Add third player
    fireEvent.change(input, { target: { value: 'Charlie' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Players (3)')).toBeInTheDocument();
      expect(screen.getByText('Ready to start')).toBeInTheDocument();
    });
  });

  it('displays validation errors when players list is invalid', () => {
    const validationErrors = ['Minimum 3 players required', 'Player names must be unique'];
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: validationErrors });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    // Add one player to trigger validation display
    const input = screen.getByLabelText('Player Name');
    const addButton = screen.getByRole('button', { name: 'Add Player' });
    
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(addButton);
    
    // Should show validation errors
    expect(screen.getByText('Setup Requirements')).toBeInTheDocument();
    validationErrors.forEach(error => {
      expect(screen.getByText(`• ${error}`)).toBeInTheDocument();
    });
  });

  it('enables start game button when validation passes', () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: true, errors: [] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    const startButton = screen.getByRole('button', { name: 'Start Game' });
    expect(startButton).not.toBeDisabled();
  });

  it('disables start game button when validation fails', () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: ['Minimum 3 players required'] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    const startButton = screen.getByRole('button', { name: 'Add More Players' });
    expect(startButton).toBeDisabled();
  });

  it('calls onPlayersReady when start game is clicked with valid players', () => {
    const players = ['Alice', 'Bob', 'Charlie'];
    mockValidatePlayerNames.mockReturnValue({ isValid: true, errors: [] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    // Mock having players already added (would need to add them first in real scenario)
    const input = screen.getByLabelText('Player Name');
    const addButton = screen.getByRole('button', { name: 'Add Player' });
    
    // Add players
    players.forEach(player => {
      fireEvent.change(input, { target: { value: player } });
      fireEvent.click(addButton);
    });
    
    // Click start game
    const startButton = screen.getByRole('button', { name: 'Start Game' });
    fireEvent.click(startButton);
    
    expect(mockOnPlayersReady).toHaveBeenCalledWith(players);
  });

  it('displays helpful instructions', () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: ['Minimum 3 players required'] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('• Add 3-16 player names to get started')).toBeInTheDocument();
    expect(screen.getByText('• Each player will view their role card one by one')).toBeInTheDocument();
    expect(screen.getByText('• Pass the device between players during role reveals')).toBeInTheDocument();
    expect(screen.getByText('• One player will secretly be the spy!')).toBeInTheDocument();
  });

  it('clears input error when user starts typing again', async () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: ['Minimum 3 players required'] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    const input = screen.getByLabelText('Player Name');
    const addButton = screen.getByRole('button', { name: 'Add Player' });
    
    // Trigger an error by adding empty name
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Player name cannot be empty')).toBeInTheDocument();
    });
    
    // Start typing should clear the error
    fireEvent.change(input, { target: { value: 'A' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Player name cannot be empty')).not.toBeInTheDocument();
    });
  });

  it('trims whitespace from player names', async () => {
    mockValidatePlayerNames.mockReturnValue({ isValid: false, errors: ['Minimum 3 players required'] });
    
    render(<PlayerSetup onPlayersReady={mockOnPlayersReady} />);
    
    const input = screen.getByLabelText('Player Name');
    const addButton = screen.getByRole('button', { name: 'Add Player' });
    
    // Add player with whitespace
    fireEvent.change(input, { target: { value: '  Alice  ' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });
}); 
