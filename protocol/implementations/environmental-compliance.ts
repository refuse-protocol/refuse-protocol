/**
 * @fileoverview Environmental Compliance entity implementation
 * @description Environmental compliance tracking with LEED allocations and regulatory reporting
 * @version 1.0.0
 */

import { EnvironmentalCompliance } from '../specifications/entities';
import { BaseEntityModel } from './base-entity';

/**
 * Environmental Compliance implementation with LEED tracking and validation
 */
export class EnvironmentalComplianceModel
  extends BaseEntityModel
  implements EnvironmentalCompliance
{
  customerId: string;
  siteId: string;
  complianceType: 'environmental' | 'safety' | 'health' | 'leed' | 'regulatory';
  leedCategory?: string;
  leedPoints?: number;
  certificationYear?: number;
  certificationBody?: string;
  carbonCredits?: number;
  environmentalBenefit: {
    type: 'carbon_reduction' | 'waste_diversion' | 'energy_savings' | 'water_conservation';
    amount: number;
    unit: string;
    description: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  verificationDate?: Date;
  verifier?: string;
  auditTrail: any[];
  supportingDocuments: any[];
  allocationValue?: number;
  settlementStatus: 'pending' | 'settled' | 'disputed' | 'cancelled';
  settlementDate?: Date;

  constructor(data: Partial<EnvironmentalCompliance>) {
    super(data);
    this.initializeEnvironmentalCompliance(data);
  }

  protected updateFromData(data: any): this {
    this.initializeEnvironmentalCompliance(data);
    return this;
  }

  protected getEntitySpecificData(): any {
    return {
      complianceType: this.complianceType,
      leedPoints: this.leedPoints,
      carbonCredits: this.carbonCredits,
      settlementStatus: this.settlementStatus,
    };
  }

  protected getCurrentState(): string {
    return this.settlementStatus;
  }

  protected validateRequiredFieldsInternal(): void {
    if (!this.complianceType) throw new Error('Compliance type is required');
    if (!this.environmentalBenefit) throw new Error('Environmental benefit is required');
    if (!this.verificationStatus) throw new Error('Verification status is required');
  }

  private initializeEnvironmentalCompliance(data: Partial<EnvironmentalCompliance>): void {
    // Validate required fields
    this.validateRequiredFields(data, [
      'customerId',
      'siteId',
      'complianceType',
      'environmentalBenefit',
      'verificationStatus',
      'settlementStatus',
    ]);

    // Assign data
    Object.assign(this, data);
  }

  // Business logic methods
  calculateLeedScore(): number {
    return this.leedPoints || 0;
  }

  calculateEnvironmentalImpact(): {
    carbonReduction: number;
    wasteDiversion: number;
    energySavings: number;
    waterConservation: number;
  } {
    const impact = {
      carbonReduction: 0,
      wasteDiversion: 0,
      energySavings: 0,
      waterConservation: 0,
    };

    if (this.carbonCredits) {
      impact.carbonReduction = this.carbonCredits;
    }

    // Calculate based on environmental benefit type
    switch (this.environmentalBenefit.type) {
      case 'carbon_reduction':
        impact.carbonReduction = this.environmentalBenefit.amount;
        break;
      case 'waste_diversion':
        impact.wasteDiversion = this.environmentalBenefit.amount;
        break;
      case 'energy_savings':
        impact.energySavings = this.environmentalBenefit.amount;
        break;
      case 'water_conservation':
        impact.waterConservation = this.environmentalBenefit.amount;
        break;
    }

    return impact;
  }

  isVerified(): boolean {
    return this.verificationStatus === 'verified';
  }

  isSettled(): boolean {
    return this.settlementStatus === 'settled';
  }

  canBeModified(): boolean {
    return this.settlementStatus === 'pending' || this.settlementStatus === 'disputed';
  }
}

/**
 * Environmental Compliance Factory
 */
export class EnvironmentalComplianceFactory {
  static create(
    data: Omit<
      EnvironmentalComplianceModel,
      keyof import('./base-entity').BaseEntity | 'createdAt' | 'updatedAt' | 'version'
    >
  ): EnvironmentalComplianceModel {
    return new EnvironmentalComplianceModel(data);
  }

  static fromRegulatoryReport(reportData: any): EnvironmentalComplianceModel {
    // Transform regulatory report data to REFUSE Protocol format
    const complianceData: Partial<EnvironmentalComplianceModel> = {
      customerId: reportData.customerId,
      siteId: reportData.siteId,
      complianceType: 'regulatory',
      environmentalBenefit: {
        type: reportData.benefitType || 'carbon_reduction',
        amount: reportData.benefitAmount || 0,
        unit: reportData.benefitUnit || 'tons',
        description: reportData.description || 'Regulatory compliance benefit',
      },
      verificationStatus: 'pending',
      settlementStatus: 'pending',
      metadata: {
        source: 'regulatory_report',
        reportId: reportData.reportId,
        reportingPeriod: reportData.reportingPeriod,
      },
    };

    return EnvironmentalComplianceFactory.create(complianceData);
  }
}

/**
 * Environmental Compliance Validator
 */
export class EnvironmentalComplianceValidator {
  static validate(data: Partial<EnvironmentalComplianceModel>): {
    isValid: boolean;
    errors: string[];
  } {
    try {
      new EnvironmentalComplianceModel(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      };
    }
  }

  static validateBusinessRules(compliance: EnvironmentalComplianceModel): string[] {
    const errors: string[] = [];

    // LEED points must be positive
    if (compliance.leedPoints && compliance.leedPoints < 0) {
      errors.push('LEED points must be non-negative');
    }

    // Carbon credits must be positive
    if (compliance.carbonCredits && compliance.carbonCredits < 0) {
      errors.push('Carbon credits must be non-negative');
    }

    // Environmental benefit amount must be positive
    if (compliance.environmentalBenefit.amount < 0) {
      errors.push('Environmental benefit amount must be non-negative');
    }

    // Verification date should not be in the future
    if (compliance.verificationDate && compliance.verificationDate > new Date()) {
      errors.push('Verification date cannot be in the future');
    }

    return errors;
  }
}
