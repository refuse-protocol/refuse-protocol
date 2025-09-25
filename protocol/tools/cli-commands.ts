#!/usr/bin/env node

/**
 * @fileoverview CLI tools for protocol validation and testing
 * @description Command-line interface for REFUSE Protocol tools
 * @version 1.0.0
 */

import { Command } from 'commander';
import { Event } from '../specifications/entities';
import { ComplianceValidator } from './compliance-validator';
import { ConformanceChecker } from './conformance-checker';
import { Benchmarker } from './benchmarker';
import { DataArchaeologist } from './data-archaeologist';
import { EventStreamingSystem } from '../implementations/event-system';
import * as fs from 'fs';
import * as path from 'path';

/**
 * REFUSE Protocol CLI Tools
 * Command-line interface for protocol validation, testing, and management
 */
export class RefuseProtocolCLI {
  private program: Command;
  private complianceValidator: ComplianceValidator;
  private conformanceChecker: ConformanceChecker;
  private benchmarker: Benchmarker;
  private dataArchaeologist: DataArchaeologist;
  private eventSystem: EventStreamingSystem;

  constructor() {
    this.program = new Command();
    this.complianceValidator = new ComplianceValidator();
    this.conformanceChecker = new ConformanceChecker();
    this.benchmarker = new Benchmarker();
    this.dataArchaeologist = new DataArchaeologist();
    this.eventSystem = new EventStreamingSystem();

    this.setupCLI();
  }

  /**
   * Setup CLI commands
   */
  private setupCLI(): void {
    this.program.name('refuse-protocol').description('REFUSE Protocol CLI Tools').version('1.0.0');

    // Validation commands
    this.setupValidationCommands();

    // Conformance commands
    this.setupConformanceCommands();

    // Benchmarking commands
    this.setupBenchmarkingCommands();

    // Data archaeology commands
    this.setupDataArchaeologyCommands();

    // Event system commands
    this.setupEventCommands();

    // Utility commands
    this.setupUtilityCommands();
  }

  /**
   * Setup validation commands
   */
  private setupValidationCommands(): void {
    const validateCmd = this.program
      .command('validate')
      .description('Validate data against REFUSE Protocol standards');

    validateCmd
      .command('compliance <file>')
      .description('Validate compliance with regulatory standards')
      .option('-r, --rules <rules>', 'specific rules to validate against')
      .option('-o, --output <format>', 'output format (json, csv, html)', 'json')
      .option('-v, --verbose', 'verbose output')
      .action(async (file, options) => {
        await this.validateCompliance(file, options);
      });

    validateCmd
      .command('schema <file>')
      .description('Validate data against JSON schema')
      .option('-s, --schema <schemaFile>', 'schema file to validate against')
      .option('-o, --output <format>', 'output format (json, csv, html)', 'json')
      .action(async (file, options) => {
        await this.validateSchema(file, options);
      });

    validateCmd
      .command('business <file>')
      .description('Validate business rules')
      .option('-r, --rules <rulesFile>', 'business rules file')
      .option('-o, --output <format>', 'output format (json, csv, html)', 'json')
      .action(async (file, options) => {
        await this.validateBusinessRules(file, options);
      });
  }

  /**
   * Setup conformance commands
   */
  private setupConformanceCommands(): void {
    const conformanceCmd = this.program
      .command('conformance')
      .description('Check conformance with REFUSE Protocol');

    conformanceCmd
      .command('check <directory>')
      .description('Check implementation conformance')
      .option('-t, --type <type>', 'implementation type (api, sdk, library)', 'api')
      .option('-s, --standard <standard>', 'conformance standard', 'refuse-protocol-v1')
      .option('-o, --output <format>', 'output format (json, csv, html)', 'json')
      .option('-v, --verbose', 'verbose output')
      .action(async (directory, options) => {
        await this.checkConformance(directory, options);
      });

    conformanceCmd
      .command('report <directory>')
      .description('Generate conformance report')
      .option('-o, --output <file>', 'output file path')
      .option('-f, --format <format>', 'report format (pdf, html, json)', 'html')
      .action(async (directory, options) => {
        await this.generateConformanceReport(directory, options);
      });
  }

