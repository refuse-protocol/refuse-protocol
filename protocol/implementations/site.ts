/**
 * @fileoverview Site entity implementation with multi-site customer support
 * @description Complete Site model for managing customer service locations with containers and services
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Site, BaseEntity, Address, EnvironmentalPermit } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Site implementation with comprehensive multi-site customer support and environmental compliance
 */
export class SiteModel implements Site {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  customerId: string;
  name: string;
  address: Address;
  services: string[];
  containers: string[];
  environmentalPermits?: EnvironmentalPermit[];

  private static readonly VALID_CONTAINER_TYPES = [
    'cart',
    'dumpster',
    'bin',
    'rolloff',
    'compactor',
  ];

  constructor(data: Partial<Site>) {
    this.validateAndAssign(data);
  }

  /**
   * Create a new site with validation
   */
  static create(
    data: Omit<Site, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>
  ): SiteModel {
    // REMOVED UNUSED:     const now = new Date();
    const siteData: Partial<Site> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'customer_system',
      },
    };

    return new SiteModel(siteData);
  }

  /**
   * Update site with optimistic locking
   */
  update(updates: Partial<Omit<Site, keyof BaseEntity>>, expectedVersion: number): SiteModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Site> = {
      ...updates,
      id: this.id,
      version: this.version + 1,
      updatedAt: new Date(),
      metadata: {
        ...this.metadata,
        ...updates.metadata,
        lastModifiedBy: 'system',
        previousVersion: this.version,
      },
    };

    return new SiteModel(updatedData);
  }

  /**
   * Validate and assign site data
   */
  private validateAndAssign(data: Partial<Site>): void {
    // Required fields validation
    if (!data.customerId || typeof data.customerId !== 'string') {
      throw new Error('Customer ID is required and must be a string');
    }

    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Site name is required and must be a string');
    }

    if (!data.address) {
      throw new Error('Address is required');
    }

    if (!Array.isArray(data.services)) {
      throw new Error('Services must be an array');
    }

    if (!Array.isArray(data.containers)) {
      throw new Error('Containers must be an array');
    }

    // Validate environmental permits if provided
    if (data.environmentalPermits) {
      data.environmentalPermits.forEach((permit, index) => {
        if (!permit.permitType || typeof permit.permitType !== 'string') {
          throw new Error(`Environmental permit ${index}: permit type is required`);
        }

        if (!permit.permitNumber || typeof permit.permitNumber !== 'string') {
          throw new Error(`Environmental permit ${index}: permit number is required`);
        }

        if (!permit.issuingAuthority || typeof permit.issuingAuthority !== 'string') {
          throw new Error(`Environmental permit ${index}: issuing authority is required`);
        }

        if (!this.isValidDate(permit.validFrom)) {
          throw new Error(`Environmental permit ${index}: valid from date is invalid`);
        }

        if (!this.isValidDate(permit.validTo)) {
          throw new Error(`Environmental permit ${index}: valid to date is invalid`);
        }

        if (new Date(permit.validFrom) >= new Date(permit.validTo)) {
          throw new Error(
            `Environmental permit ${index}: valid from date must be before valid to date`
          );
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
    // REMOVED UNUSED:     const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    // REMOVED UNUSED:     const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Add service to site
   */
  addService(serviceId: string): SiteModel {
    if (this.services.includes(serviceId)) {
      throw new Error(`Service ${serviceId} is already assigned to this site`);
    }

    return this.update({ services: [...this.services, serviceId] }, this.version);
  }

  /**
   * Remove service from site
   */
  removeService(serviceId: string): SiteModel {
    // REMOVED UNUSED:     const newServices = this.services.filter((id) => id !== serviceId);

    if (newServices.length === 0 && this.containers.length > 0) {
      throw new Error('Cannot remove all services from a site that has containers');
    }

    return this.update({ services: newServices }, this.version);
  }

  /**
   * Add container to site
   */
  addContainer(containerId: string): SiteModel {
    if (this.containers.includes(containerId)) {
      throw new Error(`Container ${containerId} is already assigned to this site`);
    }

    return this.update({ containers: [...this.containers, containerId] }, this.version);
  }

  /**
   * Remove container from site
   */
  removeContainer(containerId: string): SiteModel {
    // REMOVED UNUSED:     const newContainers = this.containers.filter((id) => id !== containerId);
    return this.update({ containers: newContainers }, this.version);
  }

  /**
   * Add environmental permit
   */
  addEnvironmentalPermit(permit: Omit<EnvironmentalPermit, 'id'>): SiteModel {
    const newPermit: EnvironmentalPermit = {
      id: uuidv4(),
      ...permit,
    };

    // REMOVED UNUSED:     const newPermits = [...(this.environmentalPermits || []), newPermit];

    return this.update({ environmentalPermits: newPermits }, this.version);
  }

  /**
   * Remove environmental permit
   */
  removeEnvironmentalPermit(permitId: string): SiteModel {
    // REMOVED UNUSED:     const newPermits = (this.environmentalPermits || []).filter((permit) => permit.id !== permitId);
    return this.update({ environmentalPermits: newPermits }, this.version);
  }

  /**
   * Check if site has required permits for service types
   */
  hasRequiredPermits(serviceTypes: string[]): boolean {
    if (!this.environmentalPermits || this.environmentalPermits.length === 0) {
      return serviceTypes.every((type) => type !== 'hazardous');
    }

    // REMOVED UNUSED:     const now = new Date();
    const activePermits = this.environmentalPermits.filter(
      (permit) => new Date(permit.validFrom) <= now && new Date(permit.validTo) >= now
    );

    // Check if hazardous services have appropriate permits
    // REMOVED UNUSED:     const hasHazardousService = serviceTypes.includes('hazardous');
    const hasHazardousPermit = activePermits.some(
      (permit) =>
        permit.permitType.toLowerCase().includes('hazardous') ||
        permit.permitType.toLowerCase().includes('hazmat')
    );

    if (hasHazardousService && !hasHazardousPermit) {
      return false;
    }

    return true;
  }

  /**
   * Get site capacity based on containers
   */
  getSiteCapacity(): number {
    // Base capacity calculation - in production this would consider container types and sizes
    return this.containers.length * 2; // Assume 2 tons per container as default
  }

  /**
   * Get site utilization based on active services
   */
  getSiteUtilization(): number {
    if (this.services.length === 0) return 0;
    return Math.min(100, (this.services.length / this.getSiteCapacity()) * 100);
  }

  /**
   * Check if site is at capacity
   */
  isAtCapacity(): boolean {
    return this.getSiteUtilization() >= 90; // 90% utilization threshold
  }

  /**
   * Get site efficiency score
   */
  getEfficiencyScore(): number {
    // REMOVED UNUSED:     const utilizationScore = Math.max(0, 100 - this.getSiteUtilization());
    // REMOVED UNUSED:     const permitScore = this.hasRequiredPermits(this.services) ? 100 : 50;
    // REMOVED UNUSED:     const containerScore = this.containers.length > 0 ? 100 : 0;

    return (utilizationScore + permitScore + containerScore) / 3;
  }

  /**
   * Get site summary for reporting
   */
  getSummary(): Record<string, any> {
    const activePermits = (this.environmentalPermits || []).filter(
      (permit) => new Date(permit.validTo) > new Date()
    ).length;

    return {
      id: this.id,
      customerId: this.customerId,
      name: this.name,
      serviceCount: this.services.length,
      containerCount: this.containers.length,
      utilizationPercentage: Math.round(this.getSiteUtilization() * 100) / 100,
      efficiencyScore: Math.round(this.getEfficiencyScore() * 100) / 100,
      activePermits: activePermits,
      hasRequiredPermits: this.hasRequiredPermits(this.services),
      isAtCapacity: this.isAtCapacity(),
      permitCompliance: this.getPermitCompliance(),
    };
  }

  /**
   * Get permit compliance status
   */
  private getPermitCompliance(): 'compliant' | 'warning' | 'non_compliant' {
    if (!this.environmentalPermits || this.environmentalPermits.length === 0) {
      return this.services.includes('hazardous') ? 'non_compliant' : 'compliant';
    }

    // REMOVED UNUSED:     const now = new Date();
    const expiredPermits = this.environmentalPermits.filter(
      (permit) => new Date(permit.validTo) <= now
    );

    const expiringSoonPermits = this.environmentalPermits.filter((permit) => {
      // REMOVED UNUSED:       const expiryDate = new Date(permit.validTo);
      // REMOVED UNUSED:       const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow && expiryDate > now;
    });

    if (expiredPermits.length > 0) {
      return 'non_compliant';
    } else if (expiringSoonPermits.length > 0) {
      return 'warning';
    }

    return 'compliant';
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Site {
    return {
      id: this.id,
      externalIds: this.externalIds,
      customerId: this.customerId,
      name: this.name,
      address: this.address,
      services: this.services,
      containers: this.containers,
      environmentalPermits: this.environmentalPermits,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Site> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for site changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'site',
      eventType,
      timestamp: new Date(),
      eventData: this.toEventData(),
      version: 1,
    };
  }

  /**
   * Validate business rules
   */
  validateBusinessRules(): string[] {
    const errors: string[] = [];

    // Business rule: Sites with containers should have services
    if (this.containers.length > 0 && this.services.length === 0) {
      errors.push('Sites with containers must have associated services');
    }

    // Business rule: Sites should not exceed capacity
    if (this.isAtCapacity()) {
      errors.push('Site is at or near capacity - consider redistributing services');
    }

    // Business rule: Sites with hazardous services need proper permits
    if (this.services.includes('hazardous') && this.getPermitCompliance() !== 'compliant') {
      errors.push('Sites with hazardous services must have valid environmental permits');
    }

    // Business rule: Site name should be descriptive
    if (this.name.length < 3) {
      errors.push('Site name should be at least 3 characters long');
    }

    return errors;
  }
}

/**
 * Site factory for creating sites from legacy data
 */
export class SiteFactory {
  /**
   * Create site from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): SiteModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Site> = {
      externalIds: [legacyData.site_id || legacyData.SITE_ID || legacyData.id],
      customerId: legacyData.customer_id || legacyData.CUSTOMER_ID,
      name: legacyData.site_name || legacyData.SITE_NAME || legacyData.name || 'Main Site',
      address: this.mapLegacyAddress(legacyData),
      services: this.mapLegacyServices(legacyData),
      containers: this.mapLegacyContainers(legacyData),
      environmentalPermits: this.mapLegacyPermits(legacyData),
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy customer management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
        siteData: {
          siteType: legacyData.site_type || 'commercial',
          squareFootage: legacyData.square_footage,
          zoning: legacyData.zoning,
        },
      },
    };

    return SiteModel.create(mappedData as any);
  }

  /**
   * Map legacy address formats
   */
  private static mapLegacyAddress(legacyData: Record<string, any>): Address {
    return {
      street1: legacyData.address1 || legacyData.ADDRESS1 || legacyData.street || 'Unknown',
      street2: legacyData.address2 || legacyData.ADDRESS2,
      city: legacyData.city || legacyData.CITY || 'Unknown',
      state: legacyData.state || legacyData.STATE || 'Unknown',
      zipCode: legacyData.zip || legacyData.ZIP || legacyData.zipcode || '00000',
      country: legacyData.country || 'US',
    };
  }

  /**
   * Map legacy services
   */
  private static mapLegacyServices(legacyData: Record<string, any>): string[] {
    if (legacyData.services && Array.isArray(legacyData.services)) {
      return legacyData.services;
    }

    if (legacyData.service_ids && Array.isArray(legacyData.service_ids)) {
      return legacyData.service_ids;
    }

    // Handle comma-separated string
    if (typeof legacyData.services === 'string') {
      return legacyData.services.split(',').map((s: string) => s.trim());
    }

    // Default fallback
    return [];
  }

  /**
   * Map legacy containers
   */
  private static mapLegacyContainers(legacyData: Record<string, any>): string[] {
    if (legacyData.containers && Array.isArray(legacyData.containers)) {
      return legacyData.containers;
    }

    if (legacyData.container_ids && Array.isArray(legacyData.container_ids)) {
      return legacyData.container_ids;
    }

    // Handle comma-separated string
    if (typeof legacyData.containers === 'string') {
      return legacyData.containers.split(',').map((c: string) => c.trim());
    }

    // Default fallback
    return [];
  }

  /**
   * Map legacy environmental permits
   */
  private static mapLegacyPermits(legacyData: Record<string, any>): EnvironmentalPermit[] {
    if (!legacyData.permits && !legacyData.environmental_permits) {
      return [];
    }

    // REMOVED UNUSED:     const permits = legacyData.permits || legacyData.environmental_permits || [];

    if (Array.isArray(permits)) {
      return permits.map((permit: any) => ({
        id: permit.id || uuidv4(),
        permitType: permit.permit_type || permit.type || 'environmental',
        permitNumber: permit.permit_number || permit.number || 'Unknown',
        issuingAuthority: permit.issuing_authority || permit.authority || 'Unknown',
        validFrom: permit.valid_from || permit.from || new Date().toISOString().split('T')[0],
        validTo:
          permit.valid_to ||
          permit.to ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }));
    }

    // Handle single permit object
    return [
      {
        id: uuidv4(),
        permitType: permits.permit_type || permits.type || 'environmental',
        permitNumber: permits.permit_number || permits.number || 'Unknown',
        issuingAuthority: permits.issuing_authority || permits.authority || 'Unknown',
        validFrom: permits.valid_from || permits.from || new Date().toISOString().split('T')[0],
        validTo:
          permits.valid_to ||
          permits.to ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ];
  }
}

/**
 * Site validator for external validation
 */
export class SiteValidator {
  /**
   * Validate site data without creating instance
   */
  static validate(data: Partial<Site>): { isValid: boolean; errors: string[] } {
    try {
      new SiteModel(data);
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
  static validateBusinessRules(site: SiteModel): string[] {
    return site.validateBusinessRules();
  }
}

/**
 * Site management utilities
 */
export class SiteManager {
  /**
   * Optimize service distribution across multiple sites
   */
  static optimizeServiceDistribution(sites: SiteModel[], availableServices: string[]): SiteModel[] {
    // REMOVED UNUSED:     const optimizedSites = [...sites];

    // Sort sites by current utilization (lowest first)
    optimizedSites.sort((a, b) => a.getSiteUtilization() - b.getSiteUtilization());

    // Distribute services to least utilized sites first
    // REMOVED UNUSED:     let serviceIndex = 0;
    for (const service of availableServices) {
      // Find site that can accept this service and has lowest utilization
      const availableSites = optimizedSites.filter(
        (site) => site.hasRequiredPermits([service]) && !site.isAtCapacity()
      );

      if (availableSites.length > 0) {
        // REMOVED UNUSED:         const targetSite = availableSites[0];
        targetSite.addService(service);
      }

      serviceIndex++;
    }

    return optimizedSites;
  }

  /**
   * Check for site capacity conflicts
   */
  static checkCapacityConflicts(sites: SiteModel[]): string[] {
    const conflicts: string[] = [];

    sites.forEach((site) => {
      if (site.isAtCapacity()) {
        conflicts.push(`Site ${site.name} (${site.id}) is at capacity`);
      }

      if (!site.hasRequiredPermits(site.services)) {
        conflicts.push(`Site ${site.name} (${site.id}) has services without required permits`);
      }
    });

    return conflicts;
  }

  /**
   * Get site utilization report
   */
  static getUtilizationReport(sites: SiteModel[]): Record<string, any> {
    const report = {
      totalSites: sites.length,
      sitesAtCapacity: 0,
      sitesOverUtilized: 0,
      averageUtilization: 0,
      permitCompliance: {
        compliant: 0,
        warning: 0,
        nonCompliant: 0,
      },
    };

    // REMOVED UNUSED:     let totalUtilization = 0;

    sites.forEach((site) => {
      // REMOVED UNUSED:       const utilization = site.getSiteUtilization();
      // REMOVED UNUSED:       const permitStatus = site.getPermitCompliance();

      totalUtilization += utilization;

      if (utilization >= 90) {
        report.sitesAtCapacity++;
      }

      if (utilization > 80) {
        report.sitesOverUtilized++;
      }

      report.permitCompliance[permitStatus]++;
    });

    report.averageUtilization = sites.length > 0 ? totalUtilization / sites.length : 0;

    return report;
  }
}
