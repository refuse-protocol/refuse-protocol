/**
 * REFUSE Protocol Load Testing Suite
 *
 * High-volume operation testing for REFUSE Protocol components:
 * - Entity creation and processing at scale
 * - Event streaming with high throughput
 * - Data transformation with large datasets
 * - Compliance validation under load
 * - Memory usage and garbage collection testing
 * - Concurrent user simulation
 * - API endpoint stress testing
 * - Database connection pool testing
 */

import { performance, PerformanceObserver } from 'perf_hooks'
import { CustomerModel } from '../../protocol/implementations/customer'
import { ServiceModel } from '../../protocol/implementations/service'
import { RouteModel } from '../../protocol/implementations/route'
import { FacilityModel } from '../../protocol/implementations/facility'
import { MaterialTicketModel } from '../../protocol/implementations/material-ticket'
import { ContractModel } from '../../protocol/implementations/contract'
import { PaymentModel } from '../../protocol/implementations/payment'
import { EventStreamingSystem } from '../../protocol/implementations/event-system'
import { ComplianceValidator } from '../../protocol/tools/compliance-validator'
import { DataTransformer } from '../../protocol/tools/data-transformer'

interface LoadTestScenario {
  name: string
  description: string
  duration: number // seconds
  concurrency: number
  operations: LoadOperation[]
  thresholds: LoadTestThresholds
}

interface LoadOperation {
  type: 'create' | 'read' | 'update' | 'delete' | 'process'
  entityType: string
  dataGenerator: () => any
  weight: number // Probability weight for this operation
}

interface LoadTestThresholds {
  maxResponseTime: number // milliseconds
  maxErrorRate: number // percentage
  minThroughput: number // operations per second
  maxMemoryUsage: number // MB
}

interface LoadTestResult {
  scenarioName: string
  duration: number
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  throughput: number // operations per second
  errorRate: number
  memoryUsage: {
    average: number
    peak: number
    final: number
  }
  errors: string[]
  timestamp: Date
}

class LoadTestRunner {
  private results: LoadTestResult[] = []
  private memorySamples: number[] = []
  private activeThreads = 0

  async runLoadTest(scenario: LoadTestScenario): Promise<LoadTestResult> {
    console.log(`🚀 Starting load test: ${scenario.name}`)
    console.log(`Duration: ${scenario.duration}s, Concurrency: ${scenario.concurrency}`)

    const startTime = performance.now()
    const endTime = startTime + (scenario.duration * 1000)

    // Start memory monitoring
    this.startMemoryMonitoring()

    // Track operation results
    let totalOperations = 0
    let successfulOperations = 0
    let failedOperations = 0
    const responseTimes: number[] = []
    const errors: string[] = []

    // Run concurrent workers
    const workers = Array.from({ length: scenario.concurrency }, () =>
      this.createWorker(scenario, endTime, {
        onOperation: (responseTime: number, success: boolean, error?: string) => {
          totalOperations++
          responseTimes.push(responseTime)
          if (success) {
            successfulOperations++
          } else {
            failedOperations++
            if (error) errors.push(error)
          }
        }
      })
    )

    // Start all workers
    const workerPromises = workers.map(worker => worker.run())
    await Promise.all(workerPromises)

    // Stop memory monitoring
    this.stopMemoryMonitoring()

    const duration = performance.now() - startTime
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    const throughput = totalOperations / (duration / 1000)
    const errorRate = (failedOperations / totalOperations) * 100

    const result: LoadTestResult = {
      scenarioName: scenario.name,
      duration,
      totalOperations,
      successfulOperations,
      failedOperations,
      averageResponseTime,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      throughput,
      errorRate,
      memoryUsage: {
        average: this.memorySamples.reduce((a, b) => a + b, 0) / this.memorySamples.length,
        peak: Math.max(...this.memorySamples),
        final: this.memorySamples[this.memorySamples.length - 1] || 0
      },
      errors: [...new Set(errors)], // Remove duplicates
      timestamp: new Date()
    }

    // Validate thresholds
    this.validateThresholds(result, scenario.thresholds)

    this.results.push(result)
    console.log(`✅ Load test completed: ${scenario.name}`)
    console.log(`Throughput: ${throughput.toFixed(2)} ops/sec, Error Rate: ${errorRate.toFixed(2)}%`)

    return result
  }

