/**
 * @fileoverview Minimal Customer entity implementation for testing
 * @description Simplified Customer model for test validation
 * @version 1.0.0
 */

import { Customer, BaseEntity, Address, Contact } from '../specifications/entities';
import { v4 as uuidv4 } from 'uuid';

/**
 * Minimal Customer implementation for testing
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

  constructor(data: any) {
    // Simple validation and assignment
    Object.assign(this, data);

    // Ensure required fields are present
    if (!this.id) this.id = uuidv4();
    if (!this.createdAt) this.createdAt = new Date();
    if (!this.updatedAt) this.updatedAt = new Date();
    if (!this.version) this.version = 1;

    // Validate basic structure
    if (!this.name || !this.type || !this.status || !this.serviceAddress) {
      throw new Error('Missing required fields: name, type, status, serviceAddress');
    }
  }

  static create(data: any): CustomerModel {
    return new CustomerModel(data);
  }

  update(updates: any, expectedVersion: number): CustomerModel {
    if (this.version !== expectedVersion) {
      throw new Error('Version mismatch');
    }

    const updatedData = { ...this, ...updates };
    updatedData.version = this.version + 1;
    updatedData.updatedAt = new Date();

    return new CustomerModel(updatedData);
  }
}
