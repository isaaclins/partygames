import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import RoleRevealCard from '../../components/RoleRevealCard';
import { OfflinePlayerRole } from '../../../../shared/types/index.js';

describe('RoleRevealCard', () => {
  const mockOnNext = vi.fn();

  const nonSpyRole: OfflinePlayerRole = {
    playerName: 'Alice',
    location: 'Casino',
    role: 'Dealer',
    isSpy: false,
  };

  const spyRole: OfflinePlayerRole = {
    playerName: 'Bob',
    location: null,
    role: null,
    isSpy: true,
  };

  beforeEach(() => {
    mockOnNext.mockClear();
  });

  describe('Privacy Warning Screen', () => {
    it('displays privacy warning initially', () => {
      render(<RoleRevealCard playerName="Alice" role={nonSpyRole} onNext={mockOnNext} />);
      
      expect(screen.getByText("Alice's Turn")).toBeInTheDocument();
      expect(screen.getByText('Make sure others can\'t see the screen before revealing your role.')).toBeInTheDocument();
      expect(screen.getByText('Privacy Reminder')).toBeInTheDocument();
      expect(screen.getByText('Make sure other players cannot see the screen before you reveal your role card. Only you should see this information!')).toBeInTheDocument();
    });

    it('shows ready button on privacy warning screen', () => {
      render(<RoleRevealCard playerName="Alice" role={nonSpyRole} onNext={mockOnNext} />);
      
      expect(screen.getByRole('button', { name: "I'm Ready - Show My Role" })).toBeInTheDocument();
    });

    it('displays helpful instructions on privacy screen', () => {
      render(<RoleRevealCard playerName="Alice" role={nonSpyRole} onNext={mockOnNext} />);
      
      expect(screen.getByText('What happens next')).toBeInTheDocument();
      expect(screen.getByText('• Tap to reveal your role card')).toBeInTheDocument();
      expect(screen.getByText('• Remember your location and role (if not the spy)')).toBeInTheDocument();
      expect(screen.getByText('• Tap again to pass to the next player')).toBeInTheDocument();
      expect(screen.getByText('• Keep your role secret during discussion!')).toBeInTheDocument();
    });

    it('transitions from privacy warning to name card when ready button is clicked', () => {
      render(<RoleRevealCard playerName="Alice" role={nonSpyRole} onNext={mockOnNext} />);
      
      const readyButton = screen.getByRole('button', { name: "I'm Ready - Show My Role" });
      fireEvent.click(readyButton);
      
      // Should now show the name card
      expect(screen.getAllByText('Alice')).toHaveLength(2); // Header and card
      expect(screen.getByText('Tap the card to reveal your role')).toBeInTheDocument();
      expect(screen.queryByText('Privacy Reminder')).not.toBeInTheDocument();
    });
  });

  describe('Player Name Card State', () => {
    beforeEach(() => {
      // Render and skip privacy warning
      render(<RoleRevealCard playerName="Alice" role={nonSpyRole} onNext={mockOnNext} />);
      const readyButton = screen.getByRole('button', { name: "I'm Ready - Show My Role" });
      fireEvent.click(readyButton);
    });

    it('displays player name and instructions', () => {
      expect(screen.getAllByText('Alice')).toHaveLength(2); // Header and card
      expect(screen.getByText('Tap the card to reveal your role')).toBeInTheDocument();
      expect(screen.getByText('Tap to reveal your role')).toBeInTheDocument();
      expect(screen.getByText('Reveal Role')).toBeInTheDocument();
    });

    it('shows player initial in avatar', () => {
      expect(screen.getByText('A')).toBeInTheDocument(); // Player initial
    });

    it('reveals role when card is clicked', () => {
      const card = screen.getByText('Reveal Role').closest('div[class*="cursor-pointer"]');
      expect(card).toBeInTheDocument();
      
      fireEvent.click(card!);
      
      // Should now show role information
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Casino')).toBeInTheDocument();
      expect(screen.getByText('Your Role')).toBeInTheDocument();
      expect(screen.getByText('Dealer')).toBeInTheDocument();
    });
  });

  describe('Non-Spy Role Display', () => {
    beforeEach(() => {
      // Render, skip privacy, and reveal role
      render(<RoleRevealCard playerName="Alice" role={nonSpyRole} onNext={mockOnNext} />);
      const readyButton = screen.getByRole('button', { name: "I'm Ready - Show My Role" });
      fireEvent.click(readyButton);
      const card = screen.getByText('Reveal Role').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);
    });

    it('displays location and role information', () => {
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Casino')).toBeInTheDocument();
      expect(screen.getByText('Your Role')).toBeInTheDocument();
      expect(screen.getByText('Dealer')).toBeInTheDocument();
    });

    it('shows helpful instructions for non-spy', () => {
      expect(screen.getByText('Remember:')).toBeInTheDocument();
      expect(screen.getByText('• Ask questions about this location')).toBeInTheDocument();
      expect(screen.getByText('• Don\'t reveal the location directly')).toBeInTheDocument();
      expect(screen.getByText('• Try to identify the spy')).toBeInTheDocument();
      expect(screen.getByText('• Act like you belong in this role')).toBeInTheDocument();
    });

    it('uses blue color scheme for non-spy', () => {
      const blueElements = document.querySelectorAll('.bg-blue-100');
      expect(blueElements.length).toBeGreaterThan(0);
    });

    it('shows continue prompt and next button', () => {
      expect(screen.getByText('Tap to continue')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next Player' })).toBeInTheDocument();
    });

    it('shows privacy reminder when revealed', () => {
      expect(screen.getByText('Keep this information secret!')).toBeInTheDocument();
      expect(screen.getByText('Don\'t let other players see your role when passing the device.')).toBeInTheDocument();
    });

    it('calls onNext when next button is clicked', () => {
      const nextButton = screen.getByRole('button', { name: 'Next Player' });
      fireEvent.click(nextButton);
      
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('calls onNext when revealed card is clicked', () => {
      const card = screen.getByText('Tap to continue').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);
      
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Spy Role Display', () => {
    beforeEach(() => {
      // Render spy role, skip privacy, and reveal role
      render(<RoleRevealCard playerName="Bob" role={spyRole} onNext={mockOnNext} />);
      const readyButton = screen.getByRole('button', { name: "I'm Ready - Show My Role" });
      fireEvent.click(readyButton);
      const card = screen.getByText('Reveal Role').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);
    });

    it('clearly displays spy message', () => {
      expect(screen.getByText('You are the SPY')).toBeInTheDocument();
    });

    it('does not show location information', () => {
      expect(screen.queryByText('Location')).not.toBeInTheDocument();
      expect(screen.queryByText('Your Role')).not.toBeInTheDocument();
    });

    it('shows spy-specific instructions', () => {
      expect(screen.getByText('Your mission:')).toBeInTheDocument();
      expect(screen.getByText('• Figure out the location through questions')).toBeInTheDocument();
      expect(screen.getByText('• Don\'t reveal you don\'t know the location')).toBeInTheDocument();
      expect(screen.getByText('• Try to blend in with other players')).toBeInTheDocument();
      expect(screen.getByText('• Avoid getting voted out!')).toBeInTheDocument();
    });

    it('uses red color scheme for spy', () => {
      const redElements = document.querySelectorAll('.bg-red-100');
      expect(redElements.length).toBeGreaterThan(0);
    });

    it('shows shield icon for spy', () => {
      // Check for shield SVG path (Shield icon has this specific path)
      const shieldPath = document.querySelector('path[d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"]');
      expect(shieldPath).toBeInTheDocument();
    });
  });

  describe('State Transitions and Interaction Flow', () => {
    it('follows complete interaction flow for non-spy', () => {
      render(<RoleRevealCard playerName="Alice" role={nonSpyRole} onNext={mockOnNext} />);
      
      // 1. Privacy warning
      expect(screen.getByText('Privacy Reminder')).toBeInTheDocument();
      
      // 2. Click ready
      fireEvent.click(screen.getByRole('button', { name: "I'm Ready - Show My Role" }));
      expect(screen.getByText('Tap the card to reveal your role')).toBeInTheDocument();
      
      // 3. Click to reveal
      const card = screen.getByText('Reveal Role').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);
      expect(screen.getByText('Casino')).toBeInTheDocument();
      
      // 4. Click to continue
      fireEvent.click(screen.getByRole('button', { name: 'Next Player' }));
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('follows complete interaction flow for spy', () => {
      render(<RoleRevealCard playerName="Bob" role={spyRole} onNext={mockOnNext} />);
      
      // 1. Privacy warning
      expect(screen.getByText('Privacy Reminder')).toBeInTheDocument();
      
      // 2. Click ready
      fireEvent.click(screen.getByRole('button', { name: "I'm Ready - Show My Role" }));
      expect(screen.getByText('Tap the card to reveal your role')).toBeInTheDocument();
      
      // 3. Click to reveal
      const card = screen.getByText('Reveal Role').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);
      expect(screen.getByText('You are the SPY')).toBeInTheDocument();
      
      // 4. Click to continue
      fireEvent.click(screen.getByRole('button', { name: 'Next Player' }));
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('updates header description based on state', () => {
      render(<RoleRevealCard playerName="Alice" role={nonSpyRole} onNext={mockOnNext} />);
      
      // Skip privacy
      fireEvent.click(screen.getByRole('button', { name: "I'm Ready - Show My Role" }));
      expect(screen.getByText('Tap the card to reveal your role')).toBeInTheDocument();
      
      // Reveal role
      const card = screen.getByText('Reveal Role').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);
      expect(screen.getByText('Your role is revealed below')).toBeInTheDocument();
    });
  });

  describe('Visual Styling and Accessibility', () => {
    it('applies correct styling for card states', () => {
      render(<RoleRevealCard playerName="Alice" role={nonSpyRole} onNext={mockOnNext} />);
      
      // Skip privacy
      fireEvent.click(screen.getByRole('button', { name: "I'm Ready - Show My Role" }));
      
      // Check unrevealed card styling
      const unrevealedCard = screen.getByText('Reveal Role').closest('div[class*="cursor-pointer"]');
      expect(unrevealedCard).toHaveClass('border-slate-300');
      
      // Reveal and check revealed card styling
      fireEvent.click(unrevealedCard!);
      const revealedCard = screen.getByText('Tap to continue').closest('div[class*="cursor-pointer"]');
      expect(revealedCard).toHaveClass('border-blue-300', 'bg-blue-50');
    });

    it('applies correct spy styling', () => {
      render(<RoleRevealCard playerName="Bob" role={spyRole} onNext={mockOnNext} />);
      
      // Skip privacy and reveal
      fireEvent.click(screen.getByRole('button', { name: "I'm Ready - Show My Role" }));
      const card = screen.getByText('Reveal Role').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);
      
      // Check spy card styling
      const spyCard = screen.getByText('Tap to continue').closest('div[class*="cursor-pointer"]');
      expect(spyCard).toHaveClass('border-red-300', 'bg-red-50');
    });

    it('handles long player names appropriately', () => {
      const longNameRole = { ...nonSpyRole, playerName: 'Christopher Alexander' };
      render(<RoleRevealCard playerName="Christopher Alexander" role={longNameRole} onNext={mockOnNext} />);
      
      expect(screen.getByText("Christopher Alexander's Turn")).toBeInTheDocument();
      
      // Skip privacy
      fireEvent.click(screen.getByRole('button', { name: "I'm Ready - Show My Role" }));
      expect(screen.getAllByText('Christopher Alexander')).toHaveLength(2); // Header and card
      expect(screen.getByText('C')).toBeInTheDocument(); // Initial
    });
  });
}); 
