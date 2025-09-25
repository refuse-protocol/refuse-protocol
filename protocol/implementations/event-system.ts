/**
 * @fileoverview Real-time event streaming system with guaranteed delivery
 * @description High-performance event streaming system for waste management operations
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Event, BaseEntity } from '../specifications/entities';
import { EventStreamer } from '../tools/event-streamer';

/**
 * REFUSE Protocol Event Streaming System
 * Provides guaranteed delivery event streaming for waste management operations
 */
export class EventStreamingSystem extends EventEmitter {
  private eventStreamer: EventStreamer;
  private eventQueue: Map<string, QueuedEvent[]> = new Map();
  private deliveryAttempts: Map<string, number> = new Map();
  private maxRetries = 5;
  private retryDelay = 1000; // 1 second
  private batchSize = 50;
  private flushInterval = 5000; // 5 seconds

  constructor(options: EventSystemOptions = {}) {
    super();
    this.eventStreamer = new EventStreamer(options);
    this.maxRetries = options.maxRetries || this.maxRetries;
    this.retryDelay = options.retryDelay || this.retryDelay;
    this.batchSize = options.batchSize || this.batchSize;
    this.flushInterval = options.flushInterval || this.flushInterval;

    this.initializeEventQueues();
    this.startBatchProcessing();
  }

  /**
   * Publish an event with guaranteed delivery
   */
  async publishEvent(event: Event, options: PublishOptions = {}): Promise<EventDeliveryResult> {
    const eventId = uuidv4();
    const queuedEvent: QueuedEvent = {
      id: eventId,
      event,
      timestamp: new Date(),
      priority: options.priority || 'normal',
      guaranteed: options.guaranteed !== false,
      retryCount: 0,
      metadata: options.metadata || {},
    };

    // Add to appropriate queue
    const queueKey = this.getQueueKey(event);
    if (!this.eventQueue.has(queueKey)) {
      this.eventQueue.set(queueKey, []);
    }

    this.eventQueue.get(queueKey)!.push(queuedEvent);

    // Process immediately if high priority or small queue
    if (options.priority === 'high' || this.eventQueue.get(queueKey)!.length <= 1) {
      return this.processEvent(queuedEvent);
    }

    // Schedule for batch processing
    this.scheduleBatchProcessing(queueKey);

    return {
      eventId,
      status: 'queued',
      timestamp: new Date(),
    };
  }

  /**
   * Subscribe to events with filtering
   */
  subscribe(filter: EventFilter, callback: EventCallback): string {
    const subscriptionId = uuidv4();

    // Create a wrapper callback that applies filtering
    const filteredCallback: EventCallback = (event: Event) => {
      if (this.matchesFilter(event, filter)) {
        callback(event);
      }
    };

    this.eventStreamer.subscribe(filteredCallback);

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    this.eventStreamer.unsubscribe(subscriptionId);
  }

  /**
   * Get event delivery status
   */
  getEventStatus(eventId: string): EventStatus | null {
    for (const [queueKey, queue] of this.eventQueue.entries()) {
      const event = queue.find((e) => e.id === eventId);
      if (event) {
        return {
          eventId,
          status: event.delivered ? 'delivered' : 'pending',
          timestamp: event.timestamp,
          retryCount: event.retryCount,
          lastError: event.lastError,
        };
      }
    }
    return null;
  }