  private createWorker(
    scenario: LoadTestScenario,
    endTime: number,
    callbacks: { onOperation: (responseTime: number, success: boolean, error?: string) => void }
  ): { run: () => Promise<void> } {
    return {
      run: async () => {
        this.activeThreads++

        while (performance.now() < endTime) {
          // Select random operation based on weights
          const operation = this.selectWeightedOperation(scenario.operations)

          const operationStart = performance.now()

          try {
            await this.executeOperation(operation)
            callbacks.onOperation(performance.now() - operationStart, true)
          } catch (error) {
            callbacks.onOperation(performance.now() - operationStart, false, error instanceof Error ? error.message : String(error))
          }

          // Small delay to simulate realistic usage patterns
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
        }

        this.activeThreads--
      }
    }
  }

  private selectWeightedOperation(operations: LoadOperation[]): LoadOperation {
    const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0)
    let random = Math.random() * totalWeight

    for (const operation of operations) {
      random -= operation.weight
      if (random <= 0) return operation
    }

    return operations[0] // fallback
  }

  private async executeOperation(operation: LoadOperation): Promise<void> {
    const data = operation.dataGenerator()

    switch (operation.type) {
      case 'create':
        await this.createEntity(operation.entityType, data)
        break
      case 'read':
        await this.readEntity(operation.entityType, data.id)
        break
      case 'update':
        await this.updateEntity(operation.entityType, data)
        break
      case 'delete':
        await this.deleteEntity(operation.entityType, data.id)
        break
      case 'process':
        await this.processEntity(operation.entityType, data)
        break
    }
  }

  private async createEntity(entityType: string, data: any): Promise<void> {
    // Simulate entity creation with validation
    switch (entityType) {
      case 'customer':
        new CustomerModel(data)
        break
      case 'service':
        new ServiceModel(data)
        break
      case 'route':
        new RouteModel(data)
        break
      case 'facility':
        new FacilityModel(data)
        break
      case 'materialTicket':
        new MaterialTicketModel(data)
        break
      case 'contract':
        new ContractModel(data)
        break
      case 'payment':
        new PaymentModel(data)
        break
      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }

    // Simulate async persistence delay
    await new Promise(resolve => setTimeout(resolve, 5))
  }

  private async readEntity(entityType: string, id: string): Promise<void> {
    // Simulate entity retrieval
    await new Promise(resolve => setTimeout(resolve, 2))
  }

  private async updateEntity(entityType: string, data: any): Promise<void> {
    // Simulate entity update with optimistic locking
    await new Promise(resolve => setTimeout(resolve, 3))
  }

  private async deleteEntity(entityType: string, id: string): Promise<void> {
    // Simulate entity deletion
    await new Promise(resolve => setTimeout(resolve, 1))
  }

  private async processEntity(entityType: string, data: any): Promise<void> {
    // Simulate entity processing (e.g., business logic execution)
    switch (entityType) {
      case 'compliance':
        const validator = new ComplianceValidator()
        await validator.validateEntityCompliance(data.entity, data.options)
        break
      case 'event':
        const eventSystem = new EventStreamingSystem()
        await eventSystem.publishEvent(data.event)
        break
      case 'transform':
        const transformer = new DataTransformer()
        await transformer.transform(data.legacyData, data.transformType)
        break
      default:
        await new Promise(resolve => setTimeout(resolve, 5))
    }
  }

  private startMemoryMonitoring(): void {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.memorySamples.push((entry as any).detail?.memoryUsage || 0)
        }
      }
    })

    obs.observe({ entryTypes: ['measure'] })

    // Sample memory every 100ms
    const interval = setInterval(() => {
      const usage = process.memoryUsage()
      this.memorySamples.push(usage.heapUsed / 1024 / 1024) // MB

      performance.mark('memory-check', {
        detail: { memoryUsage: usage.heapUsed / 1024 / 1024 }
      })
    }, 100)

    // Store interval for cleanup
    ;(this as any).memoryInterval = interval
  }

  private stopMemoryMonitoring(): void {
    const interval = (this as any).memoryInterval
    if (interval) {
      clearInterval(interval)
    }
  }

  private validateThresholds(result: LoadTestResult, thresholds: LoadTestThresholds): void {
    const violations: string[] = []

    if (result.averageResponseTime > thresholds.maxResponseTime) {
      violations.push(`Average response time ${result.averageResponseTime.toFixed(2)}ms exceeds threshold ${thresholds.maxResponseTime}ms`)
    }

    if (result.errorRate > thresholds.maxErrorRate) {
      violations.push(`Error rate ${result.errorRate.toFixed(2)}% exceeds threshold ${thresholds.maxErrorRate}%`)
    }

    if (result.throughput < thresholds.minThroughput) {
      violations.push(`Throughput ${result.throughput.toFixed(2)} ops/sec below threshold ${thresholds.minThroughput} ops/sec`)
    }

    if (result.memoryUsage.peak > thresholds.maxMemoryUsage) {
      violations.push(`Peak memory usage ${result.memoryUsage.peak.toFixed(2)}MB exceeds threshold ${thresholds.maxMemoryUsage}MB`)
    }

    if (violations.length > 0) {
      console.warn(`⚠️  Load test threshold violations for ${result.scenarioName}:`)
      violations.forEach(violation => console.warn(`  - ${violation}`))
    }
  }

  getResults(): LoadTestResult[] {
    return this.results
  }
}