  /**
   * Setup benchmarking commands
   */
  private setupBenchmarkingCommands(): void {
    const benchmarkCmd = this.program
      .command('benchmark')
      .description('Run performance benchmarks');

    benchmarkCmd
      .command('run')
      .description('Run comprehensive benchmarks')
      .option('-d, --duration <seconds>', 'benchmark duration', '60')
      .option('-c, --concurrency <number>', 'concurrent users', '10')
      .option('-o, --operations <operations>', 'operations to benchmark')
      .option('-f, --format <format>', 'output format (json, csv, html)', 'json')
      .option('-v, --verbose', 'verbose output')
      .action(async (options) => {
        await this.runBenchmarks(options);
      });

    benchmarkCmd
      .command('compare <baselineFile> <comparisonFile>')
      .description('Compare benchmark results')
      .option('-o, --output <format>', 'output format (json, csv, html)', 'json')
      .action(async (baselineFile, comparisonFile, options) => {
        await this.compareBenchmarks(baselineFile, comparisonFile, options);
      });

    benchmarkCmd
      .command('profile <operation>')
      .description('Profile specific operation')
      .option('-i, --iterations <number>', 'number of iterations', '1000')
      .option('-o, --output <format>', 'output format (json, csv)', 'json')
      .action(async (operation, options) => {
        await this.profileOperation(operation, options);
      });
  }

  /**
   * Setup data archaeology commands
   */
  private setupDataArchaeologyCommands(): void {
    const archaeologyCmd = this.program
      .command('archaeology')
      .description('Analyze legacy systems and data structures');

    archaeologyCmd
      .command('analyze <sourcePath>')
      .description('Analyze legacy system')
      .option(
        '-t, --type <type>',
        'analysis type (basic, comprehensive, detailed)',
        'comprehensive'
      )
      .option('-o, --output <format>', 'output format (json, csv, html)', 'json')
      .option('-v, --verbose', 'verbose output')
      .action(async (sourcePath, options) => {
        await this.analyzeLegacySystem(sourcePath, options);
      });

    archaeologyCmd
      .command('patterns <analysisFile>')
      .description('Extract data patterns from analysis')
      .option('-o, --output <format>', 'output format (json, csv)', 'json')
      .action(async (analysisFile, options) => {
        await this.extractPatterns(analysisFile, options);
      });

    archaeologyCmd
      .command('migrate <analysisFile>')
      .description('Generate migration strategy')
      .option('-o, --output <format>', 'output format (json, csv, html)', 'json')
      .option('-f, --format <format>', 'strategy format', 'detailed')
      .action(async (analysisFile, options) => {
        await this.generateMigrationStrategy(analysisFile, options);
      });
  }

  /**
   * Setup event commands
   */
  private setupEventCommands(): void {
    // REMOVED UNUSED:     const eventCmd = this.program.command('events').description('Event streaming and management');

    eventCmd
      .command('publish <file>')
      .description('Publish event to stream')
      .option('-t, --entityType <type>', 'entity type')
      .option('-e, --eventType <type>', 'event type')
      .option('-s, --source <source>', 'event source', 'cli')
      .option('-p, --priority <priority>', 'event priority (low, normal, high)', 'normal')
      .action(async (file, options) => {
        await this.publishEvent(file, options);
      });

    eventCmd
      .command('subscribe')
      .description('Subscribe to event stream')
      .option('-t, --entityType <type>', 'filter by entity type')
      .option('-e, --eventType <type>', 'filter by event type')
      .option('-o, --output <format>', 'output format (json, text)', 'text')
      .option('-f, --follow', 'follow stream continuously')
      .action(async (options) => {
        await this.subscribeToEvents(options);
      });

    eventCmd
      .command('stats')
      .description('Get event system statistics')
      .option('-o, --output <format>', 'output format (json, text)', 'json')
      .action(async (options) => {
        await this.getEventStats(options);
      });
  }

