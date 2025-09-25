/**
 * @fileoverview Customer entity implementation with validation
 * @description Complete Customer model with business logic and validation
 * @version 1.0.0
 */

import { Customer, Address, Contact, BaseEntity } from '../specifications/entities';
import { Event } from '../specifications/entities';
import { v4 as uuidv4 } from 'uuid';
import {
  ValidationUtils,
  FormatUtils,
  DataUtils,
  Constants,
  AuditUtils,
  MetadataUtils,
  ConcurrencyError,
  ValidationError,
} from './common';

/**
 * Customer implementation with full validation and business logic
 */
export class CustomerModel implements Customer {
  id!: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  version!: number;

  name!: string;
  type!: 'residential' | 'commercial' | 'industrial' | 'municipal';
  status!: 'active' | 'inactive' | 'suspended' | 'pending';
  taxId?: string;
  primaryContact?: Contact;
  billingContact?: Contact;
  serviceContacts?: Contact[];
  serviceAddress!: Address;
  billingAddress?: Address;
  serviceTypes?: string[];
  specialInstructions?: string;

  // Use constants from common utilities
  private static readonly MAX_NAME_LENGTH = Constants.BUSINESS_RULES.MAX_NAME_LENGTH;
  private static readonly VALID_TYPES = Constants.CUSTOMER_TYPES;
  private static readonly VALID_STATUSES = Constants.CUSTOMER_STATUSES;

  constructor(data: Partial<Customer>) {
    this.validateAndAssign(data);
  }

  /**
   * Create a new customer with validation
   */
  static create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'version'>): CustomerModel {
    const now = new Date();
    const customerData: Partial<Customer> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'api',
      },
    };

    return new CustomerModel(customerData);
  }

  /**
   * Update customer with optimistic locking
   */
  update(
    updates: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'version'>>,
    expectedVersion: number
  ): CustomerModel {
    if (this.version !== expectedVersion) {
      throw new ConcurrencyError('customer', this.id, expectedVersion, this.version);
    }

    const updatedData: Partial<Customer> = DataUtils.deepMerge(this as any, updates);
    updatedData.version = this.version + 1;
    updatedData.updatedAt = new Date();
    updatedData.metadata = MetadataUtils.updateMetadata(this.metadata!, updates.metadata || {});

    return new CustomerModel(updatedData);
  }

  /**
   * Validate and assign customer data
   */
  private validateAndAssign(data: Partial<Customer>): void {
    // Validate required fields
    const requiredErrors = ValidationUtils.validateRequired(data, [
      'name',
      'type',
      'status',
      'serviceAddress',
    ]);
    if (requiredErrors.length > 0) {
      throw new ValidationError(requiredErrors[0], 'customer', 'multiple');
    }

    // Validate enum values
    const typeErrors = ValidationUtils.validateEnum(
      data.type,
      [...Constants.CUSTOMER_TYPES],
      'Customer type'
    );
    if (typeErrors.length > 0) {
      throw new ValidationError(typeErrors[0], 'customer', 'type');
    }

    const statusErrors = ValidationUtils.validateEnum(
      data.status,
      [...Constants.CUSTOMER_STATUSES],
      'Customer status'
    );
    if (statusErrors.length > 0) {
      throw new ValidationError(statusErrors[0], 'customer', 'status');
    }

    // Validate string length
    const nameErrors = ValidationUtils.validateLength(
      data.name!,
      Constants.BUSINESS_RULES.MAX_NAME_LENGTH,
      'Customer name'
    );
    if (nameErrors.length > 0) {
      throw new ValidationError(nameErrors[0], 'customer', 'name');
    }

    // Validate contacts
    if (data.primaryContact?.email && !ValidationUtils.isValidEmail(data.primaryContact.email)) {
      throw new ValidationError(
        'Primary contact email is invalid',
        'customer',
        'primaryContact.email'
      );
    }

    if (data.billingContact?.email && !ValidationUtils.isValidEmail(data.billingContact.email)) {
      throw new ValidationError(
        'Billing contact email is invalid',
        'customer',
        'billingContact.email'
      );
    }

    if (data.serviceContacts) {
      data.serviceContacts.forEach((contact, index) => {
        if (contact.email && !ValidationUtils.isValidEmail(contact.email)) {
          throw new ValidationError(
            `Service contact ${index} email is invalid`,
            'customer',
            `serviceContacts.${index}.email`
          );
        }
      });
    }

    // Validate tax ID for commercial customers
    if (data.type === 'commercial' && data.taxId && !ValidationUtils.isValidTaxId(data.taxId)) {
      throw new ValidationError('Invalid tax ID format', 'customer', 'taxId');
    }

    // Assign validated data
    Object.assign(this, data);
  }

  /**
   * Check if customer is active
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Get customer display name
   */
  getDisplayName(): string {
    return this.name;
  }

  /**
   * Get primary contact email
   */
  getPrimaryEmail(): string | undefined {
    return this.primaryContact?.email;
  }

  /**
   * Check if customer has multiple sites
   */
  hasMultipleServiceTypes(): boolean {
    return (this.serviceTypes?.length || 0) > 1;
  }

  /**
   * Get customer age in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Customer {
    return {
      id: this.id,
      externalIds: this.externalIds,
      name: this.name,
      type: this.type,
      status: this.status,
      taxId: this.taxId,
      primaryContact: this.primaryContact,
      billingContact: this.billingContact,
      serviceContacts: this.serviceContacts,
      serviceAddress: this.serviceAddress,
      billingAddress: this.billingAddress,
      serviceTypes: this.serviceTypes,
      specialInstructions: this.specialInstructions,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Customer> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for customer changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return AuditUtils.generateEvent('customer', this.id, eventType, this.toEventData()) as Event;
  }

  /**
   * Validate customer data for business rules
   */
  validateBusinessRules(): string[] {
    const errors: string[] = [];

    // Business rule: Commercial customers should have tax ID
    if (this.type === 'commercial' && !this.taxId) {
      errors.push('Commercial customers must have a tax ID');
    }

    // Business rule: Active customers should have primary contact
    if (this.status === 'active' && !this.primaryContact) {
      errors.push('Active customers must have a primary contact');
    }

    // Business rule: Industrial customers should have service contacts
    if (
      this.type === 'industrial' &&
      (!this.serviceContacts || this.serviceContacts.length === 0)
    ) {
      errors.push('Industrial customers must have at least one service contact');
    }

    return errors;
  }

  /**
   * Get customer summary for reporting
   */
  getSummary(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      serviceTypesCount: this.serviceTypes?.length || 0,
      hasBillingAddress: !!this.billingAddress,
      contactCount: [
        this.primaryContact,
        this.billingContact,
        ...(this.serviceContacts || []),
      ].filter(Boolean).length,
      ageInDays: this.getAgeInDays(),
      isActive: this.isActive(),
    };
  }
}

