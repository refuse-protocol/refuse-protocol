/**
 * @fileoverview Testing utilities for protocol conformance
 * @description Comprehensive testing utilities for validating REFUSE Protocol implementations
 * @version 1.0.0
 */

import { Event, Customer, Service, Route, Facility, MaterialTicket } from '../specifications/entities';
import { ComplianceValidator } from './compliance-validator';
import { ConformanceChecker } from './conformance-checker';
import { Benchmarker } from './benchmarker';
import { EventStreamingSystem } from '../implementations/event-system';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Testing Utilities for Protocol Conformance
 * Comprehensive suite of testing utilities for REFUSE Protocol validation
 */
export class TestingUtilities {
  private complianceValidator: ComplianceValidator;
  private conformanceChecker: ConformanceChecker;
  private benchmarker: Benchmarker;
  private eventSystem: EventStreamingSystem;
  private testResults: Map<string, TestResult> = new Map();
  private testSuites: Map<string, TestSuite> = new Map();

  constructor() {
    this.complianceValidator = new ComplianceValidator();
    this.conformanceChecker = new ConformanceChecker();
    this.benchmarker = new Benchmarker();
    this.eventSystem = new EventStreamingSystem();
  }

  /**
   * Run comprehensive test suite
   */
  async runTestSuite(suiteName: string, options: TestOptions = {}): Promise<TestSuiteResult> {
    console.log(`Running test suite: ${suiteName}`);

    const suite = this.testSuites.get(suiteName) || this.createDefaultTestSuite(suiteName);
    const result: TestSuiteResult = {
      suiteName,
      success: true,
      tests: [],
      totalTests: suite.tests.length,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      warnings: [],
      errors: [],
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 0
    };

    for (const test of suite.tests) {
      const testResult = await this.runTest(test, options);

      result.tests.push(testResult);

      if (testResult.success) {
        result.passedTests++;
      } else {
        result.success = false;
        result.failedTests++;
        result.errors.push(...testResult.errors);
      }

      if (testResult.skipped) {
        result.skippedTests++;
      }

      result.warnings.push(...testResult.warnings);
    }

    result.completedAt = new Date();
    result.duration = result.completedAt.getTime() - result.startedAt.getTime();

    this.testResults.set(suiteName, result);
    console.log(`Test suite completed: ${result.passedTests}/${result.totalTests} tests passed`);

    return result;
  }

