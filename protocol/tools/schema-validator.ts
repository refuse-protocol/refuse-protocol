/**
 * @fileoverview JSON Schema validation engine for REFUSE Protocol
 * @description Comprehensive schema validation with detailed error reporting, performance metrics, and protocol conformance checking
 * @version 1.0.0
 */

// REMOVED UNUSED IMPORT: // REMOVED UNUSED: import { readFileSync, existsSync } from 'fs';
// REMOVED UNUSED IMPORT: // REMOVED UNUSED: import { join, dirname, resolve } from 'path';
import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import { JSONSchema7 } from 'json-schema';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

/**
 * REFUSE Protocol Schema Validation Engine
 * Provides comprehensive validation of protocol data against JSON schemas with detailed error reporting
 */
export class SchemaValidator {
  private ajv: Ajv;
  private schemas: Map<string, ValidateFunction> = new Map();
  private schemaCache: Map<string, JSONSchema7> = new Map();
  private validationMetrics: Map<string, ValidationMetrics> = new Map();

  constructor(options: SchemaValidatorOptions = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      strict: options.strict ?? false,
      verbose: options.verbose ?? true,
      code: { esm: true },
      schemas: options.preloadSchemas ? this.loadPredefinedSchemas() : [],
    });

    // Add format support
    addFormats(this.ajv);
    addErrors(this.ajv);

    // Add custom keywords for REFUSE Protocol
    this.addCustomKeywords();

    // Add meta schema support
    this.ajv.addMetaSchema(require('ajv/dist/refs/json-schema-draft-07.json'));
  }

  /**
   * Load a schema from file path
   */
  async loadSchema(schemaPath: string): Promise<ValidateFunction> {
    // REMOVED UNUSED:     const absolutePath = resolve(schemaPath);

    if (this.schemas.has(absolutePath)) {
      return this.schemas.get(absolutePath)!;
    }

    if (!existsSync(absolutePath)) {
      throw new Error(`Schema file not found: ${absolutePath}`);
    }

    try {
      // REMOVED UNUSED:       const schemaContent = readFileSync(absolutePath, 'utf8');
      // REMOVED UNUSED:       const schema = JSON.parse(schemaContent) as JSONSchema7;

      // Validate schema itself first
      // REMOVED UNUSED:       const isValidSchema = this.ajv.validateSchema(schema);
      if (!isValidSchema) {
        throw new Error(`Invalid schema definition in ${absolutePath}: ${this.ajv.errorsText()}`);
      }

      // Compile the schema
      // REMOVED UNUSED:       const validate = this.ajv.compile(schema);
      this.schemas.set(absolutePath, validate);
      this.schemaCache.set(absolutePath, schema);

      return validate;
    } catch (error) {
      throw new Error(
        `Failed to load schema from ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load all schemas from contracts directory
   */
  async loadAllSchemas(contractsDir: string): Promise<void> {
    // REMOVED UNUSED:     const contractsPath = resolve(contractsDir);

    if (!existsSync(contractsPath)) {
      throw new Error(`Contracts directory not found: ${contractsPath}`);
    }

    const schemaFiles = [
      'customer-schema.json',
      'service-schema.json',
      'event-schema.json',
      'territory-schema.json',
      'route-schema.json',
      'facility-schema.json',
      'customer-request-schema.json',
      'material-ticket-schema.json',
      'contract-schema.json',
      'fleet-schema.json',
      'container-schema.json',
      'payment-schema.json',
      'allocation-schema.json',
      'yard-schema.json',
      'site-schema.json',
      'order-schema.json',
      'material-schema.json',
    ];

// CONSOLE:     console.log(chalk.blue('🔍 Loading REFUSE Protocol schemas...'));

    for (const schemaFile of schemaFiles) {
      // REMOVED UNUSED:       const schemaPath = join(contractsPath, schemaFile);
      try {
        await this.loadSchema(schemaPath);
// CONSOLE:         console.log(chalk.green(`✅ Loaded ${schemaFile}`));
      } catch (error) {
// CONSOLE:         console.warn(
          chalk.yellow(
            `⚠️ Failed to load ${schemaFile}: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    }

// CONSOLE:     console.log(chalk.green(`✅ Loaded ${this.schemas.size} schemas successfully`));
  }

  /**
   * Validate data against a schema
   */
  validate<T = any>(schemaPath: string, data: T): ValidationResult<T> {
    // REMOVED UNUSED:     const startTime = Date.now();
    // REMOVED UNUSED:     const validate = this.schemas.get(resolve(schemaPath));

    if (!validate) {
      throw new Error(`Schema not loaded: ${schemaPath}. Call loadSchema() first.`);
    }

    // REMOVED UNUSED:     const isValid = validate(data);

    // REMOVED UNUSED:     const validationTime = Date.now() - startTime;
    // REMOVED UNUSED:     const metricsKey = resolve(schemaPath);

    // Update metrics
    const existingMetrics = this.validationMetrics.get(metricsKey) || {
      totalValidations: 0,
      validCount: 0,
      invalidCount: 0,
      totalValidationTime: 0,
      averageValidationTime: 0,
    };

    existingMetrics.totalValidations++;
    existingMetrics.totalValidationTime += validationTime;
    existingMetrics.averageValidationTime =
      existingMetrics.totalValidationTime / existingMetrics.totalValidations;

    if (isValid) {
      existingMetrics.validCount++;
    } else {
      existingMetrics.invalidCount++;
    }

    this.validationMetrics.set(metricsKey, existingMetrics);

    // REMOVED UNUSED:     const errors = validate.errors || [];
    // REMOVED UNUSED:     const detailedErrors = this.processValidationErrors(errors);

    return {
      isValid,
      errors: detailedErrors,
      errorCount: errors.length,
      validationTime,
      schemaPath: resolve(schemaPath),
      metadata: {
        dataType: typeof data,
        dataSize: JSON.stringify(data).length,
        schemaVersion: this.getSchemaVersion(schemaPath),
      },
    };
  }

  /**
   * Validate multiple data items against a schema
   */
  validateBatch<T = any>(schemaPath: string, dataArray: T[]): BatchValidationResult<T> {
    const results: ValidationResult<T>[] = [];
    // REMOVED UNUSED:     let totalValidationTime = 0;
    // REMOVED UNUSED:     let totalErrors = 0;

    for (const data of dataArray) {
      // REMOVED UNUSED:       const result = this.validate(schemaPath, data);
      results.push(result);
      totalValidationTime += result.validationTime;
      totalErrors += result.errorCount;
    }

    // REMOVED UNUSED:     const validCount = results.filter((r) => r.isValid).length;
    // REMOVED UNUSED:     const invalidCount = results.length - validCount;

    return {
      totalItems: dataArray.length,
      validCount,
      invalidCount,
      totalErrors,
      totalValidationTime,
      averageValidationTime: totalValidationTime / dataArray.length,
      results,
      summary: {
        successRate: (validCount / dataArray.length) * 100,
        errorRate: (invalidCount / dataArray.length) * 100,
        averageErrorsPerInvalid: invalidCount > 0 ? totalErrors / invalidCount : 0,
      },
    };
  }

  /**
   * Get validation metrics for a schema
   */
  getValidationMetrics(schemaPath: string): ValidationMetrics | null {
    return this.validationMetrics.get(resolve(schemaPath)) || null;
  }

  /**
   * Get all validation metrics
   */
  getAllMetrics(): Map<string, ValidationMetrics> {
    return new Map(this.validationMetrics);
  }

  /**
   * Generate validation report
   */
  generateReport(): ValidationReport {
    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      totalSchemas: this.schemas.size,
      totalValidations: 0,
      totalValid: 0,
      totalInvalid: 0,
      schemaMetrics: {},
    };

    for (const [schemaPath, metrics] of this.validationMetrics) {
      report.totalValidations += metrics.totalValidations;
      report.totalValid += metrics.validCount;
      report.totalInvalid += metrics.invalidCount;

      report.schemaMetrics[schemaPath] = {
        ...metrics,
        successRate:
          metrics.totalValidations > 0 ? (metrics.validCount / metrics.totalValidations) * 100 : 0,
      };
    }

    return report;
  }

  /**
   * Validate schema conformance across the protocol
   */
  async validateProtocolConformance(dataDir: string): Promise<ProtocolConformanceResult> {
    const conformance: ProtocolConformanceResult = {
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
      results: {},
      summary: {
        overallSuccessRate: 0,
        totalErrors: 0,
        errorsByType: {},
      },
    };

    // This would scan the data directory and validate all JSON files
    // Implementation would depend on the specific structure
    // For now, return a basic structure

    return conformance;
  }

  /**
   * Add custom keywords for REFUSE Protocol
   */
  private addCustomKeywords(): void {
    // Add custom keyword for UUID validation
    this.ajv.addKeyword({
      keyword: 'isUUID',
      validate: (schema: any, data: string) => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return typeof data === 'string' && uuidRegex.test(data);
      },
      error: { message: 'must be a valid UUID' },
    });

    // Add custom keyword for geographic coordinates
    this.ajv.addKeyword({
      keyword: 'isGeoCoordinate',
      validate: (schema: any, data: number[]) => {
        return (
          Array.isArray(data) &&
          data.length >= 2 &&
          data[0] >= -180 &&
          data[0] <= 180 &&
          data[1] >= -90 &&
          data[1] <= 90
        );
      },
      error: { message: 'must be a valid geographic coordinate [longitude, latitude]' },
    });

    // Add custom keyword for positive monetary values
    this.ajv.addKeyword({
      keyword: 'isPositiveMoney',
      validate: (schema: any, data: number) => {
        return typeof data === 'number' && data >= 0 && Number.isFinite(data);
      },
      error: { message: 'must be a positive finite number' },
    });
  }

  /**
   * Load predefined schemas for the REFUSE Protocol
   */
  private loadPredefinedSchemas(): JSONSchema7[] {
    // This would load the base schemas that are commonly used
    // For now, return empty array as schemas are loaded from files
    return [];
  }

  /**
   * Process validation errors into detailed format
   */
  private processValidationErrors(errors: ErrorObject[]): DetailedValidationError[] {
    return errors.map((error) => ({
      id: uuidv4(),
      message: error.message || 'Unknown validation error',
      path: error.instancePath || '/',
      keyword: error.keyword,
      schemaPath: error.schemaPath,
      params: error.params,
      data: error.data,
      severity: this.determineErrorSeverity(error),
      suggestion: this.generateErrorSuggestion(error),
      category: this.categorizeError(error),
    }));
  }

  /**
   * Determine error severity level
   */
  private determineErrorSeverity(error: ErrorObject): 'error' | 'warning' | 'info' {
    // REMOVED UNUSED:     const criticalKeywords = ['required', 'type', 'enum'];
    // REMOVED UNUSED:     const warningKeywords = ['minLength', 'maxLength', 'pattern', 'format'];

    if (criticalKeywords.includes(error.keyword)) return 'error';
    if (warningKeywords.includes(error.keyword)) return 'warning';
    return 'info';
  }

  /**
   * Generate suggestions for fixing validation errors
   */
  private generateErrorSuggestion(error: ErrorObject): string {
    switch (error.keyword) {
      case 'required':
        return `Add the missing required property: ${error.params.missingProperty}`;
      case 'type':
        return `Change the data type to: ${error.params.type}`;
      case 'enum':
        return `Value must be one of: ${error.params.allowedValues?.join(', ')}`;
      case 'minLength':
        return `Minimum length required: ${error.params.limit}`;
      case 'maxLength':
        return `Maximum length allowed: ${error.params.limit}`;
      case 'pattern':
        return `Value must match the required pattern`;
      case 'format':
        return `Value must be in format: ${error.params.format}`;
      default:
        return 'Review the value against the schema requirements';
    }
  }

  /**
   * Categorize error by type
   */
  private categorizeError(error: ErrorObject): string {
    if (error.instancePath.startsWith('/id')) return 'identity';
    if (error.instancePath.includes('address')) return 'location';
    if (error.instancePath.includes('price') || error.instancePath.includes('cost'))
      return 'financial';
    if (error.instancePath.includes('date') || error.instancePath.includes('time'))
      return 'temporal';
    if (error.instancePath.includes('compliance') || error.instancePath.includes('regulation'))
      return 'regulatory';
    return 'data';
  }

  /**
   * Get schema version
   */
  private getSchemaVersion(schemaPath: string): string {
    // REMOVED UNUSED:     const schema = this.schemaCache.get(resolve(schemaPath));
    return schema?.version || 'unknown';
  }
}

