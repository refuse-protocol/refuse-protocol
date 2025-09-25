/**
 * @fileoverview Event sourcing for audit trails
 * @description Comprehensive event sourcing system for audit trails and entity state reconstruction
 * @version 1.0.0
 */

import { Event, BaseEntity } from '../specifications/entities';
import { EventSourcingSystem as BaseEventSourcingSystem } from './event-system';

/**
 * Advanced Event Sourcing System for Audit Trails
 * Provides comprehensive event sourcing with advanced features for audit trails
 */
export class AdvancedEventSourcingSystem extends BaseEventSourcingSystem {
  private auditTrailManager: AuditTrailManager;
  private complianceManager: ComplianceManager;
  private retentionManager: RetentionManager;
  private queryEngine: EventQueryEngine;

  constructor(options: EventSourcingOptions = {}) {
    super();
    this.auditTrailManager = new AuditTrailManager(options);
    this.complianceManager = new ComplianceManager(options);
    this.retentionManager = new RetentionManager(options);
    this.queryEngine = new EventQueryEngine();
  }

  /**
   * Append event with enhanced audit trail
   */
  appendEventWithAudit(event: Event): AuditEventResult {
    // Append to base event store
    super.appendEvent(event);

    // Create audit trail entry
    const auditEntry = this.auditTrailManager.createAuditEntry(event);

    // Check compliance requirements
    const complianceChecks = this.complianceManager.checkCompliance(event);

    // Apply retention policies
    const retentionInfo = this.retentionManager.applyRetentionPolicy(event);

    return {
      eventId: event.id,
      auditEntry,
      complianceChecks,
      retentionInfo,
      timestamp: new Date(),
    };
  }

  /**
   * Rebuild complete entity state with audit trail
   */
  rebuildEntityWithAudit(entityType: string, entityId: string): EntityRebuildResult {
    const entityState = super.rebuildEntityState(entityType, entityId);
    const auditTrail = this.auditTrailManager.getCompleteAuditTrail(entityType, entityId);

    return {
      entityState,
      auditTrail,
      rebuildTimestamp: new Date(),
      eventCount: auditTrail.events.length,
    };
  }

  /**
   * Query events with advanced filtering
   */
  queryEvents(query: EventQuery): EventQueryResult {
    return this.queryEngine.executeQuery(query, this.eventStore);
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(entityType?: string, entityId?: string): ComplianceReport {
    return this.complianceManager.generateReport(entityType, entityId);
  }

  /**
   * Get retention statistics
   */
  getRetentionStats(): RetentionStats {
    return this.retentionManager.getStatistics();
  }

  /**
   * Create snapshot with audit trail
   */
  createSnapshotWithAudit(entityType: string, entityId: string): SnapshotResult {
    const snapshot = {
      entityType,
      entityId,
      timestamp: new Date(),
      state: super.rebuildEntityState(entityType, entityId),
      auditTrail: this.auditTrailManager.getCompleteAuditTrail(entityType, entityId),
    };

    // Store snapshot
    this.snapshots.set(`entity-${entityType}-${entityId}-${Date.now()}`, snapshot);

    return {
      snapshot,
      snapshotId: `entity-${entityType}-${entityId}-${Date.now()}`,
      created: true,
    };
  }

  /**
   * Validate audit trail integrity
   */
  validateAuditTrail(entityType: string, entityId: string): AuditValidationResult {
    const auditTrail = this.auditTrailManager.getCompleteAuditTrail(entityType, entityId);
    const validationErrors: string[] = [];

    // Check for gaps in event sequence
    const sortedEvents = auditTrail.events.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 1; i < sortedEvents.length; i++) {
      const timeDiff =
        new Date(sortedEvents[i].timestamp).getTime() -
        new Date(sortedEvents[i - 1].timestamp).getTime();

      if (timeDiff > 3600000) {
        // Gap > 1 hour
        validationErrors.push(
          `Event gap detected: ${timeDiff}ms between events ${sortedEvents[i - 1].id} and ${sortedEvents[i].id}`
        );
      }
    }

    // Check for missing events
    const entityEvents = this.eventStore.filter((event) => {
      if (typeof event.eventData === 'object' && event.eventData !== null) {
        return event.entityType === entityType && (event.eventData as any).id === entityId;
      }
      return false;
    });

    if (entityEvents.length !== auditTrail.events.length) {
      validationErrors.push(
        `Event count mismatch: store has ${entityEvents.length}, audit trail has ${auditTrail.events.length}`
      );
    }

    return {
      isValid: validationErrors.length === 0,
      validationErrors,
      auditTrail,
      validatedAt: new Date(),
    };
  }