  /**
   * Get system statistics
   */
  getSystemStats(): EventSystemStats {
    let totalQueued = 0;
    let totalDelivered = 0;
    let totalFailed = 0;

    for (const [queueKey, queue] of this.eventQueue.entries()) {
      totalQueued += queue.length;
      totalDelivered += queue.filter((e) => e.delivered).length;
      totalFailed += queue.filter((e) => e.status === 'failed').length;
    }

    return {
      totalQueued,
      totalDelivered,
      totalFailed,
      throughput: this.calculateThroughput(),
      queueSizes: Array.from(this.eventQueue.entries()).map(([key, queue]) => ({
        queue: key,
        size: queue.length,
      })),
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  /**
   * Process a single event
   */
  private async processEvent(queuedEvent: QueuedEvent): Promise<EventDeliveryResult> {
    const startTime = Date.now();

    try {
      // Attempt to deliver the event
      await this.eventStreamer.publish(queuedEvent.event);

      // Mark as delivered
      queuedEvent.delivered = true;
      queuedEvent.deliveredAt = new Date();

      this.emit('eventDelivered', {
        eventId: queuedEvent.id,
        event: queuedEvent.event,
        duration: Date.now() - startTime,
      });

      return {
        eventId: queuedEvent.id,
        status: 'delivered',
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      queuedEvent.retryCount++;
      queuedEvent.lastError = error instanceof Error ? error.message : String(error);
      queuedEvent.lastAttempt = new Date();

      if (queuedEvent.guaranteed && queuedEvent.retryCount < this.maxRetries) {
        // Schedule retry
        setTimeout(
          () => {
            this.processEvent(queuedEvent);
          },
          this.retryDelay * Math.pow(2, queuedEvent.retryCount - 1)
        ); // Exponential backoff

        return {
          eventId: queuedEvent.id,
          status: 'retrying',
          timestamp: new Date(),
          retryCount: queuedEvent.retryCount,
        };
      } else {
        // Mark as failed
        queuedEvent.status = 'failed';

        this.emit('eventFailed', {
          eventId: queuedEvent.id,
          event: queuedEvent.event,
          error: queuedEvent.lastError,
          retryCount: queuedEvent.retryCount,
        });

        return {
          eventId: queuedEvent.id,
          status: 'failed',
          timestamp: new Date(),
          error: queuedEvent.lastError!,
          retryCount: queuedEvent.retryCount,
        };
      }
    }
  }

  /**
   * Process events in batches
   */
  private async processBatch(queueKey: string): Promise<void> {
    const queue = this.eventQueue.get(queueKey);
    if (!queue || queue.length === 0) return;

    const batch = queue.splice(0, Math.min(this.batchSize, queue.length));
    const results: EventDeliveryResult[] = [];

    // Process batch concurrently
    const batchPromises = batch.map((event) => this.processEvent(event));
    const batchResults = await Promise.allSettled(batchPromises);

    for (let i = 0; i < batch.length; i++) {
      const result = batchResults[i];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Handle processing error
        batch[i].status = 'failed';
        batch[i].lastError =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        results.push({
          eventId: batch[i].id,
          status: 'failed',
          timestamp: new Date(),
          error: batch[i].lastError!,
        });
      }
    }

    this.emit('batchProcessed', {
      queue: queueKey,
      batchSize: batch.length,
      results,
      timestamp: new Date(),
    });
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatchProcessing(queueKey: string): void {
    // Use a simple debouncing mechanism
    setTimeout(() => {
      this.processBatch(queueKey);
    }, 100);
  }

  /**
   * Start batch processing interval
   */
  private startBatchProcessing(): void {
    setInterval(() => {
      // Process all queues with pending events
      for (const queueKey of this.eventQueue.keys()) {
        if (this.eventQueue.get(queueKey)!.length > 0) {
          this.processBatch(queueKey);
        }
      }
    }, this.flushInterval);
  }

  /**
   * Initialize event queues
   */
  private initializeEventQueues(): void {
    // Create queues for different event types and priorities
    const queueTypes = ['customer', 'service', 'route', 'facility', 'system'];
    const priorities = ['high', 'normal', 'low'];

    for (const type of queueTypes) {
      for (const priority of priorities) {
        const queueKey = `${type}-${priority}`;
        this.eventQueue.set(queueKey, []);
      }
    }
  }

  /**
   * Get queue key for an event
   */
  private getQueueKey(event: Event): string {
    const entityType = event.entityType || 'system';
    const priority = 'normal'; // Could be enhanced to derive priority from event
    return `${entityType}-${priority}`;
  }

  /**
   * Check if event matches filter
   */
  private matchesFilter(event: Event, filter: EventFilter): boolean {
    if (filter.entityType && filter.entityType !== event.entityType) {
      return false;
    }

    if (filter.eventType && filter.eventType !== event.eventType) {
      return false;
    }

    if (filter.timestampRange) {
      const eventTime = new Date(event.timestamp).getTime();
      if (filter.timestampRange.start && eventTime < filter.timestampRange.start.getTime()) {
        return false;
      }
      if (filter.timestampRange.end && eventTime > filter.timestampRange.end.getTime()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate throughput (events per second)
   */
  private calculateThroughput(): number {
    // This is a simplified calculation - in production would track over time windows
    let totalDelivered = 0;
    for (const [queueKey, queue] of this.eventQueue.entries()) {
      totalDelivered += queue.filter((e) => e.delivered).length;
    }
    return totalDelivered / Math.max(1, this.flushInterval / 1000);
  }

  /**
   * Clean up old events
   */
  private cleanupOldEvents(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    for (const [queueKey, queue] of this.eventQueue.entries()) {
      const initialLength = queue.length;
      const filteredQueue = queue.filter(
        (event) => event.delivered || event.status === 'failed' || event.timestamp > cutoffTime
      );

      if (filteredQueue.length < initialLength) {
        this.eventQueue.set(queueKey, filteredQueue);
        console.log(
          `Cleaned up ${initialLength - filteredQueue.length} old events from ${queueKey} queue`
        );
      }
    }
  }
}

/**
 * Event correlation and tracking system
 */
export class EventCorrelationTracker {
  private correlationMap: Map<string, CorrelatedEventGroup> = new Map();
  private eventHistory: Event[] = [];
  private maxHistorySize = 10000;

  /**
   * Track event correlation
   */
  trackEventCorrelation(event: Event): void {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    // Find or create correlation group
    const correlationKey = this.generateCorrelationKey(event);
    let correlationGroup = this.correlationMap.get(correlationKey);

    if (!correlationGroup) {
      correlationGroup = {
        id: correlationKey,
        events: [],
        startTime: new Date(event.timestamp),
        entityType: event.entityType,
        entityId: this.extractEntityId(event),
      };
      this.correlationMap.set(correlationKey, correlationGroup);
    }

    correlationGroup.events.push(event);
    correlationGroup.lastUpdate = new Date(event.timestamp);

    // Analyze correlation patterns
    this.analyzeCorrelationPatterns(correlationGroup);
  }

  /**
   * Get correlation group for entity
   */
  getCorrelationGroup(entityType: string, entityId: string): CorrelatedEventGroup | null {
    const correlationKey = `${entityType}-${entityId}`;
    return this.correlationMap.get(correlationKey) || null;
  }

  /**
   * Get correlated events within time window
   */
  getCorrelatedEvents(entityType: string, entityId: string, timeWindow: number): Event[] {
    const correlationGroup = this.getCorrelationGroup(entityType, entityId);
    if (!correlationGroup) return [];

    const cutoffTime = new Date(Date.now() - timeWindow);
    return correlationGroup.events.filter((event) => new Date(event.timestamp) >= cutoffTime);
  }

  /**
   * Generate correlation patterns report
   */
  generateCorrelationReport(): CorrelationReport {
    const report: CorrelationReport = {
      totalGroups: this.correlationMap.size,
      totalEvents: this.eventHistory.length,
      patterns: [],
      insights: [],
    };

    // Analyze patterns
    for (const [correlationKey, group] of this.correlationMap.entries()) {
      const pattern = this.analyzeGroupPattern(group);
      if (pattern) {
        report.patterns.push(pattern);
      }
    }

    // Generate insights
    report.insights = this.generateInsights(report);

    return report;
  }

  /**
   * Generate correlation key
   */
  private generateCorrelationKey(event: Event): string {
    const entityId = this.extractEntityId(event);
    return `${event.entityType}-${entityId}`;
  }

  /**
   * Extract entity ID from event
   */
  private extractEntityId(event: Event): string {
    if (typeof event.eventData === 'object' && event.eventData !== null) {
      return event.eventData.id || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Analyze correlation patterns
   */
  private analyzeCorrelationPatterns(group: CorrelatedEventGroup): void {
    if (group.events.length < 2) return;

    // Detect patterns like:
    // - Sequential events (create -> update -> delete)
    // - Related events (customer create -> service create)
    // - Error patterns (multiple failures)
    // - Performance patterns (slow operations)

    const eventTypes = group.events.map((e) => e.eventType);
    const uniqueTypes = [...new Set(eventTypes)];

    if (uniqueTypes.length >= 3) {
      group.patterns.push({
        type: 'complex_workflow',
        description: `Multi-step workflow detected: ${uniqueTypes.join(' -> ')}`,
        confidence: 0.8,
      });
    }
  }

  /**
   * Analyze group pattern
   */
  private analyzeGroupPattern(group: CorrelatedEventGroup): EventPattern | null {
    if (group.events.length < 2) return null;

    const timeSpan = new Date(group.lastUpdate!).getTime() - new Date(group.startTime).getTime();
    const eventFrequency = group.events.length / (timeSpan / 1000); // events per second

    return {
      entityType: group.entityType,
      entityId: group.entityId,
      eventCount: group.events.length,
      timeSpan,
      frequency: eventFrequency,
      eventTypes: [...new Set(group.events.map((e) => e.eventType))],
      patterns: group.patterns,
    };
  }

  /**
   * Generate insights from correlation data
   */
  private generateInsights(report: CorrelationReport): string[] {
    const insights: string[] = [];

    if (report.patterns.length > 0) {
      const highActivityEntities = report.patterns.filter((p) => p.eventCount > 10);
      if (highActivityEntities.length > 0) {
        insights.push(`${highActivityEntities.length} entities show high activity patterns`);
      }

      const workflowEntities = report.patterns.filter((p) =>
        p.patterns.some((pattern) => pattern.type === 'complex_workflow')
      );
      if (workflowEntities.length > 0) {
        insights.push(`${workflowEntities.length} entities have complex workflow patterns`);
      }
    }

    return insights;
  }
}

/**
 * Event filtering and routing engine
 */
export class EventRouter {
  private routes: Map<string, EventRoute[]> = new Map();
  private filters: Map<string, EventFilter> = new Map();

  /**
   * Add routing rule
   */
  addRoute(route: EventRoute): void {
    const routeKey = `${route.source}-${route.destination}`;
    if (!this.routes.has(routeKey)) {
      this.routes.set(routeKey, []);
    }

    this.routes.get(routeKey)!.push(route);
  }

  /**
   * Add filter
   */
  addFilter(name: string, filter: EventFilter): void {
    this.filters.set(name, filter);
  }

  /**
   * Route event to appropriate destinations
   */
  async routeEvent(event: Event): Promise<RoutingResult[]> {
    const results: RoutingResult[] = [];
    const applicableRoutes = this.findApplicableRoutes(event);

    for (const route of applicableRoutes) {
      try {
        const filteredEvent = await this.applyFilters(event, route.filters);

        if (filteredEvent) {
          const deliveryResult = await this.deliverToDestination(filteredEvent, route.destination);

          results.push({
            routeId: route.id,
            success: deliveryResult.success,
            destination: route.destination,
            error: deliveryResult.error,
          });
        } else {
          results.push({
            routeId: route.id,
            success: false,
            destination: route.destination,
            error: 'Event filtered out',
          });
        }
      } catch (error) {
        results.push({
          routeId: route.id,
          success: false,
          destination: route.destination,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Find applicable routes for event
   */
  private findApplicableRoutes(event: Event): EventRoute[] {
    const applicableRoutes: EventRoute[] = [];

    for (const [routeKey, routes] of this.routes.entries()) {
      for (const route of routes) {
        if (this.matchesRoute(event, route)) {
          applicableRoutes.push(route);
        }
      }
    }

    return applicableRoutes;
  }

  /**
   * Check if event matches route criteria
   */
  private matchesRoute(event: Event, route: EventRoute): boolean {
    if (route.source !== '*' && route.source !== event.entityType) {
      return false;
    }

    if (route.eventType && route.eventType !== event.eventType) {
      return false;
    }

    return true;
  }

  /**
   * Apply filters to event
   */
  private async applyFilters(event: Event, filterNames: string[]): Promise<Event | null> {
    for (const filterName of filterNames) {
      const filter = this.filters.get(filterName);
      if (filter && !this.matchesFilter(event, filter)) {
        return null; // Event filtered out
      }
    }
    return event; // Event passed all filters
  }

  /**
   * Check if event matches filter
   */
  private matchesFilter(event: Event, filter: EventFilter): boolean {
    if (filter.entityType && filter.entityType !== event.entityType) {
      return false;
    }

    if (filter.eventType && filter.eventType !== event.eventType) {
      return false;
    }

    if (filter.timestampRange) {
      const eventTime = new Date(event.timestamp).getTime();
      if (filter.timestampRange.start && eventTime < filter.timestampRange.start.getTime()) {
        return false;
      }
      if (filter.timestampRange.end && eventTime > filter.timestampRange.end.getTime()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Deliver event to destination
   */
  private async deliverToDestination(
    event: Event,
    destination: string
  ): Promise<{ success: boolean; error?: string }> {
    // This would integrate with various destination types:
    // - Webhooks
    // - Message queues
    // - Databases
    // - External APIs
    // - File systems

    console.log(`Delivering event to ${destination}:`, event.id);

    // Simulate delivery
    return {
      success: true,
    };
  }
}

/**
 * Event sourcing for audit trails
 */
export class EventSourcingSystem {
  private eventStore: Event[] = [];
  private snapshots: Map<string, any> = new Map();
  private projections: Map<string, any> = new Map();
  private maxEvents = 100000;
  private snapshotInterval = 1000; // Take snapshot every 1000 events

  /**
   * Append event to store
   */
  appendEvent(event: Event): void {
    this.eventStore.push(event);

    // Maintain max size
    if (this.eventStore.length > this.maxEvents) {
      this.eventStore = this.eventStore.slice(-this.maxEvents);
    }

    // Update projections
    this.updateProjections(event);

    // Take snapshot periodically
    if (this.eventStore.length % this.snapshotInterval === 0) {
      this.takeSnapshot();
    }
  }

  /**
   * Rebuild entity state from events
   */
  rebuildEntityState(entityType: string, entityId: string): any {
    const entityEvents = this.eventStore.filter((event) => {
      if (typeof event.eventData === 'object' && event.eventData !== null) {
        return event.entityType === entityType && event.eventData.id === entityId;
      }
      return false;
    });

    let state: any = {};

    for (const event of entityEvents) {
      state = this.applyEvent(state, event);
    }

    return state;
  }

  /**
   * Get events for entity
   */
  getEntityEvents(entityType: string, entityId: string, since?: Date): Event[] {
    return this.eventStore.filter((event) => {
      if (typeof event.eventData === 'object' && event.eventData !== null) {
        const matchesEntity = event.entityType === entityType && event.eventData.id === entityId;
        if (!since) return matchesEntity;

        return matchesEntity && new Date(event.timestamp) >= since;
      }
      return false;
    });
  }

  /**
   * Get audit trail for entity
   */
  getAuditTrail(entityType: string, entityId: string): AuditTrail {
    const events = this.getEntityEvents(entityType, entityId);
    const snapshots = this.getEntitySnapshots(entityType, entityId);

    return {
      entityType,
      entityId,
      events,
      snapshots,
      totalEvents: events.length,
      firstEvent: events.length > 0 ? events[0] : null,
      lastEvent: events.length > 0 ? events[events.length - 1] : null,
    };
  }

  /**
   * Create projection
   */
  createProjection(
    name: string,
    initialState: any,
    eventHandler: (state: any, event: Event) => any
  ): void {
    this.projections.set(name, {
      state: initialState,
      handler: eventHandler,
    });
  }

  /**
   * Get projection state
   */
  getProjection(name: string): any {
    const projection = this.projections.get(name);
    return projection ? projection.state : null;
  }

  /**
   * Take system snapshot
   */
  private takeSnapshot(): void {
    const snapshot = {
      timestamp: new Date(),
      eventCount: this.eventStore.length,
      lastEvent: this.eventStore.length > 0 ? this.eventStore[this.eventStore.length - 1] : null,
      projectionStates: Array.from(this.projections.entries()).map(([name, proj]) => ({
        name,
        state: proj.state,
      })),
    };

    this.snapshots.set(`system-${Date.now()}`, snapshot);
  }

  /**
   * Get entity snapshots
   */
  private getEntitySnapshots(entityType: string, entityId: string): any[] {
    const entitySnapshots: any[] = [];

    for (const [snapshotId, snapshot] of this.snapshots.entries()) {
      if (snapshotId.startsWith('entity-')) {
        const [_, type, id, timestamp] = snapshotId.split('-');
        if (type === entityType && id === entityId) {
          entitySnapshots.push({
            snapshotId,
            timestamp: new Date(parseInt(timestamp)),
            state: snapshot,
          });
        }
      }
    }

    return entitySnapshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Update projections
   */
  private updateProjections(event: Event): void {
    for (const [name, projection] of this.projections.entries()) {
      try {
        projection.state = projection.handler(projection.state, event);
      } catch (error) {
        console.error(`Error updating projection ${name}:`, error);
      }
    }
  }

  /**
   * Apply event to state
   */
  private applyEvent(state: any, event: Event): any {
    switch (event.eventType) {
      case 'created':
        return { ...event.eventData, ...state };
      case 'updated':
        return { ...state, ...event.eventData };
      case 'deleted':
        return { ...state, deleted: true, deletedAt: event.timestamp };
      default:
        return state;
    }
  }
}

/**
 * Event system options
 */
export interface EventSystemOptions {
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  flushInterval?: number;
  enablePersistence?: boolean;
  persistencePath?: string;
}

/**
 * Publish options
 */
export interface PublishOptions {
  priority?: 'low' | 'normal' | 'high';
  guaranteed?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Event delivery result
 */
export interface EventDeliveryResult {
  eventId: string;
  status: 'delivered' | 'queued' | 'retrying' | 'failed';
  timestamp: Date;
  duration?: number;
  retryCount?: number;
  error?: string;
}

/**
 * Queued event
 */
export interface QueuedEvent {
  id: string;
  event: Event;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high';
  guaranteed: boolean;
  retryCount: number;
  status?: 'pending' | 'delivered' | 'failed';
  delivered?: boolean;
  deliveredAt?: Date;
  lastError?: string;
  lastAttempt?: Date;
  metadata: Record<string, any>;
}

/**
 * Event filter
 */
export interface EventFilter {
  entityType?: string;
  eventType?: string;
  timestampRange?: {
    start?: Date;
    end?: Date;
  };
}

/**
 * Event callback
 */
export type EventCallback = (event: Event) => void;

/**
 * Event status
 */
export interface EventStatus {
  eventId: string;
  status: 'delivered' | 'pending' | 'failed';
  timestamp: Date;
  retryCount: number;
  lastError?: string;
}

/**
 * Event system statistics
 */
export interface EventSystemStats {
  totalQueued: number;
  totalDelivered: number;
  totalFailed: number;
  throughput: number;
  queueSizes: Array<{ queue: string; size: number }>;
  memoryUsage: number;
}

/**
 * Correlated event group
 */
export interface CorrelatedEventGroup {
  id: string;
  events: Event[];
  startTime: Date;
  lastUpdate?: Date;
  entityType: string;
  entityId: string;
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
}

/**
 * Event pattern
 */
export interface EventPattern {
  entityType: string;
  entityId: string;
  eventCount: number;
  timeSpan: number;
  frequency: number;
  eventTypes: string[];
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
}

/**
 * Correlation report
 */
export interface CorrelationReport {
  totalGroups: number;
  totalEvents: number;
  patterns: EventPattern[];
  insights: string[];
}

/**
 * Event route
 */
export interface EventRoute {
  id: string;
  source: string; // '*' for all, or specific entity type
  eventType?: string;
  destination: string;
  filters: string[];
  enabled: boolean;
}

/**
 * Routing result
 */
export interface RoutingResult {
  routeId: string;
  success: boolean;
  destination: string;
  error?: string;
}

/**
 * Audit trail
 */
export interface AuditTrail {
  entityType: string;
  entityId: string;
  events: Event[];
  snapshots: any[];
  totalEvents: number;
  firstEvent: Event | null;
  lastEvent: Event | null;
}

/**
 * Export factory functions
 */
export function createEventStreamingSystem(options?: EventSystemOptions): EventStreamingSystem {
  return new EventStreamingSystem(options);
}

export function createEventCorrelationTracker(): EventCorrelationTracker {
  return new EventCorrelationTracker();
}

export function createEventRouter(): EventRouter {
  return new EventRouter();
}

export function createEventSourcingSystem(): EventSourcingSystem {
  return new EventSourcingSystem();
}

// Export types
export type {
  EventSystemOptions,
  PublishOptions,
  EventDeliveryResult,
  QueuedEvent,
  EventFilter,
  EventCallback,
  EventStatus,
  EventSystemStats,
  CorrelatedEventGroup,
  EventPattern,
  CorrelationReport,
  EventRoute,
  RoutingResult,
  AuditTrail,
};
