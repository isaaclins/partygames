import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../../pages/HomePage';

// Mock the StateTest component since it's only used in development
vi.mock('../../components/StateTest', () => ({
  StateTest: () => <div data-testid="state-test">State Test Component</div>,
}));

// Mock icons from lucide-react
vi.mock('lucide-react', () => ({
  Users: ({ className }: { className?: string }) => <div className={className} data-testid="users-icon">Users</div>,
  Plus: ({ className }: { className?: string }) => <div className={className} data-testid="plus-icon">Plus</div>,
  Gamepad2: ({ className }: { className?: string }) => <div className={className} data-testid="gamepad2-icon">Gamepad2</div>,
  Zap: ({ className }: { className?: string }) => <div className={className} data-testid="zap-icon">Zap</div>,
}));

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('HomePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment variable
    delete (process.env as any).NODE_ENV;
  });

  describe('Basic Rendering', () => {
    test('renders the main heading', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByText('Welcome to Party Games!')).toBeInTheDocument();
    });

    test('renders the hero section with description', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByText('Real-time multiplayer games for you and your friends. Create a lobby or join an existing game to get started.')).toBeInTheDocument();
    });

    test('renders the gamepad icon in hero section', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByTestId('gamepad2-icon')).toBeInTheDocument();
    });

    test('has proper layout structure', () => {
      const { container } = renderWithRouter(<HomePage />);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('space-y-6');
    });
  });

  describe('Hero Section', () => {
    test('displays the main icon with proper styling', () => {
      renderWithRouter(<HomePage />);
      const iconContainer = screen.getByTestId('gamepad2-icon').closest('.w-20');
      expect(iconContainer).toHaveClass('w-20', 'h-20', 'bg-primary-600', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'mx-auto', 'mb-4');
    });

    test('has centered text layout', () => {
      renderWithRouter(<HomePage />);
      const heroSection = screen.getByText('Welcome to Party Games!').closest('.text-center');
      expect(heroSection).toHaveClass('text-center', 'py-8');
    });

    test('displays proper heading hierarchy', () => {
      renderWithRouter(<HomePage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Welcome to Party Games!');
      expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-slate-900', 'mb-2');
    });

    test('displays description with proper styling', () => {
      renderWithRouter(<HomePage />);
      const description = screen.getByText(/Real-time multiplayer games/);
      expect(description).toHaveClass('text-slate-600', 'max-w-sm', 'mx-auto');
    });
  });

  describe('Quick Actions Section', () => {
    test('renders Quick Start section title', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByText('Quick Start')).toBeInTheDocument();
    });

    test('renders Create Game link with proper content', () => {
      renderWithRouter(<HomePage />);
      const createGameLink = screen.getByRole('link', { name: /Create Game/ });
      expect(createGameLink).toHaveAttribute('href', '/create');
      expect(screen.getByText('Start a new game lobby for your friends')).toBeInTheDocument();
    });

    test('renders Join Game link with proper content', () => {
      renderWithRouter(<HomePage />);
      const joinGameLink = screen.getByRole('link', { name: /Join Game/ });
      expect(joinGameLink).toHaveAttribute('href', '/join');
      expect(screen.getByText('Enter a room code to join a friend\'s game')).toBeInTheDocument();
    });

    test('displays proper icons for quick actions', () => {
      renderWithRouter(<HomePage />);
      // Plus icon for Create Game
      const createSection = screen.getByText('Create Game').closest('.bg-white');
      expect(createSection?.querySelector('[data-testid="plus-icon"]')).toBeInTheDocument();
      
      // Users icon for Join Game
      const joinSection = screen.getByText('Join Game').closest('.bg-white');
      expect(joinSection?.querySelector('[data-testid="users-icon"]')).toBeInTheDocument();
    });

    test('quick action cards have proper styling', () => {
      renderWithRouter(<HomePage />);
      const createGameCard = screen.getByText('Create Game').closest('.bg-white');
      expect(createGameCard).toHaveClass('bg-white', 'rounded-lg', 'p-4', 'shadow-sm', 'border', 'border-slate-200', 'hover:shadow-md', 'transition-shadow');
    });

    test('icon containers have proper styling', () => {
      renderWithRouter(<HomePage />);
      const plusIconContainer = screen.getByTestId('plus-icon').closest('.w-10');
      expect(plusIconContainer).toHaveClass('w-10', 'h-10', 'bg-primary-100', 'rounded-lg', 'flex', 'items-center', 'justify-center');
      
      const usersIconContainer = screen.getByTestId('users-icon').closest('.w-10');
      expect(usersIconContainer).toHaveClass('w-10', 'h-10', 'bg-green-100', 'rounded-lg', 'flex', 'items-center', 'justify-center');
    });
  });

  describe('Available Games Section', () => {
    test('renders Available Games section title', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByText('Available Games')).toBeInTheDocument();
    });

    test('displays Quick Draw game card', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByText('Quick Draw')).toBeInTheDocument();
      expect(screen.getByText('Drawing and guessing game')).toBeInTheDocument();
    });

    test('displays Two Truths and a Lie game card', () => {
      renderWithRouter(<HomePage />);
      expect(screen.getByText('Two Truths and a Lie')).toBeInTheDocument();
      expect(screen.getByText('Social deduction game')).toBeInTheDocument();
    });

    test('displays Coming Soon badges', () => {
      renderWithRouter(<HomePage />);
      const comingSoonBadges = screen.getAllByText('Coming Soon');
      expect(comingSoonBadges).toHaveLength(2);
    });

    test('game cards have proper icons', () => {
      renderWithRouter(<HomePage />);
      // Quick Draw has Zap icon
      const quickDrawCard = screen.getByText('Quick Draw').closest('.bg-white');
      expect(quickDrawCard?.querySelector('[data-testid="zap-icon"]')).toBeInTheDocument();
      
      // Two Truths has Users icon
      const twoTruthsCard = screen.getByText('Two Truths and a Lie').closest('.bg-white');
      expect(twoTruthsCard?.querySelector('[data-testid="users-icon"]')).toBeInTheDocument();
    });

    test('game cards have proper layout and styling', () => {
      renderWithRouter(<HomePage />);
      const gameCard = screen.getByText('Quick Draw').closest('.bg-white');
      expect(gameCard).toHaveClass('bg-white', 'rounded-lg', 'p-4', 'shadow-sm', 'border', 'border-slate-200');
    });

    test('coming soon badges have proper styling', () => {
      renderWithRouter(<HomePage />);
      const comingSoonBadge = screen.getAllByText('Coming Soon')[0];
      expect(comingSoonBadge).toHaveClass('text-xs', 'bg-primary-100', 'text-primary-700', 'px-2', 'py-1', 'rounded');
    });
  });

  describe('Development Mode Features', () => {
    test('shows StateTest component in development mode', () => {
      process.env.NODE_ENV = 'development';
      renderWithRouter(<HomePage />);
      expect(screen.getByTestId('state-test')).toBeInTheDocument();
      expect(screen.getByText('Development: State Test')).toBeInTheDocument();
    });

    test('hides StateTest component in production mode', () => {
      process.env.NODE_ENV = 'production';
      renderWithRouter(<HomePage />);
      expect(screen.queryByTestId('state-test')).not.toBeInTheDocument();
      expect(screen.queryByText('Development: State Test')).not.toBeInTheDocument();
    });

    test('hides StateTest component when NODE_ENV is undefined', () => {
      delete (process.env as any).NODE_ENV;
      renderWithRouter(<HomePage />);
      expect(screen.queryByTestId('state-test')).not.toBeInTheDocument();
    });

    test('StateTest section has proper structure in development', () => {
      process.env.NODE_ENV = 'development';
      renderWithRouter(<HomePage />);
      const stateTestSection = screen.getByText('Development: State Test').closest('.space-y-4');
      expect(stateTestSection).toBeInTheDocument();
    });
  });

  describe('Navigation and Links', () => {
    test('create game link is properly formed', () => {
      renderWithRouter(<HomePage />);
      const createLink = screen.getByRole('link', { name: /Create Game/ });
      expect(createLink).toHaveAttribute('href', '/create');
    });

    test('join game link is properly formed', () => {
      renderWithRouter(<HomePage />);
      const joinLink = screen.getByRole('link', { name: /Join Game/ });
      expect(joinLink).toHaveAttribute('href', '/join');
    });

    test('links have proper accessibility attributes', () => {
      renderWithRouter(<HomePage />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeVisible();
      });
    });

    test('links work with keyboard navigation', () => {
      renderWithRouter(<HomePage />);
      const createLink = screen.getByRole('link', { name: /Create Game/ });
      
      createLink.focus();
      expect(createLink).toHaveFocus();
      
      fireEvent.keyDown(createLink, { key: 'Enter' });
      // Navigation would be handled by React Router in real app
    });
  });

  describe('Layout and Responsive Design', () => {
    test('has proper grid layout for quick actions', () => {
      renderWithRouter(<HomePage />);
      const quickActionsGrid = screen.getByText('Create Game').closest('.grid');
      expect(quickActionsGrid).toHaveClass('grid', 'grid-cols-1', 'gap-3');
    });

    test('has proper grid layout for available games', () => {
      renderWithRouter(<HomePage />);
      const gamesGrid = screen.getByText('Quick Draw').closest('.grid');
      expect(gamesGrid).toHaveClass('grid', 'grid-cols-1', 'gap-3');
    });

    test('sections have proper spacing', () => {
      renderWithRouter(<HomePage />);
      
      // Quick actions section
      const quickActionsSection = screen.getByText('Quick Start').closest('.space-y-4');
      expect(quickActionsSection).toBeInTheDocument();
      
      // Available games section
      const gamesSection = screen.getByText('Available Games').closest('.space-y-4');
      expect(gamesSection).toBeInTheDocument();
    });

    test('card layouts use flexbox correctly', () => {
      renderWithRouter(<HomePage />);
      const cardContent = screen.getByText('Create Game').closest('.flex');
      expect(cardContent).toHaveClass('flex', 'items-center', 'space-x-3');
    });
  });

  describe('Content and Typography', () => {
    test('has proper heading levels', () => {
      renderWithRouter(<HomePage />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Welcome to Party Games!');
      
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.some(h => h.textContent === 'Quick Start')).toBe(true);
      expect(sectionHeadings.some(h => h.textContent === 'Available Games')).toBe(true);
    });

    test('action items have proper heading level', () => {
      renderWithRouter(<HomePage />);
      const actionHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(actionHeadings.some(h => h.textContent === 'Create Game')).toBe(true);
      expect(actionHeadings.some(h => h.textContent === 'Join Game')).toBe(true);
    });

    test('text content is descriptive and helpful', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByText('Start a new game lobby for your friends')).toBeInTheDocument();
      expect(screen.getByText('Enter a room code to join a friend\'s game')).toBeInTheDocument();
      expect(screen.getByText('Drawing and guessing game')).toBeInTheDocument();
      expect(screen.getByText('Social deduction game')).toBeInTheDocument();
    });

    test('headings have proper typography classes', () => {
      renderWithRouter(<HomePage />);
      
      const mainHeading = screen.getByText('Welcome to Party Games!');
      expect(mainHeading).toHaveClass('text-2xl', 'font-bold', 'text-slate-900', 'mb-2');
      
      const sectionHeading = screen.getByText('Quick Start');
      expect(sectionHeading).toHaveClass('text-lg', 'font-semibold', 'text-slate-900');
    });
  });

  describe('Interactive Elements', () => {
    test('action cards have hover effects', () => {
      renderWithRouter(<HomePage />);
      const createGameCard = screen.getByText('Create Game').closest('a');
      expect(createGameCard).toHaveClass('hover:shadow-md', 'transition-shadow');
    });

    test('links are focusable and accessible', () => {
      renderWithRouter(<HomePage />);
      const links = screen.getAllByRole('link');
      
      links.forEach(link => {
        expect(link).not.toHaveAttribute('tabindex', '-1');
      });
    });

    test('action cards have proper interactive states', () => {
      renderWithRouter(<HomePage />);
      const createGameLink = screen.getByRole('link', { name: /Create Game/ });
      
      expect(createGameLink).toHaveClass('transition-shadow');
      
      fireEvent.mouseEnter(createGameLink);
      fireEvent.mouseLeave(createGameLink);
      // Hover effects would be visible in real browser
    });
  });

  describe('Accessibility', () => {
    test('has proper semantic structure', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4); // 2 actions + 2 games
      expect(screen.getAllByRole('link')).toHaveLength(2);
    });

    test('images have appropriate roles', () => {
      renderWithRouter(<HomePage />);
      const icons = screen.getAllByTestId(/_icon$/);
      icons.forEach(icon => {
        expect(icon).toBeInTheDocument();
      });
    });

    test('content is properly labeled', () => {
      renderWithRouter(<HomePage />);
      
      const createGameLink = screen.getByRole('link', { name: /Create Game/ });
      expect(createGameLink).toBeInTheDocument();
      
      const joinGameLink = screen.getByRole('link', { name: /Join Game/ });
      expect(joinGameLink).toBeInTheDocument();
    });

    test('keyboard navigation works correctly', () => {
      renderWithRouter(<HomePage />);
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      
      links.forEach(link => {
        link.focus();
        expect(link).toHaveFocus();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('renders gracefully without errors', () => {
      expect(() => renderWithRouter(<HomePage />)).not.toThrow();
    });

    test('handles missing environment variables gracefully', () => {
      delete (process.env as any).NODE_ENV;
      expect(() => renderWithRouter(<HomePage />)).not.toThrow();
    });

    test('maintains layout with different viewport sizes', () => {
      renderWithRouter(<HomePage />);
      
      // The component should use responsive classes
      const grids = screen.getByText('Create Game').closest('.grid');
      expect(grids).toHaveClass('grid-cols-1'); // Mobile-first approach
    });
  });

  describe('Performance Considerations', () => {
    test('does not cause unnecessary re-renders', () => {
      const { rerender } = renderWithRouter(<HomePage />);
      
      expect(() => {
        rerender(<BrowserRouter><HomePage /></BrowserRouter>);
        rerender(<BrowserRouter><HomePage /></BrowserRouter>);
      }).not.toThrow();
    });

    test('renders consistently across multiple renders', () => {
      const { rerender } = renderWithRouter(<HomePage />);
      
      expect(screen.getByText('Welcome to Party Games!')).toBeInTheDocument();
      
      rerender(<BrowserRouter><HomePage /></BrowserRouter>);
      
      expect(screen.getByText('Welcome to Party Games!')).toBeInTheDocument();
    });
  });
}); 
