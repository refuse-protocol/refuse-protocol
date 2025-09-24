/**
 * @fileoverview Schema validation test for Territory entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load the territory schema
const territorySchema = JSON.parse(
  readFileSync(join(__dirname, '../../specs/001-refuse-protocol-the/contracts/territory-schema.json'), 'utf8')
);

// Compile the schema validator
const validateTerritory = ajv.compile(territorySchema);

describe('Territory Entity Schema Validation', () => {
  test('should validate basic territory data structure', () => {
    const validTerritory = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'North County Service Area',
      boundary: {
        type: 'Polygon',
        coordinates: [[
          [-96.7970, 32.7767],
          [-96.7960, 32.7767],
          [-96.7960, 32.7777],
          [-96.7970, 32.7777],
          [-96.7970, 32.7767]
        ]]
      },
      pricingRules: [{
        serviceType: 'waste',
        baseRate: 150.00,
        rateUnit: 'month'
      }],
      assignedRoutes: ['route-1', 'route-2'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const isValid = validateTerritory(validTerritory);
    expect(isValid).toBe(true);

    if (!isValid) {
      console.error('Validation errors:', validateTerritory.errors);
    }
  });

  test('should reject invalid territory data', () => {
    const invalidTerritory = {
      name: '', // Invalid: empty name
      boundary: { type: 'invalid' } // Invalid: not in enum
      // Missing required id, createdAt, updatedAt, version
    };

    const isValid = validateTerritory(invalidTerritory);
    expect(isValid).toBe(false);
    expect(validateTerritory.errors?.length).toBeGreaterThan(0);
  });
});
