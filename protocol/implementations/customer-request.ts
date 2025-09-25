/**
 * @fileoverview CustomerRequest entity implementation with validation
 * @description Complete CustomerRequest model with business logic and validation
 * @version 1.0.0
 */

import { CustomerRequest } from '../specifications/entities';
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

/**
 * CustomerRequest implementation with full validation and business logic
 */
export class CustomerRequestModel implements CustomerRequest {
  id!: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  version!: number;

  requestNumber!: string;
  type!: 'new_service' | 'change_service' | 'one_time' | 'inquiry';
  status!: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  customerId!: string;
  serviceType!: string;
  requestedDate!: Date;
  approvalHistory!: Array<{
    step: string;
    timestamp: Date;
    userId: string;
    notes?: string;
  }>;
  relatedServices?: string[];

  // Use constants from common utilities
  private static readonly VALID_TYPES = ['new_service', 'change_service', 'one_time', 'inquiry'] as const;
  private static readonly VALID_STATUSES = ['pending', 'in_review', 'approved', 'rejected', 'completed'] as const;

  constructor(data: Partial<CustomerRequest>) {
    this.validateAndAssign(data);
  }

  /**
   * Validate and assign data to the instance
   */
  private validateAndAssign(data: Partial<CustomerRequest>): void {
    // Base entity validation
    this.id = data.id || DataUtils.generateId();
    this.externalIds = data.externalIds;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    this.version = data.version || 1;

    // Business logic validation
    const errors: string[] = [];

    // Required field validation
    if (!data.requestNumber) {
      errors.push('Request number is required');
    } else {
      this.requestNumber = data.requestNumber;
    }

    if (!data.type) {
      errors.push('Request type is required');
    } else if (!CustomerRequestModel.VALID_TYPES.includes(data.type)) {
      errors.push(`Request type must be one of: ${CustomerRequestModel.VALID_TYPES.join(', ')}`);
    } else {
      this.type = data.type;
    }

    if (!data.status) {
      errors.push('Request status is required');
    } else if (!CustomerRequestModel.VALID_STATUSES.includes(data.status)) {
      errors.push(`Request status must be one of: ${CustomerRequestModel.VALID_STATUSES.join(', ')}`);
    } else {
      this.status = data.status;
    }

    if (!data.customerId) {
      errors.push('Customer ID is required');
    } else {
      this.customerId = data.customerId;
    }

    if (!data.serviceType) {
      errors.push('Service type is required');
    } else {
      this.serviceType = data.serviceType;
    }

    if (!data.requestedDate) {
      errors.push('Requested date is required');
    } else {
      this.requestedDate = new Date(data.requestedDate);
      if (isNaN(this.requestedDate.getTime())) {
        errors.push('Requested date must be a valid date');
      }
    }

    this.approvalHistory = data.approvalHistory || [];
    this.relatedServices = data.relatedServices;

    // Throw validation error if any errors exist
    if (errors.length > 0) {
      throw new ValidationError(`CustomerRequest validation failed: ${errors.join(', ')}`, 'customer_request', 'multiple');
    }
  }

  /**
   * Create a new CustomerRequest
   */
  static create(data: Omit<CustomerRequest, keyof import('../specifications/entities').BaseEntity | 'createdAt' | 'updatedAt' | 'version'>): CustomerRequestModel {
    const now = new Date();
    return new CustomerRequestModel({
      ...data,
      id: DataUtils.generateId(),
      createdAt: now,
      updatedAt: now,
      version: 1
    });
  }

  /**
   * Update the CustomerRequest
   */
  update(updates: Partial<Omit<CustomerRequest, 'id' | 'createdAt' | 'updatedAt' | 'version'>>, expectedVersion: number): CustomerRequestModel {
    if (this.version !== expectedVersion) {
      throw new ConcurrencyError('customer_request', this.id, expectedVersion, this.version);
    }

    const updatedData: Partial<CustomerRequest> = {
      ...this,
      ...updates,
      version: this.version + 1,
      updatedAt: new Date()
    };

    return new CustomerRequestModel(updatedData);
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): CustomerRequest {
    return {
      ...this,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt),
      requestedDate: new Date(this.requestedDate)
    };
  }

  /**
   * Validate the current instance
   */
  validate(): { isValid: boolean; errors: string[] } {
    try {
      this.validateAndAssign(this);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get approval history summary
   */
  getApprovalSummary(): { totalSteps: number; lastStep?: string; status: string } {
    const totalSteps = this.approvalHistory.length;
    const lastStep = totalSteps > 0 ? this.approvalHistory[totalSteps - 1].step : undefined;

    return {
      totalSteps,
      lastStep,
      status: this.status
    };
  }

  /**
   * Add approval step to history
   */
  addApprovalStep(step: string, userId: string, notes?: string): CustomerRequestModel {
    const newHistory = [
      ...this.approvalHistory,
      {
        step,
        timestamp: new Date(),
        userId,
        notes
      }
    ];

    return this.update({ approvalHistory: newHistory }, this.version);
  }

  /**
   * Update status with approval step
   */
  updateStatus(newStatus: typeof this.status, userId: string, notes?: string): CustomerRequestModel {
    if (!CustomerRequestModel.VALID_STATUSES.includes(newStatus)) {
      throw new ValidationError(`Invalid status: ${newStatus}`, 'customer_request', 'status');
    }

    return this.addApprovalStep(newStatus, userId, notes).update({ status: newStatus }, this.version);
  }
}