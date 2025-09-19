import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Navbar from './Navbar'
import { LanguageProvider } from '../../contexts/LanguageContext'

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        {component}
      </LanguageProvider>
    </BrowserRouter>
  )
}

describe('Navbar', () => {
  it('renders without crashing', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders language switcher', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByText('Project Ideas')).toBeInTheDocument()
  })

  it('toggles mobile menu on button click', () => {
    renderWithProviders(<Navbar />)

    const menuButton = screen.getByRole('button', { name: /open main menu/i })
    expect(menuButton).toBeInTheDocument()

    fireEvent.click(menuButton)

    const closeButton = screen.getByRole('button', { name: /close menu/i })
    expect(closeButton).toBeInTheDocument()
  })

  it('renders logo with link to home', () => {
    renderWithProviders(<Navbar />)

    const logoLinks = screen.getAllByRole('link')
    const homeLink = logoLinks.find(link => link.getAttribute('href') === '/')
    expect(homeLink).toBeInTheDocument()
  })

  it('renders search button', () => {
    renderWithProviders(<Navbar />)

    const searchButtons = screen.getAllByRole('link')
    const searchLink = searchButtons.find(link => link.getAttribute('href') === '/search')
    expect(searchLink).toBeInTheDocument()
  })

  it('renders Join Us link', () => {
    renderWithProviders(<Navbar />)

    const joinUsLink = screen.getByRole('link', { name: /join us/i })
    expect(joinUsLink).toBeInTheDocument()
    expect(joinUsLink.getAttribute('href')).toBe('/join-us')
  })

  it('renders desktop navigation items', () => {
    renderWithProviders(<Navbar />)

    const navElement = screen.getByRole('navigation')
    expect(navElement).toBeInTheDocument()

    const philippinesLink = screen.getByText('The Philippines')
    expect(philippinesLink).toBeInTheDocument()
  })

  it('has sticky positioning', () => {
    renderWithProviders(<Navbar />)

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('sticky', 'top-0', 'z-50')
  })
})