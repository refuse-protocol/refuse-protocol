/**
 * @fileoverview Schema validation test for Facility entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { createValidator } from '../test-utils';
import { FacilityModel } from '../../protocol/implementations/facility-minimal';

// Create the schema validator using shared utilities
const validateFacility = createValidator(FacilityModel);

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
        country: 'US',
      },
      acceptedMaterials: ['waste', 'recycling'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    const result = validateFacility.validate(validFacility);
    expect(result.isValid).toBe(true);

    if (!result.isValid) {
      console.error('Validation errors:', result.errors);
    }
  });

  test('should reject invalid facility data', () => {
    const invalidFacility = {
      name: '', // Invalid: empty name
      code: '', // Invalid: empty code
      type: 'invalid_type', // Invalid: not in enum
      status: 'invalid_status', // Invalid: not in enum
      // Missing required id, address, createdAt, updatedAt, version
    };

    const result = validateFacility.validate(invalidFacility);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