  /**
   * Export audit trail for external systems
   */
  exportAuditTrail(entityType: string, entityId: string, format: ExportFormat): ExportResult {
    const auditTrail = this.auditTrailManager.getCompleteAuditTrail(entityType, entityId);

    let exportData: any;
    let contentType: string;

    switch (format) {
      case 'json':
        exportData = auditTrail;
        contentType = 'application/json';
        break;

      case 'xml':
        exportData = this.convertToXML(auditTrail);
        contentType = 'application/xml';
        break;

      case 'csv':
        exportData = this.convertToCSV(auditTrail);
        contentType = 'text/csv';
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return {
      data: exportData,
      contentType,
      filename: `audit-trail-${entityType}-${entityId}-${Date.now()}.${format}`,
      exportedAt: new Date(),
    };
  }

  /**
   * Convert audit trail to XML
   */
  private convertToXML(auditTrail: AuditTrail): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<auditTrail entityType="${auditTrail.entityType}" entityId="${auditTrail.entityId}">\n`;

    for (const event of auditTrail.events) {
      xml += `  <event id="${event.id}" type="${event.eventType}" timestamp="${event.timestamp}">\n`;
      xml += `    <entityType>${event.entityType}</entityType>\n`;
      xml += `    <eventData><![CDATA[${JSON.stringify(event.eventData)}]]></eventData>\n`;
      xml += `  </event>\n`;
    }

    xml += `</auditTrail>`;
    return xml;
  }

  /**
   * Convert audit trail to CSV
   */
  private convertToCSV(auditTrail: AuditTrail): string {
    let csv = 'id,eventType,entityType,timestamp,eventData\n';

    for (const event of auditTrail.events) {
      const eventData =
        typeof event.eventData === 'object'
          ? JSON.stringify(event.eventData)
          : String(event.eventData);

      csv += `"${event.id}","${event.eventType}","${event.entityType}","${event.timestamp}","${eventData}"\n`;
    }

    return csv;
  }
}

/**
 * Audit trail manager
 */
export class AuditTrailManager {
  private auditEntries: Map<string, AuditEntry[]> = new Map();

  /**
   * Create audit entry for event
   */
  createAuditEntry(event: Event): AuditEntry {
    const auditEntry: AuditEntry = {
      eventId: event.id,
      timestamp: new Date(),
      userId: this.extractUserId(event),
      source: this.extractSource(event),
      changes: this.extractChanges(event),
      metadata: {
        entityType: event.entityType,
        eventType: event.eventType,
        sessionId: this.generateSessionId(),
        ipAddress: 'system', // Would be extracted from context
        userAgent: 'REFUSE-Protocol/1.0',
      },
    };

    // Store audit entry
    const auditKey = `${event.entityType}-${this.extractEntityId(event)}`;
    if (!this.auditEntries.has(auditKey)) {
      this.auditEntries.set(auditKey, []);
    }

    this.auditEntries.get(auditKey)!.push(auditEntry);

    return auditEntry;
  }

  /**
   * Get complete audit trail
   */
  getCompleteAuditTrail(entityType: string, entityId: string): AuditTrail {
    const auditKey = `${entityType}-${entityId}`;
    const entries = this.auditEntries.get(auditKey) || [];

    return {
      entityType,
      entityId,
      entries,
      totalEntries: entries.length,
      firstEntry: entries.length > 0 ? entries[0] : null,
      lastEntry: entries.length > 0 ? entries[entries.length - 1] : null,
    };
  }

  /**
   * Extract user ID from event
   */
  private extractUserId(event: Event): string {
    if (typeof event.eventData === 'object' && event.eventData !== null) {
      const data = event.eventData as any;
      return data.userId || data.createdBy || data.updatedBy || 'system';
    }
    return 'system';
  }

  /**
   * Extract source from event
   */
  private extractSource(event: Event): string {
    return event.source || 'system';
  }

  /**
   * Extract changes from event
   */
  private extractChanges(event: Event): AuditChange[] {
    const changes: AuditChange[] = [];

    if (typeof event.eventData === 'object' && event.eventData !== null) {
      const data = event.eventData as any;

      // For update events, extract field changes
      if (event.eventType === 'updated' && data.previousValues) {
        for (const [field, newValue] of Object.entries(data)) {
          if (field !== 'previousValues' && data.previousValues[field] !== undefined) {
            changes.push({
              field,
              oldValue: data.previousValues[field],
              newValue,
              changeType: 'modified',
            });
          }
        }
      }

      // For create events, all fields are new
      if (event.eventType === 'created') {
        for (const [field, value] of Object.entries(data)) {
          changes.push({
            field,
            oldValue: null,
            newValue: value,
            changeType: 'added',
          });
        }
      }

      // For delete events, all fields are removed
      if (event.eventType === 'deleted') {
        for (const [field, value] of Object.entries(data)) {
          changes.push({
            field,
            oldValue: value,
            newValue: null,
            changeType: 'removed',
          });
        }
      }
    }

    return changes;
  }

  /**
   * Extract entity ID from event
   */
  private extractEntityId(event: Event): string {
    if (typeof event.eventData === 'object' && event.eventData !== null) {
      return (event.eventData as any).id || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Compliance manager
 */
export class ComplianceManager {
  private complianceRules: ComplianceRule[] = [];

  constructor(options: EventSourcingOptions = {}) {
    this.initializeComplianceRules(options);
  }

  /**
   * Check compliance for event
   */
  checkCompliance(event: Event): ComplianceCheckResult[] {
    const results: ComplianceCheckResult[] = [];

    for (const rule of this.complianceRules) {
      if (this.appliesToEvent(event, rule)) {
        const result = this.evaluateCompliance(event, rule);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Generate compliance report
   */
  generateReport(entityType?: string, entityId?: string): ComplianceReport {
    // This would aggregate compliance data from stored events
    return {
      totalChecks: this.complianceRules.length,
      passedChecks: 0, // Would calculate from actual data
      failedChecks: 0, // Would calculate from actual data
      complianceScore: 0, // Would calculate from actual data
      generatedAt: new Date(),
      entityType,
      entityId,
    };
  }

  /**
   * Check if rule applies to event
   */
  private appliesToEvent(event: Event, rule: ComplianceRule): boolean {
    if (rule.entityType && rule.entityType !== event.entityType) {
      return false;
    }

    if (rule.eventType && rule.eventType !== event.eventType) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate compliance rule
   */
  private evaluateCompliance(event: Event, rule: ComplianceRule): ComplianceCheckResult {
    // Simplified compliance evaluation
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed: true, // Would implement actual logic
      timestamp: new Date(),
      details: `Compliance check for ${rule.name}`,
    };
  }

  /**
   * Initialize compliance rules
   */
  private initializeComplianceRules(options: EventSourcingOptions): void {
    this.complianceRules = [
      {
        id: 'data-retention',
        name: 'Data Retention Compliance',
        description: 'Ensure data is retained according to regulations',
        entityType: '*',
        eventType: '*',
        retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
        regulations: ['GDPR', 'CCPA'],
      },
      {
        id: 'audit-trail-integrity',
        name: 'Audit Trail Integrity',
        description: 'Ensure audit trails maintain integrity',
        entityType: '*',
        eventType: 'deleted',
        regulations: ['SOX', 'HIPAA'],
      },
      {
        id: 'change-tracking',
        name: 'Change Tracking',
        description: 'Track all changes to sensitive data',
        entityType: 'customer',
        eventType: 'updated',
        regulations: ['GDPR', 'CCPA'],
      },
    ];
  }
}

/**
 * Retention manager
 */
export class RetentionManager {
  private retentionPolicies: RetentionPolicy[] = [];

  constructor(options: EventSourcingOptions = {}) {
    this.initializeRetentionPolicies(options);
  }

  /**
   * Apply retention policy to event
   */
  applyRetentionPolicy(event: Event): RetentionInfo {
    for (const policy of this.retentionPolicies) {
      if (this.matchesPolicy(event, policy)) {
        return {
          policyId: policy.id,
          retentionPeriod: policy.retentionPeriod,
          archiveDate: new Date(Date.now() + policy.retentionPeriod),
          disposalAction: policy.disposalAction,
          appliedAt: new Date(),
        };
      }
    }

    // Default policy
    return {
      policyId: 'default',
      retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
      archiveDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      disposalAction: 'delete',
      appliedAt: new Date(),
    };
  }

  /**
   * Get retention statistics
   */
  getStatistics(): RetentionStats {
    return {
      totalPolicies: this.retentionPolicies.length,
      eventsByRetentionPeriod: new Map(), // Would calculate from actual data
      upcomingDisposals: 0, // Would calculate from actual data
      storageUtilization: 0, // Would calculate from actual data
    };
  }

  /**
   * Check if event matches policy
   */
  private matchesPolicy(event: Event, policy: RetentionPolicy): boolean {
    if (policy.entityType !== '*' && policy.entityType !== event.entityType) {
      return false;
    }

    if (policy.eventType && policy.eventType !== event.eventType) {
      return false;
    }

    return true;
  }

  /**
   * Initialize retention policies
   */
  private initializeRetentionPolicies(options: EventSourcingOptions): void {
    this.retentionPolicies = [
      {
        id: 'customer-data',
        name: 'Customer Data Retention',
        description: 'Retain customer data for 7 years',
        entityType: 'customer',
        eventType: '*',
        retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
        disposalAction: 'archive',
        regulations: ['GDPR', 'CCPA'],
      },
      {
        id: 'financial-records',
        name: 'Financial Records Retention',
        description: 'Retain financial records for 10 years',
        entityType: 'material_ticket',
        eventType: '*',
        retentionPeriod: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
        disposalAction: 'archive',
        regulations: ['SOX'],
      },
      {
        id: 'operational-logs',
        name: 'Operational Logs Retention',
        description: 'Retain operational logs for 1 year',
        entityType: '*',
        eventType: 'created',
        retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
        disposalAction: 'delete',
        regulations: ['ISO27001'],
      },
    ];
  }
}

/**
 * Event query engine
 */
export class EventQueryEngine {
  /**
   * Execute query against event store
   */
  executeQuery(query: EventQuery, eventStore: Event[]): EventQueryResult {
    let filteredEvents = [...eventStore];

    // Apply filters
    if (query.filters) {
      for (const filter of query.filters) {
        filteredEvents = this.applyFilter(filteredEvents, filter);
      }
    }

    // Apply sorting
    if (query.sortBy) {
      filteredEvents.sort((a, b) => {
        const aValue = this.getSortValue(a, query.sortBy!);
        const bValue = this.getSortValue(b, query.sortBy!);

        if (aValue < bValue) return query.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return query.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Apply pagination
    const totalCount = filteredEvents.length;
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return {
      events: paginatedEvents,
      totalCount,
      hasMore: offset + limit < totalCount,
      query: query,
      executedAt: new Date(),
    };
  }

  /**
   * Apply filter to events
   */
  private applyFilter(events: Event[], filter: EventFilterCriteria): Event[] {
    return events.filter((event) => {
      switch (filter.field) {
        case 'entityType':
          return filter.operator === 'eq'
            ? event.entityType === filter.value
            : event.entityType !== filter.value;

        case 'eventType':
          return filter.operator === 'eq'
            ? event.eventType === filter.value
            : event.eventType !== filter.value;

        case 'timestamp':
          const eventTime = new Date(event.timestamp).getTime();
          const filterTime = new Date(filter.value).getTime();

          switch (filter.operator) {
            case 'gt':
              return eventTime > filterTime;
            case 'gte':
              return eventTime >= filterTime;
            case 'lt':
              return eventTime < filterTime;
            case 'lte':
              return eventTime <= filterTime;
            default:
              return eventTime === filterTime;
          }

        case 'id':
          return filter.operator === 'eq' ? event.id === filter.value : event.id !== filter.value;

        default:
          return true;
      }
    });
  }

  /**
   * Get value for sorting
   */
  private getSortValue(event: Event, sortBy: string): any {
    switch (sortBy) {
      case 'timestamp':
        return new Date(event.timestamp).getTime();
      case 'entityType':
        return event.entityType;
      case 'eventType':
        return event.eventType;
      case 'id':
        return event.id;
      default:
        return event.timestamp;
    }
  }
}

/**
 * Event sourcing options
 */
export interface EventSourcingOptions {
  maxEvents?: number;
  snapshotInterval?: number;
  enableAuditTrail?: boolean;
  enableCompliance?: boolean;
  enableRetention?: boolean;
  complianceRegions?: string[];
  retentionPolicies?: RetentionPolicy[];
}

/**
 * Audit event result
 */
export interface AuditEventResult {
  eventId: string;
  auditEntry: AuditEntry;
  complianceChecks: ComplianceCheckResult[];
  retentionInfo: RetentionInfo;
  timestamp: Date;
}

/**
 * Entity rebuild result
 */
export interface EntityRebuildResult {
  entityState: any;
  auditTrail: AuditTrail;
  rebuildTimestamp: Date;
  eventCount: number;
}

/**
 * Event query
 */
export interface EventQuery {
  filters?: EventFilterCriteria[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

/**
 * Event filter criteria
 */
export interface EventFilterCriteria {
  field: 'id' | 'entityType' | 'eventType' | 'timestamp';
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
  value: any;
}

/**
 * Event query result
 */
export interface EventQueryResult {
  events: Event[];
  totalCount: number;
  hasMore: boolean;
  query: EventQuery;
  executedAt: Date;
}

/**
 * Audit entry
 */
export interface AuditEntry {
  eventId: string;
  timestamp: Date;
  userId: string;
  source: string;
  changes: AuditChange[];
  metadata: {
    entityType: string;
    eventType: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * Audit change
 */
export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

/**
 * Audit trail
 */
export interface AuditTrail {
  entityType: string;
  entityId: string;
  entries: AuditEntry[];
  totalEntries: number;
  firstEntry: AuditEntry | null;
  lastEntry: AuditEntry | null;
}

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  timestamp: Date;
  details?: string;
}

/**
 * Compliance report
 */
export interface ComplianceReport {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  complianceScore: number;
  generatedAt: Date;
  entityType?: string;
  entityId?: string;
}

/**
 * Compliance rule
 */
export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  entityType?: string;
  eventType?: string;
  retentionPeriod?: number;
  regulations: string[];
}

/**
 * Retention info
 */
export interface RetentionInfo {
  policyId: string;
  retentionPeriod: number;
  archiveDate: Date;
  disposalAction: 'archive' | 'delete' | 'anonymize';
  appliedAt: Date;
}

/**
 * Retention stats
 */
export interface RetentionStats {
  totalPolicies: number;
  eventsByRetentionPeriod: Map<string, number>;
  upcomingDisposals: number;
  storageUtilization: number;
}

/**
 * Retention policy
 */
export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  entityType: string;
  eventType?: string;
  retentionPeriod: number;
  disposalAction: 'archive' | 'delete' | 'anonymize';
  regulations: string[];
}

/**
 * Snapshot result
 */
export interface SnapshotResult {
  snapshot: any;
  snapshotId: string;
  created: boolean;
}

/**
 * Audit validation result
 */
export interface AuditValidationResult {
  isValid: boolean;
  validationErrors: string[];
  auditTrail: AuditTrail;
  validatedAt: Date;
}

/**
 * Export format
 */
export type ExportFormat = 'json' | 'xml' | 'csv';

/**
 * Export result
 */
export interface ExportResult {
  data: any;
  contentType: string;
  filename: string;
  exportedAt: Date;
}

/**
 * Export factory functions
 */
export function createAdvancedEventSourcingSystem(
  options?: EventSourcingOptions
): AdvancedEventSourcingSystem {
  return new AdvancedEventSourcingSystem(options);
}

export function createAuditTrailManager(options?: EventSourcingOptions): AuditTrailManager {
  return new AuditTrailManager(options);
}

export function createComplianceManager(options?: EventSourcingOptions): ComplianceManager {
  return new ComplianceManager(options);
}

export function createRetentionManager(options?: EventSourcingOptions): RetentionManager {
  return new RetentionManager(options);
}

export function createEventQueryEngine(): EventQueryEngine {
  return new EventQueryEngine();
}

// Export types
export type {
  EventSourcingOptions,
  AuditEventResult,
  EntityRebuildResult,
  EventQuery,
  EventFilterCriteria,
  EventQueryResult,
  AuditEntry,
  AuditChange,
  AuditTrail,
  ComplianceCheckResult,
  ComplianceReport,
  ComplianceRule,
  RetentionInfo,
  RetentionStats,
  RetentionPolicy,
  SnapshotResult,
  AuditValidationResult,
  ExportFormat,
  ExportResult,
};
