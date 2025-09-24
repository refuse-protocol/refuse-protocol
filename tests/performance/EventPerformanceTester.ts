/**
 * Event Performance Tester
 * Tests performance of REFUSE Protocol event system components
 */

import { EventEmitter } from 'events'

export class EventPerformanceTester {

  async testEventStreamingThroughput(): Promise<any> {
    const emitter = new EventEmitter()
    let receivedEvents = 0
    let processedEvents = 0

    // Set up event handlers
    emitter.on('data', (data: any) => {
      receivedEvents++
      // Simulate event processing
      if (data.id && data.type) {
        processedEvents++
      }
    })

    const eventCount = 10000
    const startTime = performance.now()

    // Emit events at high rate
    for (let i = 0; i < eventCount; i++) {
      emitter.emit('data', {
        id: `event-${i}`,
        type: 'material_ticket',
        timestamp: new Date(),
        data: { value: Math.random() }
      })
    }

    // Wait for all events to be processed
    await new Promise(resolve => setTimeout(resolve, 100))

    const endTime = performance.now()

    return {
      eventCount,
      receivedEvents,
      processedEvents,
      throughput: (receivedEvents / (endTime - startTime)) * 1000, // events per second
      processingEfficiency: (processedEvents / receivedEvents) * 100
    }
  }

  async testEventCorrelationPerformance(): Promise<any> {
    const emitter = new EventEmitter()
    const correlations: any[] = []
    let correlationCount = 0

    // Set up correlation logic
    emitter.on('route_event', (event: any) => {
      correlations.push({
        eventId: event.id,
        type: event.type,
        timestamp: event.timestamp,
        correlated: false
      })
    })

    emitter.on('material_event', (event: any) => {
      // Find correlated route events
      const correlated = correlations.filter(c =>
        c.type === 'route_start' &&
        !c.correlated &&
        Math.abs(event.timestamp - c.timestamp) < 1000
      )

      correlated.forEach(c => {
        c.correlated = true
        correlationCount++
      })
    })

    const routeEventCount = 2000
    const materialEventCount = 2000
    const startTime = performance.now()

    // Emit route events
    for (let i = 0; i < routeEventCount; i++) {
      emitter.emit('route_event', {
        id: `route-${i}`,
        type: 'route_start',
        timestamp: Date.now() + Math.random() * 2000
      })
    }

    // Emit material events
    for (let i = 0; i < materialEventCount; i++) {
      emitter.emit('material_event', {
        id: `material-${i}`,
        type: 'ticket_processed',
        timestamp: Date.now() + Math.random() * 2000
      })
    }

    const endTime = performance.now()

    return {
      routeEvents: routeEventCount,
      materialEvents: materialEventCount,
      correlations: correlationCount,
      correlationRate: (correlationCount / routeEventCount) * 100,
      processingTime: endTime - startTime
    }
  }

  async testEventRoutingPerformance(): Promise<any> {
    const emitter = new EventEmitter()
    const routes = ['high_priority', 'normal_priority', 'low_priority']
    const routedEvents: any = { high_priority: 0, normal_priority: 0, low_priority: 0 }

    // Set up routing logic
    emitter.on('event', (event: any) => {
      if (event.priority >= 8) {
        routedEvents.high_priority++
      } else if (event.priority >= 5) {
        routedEvents.normal_priority++
      } else {
        routedEvents.low_priority++
      }
    })

    const eventCount = 5000
    const startTime = performance.now()

    // Emit events with different priorities
    for (let i = 0; i < eventCount; i++) {
      emitter.emit('event', {
        id: `event-${i}`,
        priority: Math.floor(Math.random() * 10) + 1,
        type: 'material_ticket',
        data: { value: Math.random() }
      })
    }

    const endTime = performance.now()

    return {
      totalEvents: eventCount,
      routedEvents,
      routingDistribution: {
        high: (routedEvents.high_priority / eventCount) * 100,
        normal: (routedEvents.normal_priority / eventCount) * 100,
        low: (routedEvents.low_priority / eventCount) * 100
      },
      routingTime: endTime - startTime,
      throughput: (eventCount / (endTime - startTime)) * 1000
    }
  }

  async testEventSourcingPerformance(): Promise<any> {
    const emitter = new EventEmitter()
    const eventStore: any[] = []
    let appendCount = 0
    let rebuildCount = 0

    // Set up event sourcing
    emitter.on('entity_event', (event: any) => {
      eventStore.push({
        id: event.id,
        type: event.type,
        entityId: event.entityId,
        entityType: event.entityType,
        data: event.data,
        timestamp: event.timestamp,
        version: appendCount + 1
      })
      appendCount++
    })

    const entityCount = 1000
    const eventCountPerEntity = 10
    const startTime = performance.now()

    // Generate events for multiple entities
    for (let entityId = 0; entityId < entityCount; entityId++) {
      for (let eventSeq = 0; eventSeq < eventCountPerEntity; eventSeq++) {
        emitter.emit('entity_event', {
          id: `event-${entityId}-${eventSeq}`,
          entityId: `entity-${entityId}`,
          entityType: 'material_ticket',
          type: 'processed',
          data: { status: 'completed', weight: Math.random() * 10 },
          timestamp: Date.now()
        })
      }
    }

    // Test event store rebuilding
    const entitiesToRebuild = 100
    for (let i = 0; i < entitiesToRebuild; i++) {
      const entityId = `entity-${Math.floor(Math.random() * entityCount)}`
      const entityEvents = eventStore.filter(e => e.entityId === entityId)
      if (entityEvents.length > 0) {
        rebuildCount++
      }
    }

    const endTime = performance.now()

    return {
      totalEvents: entityCount * eventCountPerEntity,
      eventStoreSize: eventStore.length,
      appendOperations: appendCount,
      rebuildOperations: rebuildCount,
      storeEfficiency: (appendCount / eventStore.length) * 100,
      rebuildTime: endTime - startTime,
      throughput: (appendCount / (endTime - startTime)) * 1000
    }
  }
}
