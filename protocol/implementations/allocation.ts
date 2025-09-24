/**
 * @fileoverview Allocation entity implementation with LEED compliance tracking
 * @description Complete Allocation model for managing material allocations with environmental compliance and LEED certification tracking
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Allocation, BaseEntity } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Allocation implementation with comprehensive LEED compliance tracking and environmental reporting
 */
export class AllocationModel implements Allocation {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  allocationNumber: string;
  materialTicketId: string;
  materialType: string;
  allocationType: 'direct' | 'diverted' | 'processed' | 'transferred' | 'disposed' | 'recycled' | 'donated';

  // Quantity and Measurement
  allocatedQuantity: number;
  unit: string;
  allocatedPercentage: number; // Percentage of total material ticket

  // Destination and Processing
  destination: {
    type: 'facility' | 'customer' | 'vendor' | 'landfill' | 'recycling_center' | 'donation_center';
    id: string;
    name: string;
    licenseNumber?: string;
    permitNumber?: string;
  };

  processingMethod: {
    method: string;
    efficiency: number; // Percentage
    outputProduct?: string;
    byproducts?: string[];
    energyConsumption?: number; // kWh per ton
    waterUsage?: number; // gallons per ton
  };

  // Environmental Impact
  environmentalImpact: {
    carbonFootprint: number; // kg CO2 equivalent per ton
    waterImpact: number; // gallons of water used/saved
    energyImpact: number; // kWh used/saved
    landfillDiversion: number; // percentage diverted from landfill
    recyclingRate: number; // percentage of material recycled
  };

  // LEED Compliance Tracking
  leedCompliance: {
    creditsEarned: Array<{
      category: string;
      credit: string;
      points: number;
      maxPoints: number;
      description: string;
      documentation?: string[];
    }>;

    totalPoints: number;
    certificationLevel: 'certified' | 'silver' | 'gold' | 'platinum' | 'none';
    complianceScore: number; // 0-100
    lastAuditDate?: string;
    nextAuditDate?: string;
    auditor?: string;
  };

  // Quality and Testing
  qualityMetrics: Array<{
    parameter: string;
    value: number;
    unit: string;
    testMethod: string;
    complianceStatus: 'pass' | 'fail' | 'pending';
    notes?: string;
  }>;

  // Transportation
  transportation: {
    method: string;
    distance: number; // miles
    fuelType?: string;
    emissions: number; // kg CO2 equivalent
    cost: number; // transportation cost
    carrier?: string;
  };

  // Cost and Economics
  costBreakdown: {
    materialCost: number;
    processingCost: number;
    transportationCost: number;
    disposalCost: number;
    totalCost: number;
    revenue?: number;
    netCost: number;
  };

  // Compliance and Regulatory
  regulatoryCompliance: Array<{
    regulation: string;
    status: 'compliant' | 'non_compliant' | 'pending' | 'exempt';
    lastCheckDate: string;
    nextCheckDate: string;
    notes?: string;
    documentation?: string[];
  }>;

  // Documentation and Audit
  documentation: Array<{
    type: string;
    reference: string;
    date: string;
    status: 'submitted' | 'approved' | 'rejected' | 'pending';
    notes?: string;
  }>;

  auditTrail: Array<{
    action: string;
    timestamp: string;
    userId?: string;
    previousValue?: any;
    newValue: any;
    notes?: string;
  }>;

  private static readonly VALID_ALLOCATION_TYPES: Allocation['allocationType'][] = [
    'direct', 'diverted', 'processed', 'transferred', 'disposed', 'recycled', 'donated'
  ];

  private static readonly VALID_DESTINATION_TYPES: Allocation['destination']['type'][] = [
    'facility', 'customer', 'vendor', 'landfill', 'recycling_center', 'donation_center'
  ];

  private static readonly LEED_CATEGORIES = [
    'Sustainable Sites', 'Water Efficiency', 'Energy & Atmosphere',
    'Materials & Resources', 'Indoor Environmental Quality', 'Innovation in Design',
    'Regional Priority'
  ];

  private static readonly LEED_CERTIFICATION_LEVELS: Allocation['leedCompliance']['certificationLevel'][] = [
    'certified', 'silver', 'gold', 'platinum', 'none'
  ];

  private static readonly VALID_COMPLIANCE_STATUSES: Allocation['regulatoryCompliance'][0]['status'][] = [
    'compliant', 'non_compliant', 'pending', 'exempt'
  ];

  private static readonly VALID_DOCUMENTATION_STATUSES: Allocation['documentation'][0]['status'][] = [
    'submitted', 'approved', 'rejected', 'pending'
  ];

  constructor(data: Partial<Allocation>) {
    this.validateAndAssign(data);
    this.calculateTotals();
  }

