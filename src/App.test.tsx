import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
  })

  it('renders navbar component', () => {
    render(<App />)
    const navbar = screen.getByRole('navigation')
    expect(navbar).toBeInTheDocument()
  })

  it('renders footer component', () => {
    render(<App />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
  })
})