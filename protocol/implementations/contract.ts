/**
 * @fileoverview Contract entity implementation with guaranteed pricing logic
 * @description Complete Contract model for managing customer agreements with pricing guarantees and terms
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Contract, BaseEntity } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Contract implementation with comprehensive guaranteed pricing logic and contract management
 */
export class ContractModel implements Contract {
  id!: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  version!: number;

  customerId!: string;
  siteId?: string;
  contractNumber!: string;
  serviceTypes!: string[];
  guaranteedServices!: string[];
  contractStatus!: 'draft' | 'active' | 'expired' | 'cancelled' | 'renewed' | 'pending_approval';
  pricing!: {
    baseRate: number;
    rateUnit: string;
    escalationClause?: number;
    fuelSurcharge?: number;
    environmentalFee?: number;
    disposalFee?: number;
    totalRate?: number;
    priceAdjustments?: Array<{
      type: string;
      amount: number;
      effectiveDate: string;
      reason: string;
    }>;
  };
  term!: {
    startDate: string;
    endDate: string;
    autoRenewal?: boolean;
    renewalTerms?: string;
    renewalOptions?: number;
    noticePeriod?: number;
  };
  status!: 'active' | 'expired' | 'cancelled' | 'pending' | 'draft';
  specialTerms?: string[];
  serviceType!: string;

  static readonly VALID_SERVICE_TYPES = [
    'waste', 'recycling', 'organics', 'hazardous', 'bulk'
  ];

  private static readonly VALID_RATE_UNITS = [
    'month', 'quarter', 'year', 'per_ton', 'per_cubic_yard', 'per_pickup'
  ];

  private static readonly VALID_CONTRACT_STATUSES: Contract['contractStatus'][] = [
    'draft', 'active', 'expired', 'cancelled', 'renewed', 'pending_approval'
  ];

  constructor(data: Partial<Contract>) {
    this.validateAndAssign(data);
    this.calculateTotalRate();
  }

