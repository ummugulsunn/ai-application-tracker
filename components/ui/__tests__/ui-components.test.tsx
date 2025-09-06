import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'
import { Card, CardHeader, CardTitle, CardContent } from '../Card'
import { Input } from '../Input'
import { Tooltip } from '../Tooltip'
import { HelpTooltip } from '../HelpTooltip'
import { EmptyState, NoApplicationsEmptyState } from '../EmptyState'
import { LoadingSpinner, Skeleton } from '../LoadingStates'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: () => false,
}))

describe('UI Components', () => {
  describe('Button', () => {
    it('renders with correct text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('handles click events', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      await userEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('shows loading state', () => {
      render(<Button loading>Loading</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    })

    it('applies different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-primary-600')

      rerender(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-gray-200')
    })

    it('supports keyboard navigation', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      await userEvent.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Card', () => {
    it('renders card with content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
          <CardContent>Test content</CardContent>
        </Card>
      )
      
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('applies different variants', () => {
      const { container } = render(<Card variant="elevated">Content</Card>)
      expect(container.firstChild).toHaveClass('shadow-md')
    })
  })

  describe('Input', () => {
    it('renders with label', () => {
      render(<Input label="Test Label" />)
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
    })

    it('shows error state', () => {
      render(<Input label="Test" error="This field is required" />)
      
      const input = screen.getByLabelText('Test')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
    })

    it('shows success state', () => {
      render(<Input label="Test" success="Looks good!" />)
      expect(screen.getByText('Looks good!')).toBeInTheDocument()
    })

    it('handles password toggle', async () => {
      render(<Input type="password" showPasswordToggle />)
      
      const input = document.querySelector('input[type="password"]') as HTMLInputElement
      const toggleButton = screen.getByLabelText('Show password')
      
      expect(input).toHaveAttribute('type', 'password')
      
      await userEvent.click(toggleButton)
      expect(input).toHaveAttribute('type', 'text')
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument()
    })

    it('supports required fields', () => {
      render(<Input label="Required Field" required />)
      expect(screen.getByText('*')).toBeInTheDocument()
    })
  })

  describe('Tooltip', () => {
    it('shows tooltip on hover', async () => {
      render(
        <Tooltip content="Helpful information">
          <button>Hover me</button>
        </Tooltip>
      )
      
      const trigger = screen.getByRole('button')
      await userEvent.hover(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Helpful information')).toBeInTheDocument()
      })
    })

    it('shows tooltip on focus', async () => {
      render(
        <Tooltip content="Helpful information">
          <button>Focus me</button>
        </Tooltip>
      )
      
      const trigger = screen.getByRole('button')
      trigger.focus()
      
      await waitFor(() => {
        expect(screen.getByText('Helpful information')).toBeInTheDocument()
      })
    })
  })

  describe('HelpTooltip', () => {
    it('renders help icon with tooltip', async () => {
      render(<HelpTooltip content="This is helpful information" />)
      
      const helpButton = screen.getByLabelText('Help information')
      expect(helpButton).toBeInTheDocument()
      
      await userEvent.hover(helpButton)
      
      await waitFor(() => {
        expect(screen.getByText('This is helpful information')).toBeInTheDocument()
      })
    })
  })

  describe('EmptyState', () => {
    it('renders empty state with action', async () => {
      const handleAction = jest.fn()
      
      render(
        <EmptyState
          title="No data found"
          description="There's nothing here yet"
          action={{
            label: 'Add Item',
            onClick: handleAction
          }}
        />
      )
      
      expect(screen.getByText('No data found')).toBeInTheDocument()
      expect(screen.getByText("There's nothing here yet")).toBeInTheDocument()
      
      const actionButton = screen.getByRole('button', { name: 'Add Item' })
      await userEvent.click(actionButton)
      expect(handleAction).toHaveBeenCalledTimes(1)
    })

    it('renders without action', () => {
      render(
        <EmptyState
          title="No data found"
          description="There's nothing here yet"
        />
      )
      
      expect(screen.getByText('No data found')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('NoApplicationsEmptyState', () => {
    it('renders with both actions', async () => {
      const handleAddNew = jest.fn()
      const handleImport = jest.fn()
      
      render(
        <NoApplicationsEmptyState
          onAddNew={handleAddNew}
          onImport={handleImport}
        />
      )
      
      expect(screen.getByText('No applications yet')).toBeInTheDocument()
      
      await userEvent.click(screen.getByRole('button', { name: 'Add First Application' }))
      expect(handleAddNew).toHaveBeenCalledTimes(1)
      
      await userEvent.click(screen.getByRole('button', { name: 'Import from CSV' }))
      expect(handleImport).toHaveBeenCalledTimes(1)
    })
  })

  describe('LoadingSpinner', () => {
    it('renders with different sizes', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />)
      expect(document.querySelector('.h-4')).toBeInTheDocument()
      
      rerender(<LoadingSpinner size="lg" />)
      expect(document.querySelector('.h-8')).toBeInTheDocument()
    })
  })

  describe('Skeleton', () => {
    it('renders skeleton placeholder', () => {
      const { container } = render(<Skeleton className="h-4 w-full" />)
      expect(container.firstChild).toHaveClass('animate-pulse', 'bg-gray-200')
    })
  })

  describe('Accessibility', () => {
    it('supports keyboard navigation for buttons', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Accessible Button</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      await userEvent.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
      
      await userEvent.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('provides proper ARIA labels', () => {
      render(
        <Input 
          label="Email" 
          error="Invalid email" 
          helperText="Enter your email address"
        />
      )
      
      const input = screen.getByLabelText('Email')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby')
    })

    it('supports screen readers with proper roles', () => {
      render(
        <EmptyState
          title="No results"
          description="Try adjusting your search"
          action={{
            label: 'Clear filters',
            onClick: () => {}
          }}
        />
      )
      
      // The empty state should be properly structured for screen readers
      expect(screen.getByText('No results')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
    })
  })
})