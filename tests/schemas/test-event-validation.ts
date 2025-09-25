/**
 * @fileoverview Schema validation test for Event entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { createValidator } from '../test-utils';
import { EventModel } from '../../protocol/implementations/event';

// Create the schema validator using shared utilities
const validateEvent = createValidator(EventModel);

describe('Event Entity Schema Validation', () => {
  test('should validate basic event data structure', () => {
    const validEvent = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      entityType: 'customer',
      entityId: '456e7890-e12b-34c5-b678-901234567890',
      eventType: 'created',
      timestamp: new Date().toISOString(),
      sourceSystem: 'customer-portal',
      eventData: {
        customerOnboarded: {
          salesRepId: '123e4567-e89b-12d3-a456-426614174001',
          contractValue: 15000.0,
        },
      },
      createdAt: new Date().toISOString(),
      version: 1,
    };

    const result = validateEvent.validate(validEvent);

    if (!result.isValid) {
      console.error('Event validation errors:', result.errors);
    }

    expect(result.isValid).toBe(true);
  });

  test('should reject invalid event data', () => {
    const invalidEvent = {
      entityType: 'invalid_entity_type',
      entityId: 'not-a-uuid',
      eventType: 'invalid_event_type',
      timestamp: 'invalid-date',
      sourceSystem: '',
      // Missing required id, createdAt, version
    };

    const result = validateEvent.validate(invalidEvent);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