  /**
   * Create a new contract with validation
   */
  static create(data: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'version'>): ContractModel {
    const now = new Date();
    const contractData: Partial<Contract> = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'contract_system'
      }
    };

    return new ContractModel(contractData);
  }

  /**
   * Update contract with optimistic locking
   */
  update(updates: Partial<Contract>, expectedVersion: number): ContractModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Contract> = {
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

    return new ContractModel(updatedData);
  }

  /**
   * Validate and assign contract data
   */
  private validateAndAssign(data: Partial<Contract>): void {
    // Required fields validation
    if (!data.customerId || typeof data.customerId !== 'string') {
      throw new Error('Customer ID is required and must be a string');
    }

    if (!data.contractNumber || typeof data.contractNumber !== 'string') {
      throw new Error('Contract number is required and must be a string');
    }

    if (!data.term) {
      throw new Error('Contract term is required');
    }

    if (!this.isValidDate(data.term.startDate)) {
      throw new Error('Contract start date must be a valid date');
    }

    if (!this.isValidDate(data.term.endDate)) {
      throw new Error('Contract end date must be a valid date');
    }

    if (new Date(data.term.startDate) >= new Date(data.term.endDate)) {
      throw new Error('Contract start date must be before end date');
    }

    if (!data.pricing) {
      throw new Error('Contract pricing is required');
    }

    if (typeof data.pricing.baseRate !== 'number' || data.pricing.baseRate <= 0) {
      throw new Error('Base rate must be a positive number');
    }

    if (!data.pricing.rateUnit || !ContractModel.VALID_RATE_UNITS.includes(data.pricing.rateUnit)) {
      throw new Error(`Rate unit must be one of: ${ContractModel.VALID_RATE_UNITS.join(', ')}`);
    }

    if (!Array.isArray(data.serviceTypes) || data.serviceTypes.length === 0) {
      throw new Error('Service types must be a non-empty array');
    }

    data.serviceTypes.forEach((serviceType, index) => {
      if (!ContractModel.VALID_SERVICE_TYPES.includes(serviceType)) {
        throw new Error(`Service type ${index} must be one of: ${ContractModel.VALID_SERVICE_TYPES.join(', ')}`);
      }
    });

    if (!Array.isArray(data.guaranteedServices) || data.guaranteedServices.length === 0) {
      throw new Error('Guaranteed services must be a non-empty array');
    }

    if (!data.contractStatus || !ContractModel.VALID_CONTRACT_STATUSES.includes(data.contractStatus)) {
      throw new Error(`Contract status must be one of: ${ContractModel.VALID_CONTRACT_STATUSES.join(', ')}`);
    }

    // Set status to match contractStatus if not provided
    if (!data.status) {
      const statusMap: Record<string, 'active' | 'expired' | 'cancelled' | 'pending' | 'draft'> = {
        'active': 'active',
        'expired': 'expired',
        'cancelled': 'cancelled',
        'renewed': 'active',
        'pending_approval': 'pending',
        'draft': 'draft'
      };
      data.status = statusMap[data.contractStatus] || 'draft';
    }

    // Set serviceType from serviceTypes if not provided
    if (!data.serviceType && data.serviceTypes && data.serviceTypes.length > 0) {
      data.serviceType = data.serviceTypes[0];
    }

    // Validate pricing adjustments if provided
    if (data.pricing.priceAdjustments) {
      data.pricing.priceAdjustments.forEach((adjustment, index) => {
        if (!adjustment.type || !['increase', 'decrease', 'fixed'].includes(adjustment.type)) {
          throw new Error(`Price adjustment ${index}: type must be 'increase', 'decrease', or 'fixed'`);
        }

        if (typeof adjustment.amount !== 'number') {
          throw new Error(`Price adjustment ${index}: amount must be a number`);
        }

        if (!this.isValidDate(adjustment.effectiveDate)) {
          throw new Error(`Price adjustment ${index}: effective date must be valid`);
        }

        if (!adjustment.reason || typeof adjustment.reason !== 'string') {
          throw new Error(`Price adjustment ${index}: reason is required`);
        }
      });
    }

    // Validate special terms
    if (data.specialTerms) {
      data.specialTerms.forEach((term, index) => {
        if (typeof term !== 'string' || term.trim().length === 0) {
          throw new Error(`Special term ${index} must be a non-empty string`);
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
   * Calculate total rate including all fees
   */
  private calculateTotalRate(): void {
    let totalRate = this.pricing.baseRate;

    if (this.pricing.fuelSurcharge) {
      totalRate += this.pricing.baseRate * this.pricing.fuelSurcharge;
    }

    if (this.pricing.environmentalFee) {
      totalRate += this.pricing.environmentalFee;
    }

    if (this.pricing.disposalFee) {
      totalRate += this.pricing.disposalFee;
    }

    this.pricing.totalRate = Math.round(totalRate * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Add special term to contract
   */
  addSpecialTerm(term: string): ContractModel {
    if (!term || typeof term !== 'string' || term.trim().length === 0) {
      throw new Error('Special term must be a non-empty string');
    }

    const newTerms = [...(this.specialTerms || []), term.trim()];
    return this.update({ specialTerms: newTerms }, this.version);
  }

  /**
   * Remove special term from contract
   */
  removeSpecialTerm(termIndex: number): ContractModel {
    if (termIndex < 0 || termIndex >= (this.specialTerms?.length || 0)) {
      throw new Error('Invalid special term index');
    }

    const newTerms = (this.specialTerms || []).filter((_, index) => index !== termIndex);
    return this.update({ specialTerms: newTerms }, this.version);
  }

  /**
   * Add price adjustment
   */
  addPriceAdjustment(adjustment: { type: string; amount: number; effectiveDate: string; reason: string }): ContractModel {
    if (!['increase', 'decrease', 'fixed'].includes(adjustment.type)) {
      throw new Error('Adjustment type must be increase, decrease, or fixed');
    }

    if (typeof adjustment.amount !== 'number') {
      throw new Error('Adjustment amount must be a number');
    }

    if (!this.isValidDate(adjustment.effectiveDate)) {
      throw new Error('Effective date must be valid');
    }

    if (!adjustment.reason || typeof adjustment.reason !== 'string') {
      throw new Error('Adjustment reason is required');
    }

    const newAdjustments = [...(this.pricing.priceAdjustments || []), adjustment];
    return this.update({ pricing: { ...this.pricing, priceAdjustments: newAdjustments } }, this.version);
  }

  /**
   * Remove price adjustment
   */
  removePriceAdjustment(adjustmentIndex: number): ContractModel {
    if (adjustmentIndex < 0 || adjustmentIndex >= (this.pricing.priceAdjustments?.length || 0)) {
      throw new Error('Invalid price adjustment index');
    }

    const newAdjustments = (this.pricing.priceAdjustments || []).filter((_, index) => index !== adjustmentIndex);
    return this.update({ pricing: { ...this.pricing, priceAdjustments: newAdjustments } }, this.version);
  }

  /**
   * Get guaranteed pricing for service type
   */
  getGuaranteedPrice(serviceType: string): number | null {
    if (!this.guaranteedServices.includes(serviceType)) {
      return null; // Service type not covered by this contract
    }

    return this.pricing.totalRate || this.pricing.baseRate;
  }

  /**
   * Check if contract is currently active
   */
  isActive(): boolean {
    const now = new Date();
    const startDate = new Date(this.term.startDate);
    const endDate = new Date(this.term.endDate);

    return this.contractStatus === 'active' &&
           startDate <= now &&
           endDate >= now;
  }

  /**
   * Check if contract is expired
   */
  isExpired(): boolean {
    const now = new Date();
    const endDate = new Date(this.term.endDate);

    return endDate < now || this.contractStatus === 'expired';
  }

  /**
   * Check if contract is renewable
   */
  isRenewable(): boolean {
    if (this.contractStatus === 'cancelled') return false;
    if (this.contractStatus === 'expired') return this.term.autoRenewal || false;

    const now = new Date();
    const endDate = new Date(this.term.endDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return endDate <= thirtyDaysFromNow && this.term.autoRenewal !== false;
  }

  /**
   * Get contract value (total potential revenue)
   */
  getContractValue(): number {
    const startDate = new Date(this.term.startDate);
    const endDate = new Date(this.term.endDate);

    // Calculate duration in months
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                   (endDate.getMonth() - startDate.getMonth());

    const monthlyValue = this.pricing.totalRate || this.pricing.baseRate;

    return Math.max(0, months * monthlyValue);
  }

  /**
   * Get remaining contract value
   */
  getRemainingValue(): number {
    if (this.isExpired() || this.contractStatus === 'cancelled') {
      return 0;
    }

    const now = new Date();
    const endDate = new Date(this.term.endDate);

    if (now >= endDate) return 0;

    // Calculate remaining months
    const remainingMonths = (endDate.getFullYear() - now.getFullYear()) * 12 +
                           (endDate.getMonth() - now.getMonth());

    const monthlyValue = this.pricing.totalRate || this.pricing.baseRate;

    return Math.max(0, remainingMonths * monthlyValue);
  }

  /**
   * Calculate renewal date
   */
  getRenewalDate(): Date | null {
    if (!this.term.autoRenewal) return null;

    const endDate = new Date(this.term.endDate);

    // Add renewal period (default 1 year)
    const renewalDate = new Date(endDate);
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    return renewalDate;
  }

  /**
   * Get contract summary for reporting
   */
  getSummary(): Record<string, any> {
    const remainingValue = this.getRemainingValue();
    const contractValue = this.getContractValue();

    return {
      id: this.id,
      customerId: this.customerId,
      contractNumber: this.contractNumber,
      status: this.contractStatus,
      startDate: this.term.startDate,
      endDate: this.term.endDate,
      isActive: this.isActive(),
      isExpired: this.isExpired(),
      isRenewable: this.isRenewable(),
      serviceTypes: this.serviceTypes,
      guaranteedServices: this.guaranteedServices,
      baseRate: this.pricing.baseRate,
      totalRate: this.pricing.totalRate,
      contractValue: Math.round(contractValue * 100) / 100,
      remainingValue: Math.round(remainingValue * 100) / 100,
      utilizationRate: contractValue > 0 ? Math.round((remainingValue / contractValue) * 10000) / 100 : 0,
      specialTermsCount: this.specialTerms?.length || 0,
      priceAdjustmentsCount: this.pricing.priceAdjustments?.length || 0,
      autoRenewal: this.term.autoRenewal || false
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Contract {
    return {
      id: this.id,
      externalIds: this.externalIds,
      customerId: this.customerId,
      siteId: this.siteId,
      contractNumber: this.contractNumber,
      serviceTypes: this.serviceTypes,
      guaranteedServices: this.guaranteedServices,
      contractStatus: this.contractStatus,
      pricing: this.pricing,
      term: this.term,
      status: this.status,
      specialTerms: this.specialTerms,
      serviceType: this.serviceType,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Contract> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for contract changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    const now = new Date();
    return {
      id: uuidv4(),
      entityType: 'contract',
      eventType,
      timestamp: now,
      eventData: this.toEventData(),
      version: 1,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Validate business rules
   */
  validateBusinessRules(): string[] {
    const errors: string[] = [];

    // Business rule: Contract should have reasonable duration (1-5 years)
    const startDate = new Date(this.term.startDate);
    const endDate = new Date(this.term.endDate);
    const durationMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                          (endDate.getMonth() - startDate.getMonth());

    if (durationMonths < 1) {
      errors.push('Contract duration must be at least 1 month');
    } else if (durationMonths > 60) {
      errors.push('Contract duration exceeds reasonable limits (5 years)');
    }

    // Business rule: High-value contracts should have special terms
    const contractValue = this.getContractValue();
    if (contractValue > 50000 && (!this.specialTerms || this.specialTerms.length === 0)) {
      errors.push('High-value contracts should include special terms');
    }

    // Business rule: Contracts with guaranteed services should cover all service types
    const uncoveredServices = this.serviceTypes.filter(service =>
      !this.guaranteedServices.includes(service)
    );

    if (uncoveredServices.length > 0) {
      errors.push(`Services ${uncoveredServices.join(', ')} are not covered by guarantees`);
    }

    // Business rule: Expired contracts should not be renewable
    if (this.isExpired() && this.term.autoRenewal) {
      errors.push('Expired contracts cannot have auto-renewal enabled');
    }

    // Business rule: Contract should have price adjustments for long-term agreements
    if (durationMonths > 24 && (!this.pricing.priceAdjustments || this.pricing.priceAdjustments.length === 0)) {
      errors.push('Long-term contracts (>2 years) should include price adjustments');
    }

    return errors;
  }
}

/**
 * Contract factory for creating contracts from legacy data
 */
export class ContractFactory {
  /**
   * Create contract from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): ContractModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Contract> = {
      externalIds: [legacyData.contract_id || legacyData.CONTRACT_ID || legacyData.id],
      customerId: legacyData.customer_id || legacyData.CUSTOMER_ID,
      siteId: legacyData.site_id || legacyData.SITE_ID,
      contractNumber: legacyData.contract_number || legacyData.CONTRACT_NUMBER || legacyData.contract_no,
      serviceTypes: this.mapLegacyServiceTypes(legacyData),
      guaranteedServices: this.mapLegacyGuaranteedServices(legacyData),
      contractStatus: this.mapLegacyStatus(legacyData),
      pricing: this.mapLegacyPricing(legacyData),
      term: this.mapLegacyTerm(legacyData),
      status: this.mapLegacyStatusToStatus(this.mapLegacyStatus(legacyData)),
      specialTerms: this.mapLegacySpecialTerms(legacyData),
      serviceType: (this.mapLegacyServiceTypes(legacyData))[0] || 'waste',
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy contract management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
        contractData: {
          contractType: legacyData.contract_type || 'standard',
          paymentTerms: legacyData.payment_terms || 'net_30',
          billingCycle: legacyData.billing_cycle || 'monthly'
        }
      }
    };

    return ContractModel.create(mappedData as any);
  }

  /**
   * Map legacy contract term
   */
  private static mapLegacyTerm(legacyData: Record<string, any>): Contract['term'] {
    return {
      startDate: legacyData.start_date || legacyData.START_DATE || legacyData.effective_date || new Date().toISOString().split('T')[0],
      endDate: legacyData.end_date || legacyData.END_DATE || legacyData.expiration_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      autoRenewal: legacyData.auto_renewal !== undefined ? legacyData.auto_renewal : true,
      renewalTerms: legacyData.renewal_terms || legacyData.RENEWAL_TERMS
    };
  }

  /**
   * Map legacy pricing structure
   */
  private static mapLegacyPricing(legacyData: Record<string, any>): Contract['pricing'] {
    const pricing: Contract['pricing'] = {
      baseRate: legacyData.base_rate || legacyData.BASE_RATE || legacyData.monthly_rate || 0,
      rateUnit: legacyData.rate_unit || legacyData.RATE_UNIT || 'month',
      fuelSurcharge: legacyData.fuel_surcharge || legacyData.FUEL_SURCHARGE,
      environmentalFee: legacyData.environmental_fee || legacyData.ENVIRONMENTAL_FEE,
      disposalFee: legacyData.disposal_fee || legacyData.DISPOSAL_FEE
    };

    // Handle legacy price adjustments
    if (legacyData.price_adjustments || legacyData.PRICE_ADJUSTMENTS) {
      pricing.priceAdjustments = this.mapLegacyPriceAdjustments(
        legacyData.price_adjustments || legacyData.PRICE_ADJUSTMENTS
      );
    }

    return pricing;
  }

  /**
   * Map legacy price adjustments
   */
  private static mapLegacyPriceAdjustments(legacyAdjustments: any[]): Contract['pricing']['priceAdjustments'] {
    if (!Array.isArray(legacyAdjustments)) return [];

    return legacyAdjustments.map((adjustment: any) => ({
      type: adjustment.adjustment_type || adjustment.type || 'increase',
      amount: adjustment.amount || adjustment.percentage || 0,
      effectiveDate: adjustment.effective_date || adjustment.date || new Date().toISOString().split('T')[0],
      reason: adjustment.reason || adjustment.description || 'Legacy adjustment'
    }));
  }

  /**
   * Map legacy special terms
   */
  private static mapLegacySpecialTerms(legacyData: Record<string, any>): string[] {
    if (legacyData.special_terms && Array.isArray(legacyData.special_terms)) {
      return legacyData.special_terms;
    }

    if (legacyData.special_terms && typeof legacyData.special_terms === 'string') {
      return legacyData.special_terms.split(';').map((term: string) => term.trim());
    }

    // Extract common special terms from legacy fields
    const terms: string[] = [];

    if (legacyData.volume_discount) {
      terms.push(`Volume discount: ${legacyData.volume_discount}`);
    }

    if (legacyData.payment_terms) {
      terms.push(`Payment terms: ${legacyData.payment_terms}`);
    }

    if (legacyData.service_guarantee) {
      terms.push(`Service guarantee: ${legacyData.service_guarantee}`);
    }

    return terms;
  }

  /**
   * Map legacy service types
   */
  private static mapLegacyServiceTypes(legacyData: Record<string, any>): string[] {
    if (legacyData.service_types && Array.isArray(legacyData.service_types)) {
      return legacyData.service_types.filter((type: string) =>
        ContractModel.VALID_SERVICE_TYPES.includes(type)
      );
    }

    // Handle comma-separated string
    if (typeof legacyData.service_types === 'string') {
      return legacyData.service_types.split(',').map((s: string) => s.trim()).filter((type: string) =>
        ContractModel.VALID_SERVICE_TYPES.includes(type)
      );
    }

    // Default fallback
    return ['waste'];
  }

  /**
   * Map legacy guaranteed services
   */
  private static mapLegacyGuaranteedServices(legacyData: Record<string, any>): string[] {
    if (legacyData.guaranteed_services && Array.isArray(legacyData.guaranteed_services)) {
      return legacyData.guaranteed_services;
    }

    if (legacyData.guaranteed_services && typeof legacyData.guaranteed_services === 'string') {
      return legacyData.guaranteed_services.split(',').map((s: string) => s.trim());
    }

    // Default to all service types if not specified
    return this.mapLegacyServiceTypes(legacyData);
  }

  /**
   * Map legacy contract status
   */
  private static mapLegacyStatus(legacyData: Record<string, any>): Contract['contractStatus'] {
    const statusMap: Record<string, Contract['contractStatus']> = {
      'draft': 'draft',
      'active': 'active',
      'expired': 'expired',
      'cancelled': 'cancelled',
      'renewed': 'renewed',
      'pending': 'pending_approval',
      'pending_approval': 'pending_approval',
      'approved': 'active',
      'terminated': 'cancelled'
    };

    const legacyStatus = (legacyData.contract_status || legacyData.CONTRACT_STATUS || legacyData.status || 'active').toLowerCase();
    return statusMap[legacyStatus] || 'active';
  }

  /**
   * Map legacy contract status to status
   */
  private static mapLegacyStatusToStatus(contractStatus: Contract['contractStatus']): Contract['status'] {
    const statusMap: Record<Contract['contractStatus'], Contract['status']> = {
      'draft': 'draft',
      'active': 'active',
      'expired': 'expired',
      'cancelled': 'cancelled',
      'renewed': 'active',
      'pending_approval': 'pending'
    };

    return statusMap[contractStatus] || 'draft';
  }
}

/**
 * Contract validator for external validation
 */
export class ContractValidator {
  /**
   * Validate contract data without creating instance
   */
  static validate(data: Partial<Contract>): { isValid: boolean; errors: string[] } {
    try {
      new ContractModel(data);
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
  static validateBusinessRules(contract: ContractModel): string[] {
    return contract.validateBusinessRules();
  }
}

/**
 * Contract management utilities
 */
export class ContractManager {
  /**
   * Calculate contract portfolio value
   */
  static getPortfolioValue(contracts: ContractModel[]): number {
    return contracts.reduce((total, contract) => total + contract.getContractValue(), 0);
  }

  /**
   * Get contracts expiring within specified days
   */
  static getExpiringContracts(contracts: ContractModel[], days: number): ContractModel[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return contracts.filter(contract => {
      const endDate = new Date(contract.term.endDate);
      return endDate <= cutoffDate && endDate > new Date();
    });
  }

  /**
   * Get renewable contracts
   */
  static getRenewableContracts(contracts: ContractModel[]): ContractModel[] {
    return contracts.filter(contract => contract.isRenewable());
  }

  /**
   * Generate contract renewal proposal
   */
  static generateRenewalProposal(contract: ContractModel): Partial<Contract> {
    const renewalDate = contract.getRenewalDate();
    if (!renewalDate) {
      throw new Error('Contract is not renewable');
    }

    const newEndDate = new Date(renewalDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    return {
      customerId: contract.customerId,
      siteId: contract.siteId,
      contractNumber: `${contract.contractNumber}-R1`,
      serviceTypes: contract.serviceTypes,
      guaranteedServices: contract.guaranteedServices,
      contractStatus: 'draft',
      pricing: {
        ...contract.pricing,
        baseRate: contract.pricing.baseRate * 1.05, // 5% increase for renewal
        priceAdjustments: [
          ...(contract.pricing.priceAdjustments || []),
          {
            type: 'increase',
            amount: contract.pricing.baseRate * 0.05,
            effectiveDate: renewalDate.toISOString().split('T')[0],
            reason: 'Annual renewal adjustment'
          }
        ]
      },
      term: {
        startDate: renewalDate.toISOString().split('T')[0],
        endDate: newEndDate.toISOString().split('T')[0],
        autoRenewal: contract.term.autoRenewal,
        renewalTerms: contract.term.renewalTerms
      },
      status: 'draft',
      specialTerms: contract.specialTerms,
      serviceType: contract.serviceType
    };
  }

  /**
   * Check for contract conflicts
   */
  static checkContractConflicts(contracts: ContractModel[]): string[] {
    const conflicts: string[] = [];

    contracts.forEach(contract => {
      if (contract.isExpired()) {
        conflicts.push(`Contract ${contract.contractNumber} has expired`);
      }

      if (contract.contractStatus === 'cancelled' && contract.getRemainingValue() > 0) {
        conflicts.push(`Cancelled contract ${contract.contractNumber} still has remaining value`);
      }

      const businessRuleErrors = contract.validateBusinessRules();
      conflicts.push(...businessRuleErrors.map(error => `${contract.contractNumber}: ${error}`));
    });

    return conflicts;
  }

  /**
   * Get contract performance report
   */
  static getPerformanceReport(contracts: ContractModel[]): Record<string, any> {
    const activeContracts = contracts.filter(c => c.isActive());
    const expiredContracts = contracts.filter(c => c.isExpired());
    const totalValue = this.getPortfolioValue(contracts);
    const remainingValue = contracts.reduce((total, contract) => total + contract.getRemainingValue(), 0);

    return {
      totalContracts: contracts.length,
      activeContracts: activeContracts.length,
      expiredContracts: expiredContracts.length,
      expiringSoon: this.getExpiringContracts(contracts, 30).length,
      renewableContracts: this.getRenewableContracts(contracts).length,
      totalPortfolioValue: Math.round(totalValue * 100) / 100,
      remainingPortfolioValue: Math.round(remainingValue * 100) / 100,
      utilizationRate: totalValue > 0 ? Math.round((remainingValue / totalValue) * 10000) / 100 : 0,
      averageContractValue: contracts.length > 0 ? Math.round((totalValue / contracts.length) * 100) / 100 : 0
    };
  }
}
