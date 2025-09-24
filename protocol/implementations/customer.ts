/**
 * @fileoverview Customer entity implementation with validation
 * @description Complete Customer model with business logic and validation
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Customer, Address, Contact, BaseEntity } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Customer implementation with full validation and business logic
 */
export class CustomerModel implements Customer {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  name: string;
  type: 'residential' | 'commercial' | 'industrial' | 'municipal';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  taxId?: string;
  primaryContact?: Contact;
  billingContact?: Contact;
  serviceContacts?: Contact[];
  serviceAddress: Address;
  billingAddress?: Address;
  serviceTypes?: string[];
  specialInstructions?: string;

  private static readonly MAX_NAME_LENGTH = 200;
  private static readonly VALID_TYPES: Customer['type'][] = ['residential', 'commercial', 'industrial', 'municipal'];
  private static readonly VALID_STATUSES: Customer['status'][] = ['active', 'inactive', 'suspended', 'pending'];

  constructor(data: Partial<Customer>) {
    this.validateAndAssign(data);
  }

  /**
   * Create a new customer with validation
   */
  static create(data: Omit<Customer, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>): CustomerModel {
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
        source: 'api'
      }
    };

    return new CustomerModel(customerData);
  }

  /**
   * Update customer with optimistic locking
   */
  update(updates: Partial<Omit<Customer, keyof BaseEntity>>, expectedVersion: number): CustomerModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Customer> = {
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

    return new CustomerModel(updatedData);
  }

  /**
   * Validate and assign customer data
   */
  private validateAndAssign(data: Partial<Customer>): void {
    // Required fields validation
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Customer name is required and must be a string');
    }

    if (!data.type || !CustomerModel.VALID_TYPES.includes(data.type)) {
      throw new Error(`Customer type must be one of: ${CustomerModel.VALID_TYPES.join(', ')}`);
    }

    if (!data.status || !CustomerModel.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Customer status must be one of: ${CustomerModel.VALID_STATUSES.join(', ')}`);
    }

    if (!data.serviceAddress) {
      throw new Error('Service address is required');
    }

    // Length validation
    if (data.name.length > CustomerModel.MAX_NAME_LENGTH) {
      throw new Error(`Customer name cannot exceed ${CustomerModel.MAX_NAME_LENGTH} characters`);
    }

    // Email validation for contacts
    if (data.primaryContact?.email && !this.isValidEmail(data.primaryContact.email)) {
      throw new Error('Primary contact email is invalid');
    }

    if (data.billingContact?.email && !this.isValidEmail(data.billingContact.email)) {
      throw new Error('Billing contact email is invalid');
    }

    if (data.serviceContacts) {
      data.serviceContacts.forEach((contact, index) => {
        if (contact.email && !this.isValidEmail(contact.email)) {
          throw new Error(`Service contact ${index} email is invalid`);
        }
      });
    }

    // Tax ID validation for commercial customers
    if (data.type === 'commercial' && data.taxId) {
      if (!this.isValidTaxId(data.taxId)) {
        throw new Error('Invalid tax ID format');
      }
    }

    // Assign validated data
    Object.assign(this, data);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate tax ID format (US EIN format)
   */
  private isValidTaxId(taxId: string): boolean {
    // Remove hyphens and spaces for validation
    const cleanTaxId = taxId.replace(/[-\s]/g, '');

    // US EIN format: XX-XXXXXXX or just XXXXXXXXX
    const einRegex = /^\d{9}$|^\d{2}-\d{7}$/;
    return einRegex.test(cleanTaxId);
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
      version: this.version
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
    return {
      id: uuidv4(),
      entityType: 'customer',
      eventType,
      timestamp: new Date(),
      eventData: this.toEventData(),
      version: 1
    };
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
    if (this.type === 'industrial' && (!this.serviceContacts || this.serviceContacts.length === 0)) {
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
        ...(this.serviceContacts || [])
      ].filter(Boolean).length,
      ageInDays: this.getAgeInDays(),
      isActive: this.isActive()
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
      type: this.mapLegacyCustomerType(legacyData.customer_type || legacyData.CUSTOMER_TYPE || legacyData.type),
      status: this.mapLegacyStatus(legacyData.status || legacyData.STATUS || 'active'),
      taxId: legacyData.tax_id || legacyData.TAX_ID || legacyData.ein,
      serviceAddress: this.mapLegacyAddress(legacyData),
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy waste management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString()
      }
    };

    return CustomerModel.create(mappedData as any);
  }

  /**
   * Map legacy customer types to standardized types
   */
  private static mapLegacyCustomerType(legacyType: string): Customer['type'] {
    const typeMap: Record<string, Customer['type']> = {
      'residential': 'residential',
      'res': 'residential',
      'r': 'residential',
      'commercial': 'commercial',
      'com': 'commercial',
      'c': 'commercial',
      'industrial': 'industrial',
      'ind': 'industrial',
      'i': 'industrial',
      'municipal': 'municipal',
      'muni': 'municipal',
      'm': 'municipal'
    };

    return typeMap[legacyType.toLowerCase()] || 'commercial';
  }

  /**
   * Map legacy status to standardized status
   */
  private static mapLegacyStatus(legacyStatus: string): Customer['status'] {
    const statusMap: Record<string, Customer['status']> = {
      'active': 'active',
      'a': 'active',
      'inactive': 'inactive',
      'i': 'inactive',
      'suspended': 'suspended',
      's': 'suspended',
      'pending': 'pending',
      'p': 'pending'
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
      country: legacyData.country || 'US'
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
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
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
