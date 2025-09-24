/**
 * @fileoverview Facility entity implementation with capacity management
 * @description Complete Facility model with capacity tracking, permits, and environmental controls
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Facility, BaseEntity, Address, Contact, OperatingHours } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Facility implementation with comprehensive capacity management and compliance
 */
export class FacilityModel implements Facility {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  name: string;
  code: string;
  type: 'landfill' | 'mrf' | 'transfer' | 'composter' | 'export' | 'cad' | 'incinerator' | 'recycling_center';
  status: 'operational' | 'maintenance' | 'closed' | 'planned' | 'limited';
  address: Address;
  contactInformation?: Contact;
  operatingHours?: OperatingHours;
  capacity?: {
    dailyLimit?: number;
    monthlyLimit?: number;
    currentUtilization?: number;
  };
  acceptedMaterials: string[];
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
    currentLevel?: number;
    dailyAverage?: number;
    monthlyAverage?: number;
    peakUtilization?: number;
  };
  processingRates?: Array<{
    materialType: string;
    processingRate: number;
    rateUnit: string;
  }>;
  qualityStandards?: string[];
  assignedRoutes?: string[];
  materialTickets?: string[];

  private static readonly VALID_TYPES: Facility['type'][] = [
    'landfill', 'mrf', 'transfer', 'composter', 'export', 'cad', 'incinerator', 'recycling_center'
  ];
  private static readonly VALID_STATUSES: Facility['status'][] = [
    'operational', 'maintenance', 'closed', 'planned', 'limited'
  ];
  private static readonly MATERIAL_TYPES = [
    'waste', 'recycling', 'organics', 'hazardous', 'bulk', 'paper', 'plastic', 'metal', 'glass', 'electronics'
  ];

  constructor(data: Partial<Facility>) {
    this.validateAndAssign(data);
    this.initializeCapacityTracking();
  }

  /**
   * Create a new facility with validation
   */
  static create(data: Omit<Facility, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>): FacilityModel {
    const now = new Date();
    const facilityData: Partial<Facility> = {
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

    return new FacilityModel(facilityData);
  }

  /**
   * Update facility with optimistic locking
   */
  update(updates: Partial<Omit<Facility, keyof BaseEntity>>, expectedVersion: number): FacilityModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Facility> = {
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

    return new FacilityModel(updatedData);
  }

  /**
   * Validate and assign facility data
   */
  private validateAndAssign(data: Partial<Facility>): void {
    // Required fields validation
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Facility name is required and must be a string');
    }

    if (!data.code || typeof data.code !== 'string') {
      throw new Error('Facility code is required and must be a string');
    }

    if (!data.type || !FacilityModel.VALID_TYPES.includes(data.type)) {
      throw new Error(`Facility type must be one of: ${FacilityModel.VALID_TYPES.join(', ')}`);
    }

    if (!data.status || !FacilityModel.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Facility status must be one of: ${FacilityModel.VALID_STATUSES.join(', ')}`);
    }

    if (!data.address) {
      throw new Error('Address is required');
    }

    if (!Array.isArray(data.acceptedMaterials) || data.acceptedMaterials.length === 0) {
      throw new Error('Accepted materials must be a non-empty array');
    }

    // Validate accepted materials
    const invalidMaterials = data.acceptedMaterials.filter(
      material => !FacilityModel.MATERIAL_TYPES.includes(material)
    );
    if (invalidMaterials.length > 0) {
      throw new Error(`Invalid material types: ${invalidMaterials.join(', ')}`);
    }

    // Validate capacity if provided
    if (data.capacity) {
      if (data.capacity.dailyLimit && (data.capacity.dailyLimit < 0 || data.capacity.dailyLimit > 10000)) {
        throw new Error('Daily limit must be between 0 and 10,000 tons');
      }

      if (data.capacity.monthlyLimit && (data.capacity.monthlyLimit < 0 || data.capacity.monthlyLimit > 300000)) {
        throw new Error('Monthly limit must be between 0 and 300,000 tons');
      }
    }

    // Validate permits if provided
    if (data.permits) {
      data.permits.forEach((permit, index) => {
        if (!permit.permitNumber || typeof permit.permitNumber !== 'string') {
          throw new Error(`Permit ${index}: permit number is required`);
        }

        if (!permit.issuingAuthority || typeof permit.issuingAuthority !== 'string') {
          throw new Error(`Permit ${index}: issuing authority is required`);
        }

        if (!this.isValidDate(permit.validFrom)) {
          throw new Error(`Permit ${index}: valid from date is invalid`);
        }

        if (!this.isValidDate(permit.validTo)) {
          throw new Error(`Permit ${index}: valid to date is invalid`);
        }

        if (new Date(permit.validFrom) >= new Date(permit.validTo)) {
          throw new Error(`Permit ${index}: valid from date must be before valid to date`);
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
   * Initialize capacity tracking
   */
  private initializeCapacityTracking(): void {
    if (!this.utilization) {
      this.utilization = {
        currentLevel: 0,
        dailyAverage: 0,
        monthlyAverage: 0,
        peakUtilization: 0
      };
    }

    if (!this.capacity) {
      this.capacity = {};
    }
  }

  /**
   * Check if facility is operational
   */
  isOperational(): boolean {
    return this.status === 'operational';
  }

  /**
   * Check if facility is at capacity
   */
  isAtCapacity(): boolean {
    if (!this.capacity?.dailyLimit || !this.utilization?.currentLevel) {
      return false;
    }
    return this.utilization.currentLevel >= this.capacity.dailyLimit;
  }

  /**
   * Check if facility can accept material
   */
  canAcceptMaterial(materialType: string): boolean {
    return this.acceptedMaterials.includes(materialType) && this.isOperational() && !this.isAtCapacity();
  }

  /**
   * Get available capacity
   */
  getAvailableCapacity(): number {
    if (!this.capacity?.dailyLimit || !this.utilization?.currentLevel) {
      return this.capacity?.dailyLimit || 0;
    }
    return Math.max(0, this.capacity.dailyLimit - this.utilization.currentLevel);
  }

  /**
   * Get capacity utilization percentage
   */
  getUtilizationPercentage(): number {
    if (!this.capacity?.dailyLimit || !this.utilization?.currentLevel) {
      return 0;
    }
    return Math.min(100, (this.utilization.currentLevel / this.capacity.dailyLimit) * 100);
  }

  /**
   * Calculate tipping fee for material
   */
  calculateTippingFee(materialType: string, weight: number): number {
    let fee = this.pricing?.tippingFee || 0;

    // Apply material-specific rates if available
    if (this.pricing?.materialRates && this.pricing.materialRates[materialType]) {
      fee = this.pricing.materialRates[materialType];
    }

    // Apply minimum charge
    if (this.pricing?.minimumCharge && fee * weight < this.pricing.minimumCharge) {
      return this.pricing.minimumCharge;
    }

    return fee * weight;
  }

  /**
   * Process incoming material and update utilization
   */
  processIncomingMaterial(materialType: string, weight: number, ticketId: string): boolean {
    if (!this.canAcceptMaterial(materialType)) {
      return false;
    }

    // Update current utilization
    if (this.utilization) {
      this.utilization.currentLevel = (this.utilization.currentLevel || 0) + weight;

      // Update peak utilization
      if (this.utilization.currentLevel > (this.utilization.peakUtilization || 0)) {
        this.utilization.peakUtilization = this.utilization.currentLevel;
      }
    }

    // Add material ticket reference
    if (!this.materialTickets) {
      this.materialTickets = [];
    }
    this.materialTickets.push(ticketId);

    // Update daily average (simple moving average)
    if (this.utilization) {
      const currentDailyAvg = this.utilization.dailyAverage || 0;
      this.utilization.dailyAverage = (currentDailyAvg + this.utilization.currentLevel) / 2;
    }

    return true;
  }

  /**
   * End of day capacity reset
   */
  endOfDayReset(): void {
    if (this.utilization) {
      // Update monthly average
      const currentMonthlyAvg = this.utilization.monthlyAverage || 0;
      const currentDailyTotal = this.utilization.dailyAverage || 0;
      this.utilization.monthlyAverage = (currentMonthlyAvg + currentDailyTotal) / 2;

      // Reset daily metrics
      this.utilization.currentLevel = 0;
      this.utilization.dailyAverage = 0;
    }

    // Clear material tickets (they're tracked separately)
    this.materialTickets = [];
  }

  /**
   * Check if facility needs maintenance
   */
  needsMaintenance(): boolean {
    const utilizationPercent = this.getUtilizationPercentage();
    const peakUtilization = this.utilization?.peakUtilization || 0;
    const dailyLimit = this.capacity?.dailyLimit || 0;

    // Maintenance needed if consistently running at high capacity
    return utilizationPercent > 90 || (peakUtilization / dailyLimit) > 0.95;
  }

  /**
   * Get facility efficiency score
   */
  getEfficiencyScore(): number {
    const utilizationPercent = this.getUtilizationPercentage();
    const operationalScore = this.isOperational() ? 100 : 0;

    // Optimal utilization is 70-85% for efficiency
    let utilizationScore = 0;
    if (utilizationPercent >= 70 && utilizationPercent <= 85) {
      utilizationScore = 100;
    } else if (utilizationPercent >= 50 && utilizationPercent < 70) {
      utilizationScore = 80;
    } else if (utilizationPercent > 85 && utilizationPercent <= 95) {
      utilizationScore = 60;
    } else if (utilizationPercent < 50) {
      utilizationScore = 40;
    } else {
      utilizationScore = 20;
    }

    return (operationalScore + utilizationScore) / 2;
  }

  /**
   * Get facility summary for reporting
   */
  getSummary(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      type: this.type,
      status: this.status,
      utilizationPercentage: Math.round(this.getUtilizationPercentage() * 100) / 100,
      availableCapacity: Math.round(this.getAvailableCapacity() * 100) / 100,
      efficiencyScore: Math.round(this.getEfficiencyScore() * 100) / 100,
      acceptedMaterialsCount: this.acceptedMaterials.length,
      activePermits: this.permits?.filter(p => new Date(p.validTo) > new Date()).length || 0,
      isOperational: this.isOperational(),
      needsMaintenance: this.needsMaintenance(),
      monthlyAverageUtilization: Math.round((this.utilization?.monthlyAverage || 0) * 100) / 100
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Facility {
    return {
      id: this.id,
      externalIds: this.externalIds,
      name: this.name,
      code: this.code,
      type: this.type,
      status: this.status,
      address: this.address,
      contactInformation: this.contactInformation,
      operatingHours: this.operatingHours,
      capacity: this.capacity,
      acceptedMaterials: this.acceptedMaterials,
      pricing: this.pricing,
      serviceRestrictions: this.serviceRestrictions,
      permits: this.permits,
      environmentalControls: this.environmentalControls,
      complianceRecords: this.complianceRecords,
      utilization: this.utilization,
      processingRates: this.processingRates,
      qualityStandards: this.qualityStandards,
      assignedRoutes: this.assignedRoutes,
      materialTickets: this.materialTickets,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Facility> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for facility changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'facility',
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

    // Business rule: Operational facilities should have current utilization
    if (this.status === 'operational' && this.utilization?.currentLevel === undefined) {
      errors.push('Operational facilities must track utilization');
    }

    // Business rule: Facilities with high utilization should have capacity limits
    const utilizationPercent = this.getUtilizationPercentage();
    if (utilizationPercent > 80 && (!this.capacity?.dailyLimit || this.capacity.dailyLimit === 0)) {
      errors.push('High utilization facilities must have daily capacity limits');
    }

    // Business rule: Landfills should have environmental controls
    if (this.type === 'landfill' && (!this.environmentalControls || this.environmentalControls.length === 0)) {
      errors.push('Landfills must have environmental controls');
    }

    // Business rule: Facilities accepting hazardous materials need permits
    if (this.acceptedMaterials.includes('hazardous')) {
      const hasValidPermit = this.permits?.some(permit =>
        new Date(permit.validTo) > new Date() &&
        permit.permitType.toLowerCase().includes('hazardous')
      );

      if (!hasValidPermit) {
        errors.push('Facilities accepting hazardous materials must have valid hazardous waste permits');
      }
    }

    return errors;
  }
}

/**
 * Facility factory for creating facilities from legacy data
 */
export class FacilityFactory {
  /**
   * Create facility from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): FacilityModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Facility> = {
      externalIds: [legacyData.facility_id || legacyData.FACILITY_ID || legacyData.id],
      name: legacyData.facility_name || legacyData.FACILITY_NAME || legacyData.name,
      code: legacyData.facility_code || legacyData.FACILITY_CODE || legacyData.code,
      type: this.mapLegacyFacilityType(legacyData.facility_type || legacyData.FACILITY_TYPE || legacyData.type),
      status: this.mapLegacyStatus(legacyData.status || legacyData.STATUS || 'operational'),
      address: this.mapLegacyAddress(legacyData),
      contactInformation: this.mapLegacyContact(legacyData),
      operatingHours: this.mapLegacyOperatingHours(legacyData),
      capacity: this.mapLegacyCapacity(legacyData),
      acceptedMaterials: this.mapLegacyMaterials(legacyData),
      pricing: this.mapLegacyPricing(legacyData),
      permits: this.mapLegacyPermits(legacyData),
      environmentalControls: legacyData.environmental_controls || legacyData.ENVIRONMENTAL_CONTROLS,
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy waste management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString()
      }
    };

    return FacilityModel.create(mappedData as any);
  }

  /**
   * Map legacy facility types
   */
  private static mapLegacyFacilityType(legacyType: string): Facility['type'] {
    const typeMap: Record<string, Facility['type']> = {
      'landfill': 'landfill',
      'lf': 'landfill',
      'mrf': 'mrf',
      'materials_recovery': 'mrf',
      'transfer': 'transfer',
      'transfer_station': 'transfer',
      'composter': 'composter',
      'compost': 'composter',
      'export': 'export',
      'cad': 'cad',
      'incinerator': 'incinerator',
      'recycling_center': 'recycling_center',
      'recycling': 'recycling_center'
    };

    return typeMap[legacyType.toLowerCase()] || 'transfer';
  }

  /**
   * Map legacy status
   */
  private static mapLegacyStatus(legacyStatus: string): Facility['status'] {
    const statusMap: Record<string, Facility['status']> = {
      'operational': 'operational',
      'op': 'operational',
      'active': 'operational',
      'maintenance': 'maintenance',
      'maint': 'maintenance',
      'closed': 'closed',
      'planned': 'planned',
      'limited': 'limited'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'operational';
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

  /**
   * Map legacy contact formats
   */
  private static mapLegacyContact(legacyData: Record<string, any>): Contact | undefined {
    if (!legacyData.contact_name && !legacyData.phone && !legacyData.email) {
      return undefined;
    }

    return {
      name: legacyData.contact_name || legacyData.CONTACT_NAME || 'Facility Contact',
      title: legacyData.contact_title || legacyData.CONTACT_TITLE,
      email: legacyData.email || legacyData.EMAIL,
      phone: legacyData.phone || legacyData.PHONE,
      mobile: legacyData.mobile || legacyData.MOBILE
    };
  }

  /**
   * Map legacy operating hours
   */
  private static mapLegacyOperatingHours(legacyData: Record<string, any>): OperatingHours | undefined {
    // Simplified mapping - in production this would be more comprehensive
    return {
      monday: { open: '06:00', close: '18:00' },
      tuesday: { open: '06:00', close: '18:00' },
      wednesday: { open: '06:00', close: '18:00' },
      thursday: { open: '06:00', close: '18:00' },
      friday: { open: '06:00', close: '18:00' },
      saturday: { open: '08:00', close: '16:00' },
      holidays: legacyData.holidays || legacyData.HOLIDAYS
    };
  }

  /**
   * Map legacy capacity formats
   */
  private static mapLegacyCapacity(legacyData: Record<string, any>): Facility['capacity'] {
    return {
      dailyLimit: legacyData.daily_capacity || legacyData.DAILY_CAPACITY || legacyData.daily_limit,
      monthlyLimit: legacyData.monthly_capacity || legacyData.MONTHLY_CAPACITY || legacyData.monthly_limit
    };
  }

  /**
   * Map legacy materials
   */
  private static mapLegacyMaterials(legacyData: Record<string, any>): string[] {
    const materials = legacyData.accepted_materials || legacyData.ACCEPTED_MATERIALS || [];
    if (Array.isArray(materials)) {
      return materials;
    }

    // Handle comma-separated string
    if (typeof materials === 'string') {
      return materials.split(',').map((m: string) => m.trim().toLowerCase());
    }

    return ['waste']; // Default fallback
  }

  /**
   * Map legacy pricing
   */
  private static mapLegacyPricing(legacyData: Record<string, any>): Facility['pricing'] | undefined {
    if (!legacyData.tipping_fee && !legacyData.fees) {
      return undefined;
    }

    const pricing: Facility['pricing'] = {
      tippingFee: legacyData.tipping_fee || legacyData.TIPPING_FEE || legacyData.fees
    };

    // Handle material-specific rates if available
    if (legacyData.material_rates) {
      pricing.materialRates = legacyData.material_rates;
    }

    if (legacyData.minimum_charge) {
      pricing.minimumCharge = legacyData.minimum_charge;
    }

    return pricing;
  }

  /**
   * Map legacy permits
   */
  private static mapLegacyPermits(legacyData: Record<string, any>): Facility['permits'] {
    if (!legacyData.permits && !legacyData.permits_list) {
      return [];
    }

    const permits = legacyData.permits || legacyData.permits_list || [];
    if (Array.isArray(permits)) {
      return permits;
    }

    // Handle single permit object
    return [permits];
  }
}

/**
 * Facility validator for external validation
 */
export class FacilityValidator {
  /**
   * Validate facility data without creating instance
   */
  static validate(data: Partial<Facility>): { isValid: boolean; errors: string[] } {
    try {
      new FacilityModel(data);
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
  static validateBusinessRules(facility: FacilityModel): string[] {
    return facility.validateBusinessRules();
  }
}

/**
 * Facility capacity manager
 */
export class FacilityCapacityManager {
  /**
   * Optimize capacity across multiple facilities
   */
  static optimizeCapacityDistribution(facilities: FacilityModel[], materialDemand: Map<string, number>): FacilityModel[] {
    const optimizedFacilities = [...facilities];

    // Distribute material processing based on available capacity and efficiency
    for (const [materialType, demand] of materialDemand) {
      const suitableFacilities = optimizedFacilities.filter(facility =>
        facility.canAcceptMaterial(materialType)
      );

      if (suitableFacilities.length === 0) continue;

      // Sort by available capacity and efficiency
      suitableFacilities.sort((a, b) => {
        const aAvailable = a.getAvailableCapacity();
        const bAvailable = b.getAvailableCapacity();
        const aEfficiency = a.getEfficiencyScore();
        const bEfficiency = b.getEfficiencyScore();

        return (bAvailable * bEfficiency) - (aAvailable * aEfficiency);
      });

      this.distributeMaterialToFacilities(suitableFacilities, materialType, demand);
    }

    return optimizedFacilities;
  }

  /**
   * Distribute material processing across facilities
   */
  private static distributeMaterialToFacilities(facilities: FacilityModel[], materialType: string, totalDemand: number): void {
    let remainingDemand = totalDemand;

    for (const facility of facilities) {
      if (remainingDemand <= 0) break;

      const availableCapacity = facility.getAvailableCapacity();
      const processingCapacity = Math.min(availableCapacity, remainingDemand);

      if (processingCapacity > 0) {
        facility.processIncomingMaterial(materialType, processingCapacity, `system-${Date.now()}`);
        remainingDemand -= processingCapacity;
      }
    }
  }
}
