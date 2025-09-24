/**
 * @fileoverview Schema validation test for Customer entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Add JSON Schema draft support
ajv.addMetaSchema(require('ajv/dist/refs/json-schema-draft-07.json'));

// Load the customer schema
const customerSchema = JSON.parse(
  readFileSync(join(__dirname, '../../specs/001-refuse-protocol-the/contracts/customer-schema.json'), 'utf8')
);

// Add the schema to AJV
ajv.addSchema(customerSchema);

// Compile the schema validator
const validateCustomer = ajv.compile(customerSchema);

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
        country: 'US'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const isValid = validateCustomer(validCustomer);

    // This test will fail initially since no implementation exists
    // It will pass once the Customer implementation is created
    expect(isValid).toBe(true);

    if (!isValid) {
      console.error('Validation errors:', validateCustomer.errors);
    }
  });

  test('should validate customer with all optional fields', () => {
    const fullCustomer = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      externalIds: ['legacy-001', 'old-system-123'],
      name: 'Complete Customer Example Inc.',
      type: 'industrial',
      status: 'active',
      taxId: '12-3456789',
      primaryContact: {
        name: 'John Smith',
        title: 'Operations Manager',
        email: 'john.smith@example.com',
        phone: '+1-555-0123',
        mobile: '+1-555-0456'
      },
      billingContact: {
        name: 'Jane Doe',
        title: 'Accounts Payable',
        email: 'jane.doe@example.com',
        phone: '+1-555-0789'
      },
      serviceContacts: [
        {
          name: 'Mike Johnson',
          title: 'Site Manager',
          email: 'mike.johnson@example.com',
          phone: '+1-555-0321'
        }
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
          longitude: -96.7970
        }
      },
      billingAddress: {
        street1: '200 Commerce Street',
        city: 'Business District',
        state: 'TX',
        zipCode: '75002',
        country: 'US'
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
        transformationNotes: 'Migrated from legacy system'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const isValid = validateCustomer(fullCustomer);

    // This test will fail initially since no implementation exists
    // It will pass once the Customer implementation is created
    expect(isValid).toBe(true);

    if (!isValid) {
      console.error('Validation errors:', validateCustomer.errors);
    }
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
        country: 'US'
        // Missing required street1
      }
      // Missing required id, createdAt, updatedAt, version
    };

    const isValid = validateCustomer(invalidCustomer);

    // This test should pass - we want to reject invalid data
    expect(isValid).toBe(false);
    expect(validateCustomer.errors?.length).toBeGreaterThan(0);
  });

  test('should validate customer type enum values', () => {
    const enumValues = ['residential', 'commercial', 'industrial', 'municipal'];

    enumValues.forEach(type => {
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
          country: 'US'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      const isValid = validateCustomer(customer);
      expect(isValid).toBe(true);
    });
  });

  test('should validate customer status enum values', () => {
    const statusValues = ['active', 'inactive', 'suspended', 'pending'];

    statusValues.forEach(status => {
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
          country: 'US'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      const isValid = validateCustomer(customer);
      expect(isValid).toBe(true);
    });
  });
});
