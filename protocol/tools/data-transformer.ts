/**
 * @fileoverview Data transformation utilities for REFUSE Protocol legacy system migration
 * @description Comprehensive tools for transforming legacy waste management data into REFUSE Protocol format
 * @version 1.0.0
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, extname } from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

/**
 * REFUSE Protocol Data Transformation Engine
 * Transforms legacy system data into REFUSE Protocol compliant structures
 */
export class DataTransformer {
  private fieldMappings: Map<string, FieldMapping[]> = new Map();
  private transformers: Map<string, LegacyTransformer> = new Map();
  private transformationMetrics: Map<string, TransformationMetrics> = new Map();
  private outputDir: string;

  constructor(options: DataTransformerOptions = {}) {
    this.outputDir = resolve(options.outputDir || './transformed-data');

    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    // Initialize built-in transformers
    this.initializeTransformers();
  }

  /**
   * Load field mappings from configuration file
   */
  loadFieldMappings(configPath: string): void {
    if (!existsSync(configPath)) {
      throw new Error(`Field mappings configuration not found: ${configPath}`);
    }

    try {
      // REMOVED UNUSED:       const configContent = readFileSync(configPath, 'utf8');
      // REMOVED UNUSED:       const config = JSON.parse(configContent) as FieldMappingConfig;

      for (const [entityType, mappings] of Object.entries(config)) {
        this.fieldMappings.set(entityType, mappings);
      }

      console.log(
        chalk.green(`✅ Loaded field mappings for ${this.fieldMappings.size} entity types`)
      );
    } catch (error) {
      throw new Error(
        `Failed to load field mappings: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Transform a single legacy data record to REFUSE Protocol format
   */
  transformRecord(legacyData: Record<string, any>, entityType: string): TransformationResult {
    // REMOVED UNUSED:     const startTime = Date.now();

    try {
      // REMOVED UNUSED:       const transformer = this.transformers.get(entityType);
      if (!transformer) {
        throw new Error(`No transformer available for entity type: ${entityType}`);
      }

      // REMOVED UNUSED:       const mappings = this.fieldMappings.get(entityType);
      if (!mappings) {
        throw new Error(`No field mappings configured for entity type: ${entityType}`);
      }

      // Apply field mappings
      const transformedData: Record<string, any> = this.applyFieldMappings(legacyData, mappings);

      // Apply entity-specific transformations
      // REMOVED UNUSED:       const finalData = transformer.transform(legacyData, transformedData);

      // Add metadata
      const result = {
        ...finalData,
        id: finalData.id || uuidv4(),
        externalIds: finalData.externalIds || [legacyData.id || legacyData.legacy_id],
        metadata: {
          ...finalData.metadata,
          transformationSource: 'legacy-system',
          originalEntityType: entityType,
          transformationDate: new Date().toISOString(),
          legacySystemFields: Object.keys(legacyData).filter(
            (key) => !mappings.some((m) => m.source === key)
          ),
        },
        createdAt: finalData.createdAt || new Date().toISOString(),
        updatedAt: finalData.updatedAt || new Date().toISOString(),
        version: finalData.version || 1,
      };

      // REMOVED UNUSED:       const transformationTime = Date.now() - startTime;

      // Update metrics
      this.updateTransformationMetrics(entityType, true, transformationTime);

      return {
        success: true,
        data: result,
        transformationTime,
        warnings: [],
        metadata: {
          sourceEntityType: entityType,
          targetEntityType: entityType,
          transformationRulesApplied: mappings.length,
          fieldsMapped: mappings.length,
          fieldsPreserved: Object.keys(legacyData).length - mappings.length,
        },
      };
    } catch (error) {
      // REMOVED UNUSED:       const transformationTime = Date.now() - startTime;
      this.updateTransformationMetrics(entityType, false, transformationTime);

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
        transformationTime,
        metadata: {
          sourceEntityType: entityType,
          targetEntityType: entityType,
          transformationRulesApplied: 0,
          fieldsMapped: 0,
          fieldsPreserved: 0,
        },
      };
    }
  }

  /**
   * Transform a batch of legacy data records
   */
  transformBatch(data: any[], entityType: string): BatchTransformationResult {
    const results: TransformationResult[] = [];
    // REMOVED UNUSED:     let totalTransformationTime = 0;
    // REMOVED UNUSED:     let successfulTransformations = 0;
    // REMOVED UNUSED:     let failedTransformations = 0;
    const warnings: string[] = [];

    console.log(chalk.blue(`🔄 Transforming ${data.length} ${entityType} records...`));

    for (let i = 0; i < data.length; i++) {
      // REMOVED UNUSED:       const item = data[i];
      // REMOVED UNUSED:       const result = this.transformRecord(item, entityType);

      results.push(result);
      totalTransformationTime += result.transformationTime;

      if (result.success) {
        successfulTransformations++;
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      } else {
        failedTransformations++;
      }

      // Progress indicator for large batches
      if ((i + 1) % 100 === 0 || i + 1 === data.length) {
        // REMOVED UNUSED:         const progress = (((i + 1) / data.length) * 100).toFixed(1);
        console.log(
          chalk.gray(
            `  Progress: ${i + 1}/${data.length} (${progress}%) - ✅ ${successfulTransformations} ❌ ${failedTransformations}`
          )
        );
      }
    }

    // REMOVED UNUSED:     const successRate = data.length > 0 ? (successfulTransformations / data.length) * 100 : 0;
    // REMOVED UNUSED:     const averageTime = data.length > 0 ? totalTransformationTime / data.length : 0;

    console.log(
      chalk.green(
        `✅ Batch transformation complete: ${successfulTransformations}/${data.length} successful (${successRate.toFixed(1)}%)`
      )
    );

    return {
      totalRecords: data.length,
      successfulTransformations,
      failedTransformations,
      successRate,
      totalTransformationTime,
      averageTransformationTime: averageTime,
      results,
      warnings: [...new Set(warnings)],
      summary: {
        transformationsPerSecond: averageTime > 0 ? 1000 / averageTime : 0,
        totalWarnings: warnings.length,
        entityType,
      },
    };
  }

  /**
   * Transform data from file (CSV, JSON, etc.)
   */
  async transformFromFile(
    filePath: string,
    entityType: string
  ): Promise<BatchTransformationResult> {
    if (!existsSync(filePath)) {
      throw new Error(`Input file not found: ${filePath}`);
    }

    // REMOVED UNUSED:     const fileExtension = extname(filePath).toLowerCase();

    console.log(chalk.blue(`📁 Reading data from ${filePath} (${fileExtension})`));

    let data: any[] = [];

    try {
      if (fileExtension === '.csv') {
        data = this.readCSVFile(filePath);
      } else if (fileExtension === '.json') {
        data = this.readJSONFile(filePath);
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      console.log(chalk.green(`✅ Read ${data.length} records from ${filePath}`));

      return await this.transformBatch(data, entityType);
    } catch (error) {
      throw new Error(
        `Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Save transformed data to file
   */
  saveTransformedData(results: BatchTransformationResult, outputFileName?: string): string {
    // REMOVED UNUSED:     const successfulResults = results.results.filter((r) => r.success && r.data);

    if (successfulResults.length === 0) {
      throw new Error('No successful transformations to save');
    }

    const outputFile =
      outputFileName || `${results.summary.entityType}-transformed-${Date.now()}.json`;
    // REMOVED UNUSED:     const outputPath = join(this.outputDir, outputFile);

    // REMOVED UNUSED:     const transformedData = successfulResults.map((r) => r.data);

    try {
      writeFileSync(outputPath, JSON.stringify(transformedData, null, 2), 'utf8');
      console.log(
        chalk.green(`💾 Saved ${transformedData.length} transformed records to ${outputPath}`)
      );

      return outputPath;
    } catch (error) {
      throw new Error(
        `Failed to save transformed data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate transformation report
   */
  generateTransformationReport(results: BatchTransformationResult): string {
    // REMOVED UNUSED:     const reportPath = join(this.outputDir, `transformation-report-${Date.now()}.md`);

    const report = `# REFUSE Protocol Data Transformation Report

## Overview

**Entity Type**: ${results.summary.entityType}
**Transformation Date**: ${new Date().toISOString()}

## Summary Statistics

- **Total Records Processed**: ${results.totalRecords}
- **Successful Transformations**: ${results.successfulTransformations}
- **Failed Transformations**: ${results.failedTransformations}
- **Success Rate**: ${results.successRate.toFixed(2)}%
- **Total Processing Time**: ${results.totalTransformationTime}ms
- **Average Time per Record**: ${results.averageTransformationTime.toFixed(2)}ms
- **Transformations per Second**: ${results.summary.transformationsPerSecond.toFixed(2)}

## Error Analysis

### Failed Records

${results.results
  .filter((r) => !r.success)
  .map(
    (result, index) => `#### Record ${index + 1}
- **Error**: ${result.error}
- **Processing Time**: ${result.transformationTime}ms
`
  )
  .join('\n')}

### Warnings

${
  results.warnings.length > 0
    ? results.warnings.map((warning) => `- ${warning}`).join('\n')
    : 'No warnings generated'
}

## Performance Metrics

### Transformation Speed
- **Peak TPS**: ${results.summary.transformationsPerSecond.toFixed(2)}
- **Average TPS**: ${(1000 / results.averageTransformationTime).toFixed(2)}
- **Total Throughput**: ${results.totalRecords} records in ${results.totalTransformationTime}ms

### Success Distribution
- **Success Rate**: ${results.successRate.toFixed(2)}%
- **Error Rate**: ${(100 - results.successRate).toFixed(2)}%
- **Warning Rate**: ${results.warnings.length > 0 ? ((results.warnings.length / results.totalRecords) * 100).toFixed(2) : '0.00'}%

## Recommendations

${this.generateRecommendations(results)}

---

*Generated by REFUSE Protocol Data Transformer v1.0.0*
`;

    writeFileSync(reportPath, report, 'utf8');
    console.log(chalk.green(`📊 Generated transformation report: ${reportPath}`));

    return reportPath;
  }

  /**
   * Get transformation metrics for an entity type
   */
  getTransformationMetrics(entityType: string): TransformationMetrics | null {
    return this.transformationMetrics.get(entityType) || null;
  }

  /**
   * Get all transformation metrics
   */
  getAllMetrics(): Map<string, TransformationMetrics> {
    return new Map(this.transformationMetrics);
  }

  /**
   * Apply field mappings to legacy data
   */
  private applyFieldMappings(
    legacyData: Record<string, any>,
    mappings: FieldMapping[]
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const mapping of mappings) {
      if (mapping.source in legacyData) {
        // REMOVED UNUSED:         const value = legacyData[mapping.source];

        if (mapping.transform) {
          // Apply transformation function if specified
          try {
            result[mapping.target] = mapping.transform(value, legacyData);
          } catch (error) {
            console.warn(
              chalk.yellow(
                `⚠️ Transformation failed for field ${mapping.target}: ${error instanceof Error ? error.message : String(error)}`
              )
            );
            result[mapping.target] = value; // Fallback to original value
          }
        } else {
          result[mapping.target] = value;
        }
      } else if (mapping.required) {
        throw new Error(`Required field ${mapping.source} not found in legacy data`);
      }
    }

    return result;
  }

  /**
   * Read CSV file
   */
  private readCSVFile(filePath: string): any[] {
    // REMOVED UNUSED:     const content = readFileSync(filePath, 'utf8');
    return csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  /**
   * Read JSON file
   */
  private readJSONFile(filePath: string): any[] {
    // REMOVED UNUSED:     const content = readFileSync(filePath, 'utf8');

    if (content.trim().startsWith('[')) {
      // Array of objects
      return JSON.parse(content);
    } else {
      // Single object
      return [JSON.parse(content)];
    }
  }

  /**
   * Initialize built-in transformers
   */
  private initializeTransformers(): void {
    // Customer transformer
    this.transformers.set('customer', new CustomerTransformer());

    // Service transformer
    this.transformers.set('service', new ServiceTransformer());

    // Route transformer
    this.transformers.set('route', new RouteTransformer());

    // Facility transformer
    this.transformers.set('facility', new FacilityTransformer());

    // Add more transformers as needed
  }

  /**
   * Update transformation metrics
   */
  private updateTransformationMetrics(
    entityType: string,
    success: boolean,
    transformationTime: number
  ): void {
    const existingMetrics = this.transformationMetrics.get(entityType) || {
      totalTransformations: 0,
      successfulTransformations: 0,
      failedTransformations: 0,
      totalTransformationTime: 0,
      averageTransformationTime: 0,
    };

    existingMetrics.totalTransformations++;
    existingMetrics.totalTransformationTime += transformationTime;
    existingMetrics.averageTransformationTime =
      existingMetrics.totalTransformationTime / existingMetrics.totalTransformations;

    if (success) {
      existingMetrics.successfulTransformations++;
    } else {
      existingMetrics.failedTransformations++;
    }

    this.transformationMetrics.set(entityType, existingMetrics);
  }

  /**
   * Generate recommendations based on transformation results
   */
  private generateRecommendations(results: BatchTransformationResult): string {
    const recommendations: string[] = [];

    if (results.successRate < 90) {
      recommendations.push(
        '- **Review field mappings**: Low success rate suggests field mapping issues'
      );
      recommendations.push('- **Check data quality**: Failed records may have data quality issues');
      recommendations.push(
        '- **Add error handling**: Implement fallback strategies for common errors'
      );
    }

    if (results.averageTransformationTime > 100) {
      recommendations.push(
        '- **Optimize transformations**: Slow transformation suggests complex mapping logic'
      );
      recommendations.push(
        '- **Batch processing**: Consider processing records in smaller batches'
      );
    }

    if (results.warnings.length > results.totalRecords * 0.1) {
      recommendations.push(
        '- **Address warnings**: High warning count suggests data inconsistencies'
      );
      recommendations.push('- **Review transformation rules**: Some mappings may need adjustment');
    }

    if (recommendations.length === 0) {
      return '✅ No specific recommendations. Transformation completed successfully.';
    }

    return recommendations.map((rec) => rec).join('\n');
  }
}

/**
 * Data transformer options
 */
export interface DataTransformerOptions {
  outputDir?: string;
  batchSize?: number;
  errorHandling?: 'strict' | 'lenient' | 'skip';
  preserveUnknownFields?: boolean;
}

/**
 * Field mapping configuration
 */
export interface FieldMappingConfig {
  [entityType: string]: FieldMapping[];
}

/**
 * Field mapping definition
 */
export interface FieldMapping {
  source: string;
  target: string;
  required?: boolean;
  transform?: (value: any, record: Record<string, any>) => any;
  defaultValue?: any;
  validator?: (value: any) => boolean;
}

/**
 * Transformation result interface
 */
export interface TransformationResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  transformationTime: number;
  warnings?: string[];
  metadata: {
    sourceEntityType: string;
    targetEntityType: string;
    transformationRulesApplied: number;
    fieldsMapped: number;
    fieldsPreserved: number;
  };
}

/**
 * Batch transformation result interface
 */
export interface BatchTransformationResult {
  totalRecords: number;
  successfulTransformations: number;
  failedTransformations: number;
  successRate: number;
  totalTransformationTime: number;
  averageTransformationTime: number;
  results: TransformationResult[];
  warnings: string[];
  summary: {
    transformationsPerSecond: number;
    totalWarnings: number;
    entityType: string;
  };
}

/**
 * Transformation metrics interface
 */
export interface TransformationMetrics {
  totalTransformations: number;
  successfulTransformations: number;
  failedTransformations: number;
  totalTransformationTime: number;
  averageTransformationTime: number;
}

/**
 * Base transformer interface
 */
export interface LegacyTransformer {
  transform(legacyData: Record<string, any>, mappedData: Record<string, any>): Record<string, any>;
}

/**
 * Customer data transformer
 */
export class CustomerTransformer implements LegacyTransformer {
  transform(legacyData: Record<string, any>, mappedData: Record<string, any>): Record<string, any> {
    // Transform legacy customer data to REFUSE Protocol format
    // REMOVED UNUSED:     const transformed = { ...mappedData };

    // Handle common legacy field patterns
    if (legacyData.customer_type) {
      transformed.type = this.mapLegacyCustomerType(legacyData.customer_type);
    }

    if (legacyData.status) {
      transformed.status = this.mapLegacyCustomerStatus(legacyData.status);
    }

    // Normalize contact information
    if (legacyData.phone || legacyData.phone_number) {
      transformed.contactInformation = {
        ...transformed.contactInformation,
        phone: legacyData.phone || legacyData.phone_number,
      };
    }

    // Handle multiple addresses
    if (legacyData.addresses && Array.isArray(legacyData.addresses)) {
      const primaryAddress =
        legacyData.addresses.find((addr: any) => addr.primary) || legacyData.addresses[0];
      if (primaryAddress) {
        transformed.serviceAddress = this.transformLegacyAddress(primaryAddress);
      }
    }

    return transformed;
  }

  private mapLegacyCustomerType(legacyType: string): string {
    const typeMap: Record<string, string> = {
      residential: 'residential',
      commercial: 'commercial',
      industrial: 'industrial',
      municipal: 'municipal',
      res: 'residential',
      comm: 'commercial',
      ind: 'industrial',
      muni: 'municipal',
    };
    return typeMap[legacyType.toLowerCase()] || 'commercial';
  }

  private mapLegacyCustomerStatus(legacyStatus: string): string {
    const statusMap: Record<string, string> = {
      active: 'active',
      inactive: 'inactive',
      suspended: 'inactive',
      pending: 'pending',
      approved: 'active',
      act: 'active',
      inact: 'inactive',
      susp: 'inactive',
    };
    return statusMap[legacyStatus.toLowerCase()] || 'active';
  }

  private transformLegacyAddress(legacyAddress: any): Record<string, any> {
    return {
      street1: legacyAddress.address1 || legacyAddress.street1 || legacyAddress.address,
      street2: legacyAddress.address2 || legacyAddress.street2,
      city: legacyAddress.city,
      state: legacyAddress.state || legacyAddress.province,
      zipCode: legacyAddress.zip || legacyAddress.zipcode || legacyAddress.postal_code,
      country: legacyAddress.country || 'US',
    };
  }
}

/**
 * Service data transformer
 */
export class ServiceTransformer implements LegacyTransformer {
  transform(legacyData: Record<string, any>, mappedData: Record<string, any>): Record<string, any> {
    // REMOVED UNUSED:     const transformed = { ...mappedData };

    // Transform service type
    if (legacyData.service_type) {
      transformed.serviceType = this.mapLegacyServiceType(legacyData.service_type);
    }

    // Transform container type
    if (legacyData.container_type) {
      transformed.containerType = this.mapLegacyContainerType(legacyData.container_type);
    }

    // Transform schedule information
    if (legacyData.schedule || legacyData.pickup_schedule) {
      transformed.schedule = this.transformLegacySchedule(
        legacyData.schedule || legacyData.pickup_schedule
      );
    }

    return transformed;
  }

  private mapLegacyServiceType(legacyType: string): string {
    const typeMap: Record<string, string> = {
      waste: 'waste',
      garbage: 'waste',
      trash: 'waste',
      recycling: 'recycling',
      recycle: 'recycling',
      organics: 'organics',
      compost: 'organics',
      yard_waste: 'organics',
      hazardous: 'hazardous',
      hazmat: 'hazardous',
      bulk: 'bulk',
      large_item: 'bulk',
    };
    return typeMap[legacyType.toLowerCase()] || 'waste';
  }

  private mapLegacyContainerType(legacyType: string): string {
    const typeMap: Record<string, string> = {
      cart: 'cart',
      bin: 'bin',
      dumpster: 'dumpster',
      container: 'dumpster',
      rolloff: 'rolloff',
      roll_off: 'rolloff',
      compactor: 'compactor',
    };
    return typeMap[legacyType.toLowerCase()] || 'dumpster';
  }

  private transformLegacySchedule(legacySchedule: any): Record<string, any> {
    if (typeof legacySchedule === 'string') {
      // Parse schedule string (e.g., "weekly-monday")
      return this.parseScheduleString(legacySchedule);
    } else if (typeof legacySchedule === 'object') {
      return this.transformScheduleObject(legacySchedule);
    }

    return {};
  }

  private parseScheduleString(scheduleStr: string): Record<string, any> {
    // REMOVED UNUSED:     const parts = scheduleStr.toLowerCase().split('-');
    if (parts.length >= 2) {
      return {
        frequency: parts[0],
        dayOfWeek: parts[1],
        startDate: new Date().toISOString().split('T')[0], // Default to today
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 year
      };
    }

    return {};
  }

  private transformScheduleObject(scheduleObj: any): Record<string, any> {
    return {
      frequency: scheduleObj.frequency || 'weekly',
      dayOfWeek: scheduleObj.day || scheduleObj.day_of_week,
      startDate: scheduleObj.start_date || new Date().toISOString().split('T')[0],
      endDate:
        scheduleObj.end_date ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  }
}

/**
 * Route data transformer
 */
export class RouteTransformer implements LegacyTransformer {
  transform(legacyData: Record<string, any>, mappedData: Record<string, any>): Record<string, any> {
    // REMOVED UNUSED:     const transformed = { ...mappedData };

    // Transform route schedule
    if (legacyData.route_schedule || legacyData.schedule) {
      transformed.schedule = this.transformLegacyRouteSchedule(
        legacyData.route_schedule || legacyData.schedule
      );
    }

    // Transform assigned sites
    if (legacyData.assigned_sites || legacyData.sites) {
      transformed.assignedSites = this.transformLegacyAssignedSites(
        legacyData.assigned_sites || legacyData.sites
      );
    }

    return transformed;
  }

  private transformLegacyRouteSchedule(legacySchedule: any): Record<string, any> {
    if (typeof legacySchedule === 'string') {
      return this.parseRouteScheduleString(legacySchedule);
    } else if (typeof legacySchedule === 'object') {
      return this.transformRouteScheduleObject(legacySchedule);
    }

    return {};
  }

  private parseRouteScheduleString(scheduleStr: string): Record<string, any> {
    // REMOVED UNUSED:     const parts = scheduleStr.toLowerCase().split('-');
    if (parts.length >= 3) {
      return {
        frequency: parts[0],
        dayOfWeek: parts[1],
        startTime: parts[2].replace(':', ''),
        endTime: parts[3] ? parts[3].replace(':', '') : '1700',
      };
    }

    return {};
  }

  private transformRouteScheduleObject(scheduleObj: any): Record<string, any> {
    return {
      frequency: scheduleObj.frequency || 'weekly',
      dayOfWeek: scheduleObj.day_of_week || scheduleObj.day,
      startTime: scheduleObj.start_time || '0600',
      endTime: scheduleObj.end_time || '1700',
    };
  }

  private transformLegacyAssignedSites(legacySites: any): string[] {
    if (Array.isArray(legacySites)) {
      return legacySites.map((site: any) => {
        if (typeof site === 'string') {
          return site;
        } else if (typeof site === 'object' && site.id) {
          return site.id;
        }
        return String(site);
      });
    } else if (typeof legacySites === 'string') {
      return legacySites.split(',').map((s) => s.trim());
    }

    return [];
  }
}

/**
 * Facility data transformer
 */
export class FacilityTransformer implements LegacyTransformer {
  transform(legacyData: Record<string, any>, mappedData: Record<string, any>): Record<string, any> {
    // REMOVED UNUSED:     const transformed = { ...mappedData };

    // Transform facility type
    if (legacyData.facility_type) {
      transformed.type = this.mapLegacyFacilityType(legacyData.facility_type);
    }

    // Transform status
    if (legacyData.status) {
      transformed.status = this.mapLegacyFacilityStatus(legacyData.status);
    }

    // Transform operating hours
    if (legacyData.operating_hours || legacyData.hours) {
      transformed.operatingHours = this.transformLegacyOperatingHours(
        legacyData.operating_hours || legacyData.hours
      );
    }

    return transformed;
  }

  private mapLegacyFacilityType(legacyType: string): string {
    const typeMap: Record<string, string> = {
      landfill: 'landfill',
      mrf: 'mrf',
      transfer: 'transfer',
      transfer_station: 'transfer',
      composter: 'composter',
      compost: 'composter',
      export: 'export',
      cad: 'cad',
      incinerator: 'incinerator',
      recycling_center: 'recycling_center',
      material_recovery_facility: 'mrf',
      transfer_station: 'transfer',
    };
    return typeMap[legacyType.toLowerCase()] || 'landfill';
  }

  private mapLegacyFacilityStatus(legacyStatus: string): string {
    const statusMap: Record<string, string> = {
      operational: 'operational',
      active: 'operational',
      maintenance: 'maintenance',
      closed: 'closed',
      planned: 'planned',
      limited: 'limited',
      op: 'operational',
      maint: 'maintenance',
      cls: 'closed',
    };
    return statusMap[legacyStatus.toLowerCase()] || 'operational';
  }

  private transformLegacyOperatingHours(legacyHours: any): Record<string, any> {
    const operatingHours: Record<string, any> = {};

    if (typeof legacyHours === 'string') {
      // Parse hours string (e.g., "Mon-Fri 6AM-5PM, Sat 7AM-12PM")
      return this.parseHoursString(legacyHours);
    } else if (typeof legacyHours === 'object') {
      // Transform hours object
      for (const [day, hours] of Object.entries(legacyHours)) {
        operatingHours[day.toLowerCase()] = this.transformDayHours(hours);
      }
    }

    return operatingHours;
  }

  private parseHoursString(hoursStr: string): Record<string, any> {
    // Simple parsing - would need more sophisticated logic for complex schedules
    const operatingHours: Record<string, any> = {};

    // Default to standard business hours if parsing fails
    operatingHours.monday = { open: '06:00', close: '17:00' };
    operatingHours.tuesday = { open: '06:00', close: '17:00' };
    operatingHours.wednesday = { open: '06:00', close: '17:00' };
    operatingHours.thursday = { open: '06:00', close: '17:00' };
    operatingHours.friday = { open: '06:00', close: '17:00' };
    operatingHours.saturday = { open: '07:00', close: '12:00' };
    operatingHours.sunday = { closed: true };

    return operatingHours;
  }

  private transformDayHours(dayHours: any): Record<string, any> {
    if (typeof dayHours === 'string') {
      // REMOVED UNUSED:       const parts = dayHours.split('-');
      if (parts.length === 2) {
        return {
          open: parts[0].trim(),
          close: parts[1].trim(),
        };
      }
    } else if (typeof dayHours === 'object') {
      return {
        open: dayHours.open || dayHours.start,
        close: dayHours.close || dayHours.end,
      };
    }

    return { closed: true };
  }
}

/**
 * CLI interface for data transformation
 */
export class DataTransformerCLI {
  private transformer: DataTransformer;

  constructor(options?: DataTransformerOptions) {
    this.transformer = new DataTransformer(options);
  }

  async run(args: string[]): Promise<void> {
    // REMOVED UNUSED:     const command = args[0];

    switch (command) {
      case 'transform':
        await this.transformCommand(args.slice(1));
        break;
      case 'batch':
        await this.batchTransformCommand(args.slice(1));
        break;
      case 'report':
        this.reportCommand(args.slice(1));
        break;
      case 'validate':
        this.validateCommand(args.slice(1));
        break;
      default:
        this.printUsage();
    }
  }

  private async transformCommand(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.error('Usage: transform <entity-type> <input-file> [output-file]');
      process.exit(1);
    }

    const [entityType, inputFile, outputFile] = args;

    try {
      // Load field mappings if available
      // REMOVED UNUSED:       const mappingFile = `${entityType}-mappings.json`;
      if (existsSync(mappingFile)) {
        this.transformer.loadFieldMappings(mappingFile);
      }

      // Transform data
      // REMOVED UNUSED:       const results = await this.transformer.transformFromFile(inputFile, entityType);

      // Save transformed data
      // REMOVED UNUSED:       const savedPath = this.transformer.saveTransformedData(results, outputFile);

      // Generate report
      this.transformer.generateTransformationReport(results);

      console.log(chalk.green(`✅ Transformation complete!`));
      console.log(chalk.blue(`📁 Output saved to: ${savedPath}`));
    } catch (error) {
      console.error(
        chalk.red(
          `❌ Transformation failed: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  }

  private async batchTransformCommand(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.error('Usage: batch <config-file> <input-directory>');
      process.exit(1);
    }

    const [configFile, inputDir] = args;

    try {
      // Load batch configuration
      // REMOVED UNUSED:       const config = JSON.parse(readFileSync(configFile, 'utf8'));

      console.log(
        chalk.blue(
          `🔄 Starting batch transformation with ${Object.keys(config).length} entity types`
        )
      );

      for (const [entityType, config] of Object.entries(config)) {
        // REMOVED UNUSED:         const entityConfig = config as any;

        if (entityConfig.enabled && entityConfig.inputFile) {
          console.log(chalk.gray(`Processing ${entityType}...`));

          // Load field mappings
          if (entityConfig.mappingFile) {
            this.transformer.loadFieldMappings(entityConfig.mappingFile);
          }

          // Transform data
          const results = await this.transformer.transformFromFile(
            entityConfig.inputFile,
            entityType
          );

          // Save transformed data
          this.transformer.saveTransformedData(results, entityConfig.outputFile);

          // Generate report
          this.transformer.generateTransformationReport(results);
        }
      }

      console.log(chalk.green('✅ Batch transformation complete!'));
    } catch (error) {
      console.error(
        chalk.red(
          `❌ Batch transformation failed: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  }

  private reportCommand(args: string[]): void {
    // REMOVED UNUSED:     const metrics = this.transformer.getAllMetrics();

    console.log(chalk.blue('\n📊 REFUSE Protocol Data Transformation Metrics'));
    console.log(chalk.gray('='.repeat(50)));

    if (metrics.size === 0) {
      console.log(
        chalk.yellow('⚠️ No transformation metrics available. Run some transformations first.')
      );
      return;
    }

    for (const [entityType, metric] of metrics) {
      console.log(chalk.green(`\n📋 ${entityType.toUpperCase()} METRICS:`));
      console.log(chalk.gray(`  Total Transformations: ${metric.totalTransformations}`));
      console.log(chalk.green(`  ✅ Successful: ${metric.successfulTransformations}`));
      console.log(chalk.red(`  ❌ Failed: ${metric.failedTransformations}`));
      console.log(
        chalk.yellow(
          `  📈 Success Rate: ${((metric.successfulTransformations / metric.totalTransformations) * 100).toFixed(2)}%`
        )
      );
      console.log(chalk.gray(`  ⏱️ Avg Time: ${metric.averageTransformationTime.toFixed(2)}ms`));
    }
  }

  private validateCommand(args: string[]): void {
    if (args.length < 2) {
      console.error('Usage: validate <mapping-file> <sample-data>');
      process.exit(1);
    }

    const [mappingFile, sampleData] = args;

    try {
      // Load field mappings
      this.transformer.loadFieldMappings(mappingFile);

      // Load sample data
      // REMOVED UNUSED:       const data = JSON.parse(readFileSync(sampleData, 'utf8'));

      // Test transformation
      // REMOVED UNUSED:       const entityType = Object.keys(JSON.parse(readFileSync(mappingFile, 'utf8')))[0];
      // REMOVED UNUSED:       const result = this.transformer.transformRecord(data, entityType);

      if (result.success) {
        console.log(chalk.green('✅ Validation successful!'));
        console.log(chalk.blue('📋 Transformed data preview:'));
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.log(chalk.red('❌ Validation failed:'));
        console.log(chalk.red(result.error));
      }
    } catch (error) {
      console.error(
        chalk.red(`❌ Validation failed: ${error instanceof Error ? error.message : String(error)}`)
      );
      process.exit(1);
    }
  }

  private printUsage(): void {
    console.log(chalk.blue('\nREFUSE Protocol Data Transformer'));
    console.log(chalk.gray('Usage: data-transformer <command> [options]\n'));

    console.log(chalk.green('Commands:'));
    console.log(
      '  transform <entity-type> <input-file> [output-file]    Transform single entity type'
    );
    console.log(
      '  batch <config-file> <input-directory>                 Batch transform multiple entities'
    );
    console.log(
      '  report                                                Show transformation metrics'
    );
    console.log(
      '  validate <mapping-file> <sample-data>                 Validate transformation setup\n'
    );

    console.log(chalk.green('Examples:'));
    console.log(
      '  data-transformer transform customer ./data/customers.csv customers-transformed.json'
    );
    console.log('  data-transformer batch ./batch-config.json ./legacy-data/');
    console.log('  data-transformer report');
    console.log(
      '  data-transformer validate ./mappings/customer-mappings.json ./sample-customer.json\n'
    );

    console.log(chalk.green('Configuration Files:'));
    console.log('  Field mappings: JSON file with source->target field mappings');
    console.log('  Batch config: JSON file specifying files and options for each entity type\n');
  }
}

/**
 * Export factory functions
 */
export function createDataTransformer(options?: DataTransformerOptions): DataTransformer {
  return new DataTransformer(options);
}

export function createDataTransformerCLI(options?: DataTransformerOptions): DataTransformerCLI {
  return new DataTransformerCLI(options);
}

// Export types
export type {
  DataTransformerOptions,
  FieldMappingConfig,
  FieldMapping,
  TransformationResult,
  BatchTransformationResult,
  TransformationMetrics,
  LegacyTransformer,
};
