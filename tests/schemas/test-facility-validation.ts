/**
 * @fileoverview Schema validation test for Facility entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { createValidator } from '../test-utils';

// Create the schema validator using shared utilities
const validateFacility = createValidator('facility');

describe('Facility Entity Schema Validation', () => {
  test('should validate basic facility data structure', () => {
    const validFacility = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'North County Landfill',
      code: 'NCL-001',
      type: 'landfill',
      status: 'operational',
      address: {
        street1: '123 Landfill Road',
        city: 'North County',
        state: 'CA',
        zipCode: '95000',
        country: 'US'
      },
      acceptedMaterials: ['waste', 'recycling'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const isValid = validateFacility(validFacility);
    expect(isValid).toBe(true);

    if (!isValid) {
      console.error('Validation errors:', validateFacility.errors);
    }
  });

  test('should reject invalid facility data', () => {
    const invalidFacility = {
      name: '', // Invalid: empty name
      code: '', // Invalid: empty code
      type: 'invalid_type', // Invalid: not in enum
      status: 'invalid_status' // Invalid: not in enum
      // Missing required id, address, createdAt, updatedAt, version
    };

    const isValid = validateFacility(invalidFacility);
    expect(isValid).toBe(false);
    expect(validateFacility.errors?.length).toBeGreaterThan(0);
  });
});
