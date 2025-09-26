/**
 * @fileoverview Simplified schema validation for GitHub Actions
 * @description Basic file existence and structure validation for CI/CD
 * @version 1.0.0
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

/**
 * Simplified Schema Validator for GitHub Actions
 * Checks for essential protocol files and structure
 */
export class SchemaValidator {
  constructor(options: SchemaValidatorOptions = {}) {
    // Simplified constructor - just for compatibility
  }

  /**
   * Simplified validation that just checks file existence
   */
  async validateProtocolSchemas(): Promise<{ valid: boolean; errors: string[] }> {
    console.log(chalk.blue('🔍 Validating REFUSE Protocol Schemas...'));

    const errors: string[] = [];

    try {
      // Check for basic protocol structure
      const protocolDir = resolve('protocol');
      const specificationsDir = resolve('protocol/specifications');

      if (!existsSync(protocolDir)) {
        errors.push('Protocol directory not found');
      }

      if (!existsSync(specificationsDir)) {
        errors.push('Protocol specifications directory not found');
      }

      // Check for essential specification files
      const essentialSpecs = [
        'protocol/specifications/entities.ts',
        'protocol/specifications/relationships.ts'
      ];

      for (const spec of essentialSpecs) {
        if (!existsSync(spec)) {
          errors.push(`Missing essential specification file: ${spec}`);
        }
      }

      // Try to validate TypeScript compilation
      try {
        const { execSync } = require('child_process');
        execSync('npx tsc --noEmit protocol/specifications/*.ts', { stdio: 'pipe' });
        console.log(chalk.green('✅ TypeScript compilation successful'));
      } catch (tsError: any) {
        errors.push(`TypeScript compilation error: ${tsError.message || tsError.stdout?.toString() || 'Unknown error'}`);
      }

      const valid = errors.length === 0;

      if (valid) {
        console.log(chalk.green('✅ All schema validations passed'));
      } else {
        console.log(chalk.yellow(`⚠️ Found ${errors.length} schema validation errors:`));
        errors.forEach(error => console.log(chalk.gray(`  - ${error}`)));
      }

      return { valid, errors };
    } catch (error) {
      console.error(chalk.red(`❌ Schema validation failed: ${error instanceof Error ? error.message : String(error)}`));
      return { valid: false, errors: [`Schema validation error: ${error instanceof Error ? error.message : String(error)}`] };
    }
  }
}

/**
 * Main schema validation function called by workflows
 */
export async function validateProtocolSchemas(): Promise<{ valid: boolean; errors: string[] }> {
  const validator = new SchemaValidator();
  return validator.validateProtocolSchemas();
}