  /**
   * Create a new allocation with validation
   */
  static create(data: Omit<Allocation, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>): AllocationModel {
    const now = new Date();
    const allocationData: Partial<Allocation> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'allocation_system'
      }
    };

    return new AllocationModel(allocationData);
  }

  /**
   * Update allocation with optimistic locking
   */
  update(updates: Partial<Omit<Allocation, keyof BaseEntity>>, expectedVersion: number): AllocationModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Allocation> = {
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

    return new AllocationModel(updatedData);
  }

  /**
   * Validate and assign allocation data
   */
  private validateAndAssign(data: Partial<Allocation>): void {
    // Required fields validation
    if (!data.allocationNumber || typeof data.allocationNumber !== 'string') {
      throw new Error('Allocation number is required and must be a string');
    }

    if (!data.materialTicketId || typeof data.materialTicketId !== 'string') {
      throw new Error('Material ticket ID is required and must be a string');
    }

    if (!data.materialType || typeof data.materialType !== 'string') {
      throw new Error('Material type is required and must be a string');
    }

    if (!data.allocationType || !AllocationModel.VALID_ALLOCATION_TYPES.includes(data.allocationType)) {
      throw new Error(`Allocation type must be one of: ${AllocationModel.VALID_ALLOCATION_TYPES.join(', ')}`);
    }

    if (typeof data.allocatedQuantity !== 'number' || data.allocatedQuantity <= 0) {
      throw new Error('Allocated quantity must be a positive number');
    }

    if (!data.unit || typeof data.unit !== 'string') {
      throw new Error('Unit is required and must be a string');
    }

    if (typeof data.allocatedPercentage !== 'number' || data.allocatedPercentage < 0 || data.allocatedPercentage > 100) {
      throw new Error('Allocated percentage must be between 0 and 100');
    }

    // Validate destination
    if (!data.destination) {
      throw new Error('Destination is required');
    }

    if (!AllocationModel.VALID_DESTINATION_TYPES.includes(data.destination.type)) {
      throw new Error(`Destination type must be one of: ${AllocationModel.VALID_DESTINATION_TYPES.join(', ')}`);
    }

    if (!data.destination.id || typeof data.destination.id !== 'string') {
      throw new Error('Destination ID is required');
    }

    if (!data.destination.name || typeof data.destination.name !== 'string') {
      throw new Error('Destination name is required');
    }

    // Validate processing method
    if (!data.processingMethod) {
      throw new Error('Processing method is required');
    }

    if (!data.processingMethod.method || typeof data.processingMethod.method !== 'string') {
      throw new Error('Processing method name is required');
    }

    if (typeof data.processingMethod.efficiency !== 'number' || data.processingMethod.efficiency < 0 || data.processingMethod.efficiency > 100) {
      throw new Error('Processing efficiency must be between 0 and 100');
    }

    // Validate environmental impact
    if (!data.environmentalImpact) {
      throw new Error('Environmental impact information is required');
    }

    if (typeof data.environmentalImpact.carbonFootprint !== 'number') {
      throw new Error('Carbon footprint must be a number');
    }

    if (typeof data.environmentalImpact.landfillDiversion !== 'number' || data.environmentalImpact.landfillDiversion < 0 || data.environmentalImpact.landfillDiversion > 100) {
      throw new Error('Landfill diversion must be between 0 and 100');
    }

    if (typeof data.environmentalImpact.recyclingRate !== 'number' || data.environmentalImpact.recyclingRate < 0 || data.environmentalImpact.recyclingRate > 100) {
      throw new Error('Recycling rate must be between 0 and 100');
    }

    // Validate LEED compliance
    if (!data.leedCompliance) {
      throw new Error('LEED compliance information is required');
    }

    if (!AllocationModel.LEED_CERTIFICATION_LEVELS.includes(data.leedCompliance.certificationLevel)) {
      throw new Error(`LEED certification level must be one of: ${AllocationModel.LEED_CERTIFICATION_LEVELS.join(', ')}`);
    }

    if (typeof data.leedCompliance.totalPoints !== 'number' || data.leedCompliance.totalPoints < 0) {
      throw new Error('Total LEED points must be a non-negative number');
    }

    if (typeof data.leedCompliance.complianceScore !== 'number' || data.leedCompliance.complianceScore < 0 || data.leedCompliance.complianceScore > 100) {
      throw new Error('LEED compliance score must be between 0 and 100');
    }

    // Validate quality metrics if provided
    if (data.qualityMetrics) {
      data.qualityMetrics.forEach((metric, index) => {
        if (!metric.parameter || typeof metric.parameter !== 'string') {
          throw new Error(`Quality metric ${index}: parameter is required`);
        }

        if (typeof metric.value !== 'number') {
          throw new Error(`Quality metric ${index}: value must be a number`);
        }

        if (!metric.unit || typeof metric.unit !== 'string') {
          throw new Error(`Quality metric ${index}: unit is required`);
        }

        if (!metric.testMethod || typeof metric.testMethod !== 'string') {
          throw new Error(`Quality metric ${index}: test method is required`);
        }

        if (!['pass', 'fail', 'pending'].includes(metric.complianceStatus)) {
          throw new Error(`Quality metric ${index}: compliance status must be pass, fail, or pending`);
        }
      });
    }

    // Validate transportation
    if (!data.transportation) {
      throw new Error('Transportation information is required');
    }

    if (!data.transportation.method || typeof data.transportation.method !== 'string') {
      throw new Error('Transportation method is required');
    }

    if (typeof data.transportation.distance !== 'number' || data.transportation.distance < 0) {
      throw new Error('Transportation distance must be a non-negative number');
    }

    if (typeof data.transportation.emissions !== 'number' || data.transportation.emissions < 0) {
      throw new Error('Transportation emissions must be a non-negative number');
    }

    if (typeof data.transportation.cost !== 'number' || data.transportation.cost < 0) {
      throw new Error('Transportation cost must be a non-negative number');
    }

    // Validate cost breakdown
    if (!data.costBreakdown) {
      throw new Error('Cost breakdown is required');
    }

    if (typeof data.costBreakdown.materialCost !== 'number' || data.costBreakdown.materialCost < 0) {
      throw new Error('Material cost must be a non-negative number');
    }

    if (typeof data.costBreakdown.processingCost !== 'number' || data.costBreakdown.processingCost < 0) {
      throw new Error('Processing cost must be a non-negative number');
    }

    if (typeof data.costBreakdown.transportationCost !== 'number' || data.costBreakdown.transportationCost < 0) {
      throw new Error('Transportation cost must be a non-negative number');
    }

    if (typeof data.costBreakdown.disposalCost !== 'number' || data.costBreakdown.disposalCost < 0) {
      throw new Error('Disposal cost must be a non-negative number');
    }

    // Validate regulatory compliance if provided
    if (data.regulatoryCompliance) {
      data.regulatoryCompliance.forEach((compliance, index) => {
        if (!compliance.regulation || typeof compliance.regulation !== 'string') {
          throw new Error(`Regulatory compliance ${index}: regulation is required`);
        }

        if (!AllocationModel.VALID_COMPLIANCE_STATUSES.includes(compliance.status)) {
          throw new Error(`Regulatory compliance ${index}: status must be valid`);
        }

        if (!this.isValidDate(compliance.lastCheckDate)) {
          throw new Error(`Regulatory compliance ${index}: last check date must be valid`);
        }

        if (!this.isValidDate(compliance.nextCheckDate)) {
          throw new Error(`Regulatory compliance ${index}: next check date must be valid`);
        }
      });
    }

    // Validate documentation if provided
    if (data.documentation) {
      data.documentation.forEach((doc, index) => {
        if (!doc.type || typeof doc.type !== 'string') {
          throw new Error(`Documentation ${index}: type is required`);
        }

        if (!doc.reference || typeof doc.reference !== 'string') {
          throw new Error(`Documentation ${index}: reference is required`);
        }

        if (!this.isValidDate(doc.date)) {
          throw new Error(`Documentation ${index}: date must be valid`);
        }

        if (!AllocationModel.VALID_DOCUMENTATION_STATUSES.includes(doc.status)) {
          throw new Error(`Documentation ${index}: status must be valid`);
        }
      });
    }

    // Assign validated data
    Object.assign(this, data);
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDate(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Calculate totals and derived values
   */
  private calculateTotals(): void {
    // Calculate total cost
    this.costBreakdown.totalCost = this.costBreakdown.materialCost +
                                  this.costBreakdown.processingCost +
                                  this.costBreakdown.transportationCost +
                                  this.costBreakdown.disposalCost;

    // Calculate net cost
    this.costBreakdown.netCost = this.costBreakdown.totalCost - (this.costBreakdown.revenue || 0);

    // Calculate LEED compliance score
    this.leedCompliance.complianceScore = this.calculateLEEDScore();

    // Update metadata with calculated values
    this.metadata = {
      ...this.metadata,
      calculatedTotals: {
        totalCost: this.costBreakdown.totalCost,
        netCost: this.costBreakdown.netCost,
        leedScore: this.leedCompliance.complianceScore
      }
    };
  }

  /**
   * Calculate LEED compliance score
   */
  private calculateLEEDScore(): number {
    const totalMaxPoints = this.leedCompliance.creditsEarned.reduce((sum, credit) => sum + credit.maxPoints, 0);
    const totalEarnedPoints = this.leedCompliance.creditsEarned.reduce((sum, credit) => sum + credit.points, 0);

    if (totalMaxPoints === 0) return 0;

    const score = (totalEarnedPoints / totalMaxPoints) * 100;

    // Update certification level based on score
    if (score >= 80) {
      this.leedCompliance.certificationLevel = 'platinum';
    } else if (score >= 60) {
      this.leedCompliance.certificationLevel = 'gold';
    } else if (score >= 50) {
      this.leedCompliance.certificationLevel = 'silver';
    } else if (score >= 40) {
      this.leedCompliance.certificationLevel = 'certified';
    } else {
      this.leedCompliance.certificationLevel = 'none';
    }

    return Math.round(score * 100) / 100;
  }

  /**
   * Add LEED credit
   */
  addLEEDCredit(credit: Omit<Allocation['leedCompliance']['creditsEarned'][0], 'category' | 'credit' | 'points'> & { category: string; credit: string; points: number }): AllocationModel {
    const newCredit = {
      category: credit.category,
      credit: credit.credit,
      points: credit.points,
      maxPoints: credit.maxPoints,
      description: credit.description,
      documentation: credit.documentation
    };

    const newCredits = [...this.leedCompliance.creditsEarned, newCredit];
    const updatedLEED = { ...this.leedCompliance, creditsEarned: newCredits };

    return this.update({ leedCompliance: updatedLEED }, this.version);
  }

  /**
   * Update LEED credit points
   */
  updateLEEDCredit(category: string, credit: string, newPoints: number): AllocationModel {
    const newCredits = this.leedCompliance.creditsEarned.map(c => {
      if (c.category === category && c.credit === credit) {
        return { ...c, points: newPoints };
      }
      return c;
    });

    const updatedLEED = { ...this.leedCompliance, creditsEarned: newCredits };
    return this.update({ leedCompliance: updatedLEED }, this.version);
  }

  /**
   * Add quality metric
   */
  addQualityMetric(metric: Omit<Allocation['qualityMetrics'][0], 'parameter' | 'value'> & { parameter: string; value: number }): AllocationModel {
    const newMetric = {
      parameter: metric.parameter,
      value: metric.value,
      unit: metric.unit,
      testMethod: metric.testMethod,
      complianceStatus: metric.complianceStatus,
      notes: metric.notes
    };

    const newMetrics = [...this.qualityMetrics, newMetric];
    return this.update({ qualityMetrics: newMetrics }, this.version);
  }

  /**
   * Update quality metric
   */
  updateQualityMetric(parameter: string, complianceStatus: 'pass' | 'fail' | 'pending', notes?: string): AllocationModel {
    const newMetrics = this.qualityMetrics.map(metric => {
      if (metric.parameter === parameter) {
        return { ...metric, complianceStatus, notes };
      }
      return metric;
    });

    return this.update({ qualityMetrics: newMetrics }, this.version);
  }

  /**
   * Add regulatory compliance check
   */
  addRegulatoryCompliance(compliance: Omit<Allocation['regulatoryCompliance'][0], 'regulation' | 'status'> & { regulation: string; status: 'compliant' | 'non_compliant' | 'pending' | 'exempt' }): AllocationModel {
    const newCompliance = {
      regulation: compliance.regulation,
      status: compliance.status,
      lastCheckDate: compliance.lastCheckDate,
      nextCheckDate: compliance.nextCheckDate,
      notes: compliance.notes,
      documentation: compliance.documentation
    };

    const newComplianceList = [...this.regulatoryCompliance, newCompliance];
    return this.update({ regulatoryCompliance: newComplianceList }, this.version);
  }

  /**
   * Add documentation
   */
  addDocumentation(documentation: Omit<Allocation['documentation'][0], 'type' | 'reference' | 'status'> & { type: string; reference: string; status: 'submitted' | 'approved' | 'rejected' | 'pending' }): AllocationModel {
    const newDoc = {
      type: documentation.type,
      reference: documentation.reference,
      date: documentation.date,
      status: documentation.status,
      notes: documentation.notes
    };

    const newDocumentation = [...this.documentation, newDoc];
    return this.update({ documentation: newDocumentation }, this.version);
  }

  /**
   * Add audit trail entry
   */
  addAuditTrailEntry(action: string, newValue: any, notes?: string): AllocationModel {
    const auditEntry = {
      action,
      timestamp: new Date().toISOString(),
      newValue,
      notes
    };

    const newAuditTrail = [...this.auditTrail, auditEntry];
    return this.update({ auditTrail: newAuditTrail }, this.version);
  }

  /**
   * Check if allocation meets quality standards
   */
  meetsQualityStandards(): boolean {
    const failedMetrics = this.qualityMetrics.filter(metric => metric.complianceStatus === 'fail');
    return failedMetrics.length === 0;
  }

  /**
   * Check if allocation is compliant with regulations
   */
  isRegulatoryCompliant(): boolean {
    const nonCompliant = this.regulatoryCompliance.filter(compliance => compliance.status === 'non_compliant');
    return nonCompliant.length === 0;
  }

  /**
   * Check if allocation is LEED certified
   */
  isLEEDCertified(): boolean {
    return this.leedCompliance.certificationLevel !== 'none';
  }

  /**
   * Get allocation efficiency score
   */
  getEfficiencyScore(): number {
    let score = 100;

    // Reduce score based on environmental impact
    if (this.environmentalImpact.carbonFootprint > 1000) {
      score -= 20;
    } else if (this.environmentalImpact.carbonFootprint > 500) {
      score -= 10;
    }

    // Reduce score if not LEED certified
    if (!this.isLEEDCertified()) score -= 15;

    // Reduce score if quality issues
    if (!this.meetsQualityStandards()) score -= 25;

    // Reduce score if not regulatory compliant
    if (!this.isRegulatoryCompliant()) score -= 30;

    // Reduce score based on landfill diversion
    if (this.environmentalImpact.landfillDiversion < 50) {
      score -= (50 - this.environmentalImpact.landfillDiversion) * 0.5;
    }

    // Reduce score based on recycling rate
    if (this.environmentalImpact.recyclingRate < 30) {
      score -= (30 - this.environmentalImpact.recyclingRate) * 0.8;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Get cost effectiveness score
   */
  getCostEffectivenessScore(): number {
    const netCost = this.costBreakdown.netCost;
    const divertedFromLandfill = this.allocatedQuantity * (this.environmentalImpact.landfillDiversion / 100);

    if (divertedFromLandfill === 0) return 0;

    // Cost per ton diverted from landfill
    const costPerTonDiverted = Math.abs(netCost) / divertedFromLandfill;

    // Score based on cost effectiveness (lower cost per ton diverted is better)
    if (costPerTonDiverted > 500) return 20; // High cost
    if (costPerTonDiverted > 200) return 40; // Medium-high cost
    if (costPerTonDiverted > 100) return 60; // Medium cost
    if (costPerTonDiverted > 50) return 80; // Low-medium cost
    return 100; // Low cost
  }

  /**
   * Get allocation summary for reporting
   */
  getSummary(): Record<string, any> {
    const efficiencyScore = this.getEfficiencyScore();
    const costEffectivenessScore = this.getCostEffectivenessScore();

    return {
      id: this.id,
      allocationNumber: this.allocationNumber,
      materialTicketId: this.materialTicketId,
      materialType: this.materialType,
      allocationType: this.allocationType,
      allocatedQuantity: this.allocatedQuantity,
      allocatedPercentage: this.allocatedPercentage,
      destinationName: this.destination.name,
      destinationType: this.destination.type,
      meetsQualityStandards: this.meetsQualityStandards(),
      isRegulatoryCompliant: this.isRegulatoryCompliant(),
      isLEEDCertified: this.isLEEDCertified(),
      leedCertificationLevel: this.leedCompliance.certificationLevel,
      leedScore: this.leedCompliance.complianceScore,
      efficiencyScore,
      costEffectivenessScore,
      carbonFootprint: this.environmentalImpact.carbonFootprint,
      landfillDiversion: this.environmentalImpact.landfillDiversion,
      recyclingRate: this.environmentalImpact.recyclingRate,
      totalCost: this.costBreakdown.totalCost,
      netCost: this.costBreakdown.netCost,
      transportationDistance: this.transportation.distance,
      transportationEmissions: this.transportation.emissions,
      leedCreditsCount: this.leedCompliance.creditsEarned.length,
      qualityMetricsCount: this.qualityMetrics.length,
      regulatoryComplianceCount: this.regulatoryCompliance.length,
      documentationCount: this.documentation.length
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Allocation {
    return {
      id: this.id,
      externalIds: this.externalIds,
      allocationNumber: this.allocationNumber,
      materialTicketId: this.materialTicketId,
      materialType: this.materialType,
      allocationType: this.allocationType,
      allocatedQuantity: this.allocatedQuantity,
      unit: this.unit,
      allocatedPercentage: this.allocatedPercentage,
      destination: this.destination,
      processingMethod: this.processingMethod,
      environmentalImpact: this.environmentalImpact,
      leedCompliance: this.leedCompliance,
      qualityMetrics: this.qualityMetrics,
      transportation: this.transportation,
      costBreakdown: this.costBreakdown,
      regulatoryCompliance: this.regulatoryCompliance,
      documentation: this.documentation,
      auditTrail: this.auditTrail,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Allocation> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for allocation changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'allocation',
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

    // Business rule: High environmental impact should have LEED certification
    if (this.environmentalImpact.carbonFootprint > 1000 && !this.isLEEDCertified()) {
      errors.push('High carbon footprint allocations should pursue LEED certification');
    }

    // Business rule: Quality standards must be met for processed materials
    if (this.allocationType === 'processed' && !this.meetsQualityStandards()) {
      errors.push('Processed materials must meet quality standards');
    }

    // Business rule: Regulatory compliance required for disposal
    if (this.allocationType === 'disposed' && !this.isRegulatoryCompliant()) {
      errors.push('Disposal allocations must be regulatory compliant');
    }

    // Business rule: High transportation emissions should be minimized
    if (this.transportation.emissions > 100 && this.transportation.distance > 50) {
      errors.push('High emission transportation should be optimized for shorter distances');
    }

    // Business rule: Documentation required for LEED credits
    if (this.isLEEDCertified()) {
      const creditsWithoutDocs = this.leedCompliance.creditsEarned.filter(credit =>
        credit.points > 0 && (!credit.documentation || credit.documentation.length === 0)
      );

      if (creditsWithoutDocs.length > 0) {
        errors.push('LEED credits should have supporting documentation');
      }
    }

    // Business rule: Cost effectiveness should be monitored
    if (this.getCostEffectivenessScore() < 40) {
      errors.push('Allocation cost effectiveness is below acceptable threshold');
    }

    // Business rule: Landfill diversion should be maximized
    if (this.allocationType === 'disposed' && this.environmentalImpact.landfillDiversion > 0) {
      errors.push('Disposal allocations should have zero landfill diversion');
    }

    // Business rule: Recycling rate should be optimized
    if (this.allocationType === 'recycled' && this.environmentalImpact.recyclingRate < 80) {
      errors.push('Recycling allocations should have high recycling rates');
    }

    return errors;
  }
}

/**
 * Allocation factory for creating allocations from legacy data
 */
export class AllocationFactory {
  /**
   * Create allocation from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): AllocationModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Allocation> = {
      externalIds: [legacyData.allocation_id || legacyData.ALLOCATION_ID || legacyData.ticket_allocation_id || legacyData.id],
      allocationNumber: legacyData.allocation_number || legacyData.ALLOCATION_NUMBER || legacyData.allocation_no || `ALLOC-${Date.now()}`,
      materialTicketId: legacyData.material_ticket_id || legacyData.MATERIAL_TICKET_ID || legacyData.ticket_id,
      materialType: legacyData.material_type || legacyData.MATERIAL_TYPE || 'mixed_waste',
      allocationType: this.mapLegacyAllocationType(legacyData.allocation_type || legacyData.type || 'processed'),
      allocatedQuantity: legacyData.allocated_quantity || legacyData.ALLOCATED_QUANTITY || legacyData.quantity || 0,
      unit: legacyData.unit || legacyData.UNIT || 'tons',
      allocatedPercentage: legacyData.allocated_percentage || legacyData.ALLOCATED_PERCENTAGE || 100,
      destination: this.mapLegacyDestination(legacyData),
      processingMethod: this.mapLegacyProcessingMethod(legacyData),
      environmentalImpact: this.mapLegacyEnvironmentalImpact(legacyData),
      leedCompliance: this.mapLegacyLEEDCompliance(legacyData),
      qualityMetrics: this.mapLegacyQualityMetrics(legacyData),
      transportation: this.mapLegacyTransportation(legacyData),
      costBreakdown: this.mapLegacyCostBreakdown(legacyData),
      regulatoryCompliance: this.mapLegacyRegulatoryCompliance(legacyData),
      documentation: this.mapLegacyDocumentation(legacyData),
      auditTrail: this.mapLegacyAuditTrail(legacyData),
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy allocation tracking system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
        allocationData: {
          projectId: legacyData.project_id,
          batchId: legacyData.batch_id,
          certificationId: legacyData.certification_id
        }
      }
    };

    return AllocationModel.create(mappedData as any);
  }

  /**
   * Map legacy allocation type
   */
  private static mapLegacyAllocationType(legacyType: string): Allocation['allocationType'] {
    const typeMap: Record<string, Allocation['allocationType']> = {
      'direct': 'direct',
      'diverted': 'diverted',
      'processed': 'processed',
      'transferred': 'transferred',
      'disposed': 'disposed',
      'recycled': 'recycled',
      'donated': 'donated',
      'disposal': 'disposed',
      'recycling': 'recycled',
      'transfer': 'transferred'
    };

    return typeMap[legacyType.toLowerCase()] || 'processed';
  }

  /**
   * Map legacy destination
   */
  private static mapLegacyDestination(legacyData: Record<string, any>): Allocation['destination'] {
    return {
      type: this.mapLegacyDestinationType(legacyData.destination_type || legacyData.destination || 'facility'),
      id: legacyData.destination_id || legacyData.DESTINATION_ID || 'unknown',
      name: legacyData.destination_name || legacyData.DESTINATION_NAME || 'Unknown Destination',
      licenseNumber: legacyData.license_number || legacyData.LICENSE_NUMBER,
      permitNumber: legacyData.permit_number || legacyData.PERMIT_NUMBER
    };
  }

  /**
   * Map legacy destination type
   */
  private static mapLegacyDestinationType(legacyType: string): Allocation['destination']['type'] {
    const typeMap: Record<string, Allocation['destination']['type']> = {
      'facility': 'facility',
      'customer': 'customer',
      'vendor': 'vendor',
      'landfill': 'landfill',
      'recycling_center': 'recycling_center',
      'donation_center': 'donation_center',
      'landfill': 'landfill',
      'recycling': 'recycling_center',
      'donation': 'donation_center'
    };

    return typeMap[legacyType.toLowerCase()] || 'facility';
  }

  /**
   * Map legacy processing method
   */
  private static mapLegacyProcessingMethod(legacyData: Record<string, any>): Allocation['processingMethod'] {
    return {
      method: legacyData.processing_method || legacyData.PROCESSING_METHOD || 'Unknown',
      efficiency: legacyData.processing_efficiency || legacyData.PROCESSING_EFFICIENCY || 75,
      outputProduct: legacyData.output_product || legacyData.OUTPUT_PRODUCT,
      byproducts: legacyData.byproducts || legacyData.BYPRODUCTS || [],
      energyConsumption: legacyData.energy_consumption || legacyData.ENERGY_CONSUMPTION,
      waterUsage: legacyData.water_usage || legacyData.WATER_USAGE
    };
  }

  /**
   * Map legacy environmental impact
   */
  private static mapLegacyEnvironmentalImpact(legacyData: Record<string, any>): Allocation['environmentalImpact'] {
    return {
      carbonFootprint: legacyData.carbon_footprint || legacyData.CARBON_FOOTPRINT || 0,
      waterImpact: legacyData.water_impact || legacyData.WATER_IMPACT || 0,
      energyImpact: legacyData.energy_impact || legacyData.ENERGY_IMPACT || 0,
      landfillDiversion: legacyData.landfill_diversion || legacyData.LANDFILL_DIVERSION || 0,
      recyclingRate: legacyData.recycling_rate || legacyData.RECYCLING_RATE || 0
    };
  }

  /**
   * Map legacy LEED compliance
   */
  private static mapLegacyLEEDCompliance(legacyData: Record<string, any>): Allocation['leedCompliance'] {
    return {
      creditsEarned: this.mapLegacyLEEDCredits(legacyData.leed_credits || legacyData.LEED_CREDITS || []),
      totalPoints: legacyData.total_leed_points || legacyData.TOTAL_LEED_POINTS || 0,
      certificationLevel: this.mapLegacyCertificationLevel(legacyData.leed_certification || legacyData.LEED_CERTIFICATION || 'none'),
      complianceScore: legacyData.leed_score || legacyData.LEED_SCORE || 0,
      lastAuditDate: legacyData.last_audit_date || legacyData.LAST_AUDIT_DATE,
      nextAuditDate: legacyData.next_audit_date || legacyData.NEXT_AUDIT_DATE,
      auditor: legacyData.auditor || legacyData.AUDITOR
    };
  }

  /**
   * Map legacy LEED credits
   */
  private static mapLegacyLEEDCredits(credits: any[]): Allocation['leedCompliance']['creditsEarned'] {
    if (!Array.isArray(credits)) return [];

    return credits.map((credit: any) => ({
      category: credit.category || 'Materials & Resources',
      credit: credit.credit || credit.credit_name || 'Unknown',
      points: credit.points || 0,
      maxPoints: credit.max_points || credit.maxPoints || 1,
      description: credit.description || 'No description',
      documentation: credit.documentation || []
    }));
  }

  /**
   * Map legacy certification level
   */
  private static mapLegacyCertificationLevel(legacyLevel: string): Allocation['leedCompliance']['certificationLevel'] {
    const levelMap: Record<string, Allocation['leedCompliance']['certificationLevel']> = {
      'certified': 'certified',
      'silver': 'silver',
      'gold': 'gold',
      'platinum': 'platinum',
      'none': 'none',
      'pending': 'none',
      'cert': 'certified'
    };

    return levelMap[legacyLevel.toLowerCase()] || 'none';
  }

  /**
   * Map legacy quality metrics
   */
  private static mapLegacyQualityMetrics(legacyData: Record<string, any>): Allocation['qualityMetrics'] {
    if (!legacyData.quality_metrics && !legacyData.quality_tests) {
      return [];
    }

    const metricsData = legacyData.quality_metrics || legacyData.quality_tests || [];

    if (Array.isArray(metricsData)) {
      return metricsData.map((metric: any) => ({
        parameter: metric.parameter || metric.test_name || 'Unknown',
        value: metric.value || metric.result || 0,
        unit: metric.unit || 'units',
        testMethod: metric.test_method || metric.method || 'Standard Test',
        complianceStatus: this.mapLegacyComplianceStatus(metric.status || metric.compliance || 'pending'),
        notes: metric.notes || metric.comments
      }));
    }

    return [];
  }

  /**
   * Map legacy compliance status
   */
  private static mapLegacyComplianceStatus(legacyStatus: string): Allocation['qualityMetrics'][0]['complianceStatus'] {
    const statusMap: Record<string, Allocation['qualityMetrics'][0]['complianceStatus']> = {
      'pass': 'pass',
      'fail': 'fail',
      'pending': 'pending',
      'passed': 'pass',
      'failed': 'fail',
      'pass': 'pass'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'pending';
  }

  /**
   * Map legacy transportation
   */
  private static mapLegacyTransportation(legacyData: Record<string, any>): Allocation['transportation'] {
    return {
      method: legacyData.transportation_method || legacyData.TRANSPORTATION_METHOD || 'truck',
      distance: legacyData.transportation_distance || legacyData.TRANSPORTATION_DISTANCE || 0,
      fuelType: legacyData.fuel_type || legacyData.FUEL_TYPE,
      emissions: legacyData.transportation_emissions || legacyData.TRANSPORTATION_EMISSIONS || 0,
      cost: legacyData.transportation_cost || legacyData.TRANSPORTATION_COST || 0,
      carrier: legacyData.carrier || legacyData.CARRIER
    };
  }

  /**
   * Map legacy cost breakdown
   */
  private static mapLegacyCostBreakdown(legacyData: Record<string, any>): Allocation['costBreakdown'] {
    return {
      materialCost: legacyData.material_cost || legacyData.MATERIAL_COST || 0,
      processingCost: legacyData.processing_cost || legacyData.PROCESSING_COST || 0,
      transportationCost: legacyData.transportation_cost || legacyData.TRANSPORTATION_COST || 0,
      disposalCost: legacyData.disposal_cost || legacyData.DISPOSAL_COST || 0,
      totalCost: legacyData.total_cost || legacyData.TOTAL_COST || 0,
      revenue: legacyData.revenue || legacyData.REVENUE,
      netCost: legacyData.net_cost || legacyData.NET_COST || 0
    };
  }

  /**
   * Map legacy regulatory compliance
   */
  private static mapLegacyRegulatoryCompliance(legacyData: Record<string, any>): Allocation['regulatoryCompliance'] {
    if (!legacyData.regulatory_compliance && !legacyData.compliance_checks) {
      return [];
    }

    const complianceData = legacyData.regulatory_compliance || legacyData.compliance_checks || [];

    if (Array.isArray(complianceData)) {
      return complianceData.map((compliance: any) => ({
        regulation: compliance.regulation || compliance.regulation_name || 'Unknown Regulation',
        status: this.mapLegacyRegulatoryStatus(compliance.status || 'pending'),
        lastCheckDate: compliance.last_check_date || compliance.last_check || new Date().toISOString().split('T')[0],
        nextCheckDate: compliance.next_check_date || compliance.next_check || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: compliance.notes || compliance.comments,
        documentation: compliance.documentation || compliance.docs || []
      }));
    }

    return [];
  }

  /**
   * Map legacy regulatory status
   */
  private static mapLegacyRegulatoryStatus(legacyStatus: string): Allocation['regulatoryCompliance'][0]['status'] {
    const statusMap: Record<string, Allocation['regulatoryCompliance'][0]['status']> = {
      'compliant': 'compliant',
      'non_compliant': 'non_compliant',
      'pending': 'pending',
      'exempt': 'exempt',
      'compliant': 'compliant',
      'non-compliant': 'non_compliant',
      'exempt': 'exempt'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'pending';
  }

  /**
   * Map legacy documentation
   */
  private static mapLegacyDocumentation(legacyData: Record<string, any>): Allocation['documentation'] {
    if (!legacyData.documentation && !legacyData.documents) {
      return [];
    }

    const docsData = legacyData.documentation || legacyData.documents || [];

    if (Array.isArray(docsData)) {
      return docsData.map((doc: any) => ({
        type: doc.type || doc.document_type || 'Document',
        reference: doc.reference || doc.reference_number || 'Unknown',
        date: doc.date || doc.submission_date || new Date().toISOString().split('T')[0],
        status: this.mapLegacyDocumentStatus(doc.status || 'pending'),
        notes: doc.notes || doc.comments
      }));
    }

    return [];
  }

  /**
   * Map legacy document status
   */
  private static mapLegacyDocumentStatus(legacyStatus: string): Allocation['documentation'][0]['status'] {
    const statusMap: Record<string, Allocation['documentation'][0]['status']> = {
      'submitted': 'submitted',
      'approved': 'approved',
      'rejected': 'rejected',
      'pending': 'pending',
      'submit': 'submitted',
      'approve': 'approved',
      'reject': 'rejected'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'pending';
  }

  /**
   * Map legacy audit trail
   */
  private static mapLegacyAuditTrail(legacyData: Record<string, any>): Allocation['auditTrail'] {
    if (!legacyData.audit_trail && !legacyData.audit_history) {
      return [];
    }

    const auditData = legacyData.audit_trail || legacyData.audit_history || [];

    if (Array.isArray(auditData)) {
      return auditData.map((entry: any) => ({
        action: entry.action || entry.event || 'allocation_action',
        timestamp: entry.timestamp || entry.date || new Date().toISOString(),
        userId: entry.user_id || entry.user,
        previousValue: entry.previous_value || entry.old_value,
        newValue: entry.new_value || entry.value || 'unknown',
        notes: entry.notes || entry.description
      }));
    }

    return [];
  }
}

/**
 * Allocation validator for external validation
 */
export class AllocationValidator {
  /**
   * Validate allocation data without creating instance
   */
  static validate(data: Partial<Allocation>): { isValid: boolean; errors: string[] } {
    try {
      new AllocationModel(data);
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
  static validateBusinessRules(allocation: AllocationModel): string[] {
    return allocation.validateBusinessRules();
  }
}

/**
 * Allocation management utilities
 */
export class AllocationManager {
  /**
   * Optimize allocations based on environmental impact
   */
  static optimizeAllocations(allocations: AllocationModel[]): AllocationModel[] {
    const optimizedAllocations = [...allocations];

    // Sort by efficiency score (highest first)
    optimizedAllocations.sort((a, b) => b.getEfficiencyScore() - a.getEfficiencyScore());

    return optimizedAllocations;
  }

  /**
   * Get allocations by LEED certification level
   */
  static getAllocationsByLEEDLevel(allocations: AllocationModel[], level: 'certified' | 'silver' | 'gold' | 'platinum'): AllocationModel[] {
    return allocations.filter(allocation => allocation.leedCompliance.certificationLevel === level);
  }

  /**
   * Get allocations by environmental impact
   */
  static getAllocationsByImpactLevel(allocations: AllocationModel[], impactLevel: 'low' | 'medium' | 'high'): AllocationModel[] {
    return allocations.filter(allocation => {
      const score = allocation.getEfficiencyScore();
      if (impactLevel === 'low') return score >= 80;
      if (impactLevel === 'medium') return score >= 60 && score < 80;
      return score < 60;
    });
  }

  /**
   * Get allocations requiring attention
   */
  static getAllocationsRequiringAttention(allocations: AllocationModel[]): Array<{ allocation: AllocationModel; reason: string; priority: 'low' | 'medium' | 'high' }> {
    const requiringAttention: Array<{ allocation: AllocationModel; reason: string; priority: 'low' | 'medium' | 'high' }> = [];

    allocations.forEach(allocation => {
      if (!allocation.meetsQualityStandards()) {
        requiringAttention.push({
          allocation,
          reason: 'Allocation does not meet quality standards',
          priority: 'high'
        });
      }

      if (!allocation.isRegulatoryCompliant()) {
        requiringAttention.push({
          allocation,
          reason: 'Allocation is not regulatory compliant',
          priority: 'high'
        });
      }

      if (allocation.getEfficiencyScore() < 50) {
        requiringAttention.push({
          allocation,
          reason: 'Allocation has low efficiency score',
          priority: 'medium'
        });
      }

      if (allocation.getCostEffectivenessScore() < 40) {
        requiringAttention.push({
          allocation,
          reason: 'Allocation has low cost effectiveness',
          priority: 'medium'
        });
      }

      if (allocation.leedCompliance.complianceScore < 40 && !allocation.isLEEDCertified()) {
        requiringAttention.push({
          allocation,
          reason: 'Allocation should pursue LEED certification',
          priority: 'low'
        });
      }
    });

    return requiringAttention.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get allocation performance report
   */
  static getPerformanceReport(allocations: AllocationModel[]): Record<string, any> {
    const certifiedAllocations = allocations.filter(allocation => allocation.isLEEDCertified());
    const qualityCompliantAllocations = allocations.filter(allocation => allocation.meetsQualityStandards());
    const regulatoryCompliantAllocations = allocations.filter(allocation => allocation.isRegulatoryCompliant());

    const totalQuantity = allocations.reduce((sum, allocation) => sum + allocation.allocatedQuantity, 0);
    const totalCost = allocations.reduce((sum, allocation) => sum + allocation.costBreakdown.totalCost, 0);
    const totalEmissions = allocations.reduce((sum, allocation) => sum + allocation.transportation.emissions, 0);
    const totalDiversion = allocations.reduce((sum, allocation) => sum + (allocation.allocatedQuantity * allocation.environmentalImpact.landfillDiversion / 100), 0);

    const averageEfficiency = allocations.reduce((sum, allocation) => sum + allocation.getEfficiencyScore(), 0) / allocations.length;
    const averageCostEffectiveness = allocations.reduce((sum, allocation) => sum + allocation.getCostEffectivenessScore(), 0) / allocations.length;

    const allocationsByType = allocations.reduce((acc, allocation) => {
      acc[allocation.allocationType] = (acc[allocation.allocationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const leedCertificationBreakdown = allocations.reduce((acc, allocation) => {
      acc[allocation.leedCompliance.certificationLevel] = (acc[allocation.leedCompliance.certificationLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAllocations: allocations.length,
      certifiedAllocations: certifiedAllocations.length,
      qualityCompliantAllocations: qualityCompliantAllocations.length,
      regulatoryCompliantAllocations: regulatoryCompliantAllocations.length,
      certificationRate: allocations.length > 0 ? (certifiedAllocations.length / allocations.length) * 100 : 0,
      qualityComplianceRate: allocations.length > 0 ? (qualityCompliantAllocations.length / allocations.length) * 100 : 0,
      regulatoryComplianceRate: allocations.length > 0 ? (regulatoryCompliantAllocations.length / allocations.length) * 100 : 0,
      averageEfficiencyScore: Math.round(averageEfficiency * 100) / 100,
      averageCostEffectivenessScore: Math.round(averageCostEffectiveness * 100) / 100,
      totalQuantity: Math.round(totalQuantity * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      totalLandfillDiversion: Math.round(totalDiversion * 100) / 100,
      allocationsByType,
      leedCertificationBreakdown,
      averageLEEDScore: allocations.reduce((sum, allocation) => sum + allocation.leedCompliance.complianceScore, 0) / allocations.length
    };
  }

  /**
   * Check for allocation conflicts
   */
  static checkAllocationConflicts(allocations: AllocationModel[]): string[] {
    const conflicts: string[] = [];

    allocations.forEach(allocation => {
      if (!allocation.meetsQualityStandards()) {
        conflicts.push(`Allocation ${allocation.allocationNumber} does not meet quality standards`);
      }

      if (!allocation.isRegulatoryCompliant()) {
        conflicts.push(`Allocation ${allocation.allocationNumber} is not regulatory compliant`);
      }

      const businessRuleErrors = allocation.validateBusinessRules();
      conflicts.push(...businessRuleErrors.map(error => `${allocation.allocationNumber}: ${error}`));
    });

    return conflicts;
  }
}
