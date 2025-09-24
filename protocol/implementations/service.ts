/**
 * @fileoverview Service entity implementation with scheduling logic
 * @description Complete Service model with scheduling, pricing, and compliance
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Service, BaseEntity } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Service implementation with comprehensive scheduling and pricing logic
 */
export class ServiceModel implements Service {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  customerId: string;
  siteId: string;
  serviceType: 'waste' | 'recycling' | 'organics' | 'hazardous' | 'bulk';
  containerType: 'cart' | 'dumpster' | 'bin' | 'rolloff' | 'compactor';
  containerSize?: string;
  quantity?: number;
  schedule: {
    frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'on_call' | 'one_time';
    dayOfWeek?: string;
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    holidays?: string[];
    specialInstructions?: string;
  };
  pricing?: {
    baseRate: number;
    rateUnit: string;
    fuelSurcharge?: number;
    environmentalFee?: number;
    disposalFee?: number;
    totalRate?: number;
  };
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  serviceStartDate?: string;
  serviceEndDate?: string;
  contractId?: string;
  routeId?: string;
  specialInstructions?: string;
  serviceArea?: {
    territoryId: string;
    zone: string;
    priority: string;
  };
  performance?: {
    onTimePercentage?: number;
    averagePickupTime?: string;
    lastServiceDate?: string;
    nextServiceDate?: string;
  };
  compliance?: {
    environmentalRequirements?: string[];
    safetyRequirements?: string[];
    regulatoryRequirements?: string[];
  };

  private static readonly VALID_SERVICE_TYPES: Service['serviceType'][] = [
    'waste', 'recycling', 'organics', 'hazardous', 'bulk'
  ];
  private static readonly VALID_CONTAINER_TYPES: Service['containerType'][] = [
    'cart', 'dumpster', 'bin', 'rolloff', 'compactor'
  ];
  private static readonly VALID_FREQUENCIES: Service['schedule']['frequency'][] = [
    'weekly', 'bi_weekly', 'monthly', 'on_call', 'one_time'
  ];
  private static readonly VALID_STATUSES: Service['status'][] = [
    'active', 'inactive', 'suspended', 'pending'
  ];

  constructor(data: Partial<Service>) {
    this.validateAndAssign(data);
  }