/**
 * Schema validator configuration options
 */
export interface SchemaValidatorOptions {
  strict?: boolean;
  verbose?: boolean;
  preloadSchemas?: boolean;
}

/**
 * Validation result interface
 */
export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: DetailedValidationError[];
  errorCount: number;
  validationTime: number;
  schemaPath: string;
  metadata: {
    dataType: string;
    dataSize: number;
    schemaVersion: string;
  };
}

/**
 * Batch validation result interface
 */
export interface BatchValidationResult<T = any> {
  totalItems: number;
  validCount: number;
  invalidCount: number;
  totalErrors: number;
  totalValidationTime: number;
  averageValidationTime: number;
  results: ValidationResult<T>[];
  summary: {
    successRate: number;
    errorRate: number;
    averageErrorsPerInvalid: number;
  };
}

/**
 * Detailed validation error interface
 */
export interface DetailedValidationError {
  id: string;
  message: string;
  path: string;
  keyword: string;
  schemaPath: string;
  params: Record<string, any>;
  data: any;
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
  category: string;
}

/**
 * Validation metrics interface
 */
export interface ValidationMetrics {
  totalValidations: number;
  validCount: number;
  invalidCount: number;
  totalValidationTime: number;
  averageValidationTime: number;
  successRate?: number;
}

