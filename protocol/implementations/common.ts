/**
 * @fileoverview Common utilities for REFUSE Protocol entities
 * @description Shared validation, formatting, and utility functions
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Common validation utilities
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate tax ID format (US EIN format)
   */
  static isValidTaxId(taxId: string): boolean {
    const cleanTaxId = taxId.replace(/[-\s]/g, '');
    const einRegex = /^\d{9}$|^\d{2}-\d{7}$/;
    return einRegex.test(cleanTaxId);
  }

  /**
   * Validate ZIP code format
   */
  static isValidZipCode(zipCode: string): boolean {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  }

  /**
   * Validate required fields
   */
  static validateRequired<T>(data: Partial<T>, requiredFields: (keyof T)[]): string[] {
    const errors: string[] = [];

    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`${String(field)} is required`);
      }
    }

    return errors;
  }

  /**
   * Validate enum values
   */
  static validateEnum<T>(value: any, validValues: T[], fieldName: string): string[] {
    if (!validValues.includes(value)) {
      return [`${fieldName} must be one of: ${validValues.join(', ')}`];
    }
    return [];
  }

  /**
   * Validate string length
   */
  static validateLength(value: string, maxLength: number, fieldName: string): string[] {
    if (value.length > maxLength) {
      return [`${fieldName} must not exceed ${maxLength} characters`];
    }
    return [];
  }
}

/**
 * Common formatting utilities
 */
export class FormatUtils {
  /**
   * Format customer display name
   */
  static formatCustomerName(name: string, type: string): string {
    return `${name} (${type.charAt(0).toUpperCase() + type.slice(1)})`;
  }

  /**
   * Format address for display
   */
  static formatAddress(address: any): string {
    const parts = [
      address.street1 || address.street,
      address.street2,
      address.city && `${address.city}, ${address.state} ${address.zipCode}`
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Format phone number for display
   */
  static formatPhone(phone: string): string {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      const withoutCountry = cleaned.slice(1);
      return `(${withoutCountry.slice(0, 3)}) ${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6)}`;
    }

    return phone; // Return original if can't format
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Format date and time for display
   */
  static formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}

/**
 * Common data transformation utilities
 */
export class DataUtils {
  /**
   * Generate UUID
   */
  static generateId(): string {
    return uuidv4();
  }

  /**
   * Deep clone object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        (cloned as any)[key] = this.deepClone((obj as any)[key]);
      }
    }

    return cloned;
  }

  /**
   * Merge objects deeply
   */
  static deepMerge<T>(target: T, source: Partial<T>): T {
    const result = this.deepClone(target);

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = (source as any)[key];
        const targetValue = (result as any)[key];

        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          (result as any)[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          (result as any)[key] = sourceValue;
        }
      }
    }

    return result;
  }

  private static isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Date);
  }

  /**
   * Safely access nested object properties
   */
  static safeGet<T>(obj: any, path: string, defaultValue?: T): T | undefined {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Set nested object property safely
   */
  static safeSet(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }
}

/**
 * Common constants
 */
export class Constants {
  // Customer types
  static readonly CUSTOMER_TYPES = ['residential', 'commercial', 'industrial', 'municipal'] as const;

  // Customer statuses
  static readonly CUSTOMER_STATUSES = ['active', 'inactive', 'suspended', 'pending'] as const;

  // Service types
  static readonly SERVICE_TYPES = ['waste', 'recycling', 'organics', 'hazardous'] as const;

