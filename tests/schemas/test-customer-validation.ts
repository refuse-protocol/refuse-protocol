/**
 * @fileoverview Schema validation test for Customer entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { createValidator } from '../test-utils';
import { CustomerModel } from '../../protocol/implementations/customer-minimal';

// Create the schema validator using shared utilities
const validateCustomer = createValidator(CustomerModel);

describe('Customer Entity Schema Validation', () => {
  test('should validate basic customer data structure', () => {
    const validCustomer = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'ABC Waste Management',
      type: 'commercial',
      status: 'active',
      serviceAddress: {
        street1: '123 Main Street',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'US',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    const result = validateCustomer.validate(validCustomer);

    // This test will fail initially since no implementation exists
    // It will pass once the Customer implementation is created
    expect(result.isValid).toBe(true);

    if (!result.isValid) {
//       console.error('Validation errors:', result.errors);
    }
  });

  test('should validate customer with all optional fields', () => {
    const fullCustomer = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Complete Customer Example Inc.',
      type: 'industrial',
      status: 'active',
      primaryContact: {
        name: 'John Smith',
        title: 'Operations Manager',
        email: 'john.smith@example.com',
        phone: '+15550123',
        mobile: '+15550456',
      },
      billingContact: {
        name: 'Jane Doe',
        title: 'Accounts Payable',
        email: 'jane.doe@example.com',
        phone: '+15550789',
      },
      serviceContacts: [
        {
          name: 'Mike Johnson',
          title: 'Site Manager',
          email: 'mike.johnson@example.com',
          phone: '+15550321',
        },
      ],
      serviceAddress: {
        street1: '100 Industrial Blvd',
        street2: 'Building 5',
        city: 'Manufacturing City',
        state: 'TX',
        zipCode: '75001',
        country: 'US',
        coordinates: {
          latitude: 32.7767,
          longitude: -96.797,
        },
      },
      billingAddress: {
        street1: '200 Commerce Street',
        city: 'Business District',
        state: 'TX',
        zipCode: '75002',
        country: 'US',
      },
      serviceTypes: ['waste', 'recycling', 'organics'],
      specialInstructions: 'Handle with care - hazardous materials present',
      metadata: {
        legacySystemId: 'CUST-001',
        customField1: 'Custom Value',
        customField2: 42,
        syncStatus: 'synced',
        lastSyncDate: new Date().toISOString(),
        originalFieldNames: ['customer_number', 'customer_name'],
        transformationNotes: 'Migrated from legacy system',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    const result = validateCustomer.validate(fullCustomer);

    if (!result.isValid) {
//       console.error('Customer validation errors:', result.errors);
    }

    // This test will fail initially since no implementation exists
    // It will pass once the Customer implementation is created
    expect(result.isValid).toBe(true);
  });

  test('should reject invalid customer data', () => {
    const invalidCustomer = {
      name: '', // Invalid: empty name
      type: 'invalid_type', // Invalid: not in enum
      status: 'invalid_status', // Invalid: not in enum
      serviceAddress: {
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'US',
        // Missing required street1
      },
      // Missing required id, createdAt, updatedAt, version
    };

    const result = validateCustomer.validate(invalidCustomer);

    // This test should pass - we want to reject invalid data
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should validate customer type enum values', () => {
    const enumValues = ['residential', 'commercial', 'industrial', 'municipal'];

    enumValues.forEach((type) => {
      const customer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Customer',
        type,
        status: 'active',
        serviceAddress: {
          street1: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zipCode: '12345',
          country: 'US',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      const result = validateCustomer.validate(customer);
      expect(result.isValid).toBe(true);
    });
  });

  test('should validate customer status enum values', () => {
    const statusValues = ['active', 'inactive', 'suspended', 'pending'];

    statusValues.forEach((status) => {
      const customer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Customer',
        type: 'commercial',
        status,
        serviceAddress: {
          street1: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zipCode: '12345',
          country: 'US',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      const result = validateCustomer.validate(customer);
      expect(result.isValid).toBe(true);
    });
  });
});