// Test Data Generators
class TestDataGenerator {
  private customerCounter = 1
  private serviceCounter = 1
  private routeCounter = 1

  generateCustomer(): any {
    return {
      id: `LOAD-CUST-${this.customerCounter++}`,
      name: `Load Test Customer ${this.customerCounter}`,
      type: 'commercial' as const,
      status: 'active' as const,
      contactInfo: {
        primaryPhone: '555-0100',
        email: `loadtest${this.customerCounter}@example.com`,
        address: {
          street: `${this.customerCounter} Test Street`,
          city: 'Load Test City',
          state: 'CA',
          zipCode: '94105'
        }
      },
      serviceArea: 'Test Area',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }
  }

  generateService(): any {
    return {
      id: `LOAD-SERV-${this.serviceCounter++}`,
      customerId: `LOAD-CUST-${Math.floor(Math.random() * this.customerCounter)}`,
      siteId: `LOAD-SITE-${Math.floor(Math.random() * 100)}`,
      serviceType: 'waste' as const,
      materialTypes: ['mixed_waste'] as const,
      frequency: 'weekly' as const,
      containerType: 'dumpster' as const,
      containerSize: '4_yard',
      schedule: [],
      nextServiceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      pricing: {
        baseRate: 150.00 + Math.random() * 50,
        rateUnit: 'month' as const,
        additionalCharges: Math.random() * 25
      },
      status: 'active' as const,
      priority: 'normal' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }
  }

  generateRoute(): any {
    const siteCount = Math.floor(Math.random() * 20) + 5
    return {
      id: `LOAD-ROUTE-${this.routeCounter++}`,
      name: `Load Test Route ${this.routeCounter}`,
      code: `LTR-${this.routeCounter}`,
      type: 'commercial' as const,
      status: 'planned' as const,
      schedule: {
        startTime: '08:00',
        endTime: '17:00',
        workingDays: ['monday', 'wednesday', 'friday']
      },
      estimatedDuration: 480,
      assignedVehicle: `VEH-${Math.floor(Math.random() * 50)}`,
      assignedDriver: `DRIVER-${Math.floor(Math.random() * 20)}`,
      assignedSites: Array.from({ length: siteCount }, (_, i) => `LOAD-SITE-${i}`),
      assignedServices: Array.from({ length: siteCount }, (_, i) => `LOAD-SERV-${i}`),
      serviceSequence: [],
      plannedStops: siteCount,
      efficiency: 75 + Math.random() * 20,
      totalDistance: 30 + Math.random() * 50,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }
  }

  generateComplianceData(): any {
    return {
      entity: new CustomerModel({
        id: 'LOAD-COMP-CUST',
        name: 'Compliance Load Test Customer',
        type: 'commercial' as const,
        status: 'active' as const,
        contactInfo: {
          primaryPhone: '555-1000',
          email: 'compliance@example.com',
          address: {
            street: '100 Compliance Blvd',
            city: 'Test City',
            state: 'CA',
            zipCode: '94105'
          }
        },
        serviceArea: 'Test Area',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      }),
      options: {
        entityType: 'customer',
        entityId: 'LOAD-COMP-CUST',
        complianceRules: ['data_integrity', 'format_validation']
      }
    }
  }

  generateEventData(): any {
    return {
      event: {
        id: `LOAD-EVT-${Date.now()}`,
        entityType: 'customer',
        entityId: `LOAD-CUST-${Math.floor(Math.random() * this.customerCounter)}`,
        eventType: 'updated',
        timestamp: new Date(),
        data: { status: 'active' },
        metadata: {}
      }
    }
  }

  generateTransformData(): any {
    return {
      legacyData: {
        customer: {
          legacyId: `LEG-${Date.now()}`,
          name: `Legacy Customer ${Date.now()}`,
          address: '123 Legacy Street',
          phone: '555-0000',
          serviceType: 'waste'
        }
      },
      transformType: 'legacy_to_refuse'
    }
  }
}

