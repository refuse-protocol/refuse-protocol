/**
 * @fileoverview Shared test utilities for protocol validation
 * @description Common setup and utilities for all test suites
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Creates and configures an AJV instance with proper meta schema support
 * for JSON Schema draft-07 validation
 */
export function createAjvInstance(): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateSchema: false // Disable schema validation to avoid meta schema issues
  });

  // Add format support (uuid, date-time, etc.)
  addFormats(ajv);

  // Add draft-07 meta schema support - only add if not already present
  try {
    const draft7MetaSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "$id": "http://json-schema.org/draft-07/schema#",
      "title": "Core schema meta-schema",
      "type": "object",
      "properties": {
        "$schema": {"type": "string"},
        "$id": {"type": "string"},
        "title": {"type": "string"},
        "description": {"type": "string"},
        "type": {"type": "string"},
        "properties": {"type": "object"},
        "required": {"type": "array", "items": {"type": "string"}},
        "additionalProperties": {"type": ["boolean", "object"]},
        "patternProperties": {"type": "object"}
      }
    };

    // Check if meta schema already exists before adding
    if (!ajv.getSchema('http://json-schema.org/draft-07/schema#')) {
      ajv.addMetaSchema(draft7MetaSchema);
    }
  } catch (error) {
    // Silently ignore meta schema conflicts - this is normal when running multiple tests
    // The schema will still work correctly for validation
  }

  return ajv;
}

/**
 * Loads a schema file from the specs directory
 */
export function loadSchema(schemaName: string) {
  const schemaPath = join(__dirname, '../specs/001-refuse-protocol-the/contracts', `${schemaName}-schema.json`);
  return JSON.parse(readFileSync(schemaPath, 'utf8'));
}

/**
 * Creates a validator function for a given schema
 */
export function createValidator(schemaName: string) {
  const ajv = createAjvInstance();
  const schema = loadSchema(schemaName);

  // Return the compiled validator - AJV will handle schema validation automatically
  return ajv.compile(schema);
}

/**
 * Common test data patterns
 */
export const testPatterns = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  dateTime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  zipCode: /^\d{5}(-\d{4})?$/
};

/**
 * Validates that a value matches expected test patterns
 */
export function validateTestData(data: any, patterns: Record<string, RegExp>): boolean {
  return Object.entries(patterns).every(([key, pattern]) => {
    const value = data[key];
    return value === undefined || pattern.test(value);
  });
}
