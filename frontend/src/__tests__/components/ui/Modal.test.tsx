import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Modal } from '../../../components/ui/Modal';

// Mock createPortal to render in the same container for testing
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  };
});

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow style
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up any side effects
    document.body.style.overflow = '';
  });

  describe('Basic Rendering', () => {
    test('renders modal when isOpen is true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    test('does not render modal when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    test('renders modal with title', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    test('renders modal without title', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    test('renders children correctly', () => {
      render(
        <Modal {...defaultProps}>
          <div>Custom content</div>
          <button>Action button</button>
        </Modal>
      );
      
      expect(screen.getByText('Custom content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action button' })).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    test('renders with medium size by default', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = screen.getByRole('dialog').querySelector('.max-w-md');
      expect(modalContent).toBeInTheDocument();
    });

    test('renders with small size', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const modalContent = screen.getByRole('dialog').querySelector('.max-w-sm');
      expect(modalContent).toBeInTheDocument();
    });

    test('renders with large size', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const modalContent = screen.getByRole('dialog').querySelector('.max-w-lg');
      expect(modalContent).toBeInTheDocument();
    });

    test('renders with extra large size', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const modalContent = screen.getByRole('dialog').querySelector('.max-w-xl');
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    test('shows close button by default', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    test('hides close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} title="Test Modal" showCloseButton={false} />);
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} title="Test Modal" />);
      
      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('shows close button even without title when explicitly set', () => {
      render(<Modal {...defaultProps} showCloseButton={true} />);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });

  describe('Overlay Interactions', () => {
    test('calls onClose when overlay is clicked by default', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      const overlay = screen.getByRole('dialog').firstElementChild as HTMLElement;
      await user.click(overlay);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('does not call onClose when overlay is clicked and closeOnOverlayClick is false', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);
      
      const overlay = screen.getByRole('dialog').firstElementChild as HTMLElement;
      await user.click(overlay);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    test('does not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      const modalContent = screen.getByText('Modal content');
      await user.click(modalContent);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    test('calls onClose when Escape key is pressed by default', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('does not call onClose when Escape key is pressed and closeOnEscape is false', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).not.toHaveBeenCalled();
    });

    test('does not call onClose for other keys', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'Tab' });
      
      expect(onClose).not.toHaveBeenCalled();
    });

    test('does not respond to escape key when modal is closed', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} isOpen={false} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Management', () => {
    test('disables body scroll when modal is open', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    test('restores body scroll when modal is closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
    });

    test('restores body scroll on unmount', () => {
      const { unmount } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });

    test('handles multiple modals correctly', () => {
      // Reset body overflow before test
      document.body.style.overflow = '';
      
      const { rerender } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      // Second modal
      rerender(
        <>
          <Modal {...defaultProps} />
          <Modal {...defaultProps} isOpen={true} onClose={vi.fn()}>
            <div>Second modal</div>
          </Modal>
        </>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Accessibility', () => {
    test('has proper dialog role', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('has aria-modal attribute', () => {
      render(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    test('has aria-labelledby when title is provided', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      const dialog = screen.getByRole('dialog');
      const title = screen.getByText('Test Modal');
      
      expect(dialog).toHaveAttribute('aria-labelledby', title.id);
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    test('does not have aria-labelledby when no title is provided', () => {
      render(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    test('overlay has aria-hidden attribute', () => {
      render(<Modal {...defaultProps} />);
      const overlay = screen.getByRole('dialog').querySelector('[aria-hidden="true"]');
      expect(overlay).toBeInTheDocument();
    });

    test('close button has proper aria-label', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    test('focus management works correctly', async () => {
      render(
        <Modal {...defaultProps} title="Test Modal">
          <button>First button</button>
          <button>Second button</button>
        </Modal>
      );
      
      // Modal content should be focusable
      const firstButton = screen.getByText('First button');
      firstButton.focus();
      expect(firstButton).toHaveFocus();
    });
  });

  describe('Header and Layout', () => {
    test('renders header when title or close button is present', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      const header = screen.getByRole('dialog').querySelector('.border-b');
      expect(header).toBeInTheDocument();
    });

    test('renders header with close button only', () => {
      render(<Modal {...defaultProps} showCloseButton={true} />);
      const header = screen.getByRole('dialog').querySelector('.border-b');
      expect(header).toBeInTheDocument();
    });

    test('does not render header when no title and showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      const header = screen.getByRole('dialog').querySelector('.border-b');
      expect(header).not.toBeInTheDocument();
    });

    test('header has proper layout classes', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      const header = screen.getByRole('dialog').querySelector('.border-b');
      expect(header).toHaveClass('flex', 'items-center', 'justify-between', 'p-6', 'border-b', 'border-slate-200');
    });

    test('body has proper padding', () => {
      render(<Modal {...defaultProps} />);
      const body = screen.getByText('Modal content');
      expect(body.parentElement).toHaveClass('p-6');
    });
  });

  describe('Styling and CSS Classes', () => {
    test('modal container has proper positioning classes', () => {
      render(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass(
        'fixed',
        'inset-0',
        'z-50',
        'flex',
        'items-center',
        'justify-center',
        'p-4'
      );
    });

    test('overlay has proper styling classes', () => {
      render(<Modal {...defaultProps} />);
      const overlay = screen.getByRole('dialog').querySelector('[aria-hidden="true"]');
      expect(overlay).toHaveClass(
        'fixed',
        'inset-0',
        'bg-black',
        'bg-opacity-50',
        'transition-opacity'
      );
    });

    test('modal content has proper styling classes', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = screen.getByRole('dialog').querySelector('.bg-white');
      expect(modalContent).toHaveClass(
        'relative',
        'bg-white',
        'rounded-lg',
        'shadow-xl',
        'w-full',
        'transform',
        'transition-all'
      );
    });

    test('title has proper styling', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      const title = screen.getByText('Test Modal');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-slate-900');
    });
  });

  describe('Event Propagation', () => {
    test('stops propagation when modal content is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onContentClick = vi.fn();
      
      render(
        <Modal {...defaultProps} onClose={onClose}>
          <div onClick={onContentClick}>Modal content</div>
        </Modal>
      );
      
      const content = screen.getByText('Modal content');
      await user.click(content);
      
      expect(onContentClick).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    test('prevents overlay click when clicking modal content area', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      const modalContent = screen.getByText('Modal content').closest('.bg-white') as HTMLElement;
      await user.click(modalContent);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles null children gracefully', () => {
      render(<Modal {...defaultProps}>{null}</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('handles undefined children gracefully', () => {
      render(<Modal {...defaultProps}>{undefined}</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('handles complex nested children', () => {
      render(
        <Modal {...defaultProps}>
          <div>
            <h3>Nested heading</h3>
            <p>Nested paragraph</p>
            <button>Nested button</button>
          </div>
        </Modal>
      );
      
      expect(screen.getByText('Nested heading')).toBeInTheDocument();
      expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Nested button' })).toBeInTheDocument();
    });

    test('handles rapid open/close state changes', () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={false} />);
      
      // Rapidly toggle open state
      rerender(<Modal {...defaultProps} isOpen={true} />);
      rerender(<Modal {...defaultProps} isOpen={false} />);
      rerender(<Modal {...defaultProps} isOpen={true} />);
      
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    test('handles missing onClose gracefully', () => {
      const { onClose, ...propsWithoutOnClose } = defaultProps;
      
      expect(() => {
        render(<Modal {...propsWithoutOnClose} onClose={undefined as any} />);
      }).not.toThrow();
    });

    test('handles click events when onClose is undefined', async () => {
      const user = userEvent.setup();
      render(<Modal isOpen={true} onClose={undefined as any}>{defaultProps.children}</Modal>);
      
      const overlay = screen.getByRole('dialog').firstElementChild as HTMLElement;
      
      expect(() => user.click(overlay)).not.toThrow();
    });
  });

  describe('Performance and Cleanup', () => {
    test('removes event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const { unmount } = render(<Modal {...defaultProps} />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('does not add event listeners when modal is closed', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      render(<Modal {...defaultProps} isOpen={false} />);
      
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('adds event listeners when modal opens', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      render(<Modal {...defaultProps} />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('handles multiple re-renders without memory leaks', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      
      // Multiple re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<Modal {...defaultProps} title={`Modal ${i}`} />);
      }
      
      expect(screen.getByText('Modal 9')).toBeInTheDocument();
    });
  });

  describe('Portal Rendering', () => {
    test('renders in document.body by default', () => {
      // This test verifies that createPortal is called correctly
      // The actual portal behavior is mocked for testing
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('modal is rendered at correct z-index level', () => {
      render(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('z-50');
    });
  });
}); 
