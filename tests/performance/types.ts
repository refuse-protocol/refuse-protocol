/**
 * Performance Testing Types
 */

export interface PerformanceThresholds {
  maxTime: number    // Maximum allowed execution time in milliseconds
  maxMemory: number  // Maximum allowed memory usage in bytes
  minThroughput?: number // Minimum required operations per second
  maxLatency?: number    // Maximum allowed latency in milliseconds
}

export interface BenchmarkResult {
  name: string
  duration: number      // Actual execution time in milliseconds
  memoryUsage: number   // Memory used in bytes
  passed: boolean       // Whether test passed all thresholds
  threshold: PerformanceThresholds
  timestamp: Date
  error?: string        // Error message if test failed
  metadata?: Record<string, any> // Additional test metadata
}

export interface BenchmarkSuite {
  name: string
  timestamp: Date
  environment: {
    nodeVersion: string
    platform: string
    arch: string
    memory: NodeJS.MemoryUsage
    cpus: number
  }
  results: {
    entityTests?: BenchmarkResult[]
    eventTests?: BenchmarkResult[]
    algorithmTests?: BenchmarkResult[]
    complianceTests?: BenchmarkResult[]
    resourceTests?: BenchmarkResult[]
    loadTests?: BenchmarkResult[]
  }
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    totalDuration: number
    averagePerformance: number
  }
}

export interface PerformanceMetrics {
  throughput: number     // Operations per second
  latency: number       // Average response time in ms
  memoryEfficiency: number // Memory usage efficiency score
  cpuEfficiency: number    // CPU usage efficiency score
  errorRate: number        // Error rate percentage
}

export interface LoadTestScenario {
  name: string
  concurrentUsers: number
  duration: number          // Duration in seconds
  rampUpTime: number       // Time to reach full load
  requestsPerSecond: number
  expectedResponseTime: number
  maxErrorRate: number
}

export interface LoadTestResult {
  scenario: LoadTestScenario
  actualDuration: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  minResponseTime: number
  maxResponseTime: number
  avgResponseTime: number
  percentiles: {
    p50: number
    p95: number
    p99: number
  }
  throughput: number
  errorRate: number
  memoryUsage: number[]
  cpuUsage: number[]
}

export interface EntityPerformanceTest {
  entityType: string
  operations: number
  dataSize: number
  expectedTime: number
  expectedMemory: number
}

export interface AlgorithmPerformanceTest {
  algorithm: string
  inputSize: number
  complexity: string
  expectedTime: number
  expectedMemory: number
}

export interface EventPerformanceTest {
  eventType: string
  eventRate: number        // Events per second
  duration: number         // Test duration in seconds
  expectedThroughput: number
  expectedLatency: number
}

export interface CompliancePerformanceTest {
  testType: string
  dataVolume: number
  complexity: string
  expectedTime: number
  expectedMemory: number
}
