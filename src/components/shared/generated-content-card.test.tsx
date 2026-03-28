// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { GeneratedContentCard } from './generated-content-card'

// ---------------------------------------------------------------------------
// Mock sonner toast — prevents side effects in tests
// ---------------------------------------------------------------------------
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Mock navigator.clipboard
// ---------------------------------------------------------------------------
const mockWriteText = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  cleanup()
})

describe('GeneratedContentCard', () => {
  const baseProps = {
    title: 'Test Title',
    description: 'Test description text',
    isLoading: false,
    completion: null as string | null,
    onGenerate: vi.fn(),
  }

  it('renders title and description', () => {
    render(<GeneratedContentCard {...baseProps} />)

    expect(screen.getByText('Test Title')).toBeDefined()
    expect(screen.getByText('Test description text')).toBeDefined()
  })

  it('renders custom icon when provided', () => {
    render(
      <GeneratedContentCard
        {...baseProps}
        icon={<svg data-testid="custom-icon" />}
      />,
    )

    expect(screen.getByTestId('custom-icon')).toBeDefined()
  })

  it('shows generate button with default label when no completion', () => {
    render(<GeneratedContentCard {...baseProps} />)

    const button = screen.getByText('Generieren')
    expect(button.closest('button')).toBeDefined()
  })

  it('shows custom generate label', () => {
    render(
      <GeneratedContentCard
        {...baseProps}
        generateLabel="E-Mail generieren"
      />,
    )

    expect(screen.getByText('E-Mail generieren')).toBeDefined()
  })

  it('shows empty label when no completion and not loading', () => {
    render(<GeneratedContentCard {...baseProps} />)

    expect(screen.getByText('Noch nicht generiert')).toBeDefined()
  })

  it('shows custom empty label', () => {
    render(
      <GeneratedContentCard {...baseProps} emptyLabel="Kein Ergebnis" />,
    )

    expect(screen.getByText('Kein Ergebnis')).toBeDefined()
  })

  it('calls onGenerate when generate button is clicked', () => {
    const onGenerate = vi.fn()
    render(<GeneratedContentCard {...baseProps} onGenerate={onGenerate} />)

    fireEvent.click(screen.getByText('Generieren'))
    expect(onGenerate).toHaveBeenCalledTimes(1)
  })

  it('shows loading state with spinner text', () => {
    render(<GeneratedContentCard {...baseProps} isLoading={true} />)

    // The loading indicator text appears in the loading section
    expect(screen.getByRole('status')).toBeDefined()
    // "Wird generiert..." appears both in the loading indicator and the disabled button
    expect(screen.getAllByText('Wird generiert...').length).toBeGreaterThan(0)
  })

  it('disables the action button during loading', () => {
    render(<GeneratedContentCard {...baseProps} isLoading={true} />)

    const button = screen.getByRole('button')
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('does not show empty label during loading', () => {
    render(<GeneratedContentCard {...baseProps} isLoading={true} />)

    expect(screen.queryByText('Noch nicht generiert')).toBeNull()
  })

  it('shows completion text when available', () => {
    render(
      <GeneratedContentCard
        {...baseProps}
        completion="Generated content here"
      />,
    )

    expect(screen.getByText('Generated content here')).toBeDefined()
  })

  it('shows copy button when completion exists', () => {
    render(
      <GeneratedContentCard
        {...baseProps}
        completion="Some text"
      />,
    )

    expect(
      screen.getByLabelText('In Zwischenablage kopieren'),
    ).toBeDefined()
  })

  it('copies completion to clipboard on copy button click', () => {
    render(
      <GeneratedContentCard
        {...baseProps}
        completion="Text to copy"
      />,
    )

    fireEvent.click(screen.getByLabelText('In Zwischenablage kopieren'))

    expect(mockWriteText).toHaveBeenCalledWith('Text to copy')
  })

  it('calls custom onCopy handler instead of clipboard when provided', () => {
    const onCopy = vi.fn()
    render(
      <GeneratedContentCard
        {...baseProps}
        completion="Text"
        onCopy={onCopy}
      />,
    )

    fireEvent.click(screen.getByLabelText('In Zwischenablage kopieren'))

    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(mockWriteText).not.toHaveBeenCalled()
  })

  it('shows regenerate button with default label after generation', () => {
    render(
      <GeneratedContentCard
        {...baseProps}
        completion="Done"
      />,
    )

    expect(screen.getByText('Neu generieren')).toBeDefined()
  })

  it('shows custom regenerate label', () => {
    render(
      <GeneratedContentCard
        {...baseProps}
        completion="Done"
        regenerateLabel="Erneut recherchieren"
      />,
    )

    expect(screen.getByText('Erneut recherchieren')).toBeDefined()
  })

  it('does not show empty label when completion exists', () => {
    render(
      <GeneratedContentCard
        {...baseProps}
        completion="Has content"
      />,
    )

    expect(screen.queryByText('Noch nicht generiert')).toBeNull()
  })

  it('sets aria-busy on container during loading', () => {
    const { container } = render(
      <GeneratedContentCard {...baseProps} isLoading={true} />,
    )

    const card = container.firstElementChild as HTMLElement
    expect(card.getAttribute('aria-busy')).toBe('true')
  })

  it('sets aria-busy to false when not loading', () => {
    const { container } = render(
      <GeneratedContentCard {...baseProps} />,
    )

    const card = container.firstElementChild as HTMLElement
    expect(card.getAttribute('aria-busy')).toBe('false')
  })

  it('renders children below completion', () => {
    render(
      <GeneratedContentCard {...baseProps} completion="Content">
        <div data-testid="extra-child">Extra</div>
      </GeneratedContentCard>,
    )

    expect(screen.getByTestId('extra-child')).toBeDefined()
  })

  it('applies custom className', () => {
    const { container } = render(
      <GeneratedContentCard {...baseProps} className="custom-class" />,
    )

    const card = container.firstElementChild as HTMLElement
    expect(card.classList.contains('custom-class')).toBe(true)
  })

  it('does not show copy button when no completion', () => {
    render(<GeneratedContentCard {...baseProps} />)

    expect(screen.queryByLabelText('In Zwischenablage kopieren')).toBeNull()
  })
})
