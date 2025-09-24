/**
 * @fileoverview Schema validation test for Route entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load the route schema
const routeSchema = JSON.parse(
  readFileSync(join(__dirname, '../../specs/001-refuse-protocol-the/contracts/route-schema.json'), 'utf8')
);

// Compile the schema validator
const validateRoute = ajv.compile(routeSchema);

describe('Route Entity Schema Validation', () => {
  test('should validate basic route data structure', () => {
    const validRoute = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Monday Residential Route 1',
      schedule: {
        frequency: 'weekly',
        dayOfWeek: 'monday',
        startTime: '06:00',
        endTime: '15:00'
      },
      assignedSites: ['site-1', 'site-2', 'site-3'],
      efficiency: 85.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const isValid = validateRoute(validRoute);
    expect(isValid).toBe(true);

    if (!isValid) {
      console.error('Validation errors:', validateRoute.errors);
    }
  });

  test('should reject invalid route data', () => {
    const invalidRoute = {
      name: '', // Invalid: empty name
      schedule: { frequency: 'invalid' } // Invalid: not in enum
      // Missing required id, createdAt, updatedAt, version
    };

    const isValid = validateRoute(invalidRoute);
    expect(isValid).toBe(false);
    expect(validateRoute.errors?.length).toBeGreaterThan(0);
  });
});
