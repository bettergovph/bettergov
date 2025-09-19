import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LanguageProvider, useLanguage } from './LanguageContext'

const TestComponent = () => {
  const { language, setLanguage, translate } = useLanguage()

  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="translation">{translate('navbar.home')}</div>
      <button onClick={() => setLanguage('fil')}>Change to Filipino</button>
      <button onClick={() => setLanguage('en')}>Change to English</button>
    </div>
  )
}

describe('LanguageContext', () => {
  it('provides default language as English', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )

    expect(screen.getByTestId('current-language')).toHaveTextContent('en')
  })

  it('provides translate function', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )

    expect(screen.getByTestId('translation')).toHaveTextContent('Home')
  })

  it('allows changing language', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )

    const filipinoButton = screen.getByText('Change to Filipino')
    act(() => {
      filipinoButton.click()
    })

    expect(screen.getByTestId('current-language')).toHaveTextContent('fil')
    expect(screen.getByTestId('translation')).toHaveTextContent('Tahanan')
  })

  it('persists language preference in localStorage', () => {
    const { unmount } = render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )

    const filipinoButton = screen.getByText('Change to Filipino')
    act(() => {
      filipinoButton.click()
    })

    unmount()

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )

    expect(screen.getByTestId('current-language')).toHaveTextContent('fil')
  })

  it('returns key if translation not found', () => {
    const TestComponentWithMissingKey = () => {
      const { translate } = useLanguage()
      return <div data-testid="missing">{translate('missing.key')}</div>
    }

    render(
      <LanguageProvider>
        <TestComponentWithMissingKey />
      </LanguageProvider>
    )

    expect(screen.getByTestId('missing')).toHaveTextContent('missing.key')
  })

  it('throws error when useLanguage is used outside provider', () => {
    const TestComponentOutsideProvider = () => {
      useLanguage()
      return <div>Should not render</div>
    }

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponentOutsideProvider />)
    }).toThrowError('useLanguage must be used within a LanguageProvider')

    consoleError.mockRestore()
  })
})