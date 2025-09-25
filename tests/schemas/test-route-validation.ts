/**
 * @fileoverview Schema validation test for Route entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { createValidator } from '../test-utils';
import { RouteModel } from '../../protocol/implementations/route';

// Create the schema validator using shared utilities
const validateRoute = createValidator(RouteModel);

describe('Route Entity Schema Validation', () => {
  test('should validate basic route data structure', () => {
    const validRoute = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Monday Residential Route 1',
      schedule: {
        frequency: 'weekly' as const,
        dayOfWeek: 'monday',
        startTime: '06:00',
        endTime: '15:00'
      },
      assignedSites: ['123e4567-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174003'],
      efficiency: 85.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const result = validateRoute.validate(validRoute);
    expect(result.isValid).toBe(true);

    if (!result.isValid) {
      console.error('Validation errors:', result.errors);
    }
  });

  test('should reject invalid route data', () => {
    const invalidRoute = {
      name: '', // Invalid: empty name
      code: '', // Invalid: empty code
      type: 'invalid', // Invalid: not in enum
      status: 'invalid', // Invalid: not in enum
      territoryId: 'not-a-uuid', // Invalid: not a UUID format
      schedule: { startTime: 'invalid', endTime: 'invalid' } // Invalid: not valid time format
      // Missing required id, createdAt, updatedAt, version
    };

    const result = validateRoute.validate(invalidRoute);
    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});