/**
 * Validation report interface
 */
export interface ValidationReport {
  timestamp: string;
  totalSchemas: number;
  totalValidations: number;
  totalValid: number;
  totalInvalid: number;
  schemaMetrics: Record<string, ValidationMetrics & { successRate: number }>;
}

/**
 * Protocol conformance result interface
 */
export interface ProtocolConformanceResult {
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  results: Record<string, ValidationResult>;
  summary: {
    overallSuccessRate: number;
    totalErrors: number;
    errorsByType: Record<string, number>;
  };
}

/**
 * CLI interface for schema validation
 */
export class SchemaValidatorCLI {
  private validator: SchemaValidator;

  constructor() {
    this.validator = new SchemaValidator({ verbose: true });
  }

  /**
   * Run validation from command line arguments
   */
  async run(args: string[]): Promise<void> {
    // REMOVED UNUSED:     const command = args[0];

    switch (command) {
      case 'validate':
        await this.validateCommand(args.slice(1));
        break;
      case 'batch':
        await this.batchCommand(args.slice(1));
        break;
      case 'report':
        this.reportCommand();
        break;
      case 'conformance':
        await this.conformanceCommand(args.slice(1));
        break;
      default:
        this.printUsage();
    }
  }

  /**
   * Validate single file
   */
  private async validateCommand(args: string[]): Promise<void> {
    if (args.length < 2) {
// CONSOLE:       console.error('Usage: validate <schema> <data-file>');
      process.exit(1);
    }

    const [schemaPath, dataFile] = args;

    try {
      // Load schema
      await this.validator.loadSchema(schemaPath);

      // Read and parse data file
      if (!existsSync(dataFile)) {
        throw new Error(`Data file not found: ${dataFile}`);
      }

      // REMOVED UNUSED:       const dataContent = readFileSync(dataFile, 'utf8');
      // REMOVED UNUSED:       const data = JSON.parse(dataContent);

      // Validate
      // REMOVED UNUSED:       const result = this.validator.validate(schemaPath, data);

      this.printValidationResult(result);
    } catch (error) {
// CONSOLE:       console.error(
        chalk.red(`❌ Validation failed: ${error instanceof Error ? error.message : String(error)}`)
      );
      process.exit(1);
    }
  }

  /**
   * Batch validate multiple files
   */
  private async batchCommand(args: string[]): Promise<void> {
    if (args.length < 2) {
// CONSOLE:       console.error('Usage: batch <schema> <data-directory>');
      process.exit(1);
    }

    const [schemaPath, dataDir] = args;

    try {
      await this.validator.loadSchema(schemaPath);

      // This would scan the directory for JSON files
      // For now, just demonstrate the interface
// CONSOLE:       console.log(chalk.blue(`🔍 Batch validation for ${dataDir} against ${schemaPath}`));
// CONSOLE:       console.log(chalk.yellow('⚠️ Batch validation implementation pending'));
    } catch (error) {
// CONSOLE:       console.error(
        chalk.red(
          `❌ Batch validation failed: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  }

  /**
   * Generate validation report
   */
  private reportCommand(): void {
    // REMOVED UNUSED:     const report = this.validator.generateReport();
// CONSOLE:     console.log(chalk.blue('\n📊 REFUSE Protocol Validation Report'));
// CONSOLE:     console.log(chalk.gray(`Generated: ${report.timestamp}\n`));

// CONSOLE:     console.log(chalk.green(`✅ Schemas Loaded: ${report.totalSchemas}`));
// CONSOLE:     console.log(chalk.green(`🔍 Total Validations: ${report.totalValidations}`));
// CONSOLE:     console.log(chalk.green(`✅ Valid: ${report.totalValid}`));
// CONSOLE:     console.log(chalk.red(`❌ Invalid: ${report.totalInvalid}`));
// CONSOLE:     console.log(
      chalk.yellow(
        `📈 Success Rate: ${((report.totalValid / report.totalValidations) * 100).toFixed(2)}%\n`
      )
    );

    if (report.totalValidations === 0) {
// CONSOLE:       console.log(chalk.yellow('⚠️ No validation data available. Run some validations first.'));
      return;
    }

// CONSOLE:     console.log(chalk.blue('📋 Schema Performance:'));
    for (const [schemaPath, metrics] of Object.entries(report.schemaMetrics)) {
      // REMOVED UNUSED:       const schemaName = schemaPath.split('/').pop();
// CONSOLE:       console.log(chalk.gray(`  ${schemaName}:`));
// CONSOLE:       console.log(chalk.green(`    ✅ Success Rate: ${metrics.successRate.toFixed(2)}%`));
// CONSOLE:       console.log(chalk.gray(`    🔍 Validations: ${metrics.totalValidations}`));
// CONSOLE:       console.log(chalk.gray(`    ⏱️ Avg Time: ${metrics.averageValidationTime.toFixed(2)}ms`));
    }
  }

  /**
   * Run protocol conformance check
   */
  private async conformanceCommand(args: string[]): Promise<void> {
    if (args.length < 1) {
// CONSOLE:       console.error('Usage: conformance <data-directory>');
      process.exit(1);
    }

    const [dataDir] = args;

    try {
// CONSOLE:       console.log(chalk.blue(`🔍 Running protocol conformance check on ${dataDir}`));

      // REMOVED UNUSED:       const result = await this.validator.validateProtocolConformance(dataDir);
// CONSOLE:       console.log(chalk.yellow('⚠️ Protocol conformance implementation pending'));
    } catch (error) {
// CONSOLE:       console.error(
        chalk.red(
          `❌ Conformance check failed: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  }

  /**
   * Print validation result
   */
  private printValidationResult(result: ValidationResult): void {
// CONSOLE:     console.log(chalk.blue('\n🔍 Validation Result'));
// CONSOLE:     console.log(chalk.gray(`Schema: ${result.schemaPath}`));
// CONSOLE:     console.log(chalk.gray(`Time: ${result.validationTime}ms`));
// CONSOLE:     console.log(chalk.gray(`Data Size: ${result.metadata.dataSize} bytes\n`));

    if (result.isValid) {
// CONSOLE:       console.log(chalk.green('✅ VALIDATION PASSED'));
      return;
    }

// CONSOLE:     console.log(chalk.red(`❌ VALIDATION FAILED (${result.errorCount} errors)\n`));

// CONSOLE:     console.log(chalk.yellow('🔧 Detailed Errors:'));
    result.errors.forEach((error, index) => {
      const severityColor =
        error.severity === 'error'
          ? chalk.red
          : error.severity === 'warning'
            ? chalk.yellow
            : chalk.blue;

// CONSOLE:       console.log(severityColor(`  ${index + 1}. ${error.message}`));
// CONSOLE:       console.log(chalk.gray(`     Path: ${error.path}`));
// CONSOLE:       console.log(chalk.gray(`     Type: ${error.category} | Severity: ${error.severity}`));
// CONSOLE:       console.log(chalk.gray(`     Suggestion: ${error.suggestion}\n`));
    });
  }

  /**
   * Print usage information
   */
  private printUsage(): void {
// CONSOLE:     console.log(chalk.blue('\nREFUSE Protocol Schema Validator'));
// CONSOLE:     console.log(chalk.gray('Usage: schema-validator <command> [options]\n'));

// CONSOLE:     console.log(chalk.green('Commands:'));
// CONSOLE:     console.log('  validate <schema> <data-file>    Validate single file against schema');
// CONSOLE:     console.log('  batch <schema> <data-directory>  Batch validate all files in directory');
// CONSOLE:     console.log('  report                           Generate validation performance report');
// CONSOLE:     console.log('  conformance <data-directory>     Run protocol conformance check\n');

// CONSOLE:     console.log(chalk.green('Examples:'));
// CONSOLE:     console.log(
      '  schema-validator validate ./contracts/customer-schema.json ./data/customer.json'
    );
// CONSOLE:     console.log('  schema-validator batch ./contracts/route-schema.json ./data/routes/');
// CONSOLE:     console.log('  schema-validator report');
// CONSOLE:     console.log('  schema-validator conformance ./data/\n');
  }
}

/**
 * Export factory function for creating validator instances
 */
export function createSchemaValidator(options?: SchemaValidatorOptions): SchemaValidator {
  return new SchemaValidator(options);
}

/**
 * Export CLI factory function
 */
export function createSchemaValidatorCLI(): SchemaValidatorCLI {
  return new SchemaValidatorCLI();
}

// Export types for use in other modules
export type {
  SchemaValidatorOptions,
  ValidationResult,
  BatchValidationResult,
  DetailedValidationError,
  ValidationMetrics,
  ValidationReport,
  ProtocolConformanceResult,
};
