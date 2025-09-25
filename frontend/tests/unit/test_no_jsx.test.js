/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest'

describe('No JSX Tests', () => {
  it('should run basic test without JSX', () => {
    expect(1 + 1).toBe(2)
  })

  it('should test basic JavaScript functionality', () => {
    const arr = [1, 2, 3]
    expect(arr.length).toBe(3)
    expect(arr).toContain(2)
  })
})
