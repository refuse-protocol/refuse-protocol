/**
 * @fileoverview Minimal Facility entity implementation for testing
 * @description Simplified Facility model for test validation
 * @version 1.0.0
 */

import { Facility, BaseEntity, Address, Contact, OperatingHours } from '../specifications/entities';
import { v4 as uuidv4 } from 'uuid';

/**
 * Minimal Facility implementation for testing
 */
export class FacilityModel implements Facility {
  id!: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  version!: number;

  name!: string;
  code!: string;
  type!: 'landfill' | 'mrf' | 'transfer' | 'composter' | 'export' | 'cad' | 'incinerator' | 'recycling_center';
  status!: 'operational' | 'maintenance' | 'closed' | 'planned' | 'limited';
  address!: Address;
  contactInformation?: Contact;
  operatingHours?: OperatingHours;
  capacity?: {
    dailyLimit?: number;
    monthlyLimit?: number;
    currentUtilization?: number;
  };
  acceptedMaterials!: string[];
  pricing?: {
    tippingFee?: number;
    materialRates?: Record<string, number>;
    minimumCharge?: number;
  };
  serviceRestrictions?: string[];
  permits?: Array<{
    permitNumber: string;
    issuingAuthority: string;
    validFrom: string;
    validTo: string;
    permitType: string;
  }>;
  environmentalControls?: string[];
  complianceRecords?: string[];
  utilization?: {
    currentLevel: number;
    dailyAverage: number;
    monthlyAverage: number;
    peakLevel: number;
  };

  constructor(data: any) {
    // Simple validation and assignment
    Object.assign(this, data);

    // Ensure required fields are present
    if (!this.id) this.id = uuidv4();
    if (!this.createdAt) this.createdAt = new Date();
    if (!this.updatedAt) this.updatedAt = new Date();
    if (!this.version) this.version = 1;
    if (!this.acceptedMaterials) this.acceptedMaterials = [];

    // Validate basic structure
    if (!this.name || !this.code || !this.type || !this.status || !this.address) {
      throw new Error('Missing required fields: name, code, type, status, address');
    }
  }

  static create(data: any): FacilityModel {
    return new FacilityModel(data);
  }

  update(updates: any, expectedVersion: number): FacilityModel {
    if (this.version !== expectedVersion) {
      throw new Error('Version mismatch');
    }

    const updatedData = { ...this, ...updates };
    updatedData.version = this.version + 1;
    updatedData.updatedAt = new Date();

    return new FacilityModel(updatedData);
  }
}
