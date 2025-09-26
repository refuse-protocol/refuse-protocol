/**
 * @fileoverview Schema validation test for Service entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { createValidator } from '../test-utils';
import { ServiceModel } from '../../protocol/implementations/service';

// Create the schema validator using shared utilities
const validateService = createValidator(ServiceModel);

describe('Service Entity Schema Validation', () => {
  test('should validate basic service data structure', () => {
    const validService = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      customerId: '456e7890-e12b-34c5-b678-901234567890',
      siteId: '789e0123-e45f-67g8-h901-234567890123',
      serviceType: 'waste',
      containerType: 'dumpster',
      containerSize: '4_yard',
      schedule: {
        frequency: 'weekly',
        startDate: '2024-01-15',
        dayOfWeek: 'monday',
        startTime: '08:00',
        endTime: '17:00',
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    const result = validateService.validate(validService);

    // This test will fail initially since no implementation exists
    // It will pass once the Service implementation is created
    expect(result.isValid).toBe(true);

    if (!result.isValid) {
//       console.error('Validation errors:', result.errors);
    }
  });

  test('should validate service with all optional fields', () => {
    const fullService = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      customerId: '456e7890-e12b-34c5-b678-901234567890',
      siteId: '789e0123-e45f-67g8-h901-234567890123',
      externalIds: ['legacy-svc-001', 'old-system-svc-123'],
      serviceType: 'recycling',
      containerType: 'compactor',
      containerSize: '8_yard',
      schedule: {
        frequency: 'bi_weekly',
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        dayOfWeek: 'tuesday',
        startTime: '09:00',
        endTime: '17:00',
      },
      pricing: {
        baseRate: 150.0,
        rateUnit: 'month',
        fuelSurcharge: 0.15,
        environmentalFee: 25.0,
      },
      status: 'active',
      serviceStartDate: '2024-09-25',
      serviceEndDate: '2024-12-31',
      contractId: 'contract-123',
      routeId: 'route-456',
      specialInstructions: 'Handle with care - contains hazardous materials',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    const result = validateService.validate(fullService);

    // This test will fail initially since no implementation exists
    // It will pass once the Service implementation is created
    expect(result.isValid).toBe(true);

    if (!result.isValid) {
//       console.error('Validation errors:', result.errors);
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
        country: 'USA', // Invalid: too long
      },
      status: 'invalid_status', // Invalid: not in enum
      // Missing required id, createdAt, updatedAt, version
    };

    const result = validateService.validate(invalidService);

    // This test should pass - we want to reject invalid data
    expect(result.isValid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  test('should validate service type enum values', () => {
    const serviceTypes = ['waste', 'recycling', 'organics', 'hazardous', 'bulk'];

    serviceTypes.forEach((serviceType) => {
      const service = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '456e7890-e12b-34c5-b678-901234567890',
        siteId: '789e0123-e45f-67g8-h901-234567890123',
        serviceType,
        containerType: 'dumpster',
        containerSize: '4_yard',
        schedule: {
          frequency: 'weekly',
          startDate: '2024-01-15',
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };

      const result = validateService.validate(service);
      expect(result.isValid).toBe(true);
    });
  });

  test('should validate container type enum values', () => {
    const containerTypes = ['cart', 'dumpster', 'bin', 'rolloff', 'compactor'];

    containerTypes.forEach((containerType) => {
      const service = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '456e7890-e12b-34c5-b678-901234567890',
        siteId: '789e0123-e45f-67g8-h901-234567890123',
        serviceType: 'waste',
        containerType,
        containerSize: '4_yard',
        schedule: {
          frequency: 'weekly',
          startDate: '2024-01-15',
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };

      const result = validateService.validate(service);
      expect(result.isValid).toBe(true);
    });
  });

  test('should validate frequency enum values', () => {
    const frequencies = ['weekly', 'bi_weekly', 'monthly', 'on_call', 'one_time'];

    frequencies.forEach((frequency) => {
      const service = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '456e7890-e12b-34c5-b678-901234567890',
        siteId: '789e0123-e45f-67g8-h901-234567890123',
        serviceType: 'waste',
        containerType: 'dumpster',
        containerSize: '4_yard',
        schedule: {
          frequency,
          startDate: '2024-01-15',
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };

      const result = validateService.validate(service);
      expect(result.isValid).toBe(true);
    });
  });
});
