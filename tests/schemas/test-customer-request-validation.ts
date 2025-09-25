/**
 * @fileoverview Schema validation test for CustomerRequest entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { createValidator } from '../test-utils';

// Create the schema validator using shared utilities
const validateCustomerRequest = createValidator('customer-request');

describe('CustomerRequest Entity Schema Validation', () => {
  test('should validate basic customer request data structure', () => {
    const validCustomerRequest = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      requestNumber: 'REQ-2024-001',
      type: 'new_service',
      status: 'pending',
      customerId: '456e7890-e12b-34c5-b678-901234567890',
      requestedBy: 'John Smith',
      serviceType: 'waste',
      serviceAddress: {
        street1: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        country: 'US'
      },
      requestedDate: '2024-10-15T09:00:00Z',
      approvalHistory: [{
        stepNumber: 1,
        approverId: '123e4567-e89b-12d3-a456-426614174001',
        approverName: 'John Smith',
        decision: 'approved',
        decisionDate: new Date().toISOString(),
        comments: 'Initial submission approved'
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const isValid = validateCustomerRequest(validCustomerRequest);

    if (!isValid) {
      console.error('Customer request validation errors:', validateCustomerRequest.errors);
    }

    expect(isValid).toBe(true);
  });

  test('should reject invalid customer request data', () => {
    const invalidCustomerRequest = {
      requestNumber: '', // Invalid: empty requestNumber
      type: 'invalid_type', // Invalid: not in enum
      status: 'invalid_status', // Invalid: not in enum
      customerId: 'not-a-uuid', // Invalid: not a UUID
      requestedBy: '', // Invalid: empty requestedBy
      serviceType: 'invalid_service_type', // Invalid: not in enum
      serviceAddress: {
        street1: '', // Invalid: empty street1
        city: '', // Invalid: empty city
        state: 'X', // Invalid: too short
        zipCode: 'invalid', // Invalid: not valid zip
        country: 'USA' // Invalid: too long
      },
      requestedDate: 'invalid-date' // Invalid: not valid date-time
      // Missing required id, createdAt, updatedAt, version
    };

    const isValid = validateCustomerRequest(invalidCustomerRequest);
    expect(isValid).toBe(false);
    expect(validateCustomerRequest.errors?.length).toBeGreaterThan(0);
  });
});
