/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import Navigation from '../../src/components/Navigation'
import Footer from '../../src/components/Footer'
import Layout from '../../src/components/Layout'

describe('Component Unit Tests', () => {
  describe('Navigation Component', () => {
    it('renders navigation with correct links', () => {
      render(<Navigation />)
      expect(screen.getByText('REFUSE Protocol')).toBeInTheDocument()
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
      expect(screen.getByText('Documentation')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })

    it('has accessible navigation landmarks', () => {
      render(<Navigation />)
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
      expect(nav).toHaveAttribute('aria-label', 'main navigation')
    })

    it('toggles mobile menu', () => {
      render(<Navigation />)
      const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i })

      // Mobile menu should be hidden initially
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()

      // Click to open mobile menu
      fireEvent.click(mobileMenuButton)
      expect(screen.getByRole('menu')).toBeInTheDocument()

      // Click to close mobile menu
      fireEvent.click(mobileMenuButton)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  describe('Footer Component', () => {
    it('renders footer with copyright information', () => {
      render(<Footer />)
      expect(screen.getByText(/© 2025 REFUSE Protocol/)).toBeInTheDocument()
    })

    it('has proper semantic footer landmark', () => {
      render(<Footer />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
    })

    it('includes GitHub link', () => {
      render(<Footer />)
      const githubLink = screen.getByLabelText('GitHub')
      expect(githubLink).toBeInTheDocument()
      expect(githubLink).toHaveAttribute('href', 'https://github.com/refuse-protocol')
    })
  })

  describe('Layout Component', () => {
    it('renders children correctly', () => {
      render(
        <Layout>
          <div data-testid="test-child">Test Content</div>
        </Layout>
      )
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('provides minimum height structure', () => {
      render(<Layout />)
      const layoutDiv = screen.getByTestId('layout-root') || document.querySelector('.min-h-screen')
      expect(layoutDiv).toBeInTheDocument()
    })
  })
})
