/**
 * @fileoverview Event entity implementation with validation
 * @description Complete Event model with business logic and validation
 * @version 1.0.0
 */

import { Event, BaseEntity } from '../specifications/entities';
import {
  ValidationUtils,
  FormatUtils,
  DataUtils,
  Constants,
  AuditUtils,
  MetadataUtils,
  ConcurrencyError,
  ValidationError
} from './common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Event implementation with full validation and business logic
 */
export class EventModel implements Event {
  id!: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  version!: number;

  entityType!: 'customer' | 'service' | 'route' | 'facility' | 'customer_request';
  eventType!: 'created' | 'updated' | 'completed' | 'cancelled';
  timestamp!: Date;
  eventData!: Record<string, any>;
  correlationId?: string;
  userId?: string;
  sourceSystem?: string;

  // Use constants from common utilities
  private static readonly VALID_ENTITY_TYPES = ['customer', 'service', 'route', 'facility', 'customer_request'];
  private static readonly VALID_EVENT_TYPES = ['created', 'updated', 'completed', 'cancelled'];

  constructor(data: Partial<Event>) {
    this.validateAndAssign(data);
  }

  /**
   * Create a new event with validation
   */
  static create(data: any): EventModel {
    const now = new Date();
    const eventData: Partial<EventModel> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...(data as any).metadata,
        createdBy: 'system',
        source: (data as any).sourceSystem || 'api'
      }
    };

    return new EventModel(eventData);
  }

  /**
   * Update event with optimistic locking
   */
  update(updates: any, expectedVersion: number): EventModel {
    if (this.version !== expectedVersion) {
      throw new ConcurrencyError('event', this.id, expectedVersion, this.version);
    }

    const updatedData: Partial<EventModel> = DataUtils.deepMerge(this as any, updates);
    updatedData.version = this.version + 1;
    updatedData.updatedAt = new Date();
    if (this.metadata) {
      updatedData.metadata = MetadataUtils.updateMetadata(this.metadata, (updates as any).metadata || {});
    }

    return new EventModel(updatedData);
  }

  /**
   * Validate and assign event data
   */
  private validateAndAssign(data: Partial<Event>): void {
    // Validate required fields
    const requiredErrors = ValidationUtils.validateRequired(data, ['entityType', 'eventType', 'timestamp', 'eventData']);
    if (requiredErrors.length > 0) {
      throw new ValidationError(requiredErrors[0], 'event', 'multiple');
    }

    // Validate enum values
    const entityTypeErrors = ValidationUtils.validateEnum(data.entityType, EventModel.VALID_ENTITY_TYPES, 'Entity type');
    if (entityTypeErrors.length > 0) {
      throw new ValidationError(entityTypeErrors[0], 'event', 'entityType');
    }

    const eventTypeErrors = ValidationUtils.validateEnum(data.eventType, EventModel.VALID_EVENT_TYPES, 'Event type');
    if (eventTypeErrors.length > 0) {
      throw new ValidationError(eventTypeErrors[0], 'event', 'eventType');
    }

    // Validate timestamp format
    if (data.timestamp && !(data.timestamp instanceof Date)) {
      try {
        new Date(data.timestamp);
      } catch (error) {
        throw new ValidationError('Invalid timestamp format', 'event', 'timestamp');
      }
    }

    // Assign values
    Object.assign(this, data);

    // Ensure timestamp is a Date object
    if (this.timestamp && typeof this.timestamp === 'string') {
      this.timestamp = new Date(this.timestamp);
    }

    // Validate event data is an object
    if (this.eventData && typeof this.eventData !== 'object') {
      throw new ValidationError('Event data must be an object', 'event', 'eventData');
    }
  }

  /**
   * Get correlation ID for event chaining
   */
  getCorrelationId(): string {
    return this.correlationId || this.id;
  }

  /**
   * Set correlation ID for event chaining
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  /**
   * Check if event is related to another event
   */
  isRelatedTo(otherEvent: EventModel): boolean {
    return this.getCorrelationId() === otherEvent.getCorrelationId();
  }

  /**
   * Get event summary for logging
   */
  getSummary(): string {
    return `${this.eventType} event for ${this.entityType} at ${this.timestamp.toISOString()}`;
  }
}