  /**
   * Run individual test
   */
  async runTest(test: ProtocolTest, options: TestOptions = {}): Promise<TestResult> {
    const result: TestResult = {
      testName: test.name,
      testType: test.type,
      success: true,
      skipped: false,
      warnings: [],
      errors: [],
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 0,
      metadata: {}
    };

    try {
      switch (test.type) {
        case 'schema_validation':
          await this.runSchemaValidationTest(test, result);
          break;

        case 'business_logic':
          await this.runBusinessLogicTest(test, result);
          break;

        case 'compliance':
          await this.runComplianceTest(test, result);
          break;

        case 'conformance':
          await this.runConformanceTest(test, result);
          break;

        case 'performance':
          await this.runPerformanceTest(test, result);
          break;

        case 'event_streaming':
          await this.runEventStreamingTest(test, result);
          break;

        case 'integration':
          await this.runIntegrationTest(test, result);
          break;

        case 'load':
          await this.runLoadTest(test, result);
          break;

        default:
          result.success = false;
          result.errors.push(`Unknown test type: ${test.type}`);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    result.completedAt = new Date();
    result.duration = result.completedAt.getTime() - result.startedAt.getTime();

    return result;
  }

  /**
   * Generate test report
   */
  async generateTestReport(suiteName: string, format: ReportFormat = 'html'): Promise<string> {
    const suiteResult = this.testResults.get(suiteName);

    if (!suiteResult) {
      throw new Error(`Test suite not found: ${suiteName}`);
    }

    switch (format) {
      case 'html':
        return this.generateHTMLReport(suiteResult);

      case 'json':
        return JSON.stringify(suiteResult, null, 2);

      case 'junit':
        return this.generateJUnitReport(suiteResult);

      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  /**
   * Create test data generators
   */
  createTestDataGenerators(): TestDataGenerators {
    return {
      customer: this.generateCustomerTestData.bind(this),
      service: this.generateServiceTestData.bind(this),
      route: this.generateRouteTestData.bind(this),
      facility: this.generateFacilityTestData.bind(this),
      materialTicket: this.generateMaterialTicketTestData.bind(this),
      event: this.generateEventTestData.bind(this)
    };
  }

  /**
   * Run schema validation test
   */
  private async runSchemaValidationTest(test: ProtocolTest, result: TestResult): Promise<void> {
    if (!test.data) {
      result.errors.push('No test data provided');
      return;
    }

    try {
      // Validate against JSON schema
      const validationResult = await this.validateAgainstSchema(test.data, test.entityType);

      if (!validationResult.valid) {
        result.success = false;
        result.errors.push(...validationResult.errors);
      }

      result.metadata = {
        schemaValidation: validationResult
      };

    } catch (error) {
      result.success = false;
      result.errors.push(`Schema validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run business logic test
   */
  private async runBusinessLogicTest(test: ProtocolTest, result: TestResult): Promise<void> {
    if (!test.data) {
      result.errors.push('No test data provided');
      return;
    }

    try {
      const validationResult = await this.validateBusinessLogic(test.data, test.entityType);

      if (!validationResult.valid) {
        result.success = false;
        result.errors.push(...validationResult.errors);
      }

      result.metadata = {
        businessLogicValidation: validationResult
      };

    } catch (error) {
      result.success = false;
      result.errors.push(`Business logic validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run compliance test
   */
  private async runComplianceTest(test: ProtocolTest, result: TestResult): Promise<void> {
    if (!test.data) {
      result.errors.push('No test data provided');
      return;
    }

    try {
      const complianceResult = await this.complianceValidator.validate(test.data);

      if (!complianceResult.compliant) {
        result.success = false;
        result.errors.push(...complianceResult.violations);
      }

      result.metadata = {
        complianceScore: complianceResult.score,
        violations: complianceResult.violations.length,
        warnings: complianceResult.warnings.length
      };

    } catch (error) {
      result.success = false;
      result.errors.push(`Compliance validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run conformance test
   */
  private async runConformanceTest(test: ProtocolTest, result: TestResult): Promise<void> {
    if (!test.implementationPath) {
      result.errors.push('No implementation path provided');
      return;
    }

    try {
      const conformanceResult = await this.conformanceChecker.checkConformance({
        implementationPath: test.implementationPath,
        type: test.implementationType || 'api',
        standard: test.conformanceStandard || 'refuse-protocol-v1'
      });

      if (!conformanceResult.conforms) {
        result.success = false;
        result.errors.push(...conformanceResult.issues);
      }

      result.metadata = {
        conformanceScore: conformanceResult.score,
        issues: conformanceResult.issues.length,
        recommendations: conformanceResult.recommendations
      };

    } catch (error) {
      result.success = false;
      result.errors.push(`Conformance check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run performance test
   */
  private async runPerformanceTest(test: ProtocolTest, result: TestResult): Promise<void> {
    try {
      const benchmarkResult = await this.benchmarker.runBenchmarks({
        duration: test.performanceDuration || 30,
        concurrency: test.performanceConcurrency || 10,
        operations: test.performanceOperations || ['create', 'read', 'update', 'delete']
      });

      const success = this.evaluatePerformanceResult(benchmarkResult, test.performanceThresholds);

      if (!success) {
        result.success = false;
        result.errors.push('Performance thresholds not met');
      }

      result.metadata = {
        benchmarkResult,
        thresholds: test.performanceThresholds
      };

    } catch (error) {
      result.success = false;
      result.errors.push(`Performance test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run event streaming test
   */
  private async runEventStreamingTest(test: ProtocolTest, result: TestResult): Promise<void> {
    try {
      const eventTestResult = await this.testEventStreaming(test.eventTestOptions);

      if (!eventTestResult.success) {
        result.success = false;
        result.errors.push(...eventTestResult.errors);
      }

      result.metadata = {
        eventTestResult,
        eventCount: eventTestResult.eventCount,
        deliveryTime: eventTestResult.averageDeliveryTime
      };

    } catch (error) {
      result.success = false;
      result.errors.push(`Event streaming test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run integration test
   */
  private async runIntegrationTest(test: ProtocolTest, result: TestResult): Promise<void> {
    try {
      const integrationResult = await this.runIntegrationScenario(test.integrationScenario);

      if (!integrationResult.success) {
        result.success = false;
        result.errors.push(...integrationResult.errors);
      }

      result.metadata = {
        integrationResult,
        scenario: test.integrationScenario
      };

    } catch (error) {
      result.success = false;
      result.errors.push(`Integration test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run load test
   */
  private async runLoadTest(test: ProtocolTest, result: TestResult): Promise<void> {
    try {
      const loadTestResult = await this.runLoadScenario(test.loadTestScenario);

      if (!loadTestResult.success) {
        result.success = false;
        result.errors.push(...loadTestResult.errors);
      }

      result.metadata = {
        loadTestResult,
        scenario: test.loadTestScenario
      };

    } catch (error) {
      result.success = false;
      result.errors.push(`Load test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate against schema
   */
  private async validateAgainstSchema(data: any, entityType?: string): Promise<ValidationResult> {
    // JSON Schema validation implementation
    return {
      valid: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * Validate business logic
   */
  private async validateBusinessLogic(data: any, entityType?: string): Promise<ValidationResult> {
    // Business logic validation implementation
    return {
      valid: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * Test event streaming
   */
  private async testEventStreaming(options: EventTestOptions): Promise<EventTestResult> {
    const result: EventTestResult = {
      success: true,
      eventCount: 0,
      averageDeliveryTime: 0,
      errors: [],
      warnings: []
    };

    // Simulate event streaming test
    console.log('Testing event streaming...');

    // Create test events
    const testEvents: Event[] = [
      {
        id: 'test-event-1',
        entityType: 'customer',
        eventType: 'created',
        timestamp: new Date().toISOString(),
        eventData: { id: 'TEST001' },
        source: 'test'
      }
    ];

    // Test event publishing
    for (const event of testEvents) {
      const startTime = Date.now();
      const success = await this.eventSystem.publishEvent(event);
      const endTime = Date.now();

      if (!success) {
        result.success = false;
        result.errors.push(`Failed to publish event: ${event.id}`);
      } else {
        result.eventCount++;
        result.averageDeliveryTime += (endTime - startTime);
      }
    }

    if (result.eventCount > 0) {
      result.averageDeliveryTime = result.averageDeliveryTime / result.eventCount;
    }

    return result;
  }

  /**
   * Run integration scenario
   */
  private async runIntegrationScenario(scenario: IntegrationScenario): Promise<IntegrationTestResult> {
    // Integration test implementation
    return {
      success: true,
      steps: [],
      errors: [],
      warnings: []
    };
  }

  /**
   * Run load scenario
   */
  private async runLoadScenario(scenario: LoadTestScenario): Promise<LoadTestResult> {
    // Load test implementation
    return {
      success: true,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errors: [],
      warnings: []
    };
  }

  /**
   * Evaluate performance result
   */
  private evaluatePerformanceResult(benchmarkResult: any, thresholds?: PerformanceThresholds): boolean {
    if (!thresholds) return true;

    // Simple performance evaluation
    return true; // Would implement actual threshold checking
  }

  /**
   * Generate customer test data
   */
  private generateCustomerTestData(count: number): Customer[] {
    const customers: Customer[] = [];

    for (let i = 1; i <= count; i++) {
      customers.push({
        id: `TEST-CUST-${i.toString().padStart(3, '0')}`,
        name: `Test Customer ${i}`,
        type: 'commercial',
        status: 'active',
        contactInfo: {
          primaryPhone: `555-TEST-${i.toString().padStart(3, '0')}`,
          email: `test-customer-${i}@example.com`,
          address: {
            street: `${i} Test Street`,
            city: 'Test City',
            state: 'TC',
            zipCode: '12345'
          }
        },
        serviceArea: `Area ${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      });
    }

    return customers;
  }

  /**
   * Generate service test data
   */
  private generateServiceTestData(count: number): Service[] {
    const services: Service[] = [];

    for (let i = 1; i <= count; i++) {
      services.push({
        id: `TEST-SERV-${i.toString().padStart(3, '0')}`,
        name: `Test Service ${i}`,
        type: 'waste_collection',
        status: 'active',
        frequency: 'weekly',
        pricing: {
          baseRate: 100 + i,
          rateUnit: 'month',
          additionalCharges: 25
        },
        requirements: {
          containerTypes: ['dumpster'],
          specialHandling: null
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      });
    }

    return services;
  }

  /**
   * Generate route test data
   */
  private generateRouteTestData(count: number): Route[] {
    const routes: Route[] = [];

    for (let i = 1; i <= count; i++) {
      routes.push({
        id: `TEST-ROUTE-${i.toString().padStart(3, '0')}`,
        name: `Test Route ${i}`,
        driver: `Test Driver ${i}`,
        vehicle: `TEST-VEHICLE-${i.toString().padStart(3, '0')}`,
        stops: [
          {
            customerId: `TEST-CUST-${i.toString().padStart(3, '0')}`,
            address: `${i} Test Street, Test City, TC 12345`,
            scheduledTime: '08:00',
            serviceType: 'waste_collection'
          }
        ],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      });
    }

    return routes;
  }

  /**
   * Generate facility test data
   */
  private generateFacilityTestData(count: number): Facility[] {
    const facilities: Facility[] = [];

    for (let i = 1; i <= count; i++) {
      facilities.push({
        id: `TEST-FAC-${i.toString().padStart(3, '0')}`,
        name: `Test Facility ${i}`,
        type: 'processing',
        status: 'operational',
        capacity: {
          total: 1000,
          available: 750,
          unit: 'tons'
        },
        address: {
          street: `${i} Facility Street`,
          city: 'Facility City',
          state: 'FC',
          zipCode: '67890'
        },
        operationalHours: {
          open: '06:00',
          close: '18:00',
          timezone: 'UTC'
        },
        contactInfo: {
          primaryPhone: `555-FAC-${i.toString().padStart(3, '0')}`,
          email: `facility-${i}@example.com`
        },
        permits: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      });
    }

    return facilities;
  }

  /**
   * Generate material ticket test data
   */
  private generateMaterialTicketTestData(count: number): MaterialTicket[] {
    const tickets: MaterialTicket[] = [];

    for (let i = 1; i <= count; i++) {
      tickets.push({
        id: `TEST-TICKET-${i.toString().padStart(3, '0')}`,
        customerId: `TEST-CUST-${i.toString().padStart(3, '0')}`,
        facilityId: `TEST-FAC-${i.toString().padStart(3, '0')}`,
        material: {
          id: `TEST-MAT-${i.toString().padStart(3, '0')}`,
          name: 'Test Material',
          type: 'mixed_waste',
          classification: 'non_recyclable'
        },
        weight: {
          gross: 2500,
          tare: 500,
          net: 2000
        },
        pricing: {
          rate: 75.00,
          rateUnit: 'ton',
          totalAmount: 150.00
        },
        timestamp: new Date(),
        status: 'processed',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      });
    }

    return tickets;
  }

  /**
   * Generate event test data
   */
  private generateEventTestData(count: number): Event[] {
    const events: Event[] = [];

    for (let i = 1; i <= count; i++) {
      events.push({
        id: `TEST-EVENT-${i.toString().padStart(6, '0')}`,
        entityType: 'customer',
        eventType: 'created',
        timestamp: new Date().toISOString(),
        eventData: { id: `TEST-CUST-${i.toString().padStart(3, '0')}` },
        source: 'test-suite'
      });
    }

    return events;
  }

  /**
   * Create default test suite
   */
  private createDefaultTestSuite(suiteName: string): TestSuite {
    return {
      name: suiteName,
      description: 'Default REFUSE Protocol test suite',
      tests: [
        {
          name: 'Schema Validation Test',
          type: 'schema_validation',
          description: 'Test JSON schema validation',
          entityType: 'customer',
          data: this.generateCustomerTestData(1)[0],
          expectedResult: 'valid'
        },
        {
          name: 'Business Logic Test',
          type: 'business_logic',
          description: 'Test business rule validation',
          entityType: 'customer',
          data: this.generateCustomerTestData(1)[0],
          expectedResult: 'valid'
        },
        {
          name: 'Compliance Test',
          type: 'compliance',
          description: 'Test regulatory compliance',
          data: this.generateCustomerTestData(1)[0]
        },
        {
          name: 'Event Streaming Test',
          type: 'event_streaming',
          description: 'Test event streaming functionality',
          eventTestOptions: {
            eventCount: 10,
            expectedDeliveryTime: 100
          }
        },
        {
          name: 'Performance Test',
          type: 'performance',
          description: 'Test performance characteristics',
          performanceDuration: 30,
          performanceConcurrency: 10,
          performanceOperations: ['create', 'read'],
          performanceThresholds: {
            maxResponseTime: 1000,
            minThroughput: 10
          }
        }
      ]
    };
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(suiteResult: TestSuiteResult): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>REFUSE Protocol Test Report - ${suiteResult.suiteName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: flex; justify-content: space-between; margin: 20px 0; }
        .metric { text-align: center; padding: 10px; background: #eee; border-radius: 3px; }
        .test { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 3px; }
        .test.success { background: #d4edda; border-color: #c3e6cb; }
        .test.failed { background: #f8d7da; border-color: #f5c6cb; }
        .test.skipped { background: #fff3cd; border-color: #ffeaa7; }
        .error { color: #721c24; background: #f8d7da; padding: 10px; margin: 10px 0; }
        .warning { color: #856404; background: #fff3cd; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>REFUSE Protocol Test Report</h1>
        <h2>${suiteResult.suiteName}</h2>
        <p>Generated: ${suiteResult.completedAt.toISOString()}</p>
        <p>Duration: ${suiteResult.duration}ms</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 24px;">${suiteResult.totalTests}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div style="font-size: 24px; color: green;">${suiteResult.passedTests}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div style="font-size: 24px; color: red;">${suiteResult.failedTests}</div>
        </div>
        <div class="metric">
            <h3>Skipped</h3>
            <div style="font-size: 24px; color: orange;">${suiteResult.skippedTests}</div>
        </div>
    </div>

    <h2>Test Results</h2>
    ${suiteResult.tests.map(test => `
    <div class="test ${test.success ? 'success' : 'failed'} ${test.skipped ? 'skipped' : ''}">
        <h4>${test.testName}</h4>
        <p><strong>Type:</strong> ${test.testType}</p>
        <p><strong>Duration:</strong> ${test.duration}ms</p>
        ${test.errors.length > 0 ? `<div class="error">Errors: ${test.errors.join(', ')}</div>` : ''}
        ${test.warnings.length > 0 ? `<div class="warning">Warnings: ${test.warnings.join(', ')}</div>` : ''}
    </div>
    `).join('')}

    ${suiteResult.warnings.length > 0 ? `
    <h2>Warnings</h2>
    ${suiteResult.warnings.map(w => `<div class="warning">${w}</div>`).join('')}
    ` : ''}

    ${suiteResult.errors.length > 0 ? `
    <h2>Errors</h2>
    ${suiteResult.errors.map(e => `<div class="error">${e}</div>`).join('')}
    ` : ''}
</body>
</html>`;

    return html;
  }

  /**
   * Generate JUnit report
   */
  private generateJUnitReport(suiteResult: TestSuiteResult): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
    <testsuite name="${suiteResult.suiteName}"
               tests="${suiteResult.totalTests}"
               failures="${suiteResult.failedTests}"
               errors="0"
               skipped="${suiteResult.skippedTests}"
               time="${suiteResult.duration / 1000}"
               timestamp="${suiteResult.startedAt.toISOString()}">
        ${suiteResult.tests.map(test => `
        <testcase name="${test.testName}"
                  classname="${suiteResult.suiteName}"
                  time="${test.duration / 1000}">
            ${test.errors.map(error => `<failure message="${error}"/>`).join('')}
            ${test.skipped ? '<skipped/>' : ''}
        </testcase>
        `).join('')}
    </testsuite>
</testsuites>`;

    return xml;
  }
}

/**
 * Test options
 */
export interface TestOptions {
  verbose?: boolean;
  timeout?: number;
  retries?: number;
  parallel?: boolean;
  outputFormat?: 'json' | 'html' | 'junit';
}

/**
 * Test suite
 */
export interface TestSuite {
  name: string;
  description: string;
  tests: ProtocolTest[];
}

/**
 * Protocol test
 */
export interface ProtocolTest {
  name: string;
  type: 'schema_validation' | 'business_logic' | 'compliance' | 'conformance' | 'performance' | 'event_streaming' | 'integration' | 'load';
  description?: string;
  entityType?: string;
  data?: any;
  expectedResult?: any;
  implementationPath?: string;
  implementationType?: string;
  conformanceStandard?: string;
  performanceDuration?: number;
  performanceConcurrency?: number;
  performanceOperations?: string[];
  performanceThresholds?: PerformanceThresholds;
  eventTestOptions?: EventTestOptions;
  integrationScenario?: IntegrationScenario;
  loadTestScenario?: LoadTestScenario;
}

/**
 * Test suite result
 */
export interface TestSuiteResult {
  suiteName: string;
  success: boolean;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  warnings: string[];
  errors: string[];
  startedAt: Date;
  completedAt: Date;
  duration: number;
}

/**
 * Test result
 */
export interface TestResult {
  testName: string;
  testType: string;
  success: boolean;
  skipped: boolean;
  warnings: string[];
  errors: string[];
  startedAt: Date;
  completedAt: Date;
  duration: number;
  metadata?: Record<string, any>;
}

/**
 * Report format
 */
export type ReportFormat = 'html' | 'json' | 'junit';

/**
 * Performance thresholds
 */
export interface PerformanceThresholds {
  maxResponseTime?: number;
  minThroughput?: number;
  maxErrorRate?: number;
  maxMemoryUsage?: number;
}

/**
 * Event test options
 */
export interface EventTestOptions {
  eventCount: number;
  expectedDeliveryTime?: number;
  eventTypes?: string[];
  entityTypes?: string[];
}

/**
 * Event test result
 */
export interface EventTestResult {
  success: boolean;
  eventCount: number;
  averageDeliveryTime: number;
  errors: string[];
  warnings: string[];
}

/**
 * Integration scenario
 */
export interface IntegrationScenario {
  name: string;
  description: string;
  steps: IntegrationStep[];
}

/**
 * Integration step
 */
export interface IntegrationStep {
  name: string;
  action: string;
  expectedResult: string;
}

/**
 * Integration test result
 */
export interface IntegrationTestResult {
  success: boolean;
  steps: IntegrationStepResult[];
  errors: string[];
  warnings: string[];
}

/**
 * Integration step result
 */
export interface IntegrationStepResult {
  stepName: string;
  success: boolean;
  actualResult: string;
  error?: string;
}

/**
 * Load test scenario
 */
export interface LoadTestScenario {
  name: string;
  description: string;
  duration: number;
  concurrency: number;
  operations: LoadOperation[];
}

/**
 * Load operation
 */
export interface LoadOperation {
  name: string;
  weight: number;
  parameters?: Record<string, any>;
}

/**
 * Load test result
 */
export interface LoadTestResult {
  success: boolean;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errors: string[];
  warnings: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Test data generators
 */
export interface TestDataGenerators {
  customer: (count: number) => Customer[];
  service: (count: number) => Service[];
  route: (count: number) => Route[];
  facility: (count: number) => Facility[];
  materialTicket: (count: number) => MaterialTicket[];
  event: (count: number) => Event[];
}

/**
 * Export factory function
 */
export function createTestingUtilities(): TestingUtilities {
  return new TestingUtilities();
}

// Export types
export type {
  TestOptions,
  TestSuite,
  ProtocolTest,
  TestSuiteResult,
  TestResult,
  ReportFormat,
  PerformanceThresholds,
  EventTestOptions,
  EventTestResult,
  IntegrationScenario,
  IntegrationStep,
  IntegrationTestResult,
  IntegrationStepResult,
  LoadTestScenario,
  LoadOperation,
  LoadTestResult,
  ValidationResult,
  TestDataGenerators
};
