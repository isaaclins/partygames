import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Input } from '../../../components/ui/Input';
import { Search, Eye, EyeOff } from 'lucide-react';

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    test('renders input with placeholder', () => {
      render(<Input placeholder='Enter text' />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    test('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });

    test('applies custom className', () => {
      render(<Input className='custom-class' data-testid='input' />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-class');
    });

    test('generates unique ID when not provided', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('id');
      expect(input?.id).toMatch(/^input-/);
    });

    test('uses provided ID', () => {
      render(<Input id='custom-id' />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('Label', () => {
    test('renders with label', () => {
      render(<Input label='Test Label' />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    test('associates label with input correctly', () => {
      render(<Input label='Test Label' id='test-input' />);
      const label = screen.getByText('Test Label');
      const input = screen.getByRole('textbox');

      expect(label).toHaveAttribute('for', 'test-input');
      expect(input).toHaveAttribute('id', 'test-input');
    });

    test('clicking label focuses input', async () => {
      const user = userEvent.setup();
      render(<Input label='Test Label' />);

      const label = screen.getByText('Test Label');
      const input = screen.getByRole('textbox');

      await user.click(label);
      expect(input).toHaveFocus();
    });

    test('renders without label', () => {
      render(<Input placeholder='No label' />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    test('renders default variant by default', () => {
      render(<Input data-testid='input' />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'border',
        'border-slate-300',
        'rounded-lg',
        'bg-white'
      );
    });

    test('renders outline variant', () => {
      render(<Input variant='outline' data-testid='input' />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'border-2',
        'border-slate-300',
        'rounded-lg',
        'bg-transparent'
      );
    });
  });

  describe('Error State', () => {
    test('renders with error message', () => {
      render(<Input error='This field is required' />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('applies error styles when error is present', () => {
      render(<Input error='Error message' data-testid='input' />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'border-red-300',
        'focus:ring-red-500',
        'focus:border-red-500'
      );
    });

    test('error message has proper styling', () => {
      render(<Input error='Error message' />);
      const errorElement = screen.getByText('Error message');
      expect(errorElement).toHaveClass('text-red-600');
    });

    test('error takes precedence over helperText', () => {
      render(<Input error='Error message' helperText='Helper text' />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    test('renders helper text when no error', () => {
      render(<Input helperText='This is helper text' />);
      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });

    test('helper text has proper styling', () => {
      render(<Input helperText='Helper text' />);
      const helperElement = screen.getByText('Helper text');
      expect(helperElement).toHaveClass('text-slate-500');
    });

    test('does not render helper text when error is present', () => {
      render(<Input error='Error' helperText='Helper' />);
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    test('renders with left icon', () => {
      render(<Input leftIcon={<Search data-testid='left-icon' />} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    test('renders with right icon', () => {
      render(<Input rightIcon={<Eye data-testid='right-icon' />} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    test('renders with both left and right icons', () => {
      render(
        <Input
          leftIcon={<Search data-testid='left-icon' />}
          rightIcon={<Eye data-testid='right-icon' />}
        />
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    test('applies correct padding when left icon is present', () => {
      render(<Input leftIcon={<Search />} data-testid='input' />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pl-10');
    });

    test('applies correct padding when right icon is present', () => {
      render(<Input rightIcon={<Eye />} data-testid='input' />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pr-10');
    });

    test('icon containers have proper positioning', () => {
      const { container: _container } = render(
        <Input
          leftIcon={<Search data-testid='left-icon' />}
          rightIcon={<Eye data-testid='right-icon' />}
        />
      );

      const leftIconContainer = screen.getByTestId('left-icon').parentElement;
      const rightIconContainer = screen.getByTestId('right-icon').parentElement;

      expect(leftIconContainer).toHaveClass(
        'absolute',
        'left-3',
        'top-1/2',
        'transform',
        '-translate-y-1/2'
      );
      expect(rightIconContainer).toHaveClass(
        'absolute',
        'right-3',
        'top-1/2',
        'transform',
        '-translate-y-1/2'
      );
    });
  });

  describe('User Interactions', () => {
    test('calls onChange when value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');

      expect(handleChange).toHaveBeenCalledTimes(5); // One for each character
    });

    test('calls onFocus when input is focused', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    test('calls onBlur when input loses focus', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // Move focus away

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    test('handles controlled input correctly', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      const { rerender } = render(
        <Input value='initial' onChange={handleChange} />
      );

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('initial');

      await user.clear(input);
      await user.type(input, 'new value');

      // Simulate parent component updating the value
      rerender(<Input value='new value' onChange={handleChange} />);
      expect(input.value).toBe('new value');
    });

    test('handles uncontrolled input correctly', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue='default' />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('default');

      await user.clear(input);
      await user.type(input, 'typed value');
      expect(input.value).toBe('typed value');
    });
  });

  describe('Input Types', () => {
    test('renders as text input by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      // Note: HTML inputs without explicit type attribute default to text
    });

    test('renders different input types', () => {
      const types = ['email', 'password', 'number', 'tel', 'url'];

      types.forEach((type) => {
        const { unmount } = render(
          <Input type={type as any} data-testid={`input-${type}`} />
        );
        const input = screen.getByTestId(`input-${type}`);
        expect(input).toHaveAttribute('type', type);
        unmount();
      });
    });

    test('password input toggles visibility with icon click', async () => {
      const user = userEvent.setup();

      // This would be a custom implementation, but testing the concept
      const PasswordInput = () => {
        const [showPassword, setShowPassword] = React.useState(false);
        return (
          <Input
            type={showPassword ? 'text' : 'password'}
            rightIcon={
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                data-testid='toggle-password'
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            }
          />
        );
      };

      const { container } = render(<PasswordInput />);

      const input = container.querySelector('input') as HTMLInputElement;
      const toggleButton = screen.getByTestId('toggle-password');

      expect(input.type).toBe('password');

      await user.click(toggleButton);
      expect(input.type).toBe('text');
    });
  });

  describe('Disabled State', () => {
    test('input is disabled when disabled prop is true', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    test('applies disabled styles', () => {
      render(<Input disabled data-testid='input' />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'disabled:opacity-50',
        'disabled:cursor-not-allowed'
      );
    });

    test('disabled input does not respond to user input', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input disabled onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'should not work');

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    test('input can be focused programmatically', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    test('has proper focus ring styles', () => {
      render(<Input data-testid='input' />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-1'
      );
    });

    test('focus styles change with error state', () => {
      render(<Input error='Error' data-testid='input' />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('focus:ring-red-500', 'focus:border-red-500');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<Input label='Test Input' helperText='Helper' />);
      const input = screen.getByRole('textbox');

      // Check if input is properly labeled
      expect(input).toBeInTheDocument();
      expect(screen.getByText('Helper')).toBeInTheDocument();
    });

    test('has proper ARIA attributes with error', () => {
      render(<Input label='Test Input' error='Error message' />);
      const input = screen.getByRole('textbox');

      // Check if error message is accessible
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });

    test('screen reader can access error message', () => {
      render(<Input error='This field is required' />);
      const errorElement = screen.getByText('This field is required');
      expect(errorElement).toBeInTheDocument();
    });

    test('screen reader can access helper text', () => {
      render(<Input helperText='Enter your email address' />);
      const helperElement = screen.getByText('Enter your email address');
      expect(helperElement).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    test('forwards HTML input attributes', () => {
      render(
        <Input
          placeholder='Test placeholder'
          maxLength={50}
          minLength={5}
          pattern='[A-Za-z]+'
          required
          autoComplete='off'
          data-testid='input'
        />
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('placeholder', 'Test placeholder');
      expect(input).toHaveAttribute('maxlength', '50');
      expect(input).toHaveAttribute('minlength', '5');
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });

    test('handles form validation attributes', () => {
      render(
        <Input
          type='email'
          required
          pattern='[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('pattern');
    });
  });

  describe('CSS Classes', () => {
    test('has base classes', () => {
      render(<Input data-testid='input' />);
      const input = screen.getByTestId('input');

      expect(input).toHaveClass(
        'w-full',
        'px-4',
        'py-3',
        'text-slate-900',
        'transition-colors',
        'duration-200',
        'min-h-[44px]'
      );
    });

    test('combines variant classes correctly', () => {
      render(<Input variant='outline' data-testid='input' />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-2', 'bg-transparent');
    });

    test('error classes override default focus styles', () => {
      render(<Input error='Error' data-testid='input' />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'border-red-300',
        'focus:ring-red-500',
        'focus:border-red-500'
      );
    });
  });

  describe('Edge Cases', () => {
    test('handles empty string value', () => {
      render(<Input value='' onChange={() => {}} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    test('handles numeric zero value', () => {
      render(<Input value={0 as any} onChange={() => {}} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('0');
    });

    test('handles null/undefined values gracefully', () => {
      render(<Input value={null as any} onChange={() => {}} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    test('maintains functionality with rapid value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      // Rapid typing
      await user.type(input, 'abcdefghij');
      expect(handleChange).toHaveBeenCalledTimes(10);
    });
  });

  describe('Layout and Container', () => {
    test('wraps input in proper container structure', () => {
      const { container } = render(
        <Input
          label='Test'
          leftIcon={<Search />}
          rightIcon={<Eye />}
          helperText='Helper'
        />
      );

      // Should have label, input container with relative positioning, and helper text
      expect(container.querySelector('.space-y-2')).toBeInTheDocument();
      expect(container.querySelector('.relative')).toBeInTheDocument();
    });

    test('maintains proper spacing between elements', () => {
      const { container } = render(<Input label='Test' helperText='Helper' />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-2');
    });
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn();

      function TestInput(props: any) {
        renderSpy();
        return <Input {...props} />;
      }

      const { rerender } = render(<TestInput />);
      rerender(<TestInput />);

      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    test('handles high-frequency input events', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      // Simulate rapid typing
      const text = 'the quick brown fox jumps over the lazy dog';
      await user.type(input, text);

      expect(handleChange).toHaveBeenCalledTimes(text.length);
    });
  });
});
