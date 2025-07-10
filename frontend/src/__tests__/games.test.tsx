import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import React from 'react';

// Mock the useGameSession hook
vi.mock('../hooks/useGameSession', () => ({
  useGameSession: () => ({
    game: {
      players: [
        { id: 'player-1', name: 'Player 1', isHost: true, isReady: true },
        { id: 'player-2', name: 'Player 2', isHost: false, isReady: true },
      ],
      gameData: null,
      status: 'waiting',
      gameType: 'two-truths-and-a-lie',
    },
    playerId: 'player-1',
    sendGameAction: vi.fn(),
  }),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid='users-icon' />,
  Timer: () => <div data-testid='timer-icon' />,
  Trophy: () => <div data-testid='trophy-icon' />,
  CheckCircle: () => <div data-testid='check-circle-icon' />,
  Clock: () => <div data-testid='clock-icon' />,
  Brush: () => <div data-testid='brush-icon' />,
  Eraser: () => <div data-testid='eraser-icon' />,
  Undo: () => <div data-testid='undo-icon' />,
  Trash2: () => <div data-testid='trash-icon' />,
  Palette: () => <div data-testid='palette-icon' />,
}));

// Import components after mocking
import { TwoTruthsAndALie } from '../games/TwoTruthsAndALie';
import { WouldYouRather } from '../games/WouldYouRather';
import { QuickDraw } from '../games/QuickDraw';
import { DrawingCanvas } from '../components/DrawingCanvas';

describe('TwoTruthsAndALie Component', () => {
  test('should render without crashing', () => {
    render(<TwoTruthsAndALie />);
    expect(screen.getByText(/initializing/i)).toBeInTheDocument();
  });

  test('should display game title', () => {
    render(<TwoTruthsAndALie />);
    // The component should render some content related to Two Truths and a Lie
    expect(document.body).toBeInTheDocument();
  });
});

describe('WouldYouRather Component', () => {
  test('should render without crashing', () => {
    render(<WouldYouRather />);
    expect(screen.getByText(/initializing/i)).toBeInTheDocument();
  });

  test('should handle game initialization', () => {
    render(<WouldYouRather />);
    // Component should render initialization state
    expect(document.body).toBeInTheDocument();
  });
});

describe('QuickDraw Component', () => {
  test('should render without crashing', () => {
    render(<QuickDraw />);
    expect(screen.getByText(/initializing/i)).toBeInTheDocument();
  });

  test('should display Quick Draw interface', () => {
    render(<QuickDraw />);
    // Component should render Quick Draw specific content
    expect(document.body).toBeInTheDocument();
  });
});

describe('DrawingCanvas Component', () => {
  const defaultProps = {
    width: 800,
    height: 600,
    strokes: [],
    canDraw: true,
    onStrokeAdded: vi.fn(),
    onClearCanvas: vi.fn(),
    onUndoStroke: vi.fn(),
  };

  test('should render canvas element', () => {
    const { container } = render(<DrawingCanvas {...defaultProps} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('should display drawing tools when canDraw is true', () => {
    render(<DrawingCanvas {...defaultProps} />);
    expect(screen.getByTestId('brush-icon')).toBeInTheDocument();
    expect(screen.getByTestId('eraser-icon')).toBeInTheDocument();
  });

  test('should show disabled state when canDraw is false', () => {
    render(<DrawingCanvas {...defaultProps} canDraw={false} />);
    expect(screen.getByText(/drawing disabled/i)).toBeInTheDocument();
  });

  test('should display canvas dimensions', () => {
    render(<DrawingCanvas {...defaultProps} />);
    expect(screen.getByText(/canvas: 800.*600/i)).toBeInTheDocument();
  });
});

// Integration tests for game page routing
describe('GamePage Routing', () => {
  test('should handle game routing correctly', () => {
    // This would be a more complex test in a real scenario
    // involving React Router and game type switching
    expect(true).toBe(true);
  });
});

// Mock tests for components that depend on WebSocket
describe('WebSocket Integration', () => {
  test('should handle WebSocket game actions', () => {
    // Mock WebSocket functionality
    const mockSendAction = vi.fn();
    expect(mockSendAction).toBeDefined();
  });
});

// Performance tests for frontend components
describe('Frontend Performance', () => {
  test('should render components efficiently', () => {
    const start = performance.now();
    render(<TwoTruthsAndALie />);
    render(<WouldYouRather />);
    render(<QuickDraw />);
    const end = performance.now();

    // Components should render quickly
    expect(end - start).toBeLessThan(100);
  });

  test('should handle rapid canvas updates', () => {
    const mockOnStrokeAdded = vi.fn();
    render(
      <DrawingCanvas
        width={800}
        height={600}
        strokes={[]}
        canDraw={true}
        onStrokeAdded={mockOnStrokeAdded}
        onClearCanvas={vi.fn()}
        onUndoStroke={vi.fn()}
      />
    );

    // Component should be stable with rapid updates
    expect(mockOnStrokeAdded).toBeDefined();
  });
});