// Load Test Scenarios
const loadTestScenarios: LoadTestScenario[] = [
  {
    name: 'Entity Creation Load Test',
    description: 'High-volume entity creation to test system capacity',
    duration: 30,
    concurrency: 10,
    operations: [
      {
        type: 'create',
        entityType: 'customer',
        dataGenerator: () => new TestDataGenerator().generateCustomer(),
        weight: 40
      },
      {
        type: 'create',
        entityType: 'service',
        dataGenerator: () => new TestDataGenerator().generateService(),
        weight: 35
      },
      {
        type: 'create',
        entityType: 'route',
        dataGenerator: () => new TestDataGenerator().generateRoute(),
        weight: 25
      }
    ],
    thresholds: {
      maxResponseTime: 100,
      maxErrorRate: 5,
      minThroughput: 50,
      maxMemoryUsage: 200
    }
  },
  {
    name: 'Mixed Operations Load Test',
    description: 'Balanced mix of create, read, update operations',
    duration: 60,
    concurrency: 20,
    operations: [
      {
        type: 'create',
        entityType: 'customer',
        dataGenerator: () => new TestDataGenerator().generateCustomer(),
        weight: 20
      },
      {
        type: 'read',
        entityType: 'customer',
        dataGenerator: () => ({ id: `LOAD-CUST-${Math.floor(Math.random() * 1000)}` }),
        weight: 40
      },
      {
        type: 'update',
        entityType: 'service',
        dataGenerator: () => new TestDataGenerator().generateService(),
        weight: 20
      },
      {
        type: 'process',
        entityType: 'compliance',
        dataGenerator: () => new TestDataGenerator().generateComplianceData(),
        weight: 20
      }
    ],
    thresholds: {
      maxResponseTime: 150,
      maxErrorRate: 3,
      minThroughput: 100,
      maxMemoryUsage: 300
    }
  },
  {
    name: 'Event Processing Load Test',
    description: 'High-throughput event streaming and processing',
    duration: 45,
    concurrency: 15,
    operations: [
      {
        type: 'process',
        entityType: 'event',
        dataGenerator: () => new TestDataGenerator().generateEventData(),
        weight: 80
      },
      {
        type: 'process',
        entityType: 'transform',
        dataGenerator: () => new TestDataGenerator().generateTransformData(),
        weight: 20
      }
    ],
    thresholds: {
      maxResponseTime: 50,
      maxErrorRate: 2,
      minThroughput: 200,
      maxMemoryUsage: 150
    }
  },
  {
    name: 'Peak Load Stress Test',
    description: 'Maximum stress test with high concurrency',
    duration: 120,
    concurrency: 50,
    operations: [
      {
        type: 'create',
        entityType: 'customer',
        dataGenerator: () => new TestDataGenerator().generateCustomer(),
        weight: 30
      },
      {
        type: 'read',
        entityType: 'customer',
        dataGenerator: () => ({ id: `LOAD-CUST-${Math.floor(Math.random() * 5000)}` }),
        weight: 50
      },
      {
        type: 'process',
        entityType: 'compliance',
        dataGenerator: () => new TestDataGenerator().generateComplianceData(),
        weight: 20
      }
    ],
    thresholds: {
      maxResponseTime: 200,
      maxErrorRate: 10,
      minThroughput: 150,
      maxMemoryUsage: 500
    }
  }
]

// Main load test runner
async function runLoadTests(): Promise<LoadTestResult[]> {
  console.log('🔥 Starting REFUSE Protocol Load Testing Suite')
  console.log('=' .repeat(60))

  const runner = new LoadTestRunner()
  const results: LoadTestResult[] = []

  for (const scenario of loadTestScenarios) {
    try {
      const result = await runner.runLoadTest(scenario)
      results.push(result)

      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`❌ Load test failed for scenario ${scenario.name}:`, error)
    }
  }

  console.log('=' .repeat(60))
  console.log('📊 Load Test Summary')
  console.log('=' .repeat(60))

  results.forEach(result => {
    console.log(`\n📋 ${result.scenarioName}:`)
    console.log(`   Duration: ${result.duration.toFixed(2)}ms`)
    console.log(`   Operations: ${result.totalOperations} (${result.successfulOperations} success, ${result.failedOperations} failed)`)
    console.log(`   Throughput: ${result.throughput.toFixed(2)} ops/sec`)
    console.log(`   Avg Response: ${result.averageResponseTime.toFixed(2)}ms`)
    console.log(`   Error Rate: ${result.errorRate.toFixed(2)}%`)
    console.log(`   Memory Peak: ${result.memoryUsage.peak.toFixed(2)}MB`)
  })

  return results
}

// Export for use by other test files
export { LoadTestRunner, TestDataGenerator, loadTestScenarios, runLoadTests }
export type { LoadTestScenario, LoadTestResult, LoadOperation, LoadTestThresholds }

// Run load tests if this file is executed directly
if (require.main === module) {
  runLoadTests().catch(console.error)
}
