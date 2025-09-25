/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

describe('Simple Tests', () => {
  it('should render basic JSX', () => {
    const TestComponent = () => <div data-testid="test">Hello World</div>

    render(<TestComponent />)
    expect(screen.getByTestId('test')).toBeInTheDocument()
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should handle props', () => {
    const TestComponent = ({ title }) => <h1 data-testid="title">{title}</h1>

    render(<TestComponent title="Test Title" />)
    expect(screen.getByTestId('title')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })
})
