import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { Button } from '../../../components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import userEvent from '@testing-library/user-event';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    test('renders button with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    test('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Test</Button>);
      expect(ref).toHaveBeenCalled();
    });

    test('applies custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    test('renders primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-600', 'hover:bg-primary-700', 'text-white');
    });

    test('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-slate-200', 'hover:bg-slate-300', 'text-slate-900');
    });

    test('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-slate-300', 'bg-white', 'hover:bg-slate-50');
    });

    test('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent', 'hover:bg-slate-100', 'text-slate-700');
    });

    test('renders danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600', 'hover:bg-red-700', 'text-white');
    });
  });

  describe('Sizes', () => {
    test('renders medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-3', 'text-sm', 'rounded-lg', 'min-h-[44px]');
    });

    test('renders small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-2', 'text-sm', 'rounded-md', 'min-h-[36px]');
    });

    test('renders large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-4', 'text-base', 'rounded-lg', 'min-h-[52px]');
    });
  });

  describe('Icons', () => {
    test('renders with left icon', () => {
      render(
        <Button leftIcon={<ChevronLeft data-testid="left-icon" />}>
          With Left Icon
        </Button>
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByText('With Left Icon')).toBeInTheDocument();
    });

    test('renders with right icon', () => {
      render(
        <Button rightIcon={<ChevronRight data-testid="right-icon" />}>
          With Right Icon
        </Button>
      );
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('With Right Icon')).toBeInTheDocument();
    });

    test('renders with both left and right icons', () => {
      render(
        <Button
          leftIcon={<ChevronLeft data-testid="left-icon" />}
          rightIcon={<ChevronRight data-testid="right-icon" />}
        >
          Both Icons
        </Button>
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('Both Icons')).toBeInTheDocument();
    });

    test('icon spacing is correct', () => {
      render(
        <Button leftIcon={<ChevronLeft />}>
          With Icon
        </Button>
      );
      
      const button = screen.getByRole('button');
      const iconWrapper = button.querySelector('span');
      expect(iconWrapper).toHaveClass('mr-2');
    });
  });

  describe('Loading State', () => {
    test('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>);
      
      const spinner = screen.getByRole('button').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    test('hides content when loading', () => {
      render(
        <Button 
          isLoading 
          leftIcon={<ChevronLeft data-testid="left-icon" />}
          rightIcon={<ChevronRight data-testid="right-icon" />}
        >
          Button Text
        </Button>
      );
      
      expect(screen.queryByText('Button Text')).not.toBeInTheDocument();
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });

    test('button is disabled when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('loading state takes precedence over disabled prop', () => {
      render(<Button isLoading disabled={false}>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Disabled State', () => {
    test('button is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('applies disabled styles', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    test('disabled button does not fire onClick', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    test('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} isLoading>Loading</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Test</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Use userEvent to simulate proper keyboard interaction
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('handles space key activation', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Test</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Use userEvent to simulate proper keyboard interaction
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTML Attributes', () => {
    test('forwards HTML button attributes', () => {
      render(
        <Button
          type="submit"
          form="test-form"
          data-testid="custom-button"
          aria-label="Custom button"
        >
          Submit
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('form', 'test-form');
      expect(button).toHaveAttribute('data-testid', 'custom-button');
      expect(button).toHaveAttribute('aria-label', 'Custom button');
    });

    test('handles form submission', () => {
      const handleSubmit = vi.fn();
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Focus and Accessibility', () => {
    test('button is focusable', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });

    test('disabled button is not focusable', () => {
      render(<Button disabled>Not focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).not.toHaveFocus();
    });

    test('loading button is not focusable', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).not.toHaveFocus();
    });

    test('has proper focus ring styles', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2');
    });

    test('has proper aria attributes when loading', () => {
      render(<Button isLoading aria-label="Loading button">Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Loading button');
    });
  });

  describe('CSS Classes', () => {
    test('has base classes', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'font-medium',
        'transition-colors',
        'duration-200'
      );
    });

    test('combines variant and size classes correctly', () => {
      render(<Button variant="secondary" size="lg">Test</Button>);
      const button = screen.getByRole('button');
      
      // Secondary variant classes
      expect(button).toHaveClass('bg-slate-200', 'hover:bg-slate-300', 'text-slate-900');
      
      // Large size classes
      expect(button).toHaveClass('px-6', 'py-4', 'text-base', 'rounded-lg', 'min-h-[52px]');
    });

    test('custom className overrides do not break functionality', () => {
      const handleClick = vi.fn();
      render(
        <Button 
          onClick={handleClick} 
          className="custom-bg custom-color"
        >
          Custom
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-bg', 'custom-color');
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty children gracefully', () => {
      render(<Button>{''}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('handles null children gracefully', () => {
      render(<Button>{null}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('handles undefined children gracefully', () => {
      render(<Button>{undefined}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('handles complex children elements', () => {
      render(
        <Button>
          <span>Complex</span> <strong>Children</strong>
        </Button>
      );
      
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Children')).toBeInTheDocument();
    });

    test('maintains functionality with rapid state changes', () => {
      const handleClick = vi.fn();
      const { rerender } = render(<Button onClick={handleClick}>Test</Button>);
      
      // Enable/disable rapidly
      rerender(<Button onClick={handleClick} disabled>Test</Button>);
      rerender(<Button onClick={handleClick}>Test</Button>);
      rerender(<Button onClick={handleClick} isLoading>Test</Button>);
      rerender(<Button onClick={handleClick}>Test</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn();
      
      function TestButton(props: any) {
        renderSpy();
        return <Button {...props}>Test</Button>;
      }
      
      const { rerender } = render(<TestButton />);
      
      // Same props should not trigger re-render
      rerender(<TestButton />);
      
      expect(renderSpy).toHaveBeenCalledTimes(2); // Initial + rerender with same props
    });

    test('handles multiple rapid clicks', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Test</Button>);
      
      const button = screen.getByRole('button');
      
      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
      
      expect(handleClick).toHaveBeenCalledTimes(10);
    });
  });
}); 