/**
 * Customer factory for creating customers from legacy data
 */
export class CustomerFactory {
  /**
   * Create customer from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): CustomerModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Customer> = {
      externalIds: [legacyData.customer_id || legacyData.CUSTOMER_ID || legacyData.id],
      name: legacyData.customer_name || legacyData.CUSTOMER_NAME || legacyData.name,
      type: this.mapLegacyCustomerType(
        legacyData.customer_type || legacyData.CUSTOMER_TYPE || legacyData.type
      ),
      status: this.mapLegacyStatus(legacyData.status || legacyData.STATUS || 'active'),
      taxId: legacyData.tax_id || legacyData.TAX_ID || legacyData.ein,
      serviceAddress: this.mapLegacyAddress(legacyData),
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy waste management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
      },
    };

    return CustomerModel.create(mappedData as any);
  }

  /**
   * Map legacy customer types to standardized types
   */
  private static mapLegacyCustomerType(legacyType: string): Customer['type'] {
    const typeMap: Record<string, Customer['type']> = {
      residential: 'residential',
      res: 'residential',
      r: 'residential',
      commercial: 'commercial',
      com: 'commercial',
      c: 'commercial',
      industrial: 'industrial',
      ind: 'industrial',
      i: 'industrial',
      municipal: 'municipal',
      muni: 'municipal',
      m: 'municipal',
    };

    return typeMap[legacyType.toLowerCase()] || 'commercial';
  }

  /**
   * Map legacy status to standardized status
   */
  private static mapLegacyStatus(legacyStatus: string): Customer['status'] {
    const statusMap: Record<string, Customer['status']> = {
      active: 'active',
      a: 'active',
      inactive: 'inactive',
      i: 'inactive',
      suspended: 'suspended',
      s: 'suspended',
      pending: 'pending',
      p: 'pending',
    };

    return statusMap[legacyStatus.toLowerCase()] || 'active';
  }

  /**
   * Map legacy address formats
   */
  private static mapLegacyAddress(legacyData: Record<string, any>): Address {
    return {
      street1: legacyData.address1 || legacyData.ADDRESS1 || legacyData.street,
      street2: legacyData.address2 || legacyData.ADDRESS2,
      city: legacyData.city || legacyData.CITY,
      state: legacyData.state || legacyData.STATE,
      zipCode: legacyData.zip || legacyData.ZIP || legacyData.zipcode,
      country: legacyData.country || 'US',
    };
  }
}

/**
 * Customer validator for external validation
 */
export class CustomerValidator {
  /**
   * Validate customer data without creating instance
   */
  static validate(data: Partial<Customer>): { isValid: boolean; errors: string[] } {
    try {
      new CustomerModel(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      };
    }
  }

  /**
   * Validate business rules
   */
  static validateBusinessRules(customer: CustomerModel): string[] {
    return customer.validateBusinessRules();
  }
}
