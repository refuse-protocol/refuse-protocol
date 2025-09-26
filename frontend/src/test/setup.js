import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { toHaveNoViolations } from '@axe-core/react'
import React from 'react'
import PropTypes from 'prop-types'
import { BrowserRouter } from 'react-router-dom'

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers)

// Add axe matcher for accessibility testing
expect.extend(toHaveNoViolations)

// Test wrapper for components that need Router context
export const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

TestWrapper.propTypes = {
  children: PropTypes.node.isRequired,
}

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})
