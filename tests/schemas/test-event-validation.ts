/**
 * @fileoverview Schema validation test for Event entity
 * @description Tests MUST FAIL initially - no implementation exists yet
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load the event schema
const eventSchema = JSON.parse(
  readFileSync(join(__dirname, '../../specs/001-refuse-protocol-the/contracts/event-schema.json'), 'utf8')
);

// Compile the schema validator
const validateEvent = ajv.compile(eventSchema);

describe('Event Entity Schema Validation', () => {
  test('should validate basic event data structure', () => {
    const validEvent = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      entityType: 'customer',
      eventType: 'created',
      timestamp: new Date().toISOString(),
      eventData: {
        id: '456e7890-e12b-34c5-b678-901234567890',
        name: 'Test Customer',
        type: 'commercial'
      },
      version: 1
    };

    const isValid = validateEvent(validEvent);
    expect(isValid).toBe(true);

    if (!isValid) {
      console.error('Validation errors:', validateEvent.errors);
    }
  });

  test('should reject invalid event data', () => {
    const invalidEvent = {
      entityType: 'invalid_entity_type',
      eventType: 'invalid_event_type',
      timestamp: 'invalid-date'
      // Missing required id, eventData, version
    };

    const isValid = validateEvent(invalidEvent);
    expect(isValid).toBe(false);
    expect(validateEvent.errors?.length).toBeGreaterThan(0);
  });
});
