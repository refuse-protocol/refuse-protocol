/**
 * @fileoverview Schema validation test for Service entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { createValidator } from '../test-utils';

// Create the schema validator using shared utilities
const validateService = createValidator('service');

describe('Service Entity Schema Validation', () => {
  test('should validate basic service data structure', () => {
    const validService = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      customerId: '456e7890-e12b-34c5-b678-901234567890',
      serviceType: 'waste',
      containerType: 'dumpster',
      containerSize: '4_yard',
      frequency: 'weekly',
      serviceAddress: {
        street1: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        country: 'US'
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const isValid = validateService(validService);

    // This test will fail initially since no implementation exists
    // It will pass once the Service implementation is created
    expect(isValid).toBe(true);

    if (!isValid) {
      console.error('Validation errors:', validateService.errors);
    }
  });

  test('should validate service with all optional fields', () => {
    const fullService = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      customerId: '456e7890-e12b-34c5-b678-901234567890',
      externalIds: ['legacy-svc-001', 'old-system-svc-123'],
      serviceType: 'recycling',
      containerType: 'compactor',
      containerSize: '8_yard',
      frequency: 'biweekly',
      schedule: [{
        daysOfWeek: [2], // Tuesday
        startTime: '09:00',
        endTime: '17:00'
      }],
      serviceAddress: {
        street1: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        country: 'US'
      },
      nextServiceDate: '2024-09-29T09:00:00Z',
      lastServiceDate: '2024-09-15T09:00:00Z',
      specialLocationNotes: 'Pick up after 9 AM',
      pricing: {
        baseRate: 150.00,
        perPickupRate: 25.00,
        fuelSurcharge: 0.15,
        environmentalFee: 25.00
      },
      billingCycle: 'monthly',
      status: 'active',
      specialInstructions: 'Handle with care - contains hazardous materials',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    const isValid = validateService(fullService);

    // This test will fail initially since no implementation exists
    // It will pass once the Service implementation is created
    expect(isValid).toBe(true);

    if (!isValid) {
      console.error('Validation errors:', validateService.errors);
    }
  });

  test('should reject invalid service data', () => {
    const invalidService = {
      customerId: '', // Invalid: empty customerId
      serviceType: 'invalid_service_type', // Invalid: not in enum
      containerType: 'invalid_container_type', // Invalid: not in enum
      containerSize: 'invalid_size', // Invalid: not in enum
      frequency: 'invalid_frequency', // Invalid: not in enum
      serviceAddress: {
        street1: '', // Invalid: empty street1
        city: '', // Invalid: empty city
        state: 'X', // Invalid: too short
        zipCode: 'invalid', // Invalid: not valid zip
        country: 'USA' // Invalid: too long
      },
      status: 'invalid_status' // Invalid: not in enum
      // Missing required id, createdAt, updatedAt, version
    };

    const isValid = validateService(invalidService);

    // This test should pass - we want to reject invalid data
    expect(isValid).toBe(false);
    expect(validateService.errors?.length).toBeGreaterThan(0);
  });

  test('should validate service type enum values', () => {
    const serviceTypes = ['waste', 'recycling', 'organics', 'hazardous', 'bulk'];

    serviceTypes.forEach(serviceType => {
      const service = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '456e7890-e12b-34c5-b678-901234567890',
        serviceType,
        containerType: 'dumpster',
        containerSize: '4_yard',
        frequency: 'weekly',
        serviceAddress: {
          street1: '123 Main St',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75201',
          country: 'US'
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      const isValid = validateService(service);
      expect(isValid).toBe(true);
    });
  });

  test('should validate container type enum values', () => {
    const containerTypes = ['cart', 'dumpster', 'bin', 'rolloff', 'compactor'];

    containerTypes.forEach(containerType => {
      const service = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '456e7890-e12b-34c5-b678-901234567890',
        serviceType: 'waste',
        containerType,
        containerSize: '4_yard',
        frequency: 'weekly',
        serviceAddress: {
          street1: '123 Main St',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75201',
          country: 'US'
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      const isValid = validateService(service);
      expect(isValid).toBe(true);
    });
  });

  test('should validate frequency enum values', () => {
    const frequencies = ['weekly', 'biweekly', 'monthly', 'oncall', 'custom'];

    frequencies.forEach(frequency => {
      const service = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '456e7890-e12b-34c5-b678-901234567890',
        serviceType: 'waste',
        containerType: 'dumpster',
        containerSize: '4_yard',
        frequency,
        serviceAddress: {
          street1: '123 Main St',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75201',
          country: 'US'
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      const isValid = validateService(service);
      expect(isValid).toBe(true);
    });
  });
});
