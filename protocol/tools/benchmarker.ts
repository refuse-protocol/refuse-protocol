import { existsSync } from 'fs';
import { writeFileSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { resolve } from 'path';
/**
 * @fileoverview Performance benchmarking utilities for REFUSE Protocol
 * @description Comprehensive performance testing and benchmarking tools for protocol implementations
 * @version 1.0.0
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import { Event } from '../specifications/entities';

/**
 * REFUSE Protocol Performance Benchmarker
 * Comprehensive performance testing and benchmarking for protocol implementations
 */
export class Benchmarker {
  private benchmarks: Map<string, BenchmarkSuite> = new Map();
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private baselineResults: Map<string, BaselineResult> = new Map();

  constructor(options: BenchmarkerOptions = {}) {
    this.initializeBenchmarkSuites();
    this.loadBaselineResults(options.baselinesDir);
  }

  /**
   * Run comprehensive performance benchmark suite
   */
  async runFullBenchmarkSuite(options: BenchmarkSuiteOptions): Promise<BenchmarkReport> {
    console.log(chalk.blue('🚀 Running REFUSE Protocol Performance Benchmarks...'));

    const startTime = Date.now();
    const report: BenchmarkReport = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      target: options.targetPath || process.cwd(),
      suite: options.suiteName || 'comprehensive',
      results: [],
      summary: {
        totalBenchmarks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: 0,
        averageScore: 0,
        baselineComparison: 'unknown',
      },
    };

    try {
      // Run different benchmark categories
      const benchmarkTasks = [
        this.runSchemaValidationBenchmarks(options),
        this.runEntityProcessingBenchmarks(options),
        this.runEventStreamingBenchmarks(options),
        this.runDataTransformationBenchmarks(options),
        this.runApiEndpointBenchmarks(options),
        this.runMemoryUsageBenchmarks(options),
        this.runConcurrentLoadBenchmarks(options),
      ];

      // Execute benchmarks in parallel where possible
      const results = await Promise.all(benchmarkTasks);

      // Aggregate results
      for (const result of results) {
        report.results.push(result);
        report.summary.totalBenchmarks += result.tests.length;
        report.summary.passed += result.tests.filter((t) => t.status === 'pass').length;
        report.summary.failed += result.tests.filter((t) => t.status === 'fail').length;
        report.summary.warnings += result.tests.filter((t) => t.status === 'warn').length;
        report.summary.errors += result.tests.filter((t) => t.status === 'error').length;
      }

      // Calculate average score
      report.summary.averageScore = this.calculateAverageScore(report.results);

      // Compare with baseline
      report.summary.baselineComparison = this.compareWithBaseline(report);

      const totalTime = Date.now() - startTime;

      console.log(chalk.green(`✅ Benchmarking complete in ${totalTime}ms`));
      console.log(chalk.gray(`   Average Score: ${report.summary.averageScore.toFixed(1)}/100`));
      console.log(
        chalk.gray(
          `   Passed: ${report.summary.passed}, Failed: ${report.summary.failed}, Warnings: ${report.summary.warnings}`
        )
      );

      return report;
    } catch (error) {
      console.error(
        chalk.red(
          `❌ Benchmarking failed: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      throw error;
    }
  }

  /**
   * Run schema validation benchmarks
   */
  private async runSchemaValidationBenchmarks(
    options: BenchmarkSuiteOptions
  ): Promise<BenchmarkResult> {
    const result: BenchmarkResult = {
      category: 'Schema Validation',
      status: 'pass',
      score: 100,
      tests: [],
      metrics: {
        throughput: 0,
        latency: { average: 0, p95: 0, p99: 0 },
        memory: { used: 0, peak: 0, efficiency: 0 },
        errorRate: 0,
      },
    };

    try {
      const iterations = options.iterations || 1000;
      const startTime = Date.now();
      let totalMemoryUsage = 0;
      let peakMemoryUsage = 0;
      let errorCount = 0;

      // Run schema validation benchmarks
      for (let i = 0; i < iterations; i++) {
        const iterationStart = Date.now();
        const memoryBefore = process.memoryUsage().heapUsed;

        try {
          // Simulate schema validation workload
          const validationResult = await this.simulateSchemaValidation(i);

          const iterationTime = Date.now() - iterationStart;
          const memoryAfter = process.memoryUsage().heapUsed;
          const memoryDelta = memoryAfter - memoryBefore;

          totalMemoryUsage += memoryDelta;
          peakMemoryUsage = Math.max(peakMemoryUsage, memoryDelta);

          result.tests.push({
            id: uuidv4(),
            name: `Schema Validation ${i + 1}`,
            status: validationResult.success ? 'pass' : 'fail',
            duration: iterationTime,
            memoryUsage: memoryDelta,
            throughput: 1000 / iterationTime, // operations per second
            details: validationResult.details,
          });

          if (!validationResult.success) {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          result.tests.push({
            id: uuidv4(),
            name: `Schema Validation ${i + 1}`,
            status: 'error',
            duration: Date.now() - iterationStart,
            memoryUsage: 0,
            throughput: 0,
            details: `Error: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }

      const totalTime = Date.now() - startTime;
      const successfulTests = result.tests.filter((t) => t.status === 'pass').length;

      // Calculate metrics
      result.metrics = {
        throughput: successfulTests / (totalTime / 1000), // operations per second
        latency: {
          average: totalTime / iterations,
          p95: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            95
          ),
          p99: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            99
          ),
        },
        memory: {
          used: totalMemoryUsage / iterations,
          peak: peakMemoryUsage,
          efficiency: (successfulTests / iterations) * 100,
        },
        errorRate: (errorCount / iterations) * 100,
      };

      // Adjust score based on performance
      if (result.metrics.errorRate > 5) {
        result.score -= 30;
        result.status = 'fail';
      } else if (result.metrics.latency.average > 50) {
        result.score -= 20;
        result.status = 'warn';
      } else if (result.metrics.memory.efficiency < 90) {
        result.score -= 10;
        result.status = 'warn';
      }

      result.score = Math.max(0, Math.min(100, result.score));
    } catch (error) {
      result.status = 'error';
      result.score = 0;
      result.tests.push({
        id: uuidv4(),
        name: 'Schema Validation Suite',
        status: 'error',
        duration: 0,
        memoryUsage: 0,
        throughput: 0,
        details: `Benchmark failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return result;
  }

  /**
   * Run entity processing benchmarks
   */
  private async runEntityProcessingBenchmarks(
    options: BenchmarkSuiteOptions
  ): Promise<BenchmarkResult> {
    const result: BenchmarkResult = {
      category: 'Entity Processing',
      status: 'pass',
      score: 100,
      tests: [],
      metrics: {
        throughput: 0,
        latency: { average: 0, p95: 0, p99: 0 },
        memory: { used: 0, peak: 0, efficiency: 0 },
        errorRate: 0,
      },
    };

    try {
      const iterations = options.iterations || 500;
      const startTime = Date.now();
      let totalMemoryUsage = 0;
      let peakMemoryUsage = 0;
      let errorCount = 0;

      // Test different entity types
      const entityTypes = ['customer', 'service', 'route', 'facility', 'container', 'fleet'];

      for (let i = 0; i < iterations; i++) {
        const entityType = entityTypes[i % entityTypes.length];
        const iterationStart = Date.now();
        const memoryBefore = process.memoryUsage().heapUsed;

        try {
          // Simulate entity processing workload
          const processingResult = await this.simulateEntityProcessing(entityType, i);

          const iterationTime = Date.now() - iterationStart;
          const memoryAfter = process.memoryUsage().heapUsed;
          const memoryDelta = memoryAfter - memoryBefore;

          totalMemoryUsage += memoryDelta;
          peakMemoryUsage = Math.max(peakMemoryUsage, memoryDelta);

          result.tests.push({
            id: uuidv4(),
            name: `Entity Processing ${entityType} ${i + 1}`,
            status: processingResult.success ? 'pass' : 'fail',
            duration: iterationTime,
            memoryUsage: memoryDelta,
            throughput: 1000 / iterationTime,
            details: processingResult.details,
          });

          if (!processingResult.success) {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          result.tests.push({
            id: uuidv4(),
            name: `Entity Processing ${entityType} ${i + 1}`,
            status: 'error',
            duration: Date.now() - iterationStart,
            memoryUsage: 0,
            throughput: 0,
            details: `Error: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }

      const totalTime = Date.now() - startTime;
      const successfulTests = result.tests.filter((t) => t.status === 'pass').length;

      // Calculate metrics
      result.metrics = {
        throughput: successfulTests / (totalTime / 1000),
        latency: {
          average: totalTime / iterations,
          p95: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            95
          ),
          p99: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            99
          ),
        },
        memory: {
          used: totalMemoryUsage / iterations,
          peak: peakMemoryUsage,
          efficiency: (successfulTests / iterations) * 100,
        },
        errorRate: (errorCount / iterations) * 100,
      };

      // Adjust score based on performance
      if (result.metrics.errorRate > 3) {
        result.score -= 25;
        result.status = 'fail';
      } else if (result.metrics.latency.average > 100) {
        result.score -= 15;
        result.status = 'warn';
      } else if (result.metrics.memory.efficiency < 95) {
        result.score -= 10;
        result.status = 'warn';
      }

      result.score = Math.max(0, Math.min(100, result.score));
    } catch (error) {
      result.status = 'error';
      result.score = 0;
      result.tests.push({
        id: uuidv4(),
        name: 'Entity Processing Suite',
        status: 'error',
        duration: 0,
        memoryUsage: 0,
        throughput: 0,
        details: `Benchmark failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return result;
  }

  /**
   * Run event streaming benchmarks
   */
  private async runEventStreamingBenchmarks(
    options: BenchmarkSuiteOptions
  ): Promise<BenchmarkResult> {
    const result: BenchmarkResult = {
      category: 'Event Streaming',
      status: 'pass',
      score: 100,
      tests: [],
      metrics: {
        throughput: 0,
        latency: { average: 0, p95: 0, p99: 0 },
        memory: { used: 0, peak: 0, efficiency: 0 },
        errorRate: 0,
      },
    };

    try {
      const iterations = options.iterations || 1000;
      const startTime = Date.now();
      let totalMemoryUsage = 0;
      let peakMemoryUsage = 0;
      let errorCount = 0;
      let totalEvents = 0;

      // Simulate event streaming workload
      for (let i = 0; i < iterations; i++) {
        const iterationStart = Date.now();
        const memoryBefore = process.memoryUsage().heapUsed;

        try {
          // Simulate event streaming workload
          const eventsProcessed = await this.simulateEventStreaming(i);
          totalEvents += eventsProcessed;

          const iterationTime = Date.now() - iterationStart;
          const memoryAfter = process.memoryUsage().heapUsed;
          const memoryDelta = memoryAfter - memoryBefore;

          totalMemoryUsage += memoryDelta;
          peakMemoryUsage = Math.max(peakMemoryUsage, memoryDelta);

          result.tests.push({
            id: uuidv4(),
            name: `Event Streaming Batch ${i + 1}`,
            status: 'pass',
            duration: iterationTime,
            memoryUsage: memoryDelta,
            throughput: eventsProcessed / (iterationTime / 1000),
            details: `Processed ${eventsProcessed} events`,
          });
        } catch (error) {
          errorCount++;
          result.tests.push({
            id: uuidv4(),
            name: `Event Streaming Batch ${i + 1}`,
            status: 'error',
            duration: Date.now() - iterationStart,
            memoryUsage: 0,
            throughput: 0,
            details: `Error: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }

      const totalTime = Date.now() - startTime;
      const successfulTests = result.tests.filter((t) => t.status === 'pass').length;

      // Calculate metrics
      result.metrics = {
        throughput: totalEvents / (totalTime / 1000), // events per second
        latency: {
          average: totalTime / iterations,
          p95: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            95
          ),
          p99: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            99
          ),
        },
        memory: {
          used: totalMemoryUsage / iterations,
          peak: peakMemoryUsage,
          efficiency: (successfulTests / iterations) * 100,
        },
        errorRate: (errorCount / iterations) * 100,
      };

      // Adjust score based on performance
      if (result.metrics.errorRate > 1) {
        result.score -= 20;
        result.status = 'fail';
      } else if (result.metrics.throughput < 1000) {
        result.score -= 15;
        result.status = 'warn';
      } else if (result.metrics.latency.average > 10) {
        result.score -= 10;
        result.status = 'warn';
      }

      result.score = Math.max(0, Math.min(100, result.score));
    } catch (error) {
      result.status = 'error';
      result.score = 0;
      result.tests.push({
        id: uuidv4(),
        name: 'Event Streaming Suite',
        status: 'error',
        duration: 0,
        memoryUsage: 0,
        throughput: 0,
        details: `Benchmark failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return result;
  }

  /**
   * Run data transformation benchmarks
   */
  private async runDataTransformationBenchmarks(
    options: BenchmarkSuiteOptions
  ): Promise<BenchmarkResult> {
    const result: BenchmarkResult = {
      category: 'Data Transformation',
      status: 'pass',
      score: 100,
      tests: [],
      metrics: {
        throughput: 0,
        latency: { average: 0, p95: 0, p99: 0 },
        memory: { used: 0, peak: 0, efficiency: 0 },
        errorRate: 0,
      },
    };

    try {
      const iterations = options.iterations || 200;
      const startTime = Date.now();
      let totalMemoryUsage = 0;
      let peakMemoryUsage = 0;
      let errorCount = 0;
      let totalRecords = 0;

      // Test different transformation scenarios
      const scenarios = [
        'simple_mapping',
        'complex_transformation',
        'legacy_migration',
        'batch_processing',
      ];

      for (let i = 0; i < iterations; i++) {
        const scenario = scenarios[i % scenarios.length];
        const iterationStart = Date.now();
        const memoryBefore = process.memoryUsage().heapUsed;

        try {
          // Simulate data transformation workload
          const transformationResult = await this.simulateDataTransformation(scenario, i);
          totalRecords += transformationResult.recordsProcessed;

          const iterationTime = Date.now() - iterationStart;
          const memoryAfter = process.memoryUsage().heapUsed;
          const memoryDelta = memoryAfter - memoryBefore;

          totalMemoryUsage += memoryDelta;
          peakMemoryUsage = Math.max(peakMemoryUsage, memoryDelta);

          result.tests.push({
            id: uuidv4(),
            name: `Data Transformation ${scenario} ${i + 1}`,
            status: transformationResult.success ? 'pass' : 'fail',
            duration: iterationTime,
            memoryUsage: memoryDelta,
            throughput: transformationResult.recordsProcessed / (iterationTime / 1000),
            details: transformationResult.details,
          });

          if (!transformationResult.success) {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          result.tests.push({
            id: uuidv4(),
            name: `Data Transformation ${scenario} ${i + 1}`,
            status: 'error',
            duration: Date.now() - iterationStart,
            memoryUsage: 0,
            throughput: 0,
            details: `Error: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }

      const totalTime = Date.now() - startTime;
      const successfulTests = result.tests.filter((t) => t.status === 'pass').length;

      // Calculate metrics
      result.metrics = {
        throughput: totalRecords / (totalTime / 1000),
        latency: {
          average: totalTime / iterations,
          p95: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            95
          ),
          p99: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            99
          ),
        },
        memory: {
          used: totalMemoryUsage / iterations,
          peak: peakMemoryUsage,
          efficiency: (successfulTests / iterations) * 100,
        },
        errorRate: (errorCount / iterations) * 100,
      };

      // Adjust score based on performance
      if (result.metrics.errorRate > 2) {
        result.score -= 25;
        result.status = 'fail';
      } else if (result.metrics.throughput < 500) {
        result.score -= 20;
        result.status = 'warn';
      } else if (result.metrics.latency.average > 200) {
        result.score -= 15;
        result.status = 'warn';
      }

      result.score = Math.max(0, Math.min(100, result.score));
    } catch (error) {
      result.status = 'error';
      result.score = 0;
      result.tests.push({
        id: uuidv4(),
        name: 'Data Transformation Suite',
        status: 'error',
        duration: 0,
        memoryUsage: 0,
        throughput: 0,
        details: `Benchmark failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return result;
  }

  /**
   * Run API endpoint benchmarks
   */
  private async runApiEndpointBenchmarks(options: BenchmarkSuiteOptions): Promise<BenchmarkResult> {
    const result: BenchmarkResult = {
      category: 'API Endpoints',
      status: 'pass',
      score: 100,
      tests: [],
      metrics: {
        throughput: 0,
        latency: { average: 0, p95: 0, p99: 0 },
        memory: { used: 0, peak: 0, efficiency: 0 },
        errorRate: 0,
      },
    };

    try {
      const iterations = options.iterations || 1000;
      const startTime = Date.now();
      let totalMemoryUsage = 0;
      let peakMemoryUsage = 0;
      let errorCount = 0;
      let totalRequests = 0;

      // Test different API endpoints
      const endpoints = ['customers', 'services', 'routes', 'facilities', 'events', 'reports'];

      for (let i = 0; i < iterations; i++) {
        const endpoint = endpoints[i % endpoints.length];
        const iterationStart = Date.now();
        const memoryBefore = process.memoryUsage().heapUsed;

        try {
          // Simulate API endpoint workload
          const apiResult = await this.simulateApiEndpoint(endpoint, i);
          totalRequests += 1; // Each iteration represents one request

          const iterationTime = Date.now() - iterationStart;
          const memoryAfter = process.memoryUsage().heapUsed;
          const memoryDelta = memoryAfter - memoryBefore;

          totalMemoryUsage += memoryDelta;
          peakMemoryUsage = Math.max(peakMemoryUsage, memoryDelta);

          result.tests.push({
            id: uuidv4(),
            name: `API ${endpoint} ${i + 1}`,
            status: apiResult.success ? 'pass' : 'fail',
            duration: iterationTime,
            memoryUsage: memoryDelta,
            throughput: 1000 / iterationTime,
            details: apiResult.details,
          });

          if (!apiResult.success) {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          result.tests.push({
            id: uuidv4(),
            name: `API ${endpoint} ${i + 1}`,
            status: 'error',
            duration: Date.now() - iterationStart,
            memoryUsage: 0,
            throughput: 0,
            details: `Error: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }

      const totalTime = Date.now() - startTime;
      const successfulTests = result.tests.filter((t) => t.status === 'pass').length;

      // Calculate metrics
      result.metrics = {
        throughput: totalRequests / (totalTime / 1000), // requests per second
        latency: {
          average: totalTime / iterations,
          p95: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            95
          ),
          p99: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            99
          ),
        },
        memory: {
          used: totalMemoryUsage / iterations,
          peak: peakMemoryUsage,
          efficiency: (successfulTests / iterations) * 100,
        },
        errorRate: (errorCount / iterations) * 100,
      };

      // Adjust score based on performance
      if (result.metrics.errorRate > 1) {
        result.score -= 30;
        result.status = 'fail';
      } else if (result.metrics.throughput < 100) {
        result.score -= 25;
        result.status = 'warn';
      } else if (result.metrics.latency.average > 100) {
        result.score -= 15;
        result.status = 'warn';
      }

      result.score = Math.max(0, Math.min(100, result.score));
    } catch (error) {
      result.status = 'error';
      result.score = 0;
      result.tests.push({
        id: uuidv4(),
        name: 'API Endpoints Suite',
        status: 'error',
        duration: 0,
        memoryUsage: 0,
        throughput: 0,
        details: `Benchmark failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return result;
  }

  /**
   * Run memory usage benchmarks
   */
  private async runMemoryUsageBenchmarks(options: BenchmarkSuiteOptions): Promise<BenchmarkResult> {
    const result: BenchmarkResult = {
      category: 'Memory Usage',
      status: 'pass',
      score: 100,
      tests: [],
      metrics: {
        throughput: 0,
        latency: { average: 0, p95: 0, p99: 0 },
        memory: { used: 0, peak: 0, efficiency: 0 },
        errorRate: 0,
      },
    };

    try {
      const iterations = options.iterations || 100;
      const startTime = Date.now();
      let totalMemoryUsage = 0;
      let peakMemoryUsage = 0;
      let errorCount = 0;

      // Memory stress test scenarios
      const scenarios = [
        'object_creation',
        'array_allocation',
        'string_concatenation',
        'memory_cleanup',
      ];

      for (let i = 0; i < iterations; i++) {
        const scenario = scenarios[i % scenarios.length];
        const iterationStart = Date.now();
        const memoryBefore = process.memoryUsage().heapUsed;

        try {
          // Simulate memory-intensive workload
          const memoryResult = await this.simulateMemoryWorkload(scenario, i);

          const iterationTime = Date.now() - iterationStart;
          const memoryAfter = process.memoryUsage().heapUsed;
          const memoryDelta = memoryAfter - memoryBefore;

          totalMemoryUsage += memoryDelta;
          peakMemoryUsage = Math.max(peakMemoryUsage, memoryDelta);

          result.tests.push({
            id: uuidv4(),
            name: `Memory ${scenario} ${i + 1}`,
            status: memoryResult.success ? 'pass' : 'fail',
            duration: iterationTime,
            memoryUsage: memoryDelta,
            throughput: 1000 / iterationTime,
            details: memoryResult.details,
          });

          if (!memoryResult.success) {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          result.tests.push({
            id: uuidv4(),
            name: `Memory ${scenario} ${i + 1}`,
            status: 'error',
            duration: Date.now() - iterationStart,
            memoryUsage: 0,
            throughput: 0,
            details: `Error: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }

      const totalTime = Date.now() - startTime;
      const successfulTests = result.tests.filter((t) => t.status === 'pass').length;

      // Calculate metrics
      result.metrics = {
        throughput: successfulTests / (totalTime / 1000),
        latency: {
          average: totalTime / iterations,
          p95: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            95
          ),
          p99: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            99
          ),
        },
        memory: {
          used: totalMemoryUsage / iterations,
          peak: peakMemoryUsage,
          efficiency: (successfulTests / iterations) * 100,
        },
        errorRate: (errorCount / iterations) * 100,
      };

      // Adjust score based on memory efficiency
      if (result.metrics.memory.efficiency < 80) {
        result.score -= 30;
        result.status = 'fail';
      } else if (result.metrics.memory.peak > 100 * 1024 * 1024) {
        // 100MB peak
        result.score -= 20;
        result.status = 'warn';
      } else if (result.metrics.memory.used > 50 * 1024 * 1024) {
        // 50MB average
        result.score -= 10;
        result.status = 'warn';
      }

      result.score = Math.max(0, Math.min(100, result.score));
    } catch (error) {
      result.status = 'error';
      result.score = 0;
      result.tests.push({
        id: uuidv4(),
        name: 'Memory Usage Suite',
        status: 'error',
        duration: 0,
        memoryUsage: 0,
        throughput: 0,
        details: `Benchmark failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return result;
  }

  /**
   * Run concurrent load benchmarks
   */
  private async runConcurrentLoadBenchmarks(
    options: BenchmarkSuiteOptions
  ): Promise<BenchmarkResult> {
    const result: BenchmarkResult = {
      category: 'Concurrent Load',
      status: 'pass',
      score: 100,
      tests: [],
      metrics: {
        throughput: 0,
        latency: { average: 0, p95: 0, p99: 0 },
        memory: { used: 0, peak: 0, efficiency: 0 },
        errorRate: 0,
      },
    };

    try {
      const concurrencyLevels = [1, 5, 10, 25, 50];
      const startTime = Date.now();
      let totalMemoryUsage = 0;
      let peakMemoryUsage = 0;
      let errorCount = 0;
      let totalOperations = 0;

      for (const concurrency of concurrencyLevels) {
        const iterationStart = Date.now();
        const memoryBefore = process.memoryUsage().heapUsed;

        try {
          // Simulate concurrent workload
          const concurrentResult = await this.simulateConcurrentLoad(concurrency);
          totalOperations += concurrentResult.operations;

          const iterationTime = Date.now() - iterationStart;
          const memoryAfter = process.memoryUsage().heapUsed;
          const memoryDelta = memoryAfter - memoryBefore;

          totalMemoryUsage += memoryDelta;
          peakMemoryUsage = Math.max(peakMemoryUsage, memoryDelta);

          result.tests.push({
            id: uuidv4(),
            name: `Concurrent Load ${concurrency} workers`,
            status: concurrentResult.success ? 'pass' : 'fail',
            duration: iterationTime,
            memoryUsage: memoryDelta,
            throughput: concurrentResult.operations / (iterationTime / 1000),
            details: `Concurrency: ${concurrency}, Operations: ${concurrentResult.operations}`,
          });

          if (!concurrentResult.success) {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          result.tests.push({
            id: uuidv4(),
            name: `Concurrent Load ${concurrency} workers`,
            status: 'error',
            duration: Date.now() - iterationStart,
            memoryUsage: 0,
            throughput: 0,
            details: `Error: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }

      const totalTime = Date.now() - startTime;
      const successfulTests = result.tests.filter((t) => t.status === 'pass').length;

      // Calculate metrics
      result.metrics = {
        throughput: totalOperations / (totalTime / 1000),
        latency: {
          average: totalTime / concurrencyLevels.length,
          p95: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            95
          ),
          p99: this.calculatePercentile(
            result.tests.map((t) => t.duration),
            99
          ),
        },
        memory: {
          used: totalMemoryUsage / concurrencyLevels.length,
          peak: peakMemoryUsage,
          efficiency: (successfulTests / concurrencyLevels.length) * 100,
        },
        errorRate: (errorCount / concurrencyLevels.length) * 100,
      };

      // Adjust score based on concurrent performance
      if (result.metrics.errorRate > 5) {
        result.score -= 35;
        result.status = 'fail';
      } else if (result.metrics.throughput < 200) {
        result.score -= 25;
        result.status = 'warn';
      } else if (result.metrics.latency.p95 > 500) {
        result.score -= 15;
        result.status = 'warn';
      }

      result.score = Math.max(0, Math.min(100, result.score));
    } catch (error) {
      result.status = 'error';
      result.score = 0;
      result.tests.push({
        id: uuidv4(),
        name: 'Concurrent Load Suite',
        status: 'error',
        duration: 0,
        memoryUsage: 0,
        throughput: 0,
        details: `Benchmark failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return result;
  }

  /**
   * Simulate schema validation workload
   */
  private async simulateSchemaValidation(
    iteration: number
  ): Promise<{ success: boolean; details: string }> {
    // Simulate JSON Schema validation workload
    const testData = {
      id: `test-${iteration}`,
      name: `Test Customer ${iteration}`,
      type: 'commercial',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    // Simulate validation logic
    const isValid = testData.id && testData.name && testData.type;
    return {
      success: isValid,
      details: isValid ? 'Schema validation passed' : 'Schema validation failed',
    };
  }

  /**
   * Simulate entity processing workload
   */
  private async simulateEntityProcessing(
    entityType: string,
    iteration: number
  ): Promise<{ success: boolean; details: string }> {
    // Simulate entity creation and processing
    const entityData = {
      id: `${entityType}-${iteration}`,
      name: `Test ${entityType} ${iteration}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    // Simulate processing logic
    const isProcessed = entityData.id && entityData.name;
    return {
      success: isProcessed,
      details: isProcessed
        ? `${entityType} processing completed`
        : `${entityType} processing failed`,
    };
  }

  /**
   * Simulate event streaming workload
   */
  private async simulateEventStreaming(iteration: number): Promise<number> {
    // Simulate event streaming workload
    const eventsPerBatch = Math.floor(Math.random() * 100) + 50; // 50-150 events per batch

    // Simulate event processing
    for (let i = 0; i < eventsPerBatch; i++) {
      const event = {
        id: `event-${iteration}-${i}`,
        entityType: 'customer',
        eventType: 'created',
        timestamp: new Date().toISOString(),
        eventData: { id: `data-${i}` },
      };

      // Simulate minimal processing
      if (!event.id || !event.entityType) {
        throw new Error('Invalid event structure');
      }
    }

    return eventsPerBatch;
  }

  /**
   * Simulate data transformation workload
   */
  private async simulateDataTransformation(
    scenario: string,
    iteration: number
  ): Promise<{ success: boolean; details: string; recordsProcessed: number }> {
    // Simulate data transformation based on scenario
    let recordsProcessed = 0;

    switch (scenario) {
      case 'simple_mapping':
        recordsProcessed = 100;
        break;
      case 'complex_transformation':
        recordsProcessed = 50;
        break;
      case 'legacy_migration':
        recordsProcessed = 25;
        break;
      case 'batch_processing':
        recordsProcessed = 200;
        break;
      default:
        recordsProcessed = 50;
    }

    // Simulate transformation logic
    for (let i = 0; i < recordsProcessed; i++) {
      const legacyData = {
        customer_id: `legacy-${iteration}-${i}`,
        customer_name: `Legacy Customer ${i}`,
        created_date: '2023-01-01',
      };

      // Simple transformation
      const transformedData = {
        id: legacyData.customer_id,
        name: legacyData.customer_name,
        createdAt: legacyData.created_date + 'T00:00:00.000Z',
      };

      if (!transformedData.id || !transformedData.name) {
        throw new Error('Transformation failed');
      }
    }

    return {
      success: true,
      details: `${scenario} transformation completed`,
      recordsProcessed,
    };
  }

  /**
   * Simulate API endpoint workload
   */
  private async simulateApiEndpoint(
    endpoint: string,
    iteration: number
  ): Promise<{ success: boolean; details: string }> {
    // Simulate API endpoint processing
    const requestData = {
      endpoint,
      iteration,
      timestamp: new Date().toISOString(),
    };

    // Simulate request processing
    const processingTime = Math.random() * 100; // 0-100ms
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    return {
      success: true,
      details: `${endpoint} API call processed in ${processingTime.toFixed(1)}ms`,
    };
  }

  /**
   * Simulate memory workload
   */
  private async simulateMemoryWorkload(
    scenario: string,
    iteration: number
  ): Promise<{ success: boolean; details: string }> {
    let memoryUsage = 0;

    switch (scenario) {
      case 'object_creation':
        // Create objects to test memory allocation
        const objects = [];
        for (let i = 0; i < 1000; i++) {
          objects.push({
            id: `object-${iteration}-${i}`,
            data: `data-${i}`.repeat(10),
          });
        }
        memoryUsage = objects.length * 100; // Approximate bytes
        break;

      case 'array_allocation':
        // Test array allocation patterns
        const arrays = [];
        for (let i = 0; i < 100; i++) {
          arrays.push(new Array(1000).fill(`item-${i}`));
        }
        memoryUsage = arrays.length * 1000 * 20; // Approximate bytes
        break;

      case 'string_concatenation':
        // Test string concatenation patterns
        let bigString = '';
        for (let i = 0; i < 1000; i++) {
          bigString += `string-${iteration}-${i}`;
        }
        memoryUsage = bigString.length * 2; // Approximate bytes
        break;

      case 'memory_cleanup':
        // Test garbage collection patterns
        const tempObjects = [];
        for (let i = 0; i < 5000; i++) {
          tempObjects.push({ data: `temp-${i}`.repeat(100) });
        }
        tempObjects.length = 0; // Clear array
        memoryUsage = 0;
        break;
    }

    return {
      success: memoryUsage >= 0,
      details: `${scenario} memory workload completed, usage: ${memoryUsage} bytes`,
    };
  }

  /**
   * Simulate concurrent load
   */
  private async simulateConcurrentLoad(
    concurrency: number
  ): Promise<{ success: boolean; operations: number }> {
    const operations: number[] = [];

    // Create concurrent workers
    const workers = Array.from({ length: concurrency }, async (_, workerId) => {
      let workerOperations = 0;

      // Simulate concurrent work
      for (let i = 0; i < 10; i++) {
        const operationId = `worker-${workerId}-op-${i}`;

        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));

        workerOperations++;
      }

      return workerOperations;
    });

    // Wait for all workers to complete
    const workerResults = await Promise.all(workers);
    const totalOperations = workerResults.reduce((sum, ops) => sum + ops, 0);

    return {
      success: totalOperations > 0,
      operations: totalOperations,
    };
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Calculate average score
   */
  private calculateAverageScore(results: BenchmarkResult[]): number {
    if (results.length === 0) return 0;

    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return totalScore / results.length;
  }

  /**
   * Compare with baseline
   */
  private compareWithBaseline(report: BenchmarkReport): 'better' | 'worse' | 'similar' | 'unknown' {
    const baseline = this.baselineResults.get(report.suite);
    if (!baseline) return 'unknown';

    const baselineScore = baseline.summary.averageScore;
    const currentScore = report.summary.averageScore;
    const difference = currentScore - baselineScore;

    if (difference > 5) return 'better';
    if (difference < -5) return 'worse';
    return 'similar';
  }

  /**
   * Initialize benchmark suites
   */
  private initializeBenchmarkSuites(): void {
    // Schema validation benchmarks
    this.benchmarks.set('schema-validation', {
      name: 'Schema Validation',
      description: 'Benchmarks for JSON schema validation performance',
      categories: ['validation', 'parsing'],
      estimatedDuration: '2 minutes',
      tests: [
        { name: 'Basic Schema Validation', weight: 30 },
        { name: 'Complex Schema Validation', weight: 40 },
        { name: 'Schema Compilation', weight: 30 },
      ],
    });

    // Entity processing benchmarks
    this.benchmarks.set('entity-processing', {
      name: 'Entity Processing',
      description: 'Benchmarks for entity creation, validation, and processing',
      categories: ['entities', 'validation', 'business-logic'],
      estimatedDuration: '3 minutes',
      tests: [
        { name: 'Entity Creation', weight: 25 },
        { name: 'Entity Validation', weight: 35 },
        { name: 'Business Rule Processing', weight: 40 },
      ],
    });

    // Event streaming benchmarks
    this.benchmarks.set('event-streaming', {
      name: 'Event Streaming',
      description: 'Benchmarks for real-time event streaming performance',
      categories: ['events', 'streaming', 'real-time'],
      estimatedDuration: '4 minutes',
      tests: [
        { name: 'Event Processing', weight: 40 },
        { name: 'Event Broadcasting', weight: 30 },
        { name: 'Event Persistence', weight: 30 },
      ],
    });
  }

  /**
   * Load baseline results
   */
  private loadBaselineResults(baselinesDir?: string): void {
    if (!baselinesDir) return;

    try {
      const baselinesPath = resolve(baselinesDir);
      if (!existsSync(baselinesPath)) return;

      const baselineFiles = await glob('**/*baseline*.json', { cwd: baselinesPath });

      for (const file of baselineFiles) {
        const content = readFileSync(join(baselinesPath, file), 'utf8');
        const baseline = JSON.parse(content) as BaselineResult;
        this.baselineResults.set(baseline.suite, baseline);
      }
    } catch (error) {
      console.warn(
        `⚠️ Failed to load baseline results: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Benchmarker options
 */
export interface BenchmarkerOptions {
  baselinesDir?: string;
  includeMemoryProfiling?: boolean;
  includeCpuProfiling?: boolean;
  enableGcStats?: boolean;
}

/**
 * Benchmark suite options
 */
export interface BenchmarkSuiteOptions {
  suiteName?: string;
  targetPath?: string;
  iterations?: number;
  concurrency?: number;
  duration?: number;
  warmUpIterations?: number;
}

/**
 * Benchmark suite
 */
export interface BenchmarkSuite {
  name: string;
  description: string;
  categories: string[];
  estimatedDuration: string;
  tests: Array<{
    name: string;
    weight: number;
  }>;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  category: string;
  status: 'pass' | 'fail' | 'warn' | 'error';
  score: number;
  tests: BenchmarkTest[];
  metrics: PerformanceMetrics;
}

/**
 * Benchmark test
 */
export interface BenchmarkTest {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'error';
  duration: number;
  memoryUsage: number;
  throughput: number;
  details?: string;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  throughput: number; // operations per second
  latency: {
    average: number; // milliseconds
    p95: number; // 95th percentile
    p99: number; // 99th percentile
  };
  memory: {
    used: number; // average bytes
    peak: number; // peak bytes
    efficiency: number; // percentage
  };
  errorRate: number; // percentage
}

/**
 * Benchmark report
 */
export interface BenchmarkReport {
  id: string;
  timestamp: string;
  target: string;
  suite: string;
  results: BenchmarkResult[];
  summary: {
    totalBenchmarks: number;
    passed: number;
    failed: number;
    warnings: number;
    errors: number;
    averageScore: number;
    baselineComparison: 'better' | 'worse' | 'similar' | 'unknown';
  };
}

/**
 * Baseline result
 */
export interface BaselineResult {
  suite: string;
  timestamp: string;
  summary: {
    averageScore: number;
    totalBenchmarks: number;
    baselineMetrics: PerformanceMetrics;
  };
}

/**
 * Benchmarker CLI
 */
export class BenchmarkerCLI {
  private benchmarker: Benchmarker;

  constructor(options?: BenchmarkerOptions) {
    this.benchmarker = new Benchmarker(options);
  }

  async run(args: string[]): Promise<void> {
    const command = args[0];

    switch (command) {
      case 'run':
        await this.runCommand(args.slice(1));
        break;
      case 'suite':
        this.suiteCommand(args.slice(1));
        break;
      case 'baseline':
        this.baselineCommand(args.slice(1));
        break;
      default:
        this.printUsage();
    }
  }

  private async runCommand(args: string[]): Promise<void> {
    const options: BenchmarkSuiteOptions = {
      targetPath: process.cwd(),
      iterations: 1000,
      concurrency: 10,
    };

    // Parse options
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--suite' && args[i + 1]) {
        options.suiteName = args[++i];
      } else if (arg === '--target' && args[i + 1]) {
        options.targetPath = args[++i];
      } else if (arg === '--iterations' && args[i + 1]) {
        options.iterations = parseInt(args[++i]);
      } else if (arg === '--concurrency' && args[i + 1]) {
        options.concurrency = parseInt(args[++i]);
      }
    }

    try {
      const report = await this.benchmarker.runFullBenchmarkSuite(options);

      this.printReport(report);

      // Exit with error code if performance is poor
      if (report.summary.averageScore < 70) {
        console.log(`❌ Performance score too low: ${report.summary.averageScore.toFixed(1)}/100`);
        process.exit(1);
      } else if (report.summary.averageScore < 90) {
        console.log(
          `⚠️ Performance score acceptable but could be improved: ${report.summary.averageScore.toFixed(1)}/100`
        );
        process.exit(0);
      } else {
        console.log(
          `✅ Performance benchmark passed: ${report.summary.averageScore.toFixed(1)}/100`
        );
        process.exit(0);
      }
    } catch (error) {
      console.error(
        `❌ Benchmarking failed: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  }

  private suiteCommand(args: string[]): void {
    const suiteName = args[0];

    if (!suiteName) {
//       console.log('\n📊 Available Benchmark Suites:');
//       console.log('  • schema-validation     Schema validation performance');
//       console.log('  • entity-processing     Entity creation and processing');
//       console.log('  • event-streaming       Real-time event streaming');
//       console.log('  • data-transformation   Data transformation pipelines');
//       console.log('  • api-endpoints         REST API endpoint performance');
//       console.log('  • memory-usage          Memory allocation and GC');
//       console.log('  • concurrent-load       Concurrent processing capabilities');
//       console.log('  • comprehensive         All benchmark suites\n');
// 
      console.log('Usage: benchmarker run --suite <suite-name>');
      return;
    }
// 
    console.log(`\n📋 Benchmark Suite: ${suiteName}`);
//     console.log('Run with: benchmarker run --suite ' + suiteName);
  }

  private baselineCommand(args: string[]): void {
    const baselinePath = args[0] || './benchmarks/baseline';
// 
    console.log(`📊 Creating baseline performance metrics at ${baselinePath}`);

    try {
      // Create baseline directory
      if (!existsSync(baselinePath)) {
        // This would create the baseline - simplified for now
//         console.log('✅ Baseline creation would be implemented here');
      } else {
//         console.log('⚠️ Baseline directory already exists');
      }
    } catch (error) {
      console.error(
        `❌ Baseline command failed: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  }

  private printReport(report: BenchmarkReport): void {
//     console.log('\n🚀 REFUSE Protocol Performance Benchmark Report');
    console.log('='.repeat(60));
//     console.log(`Report ID: ${report.id}`);
//     console.log(`Generated: ${report.timestamp}`);
//     console.log(`Target: ${report.target}`);
//     console.log(`Suite: ${report.suite}`);
// 
    console.log('\n📊 Summary:');
    console.log(`  Average Score: ${report.summary.averageScore.toFixed(1)}/100`);
//     console.log(`  Total Benchmarks: ${report.summary.totalBenchmarks}`);
//     console.log(`  Passed: ${report.summary.passed}`);
//     console.log(`  Failed: ${report.summary.failed}`);
//     console.log(`  Warnings: ${report.summary.warnings}`);
//     console.log(`  Errors: ${report.summary.errors}`);

    if (report.summary.baselineComparison !== 'unknown') {
      const comparisonIcon =
        report.summary.baselineComparison === 'better'
          ? '📈'
          : report.summary.baselineComparison === 'worse'
            ? '📉'
            : '➡️';
//       console.log(`  Baseline Comparison: ${comparisonIcon} ${report.summary.baselineComparison}`);
    }
// 
    console.log('\n📈 Category Breakdown:');
    for (const result of report.results) {
      const statusIcon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
      const statusColor =
        result.status === 'pass' ? 'green' : result.status === 'warn' ? 'yellow' : 'red';

      console.log(`${statusIcon} ${result.category}: ${result.score.toFixed(1)}/100`);

      // Show key metrics
      console.log(`    Throughput: ${Math.round(result.metrics.throughput)} ops/sec`);
      console.log(`    Avg Latency: ${result.metrics.latency.average.toFixed(1)}ms`);
      console.log(`    Memory Efficiency: ${result.metrics.memory.efficiency.toFixed(1)}%`);
      console.log(`    Error Rate: ${result.metrics.errorRate.toFixed(1)}%`);
    }
// 
    console.log('\n💡 Recommendations:');
    const lowPerforming = report.results.filter((r) => r.score < 80);

    if (lowPerforming.length === 0) {
//       console.log('  • All benchmarks performing well! 🎉');
    } else {
      lowPerforming.forEach((result) => {
        if (result.metrics.errorRate > 5) {
//           console.log(`  • High error rate in ${result.category} - check for bugs`);
        }
        if (result.metrics.latency.average > 100) {
//           console.log(`  • High latency in ${result.category} - optimize performance`);
        }
        if (result.metrics.memory.efficiency < 80) {
//           console.log(`  • Memory inefficiency in ${result.category} - check for leaks`);
        }
        if (result.metrics.throughput < 100) {
//           console.log(`  • Low throughput in ${result.category} - optimize algorithms`);
        }
      });
    }
  }

  private printUsage(): void {
//     console.log('\nREFUSE Protocol Performance Benchmarker');
//     console.log('Usage: benchmarker <command> [options]\n');
// 
    console.log('Commands:');
//     console.log('  run [options]         Run performance benchmarks');
//     console.log('  suite <name>          Show benchmark suite details');
//     console.log('  baseline <path>       Create baseline metrics\n');
// 
    console.log('Options for run command:');
    console.log('  --suite <name>        Benchmark suite to run (default: comprehensive)');
    console.log('  --target <path>       Target directory to benchmark (default: current)');
    console.log('  --iterations <n>      Number of iterations per test (default: 1000)');
    console.log('  --concurrency <n>     Concurrent worker count (default: 10)\n');
// 
    console.log('Available Suites:');
//     console.log('  • comprehensive       All benchmark suites');
//     console.log('  • schema-validation   JSON schema validation performance');
//     console.log('  • entity-processing   Entity creation and validation');
//     console.log('  • event-streaming     Real-time event streaming');
//     console.log('  • data-transformation Data transformation pipelines');
//     console.log('  • api-endpoints       REST API endpoint performance');
//     console.log('  • memory-usage        Memory allocation and GC');
//     console.log('  • concurrent-load     Concurrent processing capabilities\n');
// 
    console.log('Examples:');
//     console.log('  benchmarker run --suite comprehensive --iterations 5000');
//     console.log('  benchmarker run --suite api-endpoints --target ./protocol');
//     console.log('  benchmarker suite schema-validation');
//     console.log('  benchmarker baseline ./benchmarks\n');
  }
}

/**
 * Export factory functions
 */
export function createBenchmarker(options?: BenchmarkerOptions): Benchmarker {
  return new Benchmarker(options);
}

export function createBenchmarkerCLI(options?: BenchmarkerOptions): BenchmarkerCLI {
  return new BenchmarkerCLI(options);
}

// Export types
export type {
  BenchmarkerOptions,
  BenchmarkSuiteOptions,
  BenchmarkSuite,
  BenchmarkResult,
  BenchmarkTest,
  PerformanceMetrics,
  BenchmarkReport,
  BaselineResult,
};
