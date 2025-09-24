/**
 * @fileoverview CustomerRequest entity implementation with approval workflow
 * @description Complete CustomerRequest model with workflow management and approval tracking
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { CustomerRequest, BaseEntity } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * CustomerRequest implementation with comprehensive approval workflow
 */
export class CustomerRequestModel implements CustomerRequest {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  requestNumber: string;
  type: 'new_service' | 'change_service' | 'one_time' | 'inquiry';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  customerId: string;
  serviceType: string;
  requestedDate: Date;
  approvalHistory: Array<{
    step: string;
    timestamp: Date;
    userId: string;
    notes?: string;
  }>;
  relatedServices?: string[];

  private static readonly VALID_TYPES: CustomerRequest['type'][] = [
    'new_service', 'change_service', 'one_time', 'inquiry'
  ];
  private static readonly VALID_STATUSES: CustomerRequest['status'][] = [
    'pending', 'in_review', 'approved', 'rejected', 'completed'
  ];
  private static readonly APPROVAL_STEPS = [
    'submitted', 'initial_review', 'manager_approval', 'final_approval', 'implemented'
  ];

  constructor(data: Partial<CustomerRequest>) {
    this.validateAndAssign(data);
  }

  /**
   * Create a new customer request with validation
   */
  static create(data: Omit<CustomerRequest, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version' | 'requestNumber' | 'approvalHistory'>): CustomerRequestModel {
    const now = new Date();
    const requestNumber = this.generateRequestNumber();
    const customerRequestData: Partial<CustomerRequest> = {
      id: uuidv4(),
      requestNumber,
      approvalHistory: [{
        step: 'submitted',
        timestamp: now,
        userId: data.metadata?.createdBy || 'system',
        notes: 'Initial request submission'
      }],
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'api'
      }
    };

