/**
 * @fileoverview Schema validation test for CustomerRequest entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load the customer-request schema
const customerRequestSchema = JSON.parse(
  readFileSync(join(__dirname, '../../specs/001-refuse-protocol-the/contracts/customer-request-schema.json'), 'utf8')
);

// Compile the schema validator
const validateCustomerRequest = ajv.compile(customerRequestSchema);

describe('CustomerRequest Entity Schema Validation', () => {
  test('should validate basic customer request data structure', () => {
    const validCustomerRequest = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      requestNumber: 'REQ-2024-001',
      type: 'new_service',
      status: 'pending',
      customerId: '456e7890-e12b-34c5-b678-901234567890',
      serviceType: 'waste',
      requestedDate: '2024-10-15',
      approvalHistory: [{
        step: 'submitted',
        timestamp: new Date().toISOString(),
        userId: 'user-123',
        notes: 'Initial submission'
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const isValid = validateCustomerRequest(validCustomerRequest);
    expect(isValid).toBe(true);

    if (!isValid) {
      console.error('Validation errors:', validateCustomerRequest.errors);
    }
  });

  test('should reject invalid customer request data', () => {
    const invalidCustomerRequest = {
      requestNumber: '', // Invalid: empty requestNumber
      type: 'invalid_type', // Invalid: not in enum
      status: 'invalid_status', // Invalid: not in enum
      serviceType: 'invalid_service_type' // Invalid: not in enum
      // Missing required id, customerId, requestedDate, createdAt, updatedAt, version
    };

    const isValid = validateCustomerRequest(invalidCustomerRequest);
    expect(isValid).toBe(false);
    expect(validateCustomerRequest.errors?.length).toBeGreaterThan(0);
  });
});