  /**
   * Create a new service with validation
   */
  static create(data: Omit<Service, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>): ServiceModel {
    const now = new Date();
    const serviceData: Partial<Service> = {
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

    return new ServiceModel(serviceData);
  }

  /**
   * Update service with optimistic locking
   */
  update(updates: Partial<Omit<Service, keyof BaseEntity>>, expectedVersion: number): ServiceModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Service> = {
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

    return new ServiceModel(updatedData);
  }

  /**
   * Validate and assign service data
   */
  private validateAndAssign(data: Partial<Service>): void {
    // Required fields validation
    if (!data.customerId || typeof data.customerId !== 'string') {
      throw new Error('Customer ID is required and must be a string');
    }

    if (!data.siteId || typeof data.siteId !== 'string') {
      throw new Error('Site ID is required and must be a string');
    }

    if (!data.serviceType || !ServiceModel.VALID_SERVICE_TYPES.includes(data.serviceType)) {
      throw new Error(`Service type must be one of: ${ServiceModel.VALID_SERVICE_TYPES.join(', ')}`);
    }

    if (!data.containerType || !ServiceModel.VALID_CONTAINER_TYPES.includes(data.containerType)) {
      throw new Error(`Container type must be one of: ${ServiceModel.VALID_CONTAINER_TYPES.join(', ')}`);
    }

    if (!data.schedule) {
      throw new Error('Schedule is required');
    }

    if (!data.schedule.frequency || !ServiceModel.VALID_FREQUENCIES.includes(data.schedule.frequency)) {
      throw new Error(`Schedule frequency must be one of: ${ServiceModel.VALID_FREQUENCIES.join(', ')}`);
    }

    if (!data.schedule.startDate) {
      throw new Error('Schedule start date is required');
    }

    if (!data.status || !ServiceModel.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Status must be one of: ${ServiceModel.VALID_STATUSES.join(', ')}`);
    }

    // Date validation
    if (!this.isValidDate(data.schedule.startDate)) {
      throw new Error('Schedule start date must be a valid date');
    }

    if (data.schedule.endDate && !this.isValidDate(data.schedule.endDate)) {
      throw new Error('Schedule end date must be a valid date');
    }

    if (data.serviceStartDate && !this.isValidDate(data.serviceStartDate)) {
      throw new Error('Service start date must be a valid date');
    }

    if (data.serviceEndDate && !this.isValidDate(data.serviceEndDate)) {
      throw new Error('Service end date must be a valid date');
    }

    // Pricing validation
    if (data.pricing) {
      if (typeof data.pricing.baseRate !== 'number' || data.pricing.baseRate < 0) {
        throw new Error('Base rate must be a non-negative number');
      }

      if (data.pricing.fuelSurcharge && (data.pricing.fuelSurcharge < 0 || data.pricing.fuelSurcharge > 1)) {
        throw new Error('Fuel surcharge must be between 0 and 1');
      }
    }

    // Assign validated data
    Object.assign(this, data);

    // Calculate next service date
    this.calculateNextServiceDate();
  }

  /**
   * Validate date format
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  }

  /**
   * Calculate next service date based on schedule
   */
  private calculateNextServiceDate(): void {
    if (!this.performance) {
      this.performance = {};
    }

    const today = new Date();
    let nextDate = new Date(this.schedule.startDate);

    // Simple scheduling logic - in production this would be more sophisticated
    switch (this.schedule.frequency) {
      case 'weekly':
        // Find next occurrence of the specified day of week
        while (nextDate <= today) {
          nextDate.setDate(nextDate.getDate() + 7);
        }
        break;
      case 'bi_weekly':
        while (nextDate <= today) {
          nextDate.setDate(nextDate.getDate() + 14);
        }
        break;
      case 'monthly':
        while (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
      case 'on_call':
        // For on-call services, next date is null until scheduled
        nextDate = new Date();
        break;
      case 'one_time':
        // For one-time services, use the start date if it's in the future
        if (nextDate <= today) {
          nextDate = new Date();
        }
        break;
    }

    this.performance.nextServiceDate = nextDate.toISOString().split('T')[0];
  }

  /**
   * Check if service is active
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Check if service is recurring
   */
  isRecurring(): boolean {
    return this.schedule.frequency !== 'one_time';
  }

  /**
   * Get service duration in days
   */
  getServiceDuration(): number | null {
    if (!this.serviceStartDate || !this.serviceEndDate) {
      return null;
    }

    const start = new Date(this.serviceStartDate);
    const end = new Date(this.serviceEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate total monthly cost
   */
  getMonthlyCost(): number {
    if (!this.pricing) {
      return 0;
    }

    const baseRate = this.pricing.baseRate;
    let total = baseRate;

    if (this.pricing.fuelSurcharge) {
      total += baseRate * this.pricing.fuelSurcharge;
    }

    if (this.pricing.environmentalFee) {
      total += this.pricing.environmentalFee;
    }

    if (this.pricing.disposalFee) {
      total += this.pricing.disposalFee;
    }

    return total;
  }

  /**
   * Check if service needs rescheduling
   */
  needsRescheduling(): boolean {
    if (!this.performance?.nextServiceDate) {
      return true;
    }

    const nextService = new Date(this.performance.nextServiceDate);
    const today = new Date();
    const daysUntilService = Math.ceil((nextService.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Needs rescheduling if next service is within 24 hours or in the past
    return daysUntilService <= 1;
  }

  /**
   * Get service efficiency score
   */
  getEfficiencyScore(): number {
    if (!this.performance?.onTimePercentage) {
      return 0;
    }

    return this.performance.onTimePercentage;
  }

  /**
   * Update performance metrics
   */
  updatePerformance(completedDate: string, onTime: boolean): void {
    if (!this.performance) {
      this.performance = {};
    }

    this.performance.lastServiceDate = completedDate;

    // Update on-time percentage
    const currentOnTime = this.performance.onTimePercentage || 0;
    const newOnTime = onTime ? currentOnTime + 1 : currentOnTime - 1;
    this.performance.onTimePercentage = Math.max(0, Math.min(100, newOnTime));

    // Recalculate next service date
    this.calculateNextServiceDate();
  }

  /**
   * Get service summary for reporting
   */
  getSummary(): Record<string, any> {
    return {
      id: this.id,
      customerId: this.customerId,
      serviceType: this.serviceType,
      containerType: this.containerType,
      status: this.status,
      monthlyCost: this.getMonthlyCost(),
      isRecurring: this.isRecurring(),
      nextServiceDate: this.performance?.nextServiceDate,
      efficiencyScore: this.getEfficiencyScore(),
      needsRescheduling: this.needsRescheduling()
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Service {
    return {
      id: this.id,
      externalIds: this.externalIds,
      customerId: this.customerId,
      siteId: this.siteId,
      serviceType: this.serviceType,
      containerType: this.containerType,
      containerSize: this.containerSize,
      quantity: this.quantity,
      schedule: this.schedule,
      pricing: this.pricing,
      status: this.status,
      serviceStartDate: this.serviceStartDate,
      serviceEndDate: this.serviceEndDate,
      contractId: this.contractId,
      routeId: this.routeId,
      specialInstructions: this.specialInstructions,
      serviceArea: this.serviceArea,
      performance: this.performance,
      compliance: this.compliance,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Service> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for service changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'service',
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

    // Business rule: Active services should have a route assigned
    if (this.status === 'active' && !this.routeId) {
      errors.push('Active services must have a route assigned');
    }

    // Business rule: Services with contracts should have guaranteed pricing
    if (this.contractId && !this.pricing) {
      errors.push('Services with contracts must have pricing information');
    }

    // Business rule: Hazardous services require compliance information
    if (this.serviceType === 'hazardous' && (!this.compliance || this.compliance.environmentalRequirements?.length === 0)) {
      errors.push('Hazardous services must have environmental compliance requirements');
    }

    return errors;
  }
}

/**
 * Service factory for creating services from legacy data
 */
export class ServiceFactory {
  /**
   * Create service from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): ServiceModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Service> = {
      externalIds: [legacyData.service_id || legacyData.SERVICE_ID || legacyData.id],
      customerId: legacyData.customer_id || legacyData.CUSTOMER_ID,
      siteId: legacyData.site_id || legacyData.SITE_ID,
      serviceType: this.mapLegacyServiceType(legacyData.service_type || legacyData.SERVICE_TYPE || legacyData.type),
      containerType: this.mapLegacyContainerType(legacyData.container_type || legacyData.CONTAINER_TYPE || legacyData.container),
      containerSize: legacyData.container_size || legacyData.CONTAINER_SIZE,
      schedule: this.mapLegacySchedule(legacyData),
      pricing: this.mapLegacyPricing(legacyData),
      status: this.mapLegacyStatus(legacyData.status || legacyData.STATUS || 'active'),
      specialInstructions: legacyData.special_instructions || legacyData.SPECIAL_INSTRUCTIONS,
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy waste management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString()
      }
    };

    return ServiceModel.create(mappedData as any);
  }

  /**
   * Map legacy service types to standardized types
   */
  private static mapLegacyServiceType(legacyType: string): Service['serviceType'] {
    const typeMap: Record<string, Service['serviceType']> = {
      'waste': 'waste',
      'trash': 'waste',
      'garbage': 'waste',
      'recycling': 'recycling',
      'recycle': 'recycling',
      'organics': 'organics',
      'organic': 'organics',
      'food_waste': 'organics',
      'hazardous': 'hazardous',
      'hazmat': 'hazardous',
      'bulk': 'bulk',
      'bulky': 'bulk'
    };

    return typeMap[legacyType.toLowerCase()] || 'waste';
  }

  /**
   * Map legacy container types
   */
  private static mapLegacyContainerType(legacyType: string): Service['containerType'] {
    const typeMap: Record<string, Service['containerType']> = {
      'cart': 'cart',
      'toter': 'cart',
      'bin': 'bin',
      'dumpster': 'dumpster',
      'rolloff': 'rolloff',
      'roll_off': 'rolloff',
      'compactor': 'compactor'
    };

    return typeMap[legacyType.toLowerCase()] || 'dumpster';
  }

  /**
   * Map legacy schedule formats
   */
  private static mapLegacySchedule(legacyData: Record<string, any>): Service['schedule'] {
    return {
      frequency: this.mapLegacyFrequency(legacyData.frequency || legacyData.FREQUENCY),
      dayOfWeek: legacyData.day_of_week || legacyData.DAY_OF_WEEK,
      startDate: legacyData.start_date || legacyData.START_DATE || new Date().toISOString().split('T')[0],
      endDate: legacyData.end_date || legacyData.END_DATE,
      startTime: legacyData.start_time || legacyData.START_TIME,
      endTime: legacyData.end_time || legacyData.END_TIME,
      holidays: legacyData.holidays || legacyData.HOLIDAYS,
      specialInstructions: legacyData.schedule_notes || legacyData.SCHEDULE_NOTES
    };
  }

  /**
   * Map legacy frequency formats
   */
  private static mapLegacyFrequency(legacyFrequency: string): Service['schedule']['frequency'] {
    const freqMap: Record<string, Service['schedule']['frequency']> = {
      'weekly': 'weekly',
      'week': 'weekly',
      'bi_weekly': 'bi_weekly',
      'biweekly': 'bi_weekly',
      'monthly': 'monthly',
      'month': 'monthly',
      'on_call': 'on_call',
      'oncall': 'on_call',
      'one_time': 'one_time',
      'onetime': 'one_time'
    };

    return freqMap[legacyFrequency.toLowerCase()] || 'weekly';
  }

  /**
   * Map legacy pricing formats
   */
  private static mapLegacyPricing(legacyData: Record<string, any>): Service['pricing'] | undefined {
    if (!legacyData.price && !legacyData.rate && !legacyData.cost) {
      return undefined;
    }

    return {
      baseRate: legacyData.price || legacyData.rate || legacyData.cost || 0,
      rateUnit: legacyData.rate_unit || legacyData.RATE_UNIT || 'month',
      fuelSurcharge: legacyData.fuel_surcharge || legacyData.FUEL_SURCHARGE,
      environmentalFee: legacyData.environmental_fee || legacyData.ENVIRONMENTAL_FEE,
      disposalFee: legacyData.disposal_fee || legacyData.DISPOSAL_FEE
    };
  }

  /**
   * Map legacy status
   */
  private static mapLegacyStatus(legacyStatus: string): Service['status'] {
    const statusMap: Record<string, Service['status']> = {
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
}

/**
 * Service validator for external validation
 */
export class ServiceValidator {
  /**
   * Validate service data without creating instance
   */
  static validate(data: Partial<Service>): { isValid: boolean; errors: string[] } {
    try {
      new ServiceModel(data);
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
  static validateBusinessRules(service: ServiceModel): string[] {
    return service.validateBusinessRules();
  }
}
