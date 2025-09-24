/**
 * @fileoverview Schema validation test for Facility entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load the facility schema
const facilitySchema = JSON.parse(
  readFileSync(join(__dirname, '../../specs/001-refuse-protocol-the/contracts/facility-schema.json'), 'utf8')
);

// Compile the schema validator
const validateFacility = ajv.compile(facilitySchema);

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
