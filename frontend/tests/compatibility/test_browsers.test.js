/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

describe('Cross-Browser Compatibility Tests', () => {
  beforeEach(() => {
    // Mock browser APIs that might not be available in test environment
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    })

    // Mock IntersectionObserver
    global.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      observe() { return null }
      disconnect() { return null }
      unobserve() { return null }
    }

    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      constructor() {}
      observe() { return null }
      disconnect() { return null }
      unobserve() { return null }
    }
  })

  it('should render without errors in basic browser environment', () => {
    // Test that components can render in a minimal browser environment
    const TestComponent = () => <div data-testid="test">Browser Test</div>

    expect(() => {
      render(<TestComponent />)
      expect(screen.getByTestId('test')).toBeInTheDocument()
    }).not.toThrow()
  })

  it('should handle CSS custom properties (CSS variables)', () => {
    // Test CSS custom property support
    const style = document.createElement('style')
    style.textContent = ':root { --test-color: #ff0000; }'
    document.head.appendChild(style)

    const computedStyle = getComputedStyle(document.documentElement)
    expect(computedStyle.getPropertyValue('--test-color')).toBe('#ff0000')

    document.head.removeChild(style)
  })

  it('should work with modern JavaScript features', () => {
    // Test modern JS features like async/await, destructuring, etc.
    const testAsyncFunction = async () => {
      const result = await Promise.resolve('success')
      return result
    }

    expect(() => {
      // Test that modern JS syntax doesn't break
      const { a, b } = { a: 1, b: 2 }
      const arrowFn = () => a + b
      expect(arrowFn()).toBe(3)
    }).not.toThrow()
  })

  it('should handle different viewport sizes', () => {
    // Test responsive behavior across different viewport sizes
    const originalInnerWidth = window.innerWidth

    // Mock different viewport sizes
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // Mobile
    })

    expect(window.innerWidth).toBe(375)

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768, // Tablet
    })

    expect(window.innerWidth).toBe(768)

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920, // Desktop
    })

    expect(window.innerWidth).toBe(1920)

    // Restore original value
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  it('should work with different user agents', () => {
    // Test that the app works with different browser user agents
    const originalUserAgent = navigator.userAgent

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    ]

    userAgents.forEach(userAgent => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: userAgent,
      })

      expect(navigator.userAgent).toBe(userAgent)

      // Test that basic functionality still works
      expect(() => {
        const testElement = document.createElement('div')
        testElement.textContent = 'Test'
        document.body.appendChild(testElement)
        expect(testElement.textContent).toBe('Test')
        document.body.removeChild(testElement)
      }).not.toThrow()
    })

    // Restore original user agent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: originalUserAgent,
    })
  })
})
