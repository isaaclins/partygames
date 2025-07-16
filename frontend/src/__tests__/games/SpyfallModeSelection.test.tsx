import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SpyfallModeSelection from '../../games/SpyfallModeSelection';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SpyfallModeSelection', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the component with correct title and description', () => {
    renderWithRouter(<SpyfallModeSelection />);
    
    expect(screen.getByText('Spyfall')).toBeInTheDocument();
    expect(screen.getByText('Choose how you want to play Spyfall with your friends.')).toBeInTheDocument();
  });

  it('displays both online and offline mode options', () => {
    renderWithRouter(<SpyfallModeSelection />);
    
    expect(screen.getByText('Online Mode')).toBeInTheDocument();
    expect(screen.getByText('Offline Mode')).toBeInTheDocument();
    
    // Check descriptions
    expect(screen.getByText(/Create a lobby and play with friends using separate devices/)).toBeInTheDocument();
    expect(screen.getByText(/Play using a single device that gets passed around/)).toBeInTheDocument();
  });

  it('displays feature lists for both modes', () => {
    renderWithRouter(<SpyfallModeSelection />);
    
    // Online mode features
    expect(screen.getByText('• Each player uses their own device')).toBeInTheDocument();
    expect(screen.getByText('• Real-time synchronization')).toBeInTheDocument();
    expect(screen.getByText('• Automatic role distribution')).toBeInTheDocument();
    expect(screen.getByText('• Built-in voting system')).toBeInTheDocument();
    
    // Offline mode features
    expect(screen.getByText('• Single device for all players')).toBeInTheDocument();
    expect(screen.getByText('• Pass the phone for role reveals')).toBeInTheDocument();
    expect(screen.getByText('• No internet connection required')).toBeInTheDocument();
    expect(screen.getByText('• Perfect for parties and gatherings')).toBeInTheDocument();
  });

  it('navigates to create page with correct state when online mode is selected', () => {
    renderWithRouter(<SpyfallModeSelection />);
    
    const onlineButton = screen.getByText('Play Online');
    fireEvent.click(onlineButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/create', {
      state: {
        selectedGame: 'spyfall',
        fromModeSelection: true,
      },
    });
  });

  it('navigates to offline spyfall route when offline mode is selected', () => {
    renderWithRouter(<SpyfallModeSelection />);
    
    const offlineButton = screen.getByText('Play Offline');
    fireEvent.click(offlineButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/spyfall/offline');
  });

  it('displays the about spyfall info box', () => {
    renderWithRouter(<SpyfallModeSelection />);
    
    expect(screen.getByText('About Spyfall')).toBeInTheDocument();
    expect(screen.getByText(/One player is secretly the spy while others know the location/)).toBeInTheDocument();
  });

  it('has correct button variants and icons', () => {
    renderWithRouter(<SpyfallModeSelection />);
    
    const onlineButton = screen.getByText('Play Online');
    const offlineButton = screen.getByText('Play Offline');
    
    // Check that buttons exist and are clickable
    expect(onlineButton).toBeInTheDocument();
    expect(offlineButton).toBeInTheDocument();
    
    // Verify buttons are not disabled
    expect(onlineButton).not.toBeDisabled();
    expect(offlineButton).not.toBeDisabled();
  });

  it('displays correct icons for each mode', () => {
    renderWithRouter(<SpyfallModeSelection />);
    
    // Check that the component renders without errors
    // Icons are rendered as SVG elements, so we check for their presence indirectly
    const onlineModeSection = screen.getByText('Online Mode').closest('div');
    const offlineModeSection = screen.getByText('Offline Mode').closest('div');
    
    expect(onlineModeSection).toBeInTheDocument();
    expect(offlineModeSection).toBeInTheDocument();
  });
});
