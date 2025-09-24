/**
 * @fileoverview Schema validation test for Service entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load the service schema
const serviceSchema = JSON.parse(
  readFileSync(join(__dirname, '../../specs/001-refuse-protocol-the/contracts/service-schema.json'), 'utf8')
);

// Compile the schema validator
const validateService = ajv.compile(serviceSchema);

describe('Service Entity Schema Validation', () => {
  test('should validate basic service data structure', () => {
    const validService = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      customerId: '456e7890-e12b-34c5-b678-901234567890',
      siteId: '789e0123-e45b-67c8-d901-234567890123',
      serviceType: 'waste',
      containerType: 'dumpster',
      schedule: {
        frequency: 'weekly',
        dayOfWeek: 'monday',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
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
      externalIds: ['legacy-svc-001', 'old-system-svc-123'],
      customerId: '456e7890-e12b-34c5-b678-901234567890',
      siteId: '789e0123-e45b-67c8-d901-234567890123',
      serviceType: 'recycling',
      containerType: 'compactor',
      containerSize: '8_cubic_yards',
      quantity: 2,
      schedule: {
        frequency: 'bi_weekly',
        dayOfWeek: 'tuesday',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        holidays: ['2024-12-25', '2024-01-01'],
        specialInstructions: 'Pick up after 9 AM'
      },
      pricing: {
        baseRate: 150.00,
        rateUnit: 'month',
        fuelSurcharge: 0.15,
        environmentalFee: 25.00,
        disposalFee: 75.00,
        totalRate: 250.00
      },
      status: 'active',
      serviceStartDate: '2024-01-15',
      serviceEndDate: '2024-12-31',
      contractId: 'contract-123',
      routeId: 'route-456',
      specialInstructions: 'Handle with care - contains hazardous materials',
      serviceArea: {
        territoryId: 'territory-789',
        zone: 'commercial',
        priority: 'standard'
      },
      performance: {
        onTimePercentage: 98.5,
        averagePickupTime: '08:30',
        lastServiceDate: '2024-09-15',
        nextServiceDate: '2024-09-29'
      },
      compliance: {
        environmentalRequirements: ['no_leakage', 'proper_containment'],
        safetyRequirements: ['safety_equipment', 'trained_personnel'],
        regulatoryRequirements: ['epa_compliant', 'local_permits']
      },
      metadata: {
        legacySystemId: 'SVC-001',
        customField1: 'Custom Value',
        customField2: 42,
        syncStatus: 'synced',
        lastSyncDate: new Date().toISOString(),
        originalFieldNames: ['service_number', 'service_type'],
        transformationNotes: 'Migrated from legacy system'
      },
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
      schedule: {
        frequency: 'invalid_frequency' // Invalid: not in enum
      }
      // Missing required id, siteId, status, createdAt, updatedAt, version
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
        siteId: '789e0123-e45b-67c8-d901-234567890123',
        serviceType,
        containerType: 'dumpster',
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 'monday',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
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
        siteId: '789e0123-e45b-67c8-d901-234567890123',
        serviceType: 'waste',
        containerType,
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 'monday',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
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

  test('should validate schedule frequency enum values', () => {
    const frequencies = ['weekly', 'bi_weekly', 'monthly', 'on_call', 'one_time'];

    frequencies.forEach(frequency => {
      const service = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '456e7890-e12b-34c5-b678-901234567890',
        siteId: '789e0123-e45b-67c8-d901-234567890123',
        serviceType: 'waste',
        containerType: 'dumpster',
        schedule: {
          frequency,
          dayOfWeek: 'monday',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
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