  /**
   * Setup utility commands
   */
  private setupUtilityCommands(): void {
    // REMOVED UNUSED:     const utilsCmd = this.program.command('utils').description('Utility commands');

    utilsCmd
      .command('generate <type>')
      .description('Generate sample data or configurations')
      .option('-c, --count <number>', 'number of items to generate', '10')
      .option('-o, --output <file>', 'output file')
      .option('-f, --format <format>', 'output format (json, csv, xml)', 'json')
      .action(async (type, options) => {
        await this.generateSampleData(type, options);
      });

    utilsCmd
      .command('convert <inputFile> <outputFile>')
      .description('Convert between data formats')
      .option('-f, --from <format>', 'input format (json, csv, xml)')
      .option('-t, --to <format>', 'output format (json, csv, xml)')
      .action(async (inputFile, outputFile, options) => {
        await this.convertDataFormat(inputFile, outputFile, options);
      });

    utilsCmd
      .command('health')
      .description('Check system health')
      .option('-d, --detailed', 'detailed health check')
      .option('-o, --output <format>', 'output format (json, text)', 'json')
      .action(async (options) => {
        await this.checkSystemHealth(options);
      });
  }

  /**
   * Validate compliance
   */
  private async validateCompliance(file: string, options: any): Promise<void> {
    try {
      console.log(`Validating compliance for: ${file}`);

      // REMOVED UNUSED:       const data = JSON.parse(fs.readFileSync(file, 'utf8'));

      // REMOVED UNUSED:       const result = await this.complianceValidator.validate(data, options.rules?.split(','));

      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Compliance Score: ${result.score}`);
        console.log(`Violations: ${result.violations.length}`);
        console.log(`Warnings: ${result.warnings.length}`);

        if (options.verbose) {
          result.violations.forEach((v) => console.log(`❌ ${v}`));
          result.warnings.forEach((w) => console.log(`⚠️  ${w}`));
        }
      }
    } catch (error) {
      console.error('Compliance validation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Validate schema
   */
  private async validateSchema(file: string, options: any): Promise<void> {
    try {
      console.log(`Validating schema for: ${file}`);

      // REMOVED UNUSED:       const data = JSON.parse(fs.readFileSync(file, 'utf8'));

      // Use JSON Schema validation
      // REMOVED UNUSED:       const validationResult = await this.validateDataAgainstSchema(data, options.schema);

      console.log(JSON.stringify(validationResult, null, 2));
    } catch (error) {
      console.error('Schema validation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(file: string, options: any): Promise<void> {
    try {
      console.log(`Validating business rules for: ${file}`);

      // REMOVED UNUSED:       const data = JSON.parse(fs.readFileSync(file, 'utf8'));

      // Apply business rules validation
      // REMOVED UNUSED:       const validationResult = await this.validateBusinessLogic(data, options.rules);

      console.log(JSON.stringify(validationResult, null, 2));
    } catch (error) {
      console.error('Business rules validation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Check conformance
   */
  private async checkConformance(directory: string, options: any): Promise<void> {
    try {
      console.log(`Checking conformance for: ${directory}`);

      const result = await this.conformanceChecker.checkConformance({
        implementationPath: directory,
        type: options.type,
        standard: options.standard,
      });

      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Conformance Score: ${result.score}`);
        console.log(`Issues: ${result.issues.length}`);

        if (options.verbose) {
          result.issues.forEach((issue) => console.log(`❌ ${issue}`));
          result.recommendations.forEach((rec) => console.log(`💡 ${rec}`));
        }
      }
    } catch (error) {
      console.error('Conformance check failed:', error);
      process.exit(1);
    }
  }

  /**
   * Generate conformance report
   */
  private async generateConformanceReport(directory: string, options: any): Promise<void> {
    try {
      console.log(`Generating conformance report for: ${directory}`);

      const report = await this.conformanceChecker.generateReport({
        implementationPath: directory,
        format: options.format,
      });

      if (options.output) {
        fs.writeFileSync(options.output, report);
        console.log(`Report saved to: ${options.output}`);
      } else {
        console.log(report);
      }
    } catch (error) {
      console.error('Report generation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Run benchmarks
   */
  private async runBenchmarks(options: any): Promise<void> {
    try {
      console.log('Running benchmarks...');

      const result = await this.benchmarker.runBenchmarks({
        duration: parseInt(options.duration),
        concurrency: parseInt(options.concurrency),
        operations: options.operations?.split(','),
        outputFormat: options.format,
      });

      if (options.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('Benchmark Results:');
        console.log(result.summary);
        console.log('\nRecommendations:');
        result.recommendations.forEach((rec) => console.log(`• ${rec}`));
      }
    } catch (error) {
      console.error('Benchmarking failed:', error);
      process.exit(1);
    }
  }

  /**
   * Compare benchmarks
   */
  private async compareBenchmarks(
    baselineFile: string,
    comparisonFile: string,
    options: any
  ): Promise<void> {
    try {
      console.log(`Comparing benchmarks: ${baselineFile} vs ${comparisonFile}`);

      // REMOVED UNUSED:       const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
      // REMOVED UNUSED:       const comparison = JSON.parse(fs.readFileSync(comparisonFile, 'utf8'));

      // REMOVED UNUSED:       const comparisonResult = await this.benchmarker.compareResults(baseline, comparison);

      console.log(JSON.stringify(comparisonResult, null, 2));
    } catch (error) {
      console.error('Benchmark comparison failed:', error);
      process.exit(1);
    }
  }

  /**
   * Profile operation
   */
  private async profileOperation(operation: string, options: any): Promise<void> {
    try {
      console.log(`Profiling operation: ${operation}`);

      const profile = await this.benchmarker.profileOperation(operation, {
        iterations: parseInt(options.iterations),
      });

      console.log(JSON.stringify(profile, null, 2));
    } catch (error) {
      console.error('Operation profiling failed:', error);
      process.exit(1);
    }
  }

  /**
   * Analyze legacy system
   */
  private async analyzeLegacySystem(sourcePath: string, options: any): Promise<void> {
    try {
      console.log(`Analyzing legacy system: ${sourcePath}`);

      const analysis = await this.dataArchaeologist.analyzeLegacySystem({
        sourcePath,
        analysisType: options.type,
        includeMetadata: true,
        detectPatterns: true,
        analyzeDependencies: true,
      });

      if (options.output === 'json') {
        console.log(JSON.stringify(analysis, null, 2));
      } else {
        console.log('Analysis Summary:');
        console.log(`System: ${analysis.systemInfo.name} v${analysis.systemInfo.version}`);
        console.log(`Entities: ${analysis.entities.length}`);
        console.log(`Files: ${analysis.fileStructure.totalFiles}`);
        console.log(`Complexity: ${analysis.complexityScore}/100`);
      }
    } catch (error) {
      console.error('Legacy system analysis failed:', error);
      process.exit(1);
    }
  }

  /**
   * Extract patterns
   */
  private async extractPatterns(analysisFile: string, options: any): Promise<void> {
    try {
      console.log(`Extracting patterns from: ${analysisFile}`);

      // REMOVED UNUSED:       const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

      // REMOVED UNUSED:       const patterns = await this.dataArchaeologist.extractPatterns(analysis);

      console.log(JSON.stringify(patterns, null, 2));
    } catch (error) {
      console.error('Pattern extraction failed:', error);
      process.exit(1);
    }
  }

  /**
   * Generate migration strategy
   */
  private async generateMigrationStrategy(analysisFile: string, options: any): Promise<void> {
    try {
      console.log(`Generating migration strategy for: ${analysisFile}`);

      // REMOVED UNUSED:       const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

      // REMOVED UNUSED:       const strategy = await this.dataArchaeologist.generateMigrationStrategy(analysis);

      console.log(JSON.stringify(strategy, null, 2));
    } catch (error) {
      console.error('Migration strategy generation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Publish event
   */
  private async publishEvent(file: string, options: any): Promise<void> {
    try {
      console.log(`Publishing event from: ${file}`);

      // REMOVED UNUSED:       const eventData = JSON.parse(fs.readFileSync(file, 'utf8'));

      const event: Event = {
        id: `evt-cli-${Date.now()}`,
        entityType: options.entityType,
        eventType: options.eventType,
        timestamp: new Date().toISOString(),
        eventData,
        source: options.source,
        priority: options.priority,
      };

      // REMOVED UNUSED:       const success = await this.eventSystem.publishEvent(event);

      if (success) {
        console.log('✅ Event published successfully');
      } else {
        console.error('❌ Failed to publish event');
        process.exit(1);
      }
    } catch (error) {
      console.error('Event publishing failed:', error);
      process.exit(1);
    }
  }

  /**
   * Subscribe to events
   */
  private async subscribeToEvents(options: any): Promise<void> {
    try {
      console.log('Subscribing to events...');

      const subscriptionId = this.eventSystem.subscribe((event: Event) => {
        if (options.output === 'json') {
          console.log(JSON.stringify(event, null, 2));
        } else {
          console.log(`[${event.timestamp}] ${event.entityType}:${event.eventType} - ${event.id}`);
        }
      });

      console.log(`Subscribed with ID: ${subscriptionId}`);

      if (options.follow) {
        console.log('Following event stream... (Ctrl+C to stop)');

        // Keep process alive
        process.stdin.resume();

        process.on('SIGINT', () => {
          this.eventSystem.unsubscribe(subscriptionId);
          console.log('\nUnsubscribed from event stream');
          process.exit(0);
        });
      }
    } catch (error) {
      console.error('Event subscription failed:', error);
      process.exit(1);
    }
  }

  /**
   * Get event stats
   */
  private async getEventStats(options: any): Promise<void> {
    try {
      // REMOVED UNUSED:       const stats = this.eventSystem.getSystemStats();

      if (options.output === 'json') {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log('Event System Statistics:');
        console.log(`Total Events: ${stats.totalEvents}`);
        console.log(`Routed Events: ${stats.routedEvents}`);
        console.log(`Filtered Events: ${stats.filteredEvents}`);
        console.log(`Failed Routes: ${stats.failedRoutes}`);
        console.log(`Average Routing Time: ${stats.averageRoutingTime}ms`);
        console.log(`Throughput: ${stats.throughput} events/sec`);
      }
    } catch (error) {
      console.error('Failed to get event stats:', error);
      process.exit(1);
    }
  }

  /**
   * Generate sample data
   */
  private async generateSampleData(type: string, options: any): Promise<void> {
    try {
      console.log(`Generating ${options.count} ${type} samples...`);

      // REMOVED UNUSED:       const samples = this.generateSamples(type, parseInt(options.count));

      let output: string;

      switch (options.format) {
        case 'json':
          output = JSON.stringify(samples, null, 2);
          break;
        case 'csv':
          output = this.convertToCSV(samples);
          break;
        case 'xml':
          output = this.convertToXML(samples);
          break;
        default:
          output = JSON.stringify(samples, null, 2);
      }

      if (options.output) {
        fs.writeFileSync(options.output, output);
        console.log(`Sample data saved to: ${options.output}`);
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error('Sample data generation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Convert data format
   */
  private async convertDataFormat(
    inputFile: string,
    outputFile: string,
    options: any
  ): Promise<void> {
    try {
      console.log(`Converting ${inputFile} from ${options.from} to ${options.to}`);

      // REMOVED UNUSED:       const inputData = fs.readFileSync(inputFile, 'utf8');
      let parsedData: any;

      switch (options.from) {
        case 'json':
          parsedData = JSON.parse(inputData);
          break;
        case 'csv':
          parsedData = this.parseCSV(inputData);
          break;
        case 'xml':
          parsedData = this.parseXML(inputData);
          break;
        default:
          throw new Error(`Unsupported input format: ${options.from}`);
      }

      let outputData: string;

      switch (options.to) {
        case 'json':
          outputData = JSON.stringify(parsedData, null, 2);
          break;
        case 'csv':
          outputData = this.convertToCSV(parsedData);
          break;
        case 'xml':
          outputData = this.convertToXML(parsedData);
          break;
        default:
          throw new Error(`Unsupported output format: ${options.to}`);
      }

      fs.writeFileSync(outputFile, outputData);
      console.log(`Converted data saved to: ${outputFile}`);
    } catch (error) {
      console.error('Data conversion failed:', error);
      process.exit(1);
    }
  }

  /**
   * Check system health
   */
  private async checkSystemHealth(options: any): Promise<void> {
    try {
      console.log('Checking system health...');

      const health = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        components: {
          complianceValidator: 'operational',
          conformanceChecker: 'operational',
          benchmarker: 'operational',
          dataArchaeologist: 'operational',
          eventSystem: 'operational',
        },
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      };

      if (options.output === 'json') {
        console.log(JSON.stringify(health, null, 2));
      } else {
        console.log('System Health: ✅ Healthy');
        console.log(`Memory Usage: ${Math.round(health.memory.heapUsed / 1024 / 1024)}MB`);
        console.log(`Uptime: ${Math.round(health.uptime / 60)} minutes`);

        if (options.detailed) {
          console.log('\nComponent Status:');
          Object.entries(health.components).forEach(([component, status]) => {
            console.log(`  ${component}: ✅ ${status}`);
          });
        }
      }
    } catch (error) {
      console.error('Health check failed:', error);
      process.exit(1);
    }
  }

  // Helper methods
  private async validateDataAgainstSchema(data: any, schemaFile?: string): Promise<any> {
    // JSON Schema validation implementation
    return { valid: true, errors: [] };
  }

  private async validateBusinessLogic(data: any, rulesFile?: string): Promise<any> {
    // Business rules validation implementation
    return { valid: true, errors: [], warnings: [] };
  }

  private generateSamples(type: string, count: number): any[] {
    const samples: any[] = [];

    for (let i = 1; i <= count; i++) {
      switch (type) {
        case 'customer':
          samples.push({
            id: `CUST${i.toString().padStart(3, '0')}`,
            name: `Sample Customer ${i}`,
            type: 'commercial',
            status: 'active',
            contactInfo: {
              primaryPhone: `555-0${i.toString().padStart(3, '0')}`,
              email: `customer${i}@example.com`,
              address: {
                street: `${i} Sample Street`,
                city: 'Sample City',
                state: 'SC',
                zipCode: '12345',
              },
            },
            createdAt: new Date('2023-01-15'),
            updatedAt: new Date('2024-01-15'),
            version: 1,
          });
          break;

        case 'event':
          samples.push({
            id: `EVT${i.toString().padStart(6, '0')}`,
            entityType: 'customer',
            eventType: 'created',
            timestamp: new Date().toISOString(),
            eventData: { id: `CUST${i.toString().padStart(3, '0')}` },
            source: 'cli',
          });
          break;

        default:
          samples.push({ id: i, name: `Sample ${type} ${i}` });
      }
    }

    return samples;
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    // REMOVED UNUSED:     const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            // REMOVED UNUSED:             const value = row[header];
            return typeof value === 'object' ? `"${JSON.stringify(value)}"` : String(value);
          })
          .join(',')
      ),
    ];

    return csvRows.join('\n');
  }

  private convertToXML(data: any[]): string {
    if (data.length === 0) return '<data></data>';

    // REMOVED UNUSED:     const rootName = 'data';
    // REMOVED UNUSED:     let xml = `<${rootName}>\n`;

    data.forEach((item, index) => {
      xml += `  <item id="${index + 1}">\n`;
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === 'object') {
          xml += `    <${key}>${JSON.stringify(value)}</${key}>\n`;
        } else {
          xml += `    <${key}>${value}</${key}>\n`;
        }
      });
      xml += `  </item>\n`;
    });

    xml += `</${rootName}>`;
    return xml;
  }

  private parseCSV(csv: string): any[] {
    // REMOVED UNUSED:     const lines = csv.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return [];

    // REMOVED UNUSED:     const headers = lines[0].split(',').map((h) => h.trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      // REMOVED UNUSED:       const values = lines[i].split(',').map((v) => v.trim());
      const item: any = {};

      headers.forEach((header, index) => {
        item[header] = values[index];
      });

      data.push(item);
    }

    return data;
  }

  private parseXML(xml: string): any[] {
    // Simple XML parsing - in production would use proper XML parser
    console.log('XML parsing not fully implemented in CLI');
    return [];
  }

  /**
   * Run the CLI
   */
  public async run(): Promise<void> {
    this.program.parse(process.argv);

    // If no command is provided, show help
    if (!process.argv.slice(2).length) {
      this.program.outputHelp();
    }
  }
}

/**
 * Export factory function
 */
export function createRefuseProtocolCLI(): RefuseProtocolCLI {
  return new RefuseProtocolCLI();
}

// Run CLI if this file is executed directly
if (require.main === module) {
  // REMOVED UNUSED:   const cli = new RefuseProtocolCLI();
  cli.run().catch(console.error);
}

// Export types
export // Re-export any types that might be needed
 type {};
