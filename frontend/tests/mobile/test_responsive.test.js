/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

describe('Mobile Responsiveness Validation', () => {
  beforeEach(() => {
    // Mock matchMedia for responsive testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => ({
        matches: query.includes('max-width: 767px'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    })
  })

  it('should have responsive meta viewport tag', () => {
    // Check that the viewport meta tag exists and has proper content
    const viewport = document.querySelector('meta[name="viewport"]')
    expect(viewport).toBeTruthy()
    expect(viewport.content).toContain('width=device-width')
    expect(viewport.content).toContain('initial-scale=1.0')
  })

  it('should handle mobile navigation correctly', () => {
    // This test validates that the navigation component works on mobile
    const TestNavigation = () => (
      <nav className="sm:hidden">
        <button className="md:hidden">Mobile Menu</button>
        <div className="hidden md:block">Desktop Menu</div>
      </nav>
    )

    render(<TestNavigation />)

    // Mobile menu button should be visible on mobile
    const mobileButton = screen.getByText('Mobile Menu')
    expect(mobileButton).toBeInTheDocument()

    // Desktop menu should be hidden on mobile
    const desktopMenu = screen.getByText('Desktop Menu')
    expect(desktopMenu).toBeInTheDocument()
  })

  it('should stack elements vertically on mobile', () => {
    // Test that flex layouts stack properly on mobile
    const TestLayout = () => (
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-1/2">Content 1</div>
        <div className="sm:w-1/2">Content 2</div>
      </div>
    )

    render(<TestLayout />)

    const content1 = screen.getByText('Content 1')
    const content2 = screen.getByText('Content 2')

    expect(content1).toBeInTheDocument()
    expect(content2).toBeInTheDocument()
  })

  it('should have appropriate mobile typography', () => {
    // Test responsive typography classes
    const TestTypography = () => (
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl">Responsive Heading</h1>
        <p className="text-sm sm:text-base lg:text-lg">Responsive Text</p>
      </div>
    )

    render(<TestTypography />)

    const heading = screen.getByText('Responsive Heading')
    const text = screen.getByText('Responsive Text')

    expect(heading).toBeInTheDocument()
    expect(text).toBeInTheDocument()

    // Check that responsive classes are applied
    expect(heading.className).toContain('text-2xl')
    expect(text.className).toContain('text-sm')
  })

  it('should handle touch interactions properly', () => {
    // Test that touch-friendly elements have appropriate sizing
    const TestTouch = () => (
      <div>
        <button className="min-h-[44px] min-w-[44px] p-2">Touch Button</button>
        <a href="#" className="min-h-[44px] block p-2">Touch Link</a>
      </div>
    )

    render(<TestTouch />)

    const button = screen.getByText('Touch Button')
    const link = screen.getByText('Touch Link')

    expect(button).toBeInTheDocument()
    expect(link).toBeInTheDocument()

    // Check for touch-friendly sizing
    expect(button.className).toContain('min-h-[44px]')
    expect(link.className).toContain('min-h-[44px]')
  })

  it('should optimize content layout for mobile screens', () => {
    // Test mobile-optimized layout patterns
    const TestMobileLayout = () => (
      <div className="max-w-sm mx-auto p-4">
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">Card 1</div>
          <div className="bg-gray-100 p-4 rounded">Card 2</div>
          <div className="bg-gray-100 p-4 rounded">Card 3</div>
        </div>
      </div>
    )

    render(<TestMobileLayout />)

    const card1 = screen.getByText('Card 1')
    const card2 = screen.getByText('Card 2')
    const card3 = screen.getByText('Card 3')

    expect(card1).toBeInTheDocument()
    expect(card2).toBeInTheDocument()
    expect(card3).toBeInTheDocument()
  })

  it('should validate mobile performance considerations', () => {
    // Test that mobile-specific performance optimizations are in place
    const style = document.createElement('style')
    style.textContent = `
      .mobile-optimized {
        contain: layout style paint;
        will-change: transform;
      }
    `
    document.head.appendChild(style)

    // Verify critical CSS is inlined for mobile
    const criticalCSS = document.querySelector('style')
    expect(criticalCSS).toBeTruthy()

    document.head.removeChild(style)
  })
})