  // Service frequencies
  static readonly SERVICE_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'on_demand'] as const;

  // Container types
  static readonly CONTAINER_TYPES = ['dumpster', 'rolloff', 'compactor', 'cart'] as const;

  // Container sizes
  static readonly CONTAINER_SIZES = ['1_yard', '2_yard', '4_yard', '6_yard', '8_yard', '10_yard', '20_yard', '30_yard', '40_yard'] as const;

  // Material categories
  static readonly MATERIAL_CATEGORIES = ['paper', 'plastic', 'metal', 'glass', 'organic', 'hazardous', 'mixed_waste'] as const;

  // Payment methods
  static readonly PAYMENT_METHODS = ['cash', 'check', 'credit_card', 'ach', 'wire'] as const;

  // Payment statuses
  static readonly PAYMENT_STATUSES = ['pending', 'processing', 'processed', 'failed', 'cancelled', 'refunded'] as const;

  // Route statuses
  static readonly ROUTE_STATUSES = ['planned', 'active', 'completed', 'cancelled'] as const;

  // Facility types
  static readonly FACILITY_TYPES = ['mrf', 'transfer', 'landfill', 'compost', 'incinerator'] as const;

  // Address validation patterns
  static readonly ADDRESS_PATTERNS = {
    street: /^[a-zA-Z0-9\s\-\.\#]+$/,
    city: /^[a-zA-Z\s\-\.]+$/,
    state: /^[A-Z]{2}$/,
    zipCode: /^\d{5}(-\d{4})?$/
  };

  // Contact validation patterns
  static readonly CONTACT_PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-\(\)]{10,}$/,
    taxId: /^\d{9}$|^\d{2}-\d{7}$/
  };

  // Business rule constants
  static readonly BUSINESS_RULES = {
    MAX_NAME_LENGTH: 200,
    MAX_CONTACTS_PER_CUSTOMER: 10,
    MAX_SERVICES_PER_CUSTOMER: 50,
    MAX_ROUTE_STOPS: 25,
    MAX_FACILITY_CAPACITY: 10000, // tons/day
    MIN_CONTRACT_VALUE: 100,
    MAX_PAYMENT_RETRIES: 3
  };
}

/**
 * Common error types
 */
export class EntityError extends Error {
  constructor(
    message: string,
    public readonly entityType: string,
    public readonly entityId?: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'EntityError';
  }
}

export class ValidationError extends EntityError {
  constructor(
    message: string,
    entityType: string,
    field?: string,
    entityId?: string
  ) {
    super(message, entityType, entityId, field);
    this.name = 'ValidationError';
  }
}

export class BusinessRuleError extends EntityError {
  constructor(
    message: string,
    entityType: string,
    entityId?: string
  ) {
    super(message, entityType, entityId);
    this.name = 'BusinessRuleError';
  }
}

export class ConcurrencyError extends EntityError {
  constructor(
    entityType: string,
    entityId: string,
    expectedVersion: number,
    actualVersion: number
  ) {
    super(
      `Version conflict. Expected: ${expectedVersion}, Actual: ${actualVersion}`,
      entityType,
      entityId
    );
    this.name = 'ConcurrencyError';
  }
}

/**
 * Common audit trail utilities
 */
export class AuditUtils {
  /**
   * Generate audit event
   */
  static generateEvent(
    entityType: string,
    entityId: string,
    eventType: string,
    changes: any,
    userId?: string
  ): any {
    return {
      id: uuidv4(),
      entityType,
      entityId,
      eventType,
      timestamp: new Date(),
      data: changes,
      metadata: {
        userId: userId || 'system',
        source: 'api',
        version: 1
      }
    };
  }

  /**
   * Calculate entity hash for integrity checking
   */
  static calculateHash(data: any): string {
    const entityString = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < entityString.length; i++) {
      const char = entityString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Generate change summary
   */
  static generateChangeSummary(oldData: any, newData: any): any {
    const changes: any = {};

    for (const key in newData) {
      if (newData.hasOwnProperty(key)) {
        const oldValue = oldData[key];
        const newValue = newData[key];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes[key] = {
            from: oldValue,
            to: newValue
          };
        }
      }
    }

    return changes;
  }
}

/**
 * Common metadata utilities
 */
export class MetadataUtils {
  /**
   * Create standard metadata
   */
  static createMetadata(
    source: string = 'api',
    userId?: string,
    additionalData?: Record<string, any>
  ): Record<string, any> {
    return {
      createdBy: userId || 'system',
      source,
      createdAt: new Date(),
      ...additionalData
    };
  }

  /**
   * Update metadata
   */
  static updateMetadata(
    existingMetadata: Record<string, any>,
    updates: Record<string, any>,
    userId?: string
  ): Record<string, any> {
    return {
      ...existingMetadata,
      ...updates,
      lastModifiedBy: userId || 'system',
      lastModifiedAt: new Date(),
      previousVersion: existingMetadata.version || 1
    };
  }

  /**
   * Merge metadata safely
   */
  static mergeMetadata(
    target: Record<string, any>,
    source: Record<string, any>
  ): Record<string, any> {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (key === 'tags' && target.tags) {
          result.tags = [...new Set([...target.tags, ...source.tags])];
        } else if (DataUtils.isObject(source[key]) && DataUtils.isObject(target[key])) {
          result[key] = DataUtils.deepMerge(target[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }
}