    return new CustomerRequestModel(customerRequestData);
  }

  /**
   * Generate unique request number
   */
  private static generateRequestNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = String(date.getTime()).slice(-6);
    return `REQ-${year}${month}${day}-${timestamp}`;
  }

  /**
   * Update request with optimistic locking
   */
  update(updates: Partial<Omit<CustomerRequest, keyof BaseEntity>>, expectedVersion: number): CustomerRequestModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<CustomerRequest> = {
      ...updates,
      id: this.id,
      version: this.version + 1,
      updatedAt: new Date(),
      metadata: {
        ...this.metadata,
        ...updates.metadata,
        lastModifiedBy: 'system',
        previousVersion: this.version
      }
    };

    return new CustomerRequestModel(updatedData);
  }

  /**
   * Validate and assign customer request data
   */
  private validateAndAssign(data: Partial<CustomerRequest>): void {
    // Required fields validation
    if (!data.requestNumber || typeof data.requestNumber !== 'string') {
      throw new Error('Request number is required and must be a string');
    }

    if (!data.type || !CustomerRequestModel.VALID_TYPES.includes(data.type)) {
      throw new Error(`Request type must be one of: ${CustomerRequestModel.VALID_TYPES.join(', ')}`);
    }

    if (!data.status || !CustomerRequestModel.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Request status must be one of: ${CustomerRequestModel.VALID_STATUSES.join(', ')}`);
    }

    if (!data.customerId || typeof data.customerId !== 'string') {
      throw new Error('Customer ID is required and must be a string');
    }

    if (!data.serviceType || typeof data.serviceType !== 'string') {
      throw new Error('Service type is required and must be a string');
    }

    if (!data.requestedDate || !(data.requestedDate instanceof Date)) {
      throw new Error('Requested date is required and must be a valid date');
    }

    if (!Array.isArray(data.approvalHistory)) {
      throw new Error('Approval history must be an array');
    }

    // Date validation
    if (data.requestedDate < new Date()) {
      throw new Error('Requested date cannot be in the past');
    }

    // Assign validated data
    Object.assign(this, data);
  }

  /**
   * Submit request for approval
   */
  submit(notes?: string): CustomerRequestModel {
    if (this.status !== 'pending') {
      throw new Error('Can only submit pending requests');
    }

    return this.addApprovalStep('submitted', notes || 'Request submitted for approval');
  }

  /**
   * Move to review stage
   */
  moveToReview(userId: string, notes?: string): CustomerRequestModel {
    if (this.status !== 'pending') {
      throw new Error('Can only move pending requests to review');
    }

    return this.addApprovalStep('in_review', notes || 'Request moved to review', userId);
  }

  /**
   * Approve request
   */
  approve(userId: string, notes?: string): CustomerRequestModel {
    if (!['pending', 'in_review'].includes(this.status)) {
      throw new Error('Can only approve pending or in-review requests');
    }

    return this.addApprovalStep('approved', notes || 'Request approved', userId);
  }

  /**
   * Reject request
   */
  reject(userId: string, notes?: string): CustomerRequestModel {
    if (!['pending', 'in_review'].includes(this.status)) {
      throw new Error('Can only reject pending or in-review requests');
    }

    return this.addApprovalStep('rejected', notes || 'Request rejected', userId);
  }

  /**
   * Complete request
   */
  complete(relatedServiceIds: string[], userId: string, notes?: string): CustomerRequestModel {
    if (this.status !== 'approved') {
      throw new Error('Can only complete approved requests');
    }

    const completedData: Partial<CustomerRequest> = {
      status: 'completed',
      relatedServices: relatedServiceIds,
      updatedAt: new Date()
    };

    return this.addApprovalStep('completed', notes || 'Request completed', userId, completedData);
  }

  /**
   * Add approval step to history
   */
  private addApprovalStep(
    step: string,
    notes?: string,
    userId: string = 'system',
    additionalUpdates: Partial<CustomerRequest> = {}
  ): CustomerRequestModel {
    const now = new Date();
    const newApprovalStep = {
      step,
      timestamp: now,
      userId,
      notes
    };

    const updatedHistory = [...this.approvalHistory, newApprovalStep];

    const updatedData: Partial<CustomerRequest> = {
      ...additionalUpdates,
      approvalHistory: updatedHistory,
      updatedAt: now,
      version: this.version + 1,
      metadata: {
        ...this.metadata,
        lastModifiedBy: userId,
        previousVersion: this.version
      }
    };

    return new CustomerRequestModel({
      ...this,
      ...updatedData
    });
  }

  /**
   * Get current approval status
   */
  getCurrentApprovalStatus(): string {
    if (this.approvalHistory.length === 0) {
      return 'not_started';
    }
    return this.approvalHistory[this.approvalHistory.length - 1].step;
  }

  /**
   * Get days since submission
   */
  getDaysSinceSubmission(): number {
    const submissionStep = this.approvalHistory.find(step => step.step === 'submitted');
    if (!submissionStep) return 0;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submissionStep.timestamp.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if request is overdue
   */
  isOverdue(maxDays: number = 30): boolean {
    return this.getDaysSinceSubmission() > maxDays;
  }

  /**
   * Get approval workflow progress
   */
  getWorkflowProgress(): { completedSteps: number; totalSteps: number; percentage: number } {
    const completedSteps = this.approvalHistory.length;
    const totalSteps = CustomerRequestModel.APPROVAL_STEPS.length;
    const percentage = (completedSteps / totalSteps) * 100;

    return {
      completedSteps,
      totalSteps,
      percentage: Math.round(percentage * 100) / 100
    };
  }

  /**
   * Get request priority based on type and age
   */
  getPriority(): 'low' | 'medium' | 'high' | 'urgent' {
    const daysSinceSubmission = this.getDaysSinceSubmission();

    if (this.type === 'new_service' && daysSinceSubmission > 7) {
      return 'urgent';
    }

    if (daysSinceSubmission > 14) {
      return 'high';
    }

    if (daysSinceSubmission > 7) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get request summary for reporting
   */
  getSummary(): Record<string, any> {
    return {
      id: this.id,
      requestNumber: this.requestNumber,
      type: this.type,
      status: this.status,
      customerId: this.customerId,
      serviceType: this.serviceType,
      requestedDate: this.requestedDate,
      daysSinceSubmission: this.getDaysSinceSubmission(),
      currentApprovalStatus: this.getCurrentApprovalStatus(),
      workflowProgress: this.getWorkflowProgress(),
      priority: this.getPriority(),
      isOverdue: this.isOverdue(),
      approvalHistoryCount: this.approvalHistory.length
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): CustomerRequest {
    return {
      id: this.id,
      externalIds: this.externalIds,
      requestNumber: this.requestNumber,
      type: this.type,
      status: this.status,
      customerId: this.customerId,
      serviceType: this.serviceType,
      requestedDate: this.requestedDate,
      approvalHistory: this.approvalHistory,
      relatedServices: this.relatedServices,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<CustomerRequest> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for request changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'customer_request',
      eventType,
      timestamp: new Date(),
      eventData: this.toEventData(),
      version: 1
    };
  }

  /**
   * Validate business rules
   */
  validateBusinessRules(): string[] {
    const errors: string[] = [];

    // Business rule: Requests should not be pending too long
    if (this.status === 'pending' && this.isOverdue(30)) {
      errors.push('Pending requests older than 30 days require immediate attention');
    }

    // Business rule: Rejected requests should have rejection notes
    if (this.status === 'rejected') {
      const rejectionStep = this.approvalHistory.find(step => step.step === 'rejected');
      if (!rejectionStep?.notes) {
        errors.push('Rejected requests must include rejection notes');
      }
    }

    // Business rule: Completed requests should have related services
    if (this.status === 'completed' && (!this.relatedServices || this.relatedServices.length === 0)) {
      errors.push('Completed requests must have associated services');
    }

    return errors;
  }
}

/**
 * CustomerRequest factory for creating requests from legacy data
 */
export class CustomerRequestFactory {
  /**
   * Create request from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): CustomerRequestModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<CustomerRequest> = {
      externalIds: [legacyData.request_id || legacyData.REQUEST_ID || legacyData.id],
      requestNumber: legacyData.request_number || legacyData.REQUEST_NUMBER || CustomerRequestModel['generateRequestNumber'](),
      type: this.mapLegacyRequestType(legacyData.request_type || legacyData.REQUEST_TYPE || legacyData.type),
      status: this.mapLegacyRequestStatus(legacyData.status || legacyData.STATUS || 'pending'),
      customerId: legacyData.customer_id || legacyData.CUSTOMER_ID,
      serviceType: legacyData.service_type || legacyData.SERVICE_TYPE || 'waste',
      requestedDate: new Date(legacyData.requested_date || legacyData.REQUESTED_DATE || Date.now()),
      approvalHistory: this.mapLegacyApprovalHistory(legacyData),
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy waste management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString()
      }
    };

    return CustomerRequestModel.create(mappedData as any);
  }

  /**
   * Map legacy request types
   */
  private static mapLegacyRequestType(legacyType: string): CustomerRequest['type'] {
    const typeMap: Record<string, CustomerRequest['type']> = {
      'new_service': 'new_service',
      'new': 'new_service',
      'change_service': 'change_service',
      'change': 'change_service',
      'one_time': 'one_time',
      'onetime': 'one_time',
      'inquiry': 'inquiry',
      'question': 'inquiry'
    };

    return typeMap[legacyType.toLowerCase()] || 'new_service';
  }

  /**
   * Map legacy request status
   */
  private static mapLegacyRequestStatus(legacyStatus: string): CustomerRequest['status'] {
    const statusMap: Record<string, CustomerRequest['status']> = {
      'pending': 'pending',
      'p': 'pending',
      'in_review': 'in_review',
      'review': 'in_review',
      'approved': 'approved',
      'a': 'approved',
      'rejected': 'rejected',
      'r': 'rejected',
      'completed': 'completed',
      'c': 'completed',
      'done': 'completed'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'pending';
  }

  /**
   * Map legacy approval history
   */
  private static mapLegacyApprovalHistory(legacyData: Record<string, any>): CustomerRequest['approvalHistory'] {
    // Simplified mapping - in production this would handle more complex legacy formats
    const history: CustomerRequest['approvalHistory'] = [];

    if (legacyData.created_date) {
      history.push({
        step: 'submitted',
        timestamp: new Date(legacyData.created_date),
        userId: 'legacy_system',
        notes: 'Migrated from legacy system'
      });
    }

    if (legacyData.approved_date) {
      history.push({
        step: 'approved',
        timestamp: new Date(legacyData.approved_date),
        userId: 'legacy_system',
        notes: 'Auto-approved during migration'
      });
    }

    return history.length > 0 ? history : [{
      step: 'submitted',
      timestamp: new Date(),
      userId: 'migration_system',
      notes: 'Migrated from legacy system'
    }];
  }
}

/**
 * CustomerRequest validator for external validation
 */
export class CustomerRequestValidator {
  /**
   * Validate request data without creating instance
   */
  static validate(data: Partial<CustomerRequest>): { isValid: boolean; errors: string[] } {
    try {
      new CustomerRequestModel(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    }
  }

  /**
   * Validate business rules
   */
  static validateBusinessRules(request: CustomerRequestModel): string[] {
    return request.validateBusinessRules();
  }
}

/**
 * CustomerRequest workflow manager
 */
export class CustomerRequestWorkflowManager {
  /**
   * Get next step in approval workflow
   */
  static getNextApprovalStep(currentStatus: CustomerRequest['status']): string | null {
    const workflow: Record<CustomerRequest['status'], string | null> = {
      'pending': 'in_review',
      'in_review': 'approved',
      'approved': null, // End of workflow
      'rejected': null, // End of workflow
      'completed': null // End of workflow
    };

    return workflow[currentStatus] || null;
  }

  /**
   * Check if status transition is valid
   */
  static isValidStatusTransition(fromStatus: CustomerRequest['status'], toStatus: CustomerRequest['status']): boolean {
    const validTransitions: Record<CustomerRequest['status'], CustomerRequest['status'][]> = {
      'pending': ['in_review', 'rejected'],
      'in_review': ['pending', 'approved', 'rejected'],
      'approved': ['completed'],
      'rejected': ['pending', 'in_review'],
      'completed': [] // No transitions allowed
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  /**
   * Get requests requiring attention
   */
  static getRequestsRequiringAttention(requests: CustomerRequestModel[]): CustomerRequestModel[] {
    return requests.filter(request => {
      if (request.status === 'pending' && request.isOverdue(7)) {
        return true;
      }

      if (request.status === 'in_review' && request.isOverdue(14)) {
        return true;
      }

      return false;
    });
  }
}
