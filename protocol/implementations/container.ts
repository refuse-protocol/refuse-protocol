/**
 * @fileoverview Container entity implementation with RFID/GPS tracking support
 * @description Complete Container model for managing waste containers with asset tracking and lifecycle management
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Container, BaseEntity, Address, MaintenanceRecord } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Container implementation with comprehensive RFID/GPS tracking and lifecycle management
 */
export class ContainerModel extends BaseEntityModel implements Container {
  type: 'cart' | 'dumpster' | 'bin' | 'rolloff' | 'compactor';
  size: string;
  material?: string;
  assignedTo?: string;
  currentLocation?: Address;
  rfidTag?: string;
  specifications?: Record<string, any>;
  capacityGallons?: number;
  capacityCubicYards?: number;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  maintenanceRecords?: MaintenanceRecord[];
  isActive?: boolean;
  lastGpsUpdate?: Date;

  constructor(data: Partial<Container> = {}) {
    super(data);
    this.type = data.type || 'cart';
    this.size = data.size || '';
    this.material = data.material;
    this.assignedTo = data.assignedTo;
    this.currentLocation = data.currentLocation;
    this.rfidTag = data.rfidTag;
    this.specifications = data.specifications;
    this.capacityGallons = data.capacityGallons;
    this.capacityCubicYards = data.capacityCubicYards;
    this.purchaseDate = data.purchaseDate;
    this.warrantyExpiry = data.warrantyExpiry;
    this.maintenanceRecords = data.maintenanceRecords || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastGpsUpdate = data.lastGpsUpdate;
  }

  private static readonly VALID_CONTAINER_TYPES: Container['type'][] = [
    'cart', 'dumpster', 'bin', 'rolloff', 'compactor'
  ];

  private static readonly VALID_MATERIALS = [
    'plastic', 'metal', 'steel', 'aluminum', 'composite', 'fiberglass'
  ];

  private static readonly COMMON_SIZES = [
    '32_gallon', '64_gallon', '96_gallon', '2_yard', '3_yard', '4_yard',
    '6_yard', '8_yard', '20_yard', '30_yard', '40_yard'
  ];

  constructor(data: Partial<Container>) {
    this.validateAndAssign(data);
  }

  /**
   * Create a new container with validation
   */
  static create(data: Omit<Container, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>): ContainerModel {
    const now = new Date();
    const containerData: Partial<Container> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'container_system'
      }
    };

    return new ContainerModel(containerData);
  }

  /**
   * Update container with optimistic locking
   */
  update(updates: Partial<Omit<Container, keyof BaseEntity>>, expectedVersion: number): ContainerModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Container> = {
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

    return new ContainerModel(updatedData);
  }

  /**
   * Validate and assign container data
   */
  private validateAndAssign(data: Partial<Container>): void {
    // Required fields validation
    if (!data.type || !ContainerModel.VALID_CONTAINER_TYPES.includes(data.type)) {
      throw new Error(`Container type must be one of: ${ContainerModel.VALID_CONTAINER_TYPES.join(', ')}`);
    }

    if (!data.size || typeof data.size !== 'string') {
      throw new Error('Container size is required and must be a string');
    }

    if (!data.material || !ContainerModel.VALID_MATERIALS.includes(data.material)) {
      throw new Error(`Container material must be one of: ${ContainerModel.VALID_MATERIALS.join(', ')}`);
    }

    if (!Array.isArray(data.maintenanceRecords)) {
      throw new Error('Maintenance records must be an array');
    }

    if (typeof data.isActive !== 'boolean') {
      throw new Error('isActive must be a boolean');
    }

    // Validate specifications
    if (data.specifications && typeof data.specifications !== 'object') {
      throw new Error('Specifications must be an object');
    }

    // Validate RFID tag format if provided
    if (data.rfidTag && !this.isValidRfidTag(data.rfidTag)) {
      throw new Error('RFID tag format is invalid');
    }

    // Validate capacity values
    if (data.capacityGallons && (typeof data.capacityGallons !== 'number' || data.capacityGallons <= 0)) {
      throw new Error('Capacity in gallons must be a positive number');
    }

    if (data.capacityCubicYards && (typeof data.capacityCubicYards !== 'number' || data.capacityCubicYards <= 0)) {
      throw new Error('Capacity in cubic yards must be a positive number');
    }

    // Validate purchase date if provided
    if (data.purchaseDate && !this.isValidDate(data.purchaseDate)) {
      throw new Error('Purchase date must be a valid date');
    }

    // Validate warranty expiry if provided
    if (data.warrantyExpiry && !this.isValidDate(data.warrantyExpiry)) {
      throw new Error('Warranty expiry date must be a valid date');
    }

    // Validate maintenance records if provided
    if (data.maintenanceRecords) {
      data.maintenanceRecords.forEach((record, index) => {
        if (!record.maintenanceType || typeof record.maintenanceType !== 'string') {
          throw new Error(`Maintenance record ${index}: maintenance type is required`);
        }

        if (!this.isValidDate(record.date)) {
          throw new Error(`Maintenance record ${index}: date must be valid`);
        }

        if (typeof record.cost !== 'number' || record.cost < 0) {
          throw new Error(`Maintenance record ${index}: cost must be a non-negative number`);
        }

        if (!record.performedBy || typeof record.performedBy !== 'string') {
          throw new Error(`Maintenance record ${index}: performed by is required`);
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
   * Validate RFID tag format
   */
  private isValidRfidTag(rfidTag: string): boolean {
    // RFID tags can be various formats - basic validation for alphanumeric with dashes
    const rfidRegex = /^[A-Z0-9\-_]+$/i;
    return rfidRegex.test(rfidTag) && rfidTag.length >= 8 && rfidTag.length <= 24;
  }

  /**
   * Update GPS location
   */
  updateLocation(location: Address, timestamp?: Date): ContainerModel {
    const updateData: Partial<Container> = {
      currentLocation: location,
      lastGpsUpdate: timestamp || new Date()
    };

    return this.update(updateData, this.version);
  }

  /**
   * Assign container to site
   */
  assignToSite(siteId: string): ContainerModel {
    return this.update({ assignedTo: siteId }, this.version);
  }

  /**
   * Unassign container from current site
   */
  unassign(): ContainerModel {
    return this.update({ assignedTo: undefined }, this.version);
  }

  /**
   * Update RFID tag
   */
  updateRfidTag(rfidTag: string): ContainerModel {
    if (!this.isValidRfidTag(rfidTag)) {
      throw new Error('Invalid RFID tag format');
    }

    return this.update({ rfidTag }, this.version);
  }

  /**
   * Add maintenance record
   */
  addMaintenanceRecord(record: Omit<MaintenanceRecord, 'id'>): ContainerModel {
    if (!record.maintenanceType || typeof record.maintenanceType !== 'string') {
      throw new Error('Maintenance type is required');
    }

    if (!this.isValidDate(record.date)) {
      throw new Error('Maintenance date must be valid');
    }

    if (typeof record.cost !== 'number' || record.cost < 0) {
      throw new Error('Maintenance cost must be a non-negative number');
    }

    if (!record.performedBy || typeof record.performedBy !== 'string') {
      throw new Error('Performed by is required');
    }

    const newRecord: MaintenanceRecord = {
      id: uuidv4(),
      ...record
    };

    const newRecords = [...this.maintenanceRecords, newRecord];
    return this.update({ maintenanceRecords: newRecords }, this.version);
  }

  /**
   * Remove maintenance record
   */
  removeMaintenanceRecord(recordId: string): ContainerModel {
    const newRecords = this.maintenanceRecords.filter(record => record.id !== recordId);
    return this.update({ maintenanceRecords: newRecords }, this.version);
  }

  /**
   * Check if container requires maintenance
   */
  requiresMaintenance(): boolean {
    if (!this.isActive) return false;

    // Check based on maintenance schedule
    const daysSinceLastMaintenance = this.getDaysSinceLastMaintenance();
    return daysSinceLastMaintenance > 180; // Maintenance every 180 days minimum
  }

  /**
   * Get last maintenance date
   */
  getLastMaintenanceDate(): MaintenanceRecord | null {
    if (this.maintenanceRecords.length === 0) return null;

    return this.maintenanceRecords
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }

  /**
   * Get days since last maintenance
   */
  getDaysSinceLastMaintenance(): number {
    const lastMaintenance = this.getLastMaintenanceDate();
    if (!lastMaintenance) return Infinity;

    const lastMaintenanceDate = new Date(lastMaintenance.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastMaintenanceDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get total maintenance cost
   */
  getTotalMaintenanceCost(): number {
    return this.maintenanceRecords.reduce((total, record) => total + record.cost, 0);
  }

  /**
   * Get maintenance cost for specific period
   */
  getMaintenanceCostForPeriod(startDate: string, endDate: string): number {
    return this.maintenanceRecords
      .filter(record => record.date >= startDate && record.date <= endDate)
      .reduce((total, record) => total + record.cost, 0);
  }

  /**
   * Get container age in days
   */
  getAgeInDays(): number {
    if (!this.purchaseDate) return 0;

    const purchaseDate = new Date(this.purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate depreciation value
   */
  calculateDepreciationValue(originalValue: number, usefulLifeYears: number): number {
    const ageInYears = this.getAgeInDays() / 365;
    const depreciationRate = originalValue / usefulLifeYears;
    const currentValue = Math.max(0, originalValue - (depreciationRate * ageInYears));
    return Math.round(currentValue * 100) / 100;
  }

  /**
   * Get container efficiency score
   */
  getEfficiencyScore(): number {
    let score = 100;

    // Reduce score based on age
    const ageInYears = this.getAgeInDays() / 365;
    if (ageInYears > 5) score -= (ageInYears - 5) * 5;

    // Reduce score based on maintenance frequency
    const daysSinceMaintenance = this.getDaysSinceLastMaintenance();
    if (daysSinceMaintenance > 180) {
      score -= Math.min(30, (daysSinceMaintenance - 180) / 10);
    }

    // Reduce score if no RFID tracking
    if (!this.rfidTag) {
      score -= 15;
    }

    // Reduce score if no GPS tracking
    if (!this.currentLocation) {
      score -= 10;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Check if container is currently in use
   */
  isInUse(): boolean {
    return this.isActive && !!this.assignedTo;
  }

  /**
   * Check if container is available for assignment
   */
  isAvailable(): boolean {
    return this.isActive && !this.assignedTo && !this.requiresMaintenance();
  }

  /**
   * Get container utilization rate
   */
  getUtilizationRate(): number {
    // This would be calculated based on pickup frequency and fill levels in production
    return this.isInUse() ? 85 : 0; // Simplified for demo
  }

  /**
   * Get container summary for reporting
   */
  getSummary(): Record<string, any> {
    const lastMaintenance = this.getLastMaintenanceDate();
    const totalMaintenanceCost = this.getTotalMaintenanceCost();
    const ageInDays = this.getAgeInDays();

    return {
      id: this.id,
      type: this.type,
      size: this.size,
      material: this.material,
      color: this.color,
      isActive: this.isActive,
      isInUse: this.isInUse(),
      isAvailable: this.isAvailable(),
      assignedTo: this.assignedTo,
      hasRfidTag: !!this.rfidTag,
      hasGpsLocation: !!this.currentLocation,
      requiresMaintenance: this.requiresMaintenance(),
      efficiencyScore: this.getEfficiencyScore(),
      ageInDays: ageInDays,
      utilizationRate: this.getUtilizationRate(),
      lastMaintenanceDate: lastMaintenance?.date || null,
      daysSinceLastMaintenance: this.getDaysSinceLastMaintenance(),
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      capacityGallons: this.capacityGallons,
      capacityCubicYards: this.capacityCubicYards,
      lastGpsUpdate: this.lastGpsUpdate?.toISOString() || null
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Container {
    return {
      id: this.id,
      externalIds: this.externalIds,
      type: this.type,
      size: this.size,
      material: this.material,
      color: this.color,
      rfidTag: this.rfidTag,
      assignedTo: this.assignedTo,
      currentLocation: this.currentLocation,
      lastGpsUpdate: this.lastGpsUpdate,
      specifications: this.specifications,
      maintenanceRecords: this.maintenanceRecords,
      capacityGallons: this.capacityGallons,
      capacityCubicYards: this.capacityCubicYards,
      isActive: this.isActive,
      purchaseDate: this.purchaseDate,
      warrantyExpiry: this.warrantyExpiry,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Container> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for container changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'container',
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

    // Business rule: Active containers should have RFID tags for tracking
    if (this.isActive && !this.rfidTag) {
      errors.push('Active containers should have RFID tags for asset tracking');
    }

    // Business rule: Containers over 5 years old should be inspected
    const ageInDays = this.getAgeInDays();
    if (ageInDays > 1825 && this.isActive) { // 5 years
      errors.push('Container is over 5 years old and should be inspected for replacement');
    }

    // Business rule: High-value containers should have warranty tracking
    const estimatedValue = this.estimateContainerValue();
    if (estimatedValue > 1000 && !this.warrantyExpiry) {
      errors.push('High-value containers should have warranty information tracked');
    }

    // Business rule: Maintenance records should be current
    if (this.requiresMaintenance()) {
      errors.push('Container requires maintenance');
    }

    // Business rule: In-use containers should have GPS tracking for logistics
    if (this.isInUse() && !this.currentLocation) {
      errors.push('In-use containers should have GPS tracking enabled');
    }

    // Business rule: Container size should match specifications
    if (this.capacityGallons && this.capacityCubicYards) {
      const expectedGallons = this.capacityCubicYards * 201.974; // 1 cubic yard ≈ 202 gallons
      const tolerance = expectedGallons * 0.1; // 10% tolerance

      if (Math.abs(this.capacityGallons - expectedGallons) > tolerance) {
        errors.push('Container capacity specifications may be inconsistent');
      }
    }

    return errors;
  }

  /**
   * Estimate container value based on type and specifications
   */
  private estimateContainerValue(): number {
    const baseValues: Record<Container['type'], number> = {
      'cart': 150,
      'dumpster': 800,
      'bin': 400,
      'rolloff': 2500,
      'compactor': 5000
    };

    let value = baseValues[this.type];

    // Adjust based on material
    const materialMultipliers: Record<string, number> = {
      'plastic': 0.8,
      'metal': 1.2,
      'steel': 1.3,
      'aluminum': 1.1,
      'composite': 1.0,
      'fiberglass': 0.9
    };

    value *= materialMultipliers[this.material] || 1.0;

    // Adjust based on size
    if (this.size.includes('yard')) {
      const yardSize = parseInt(this.size.split('_')[0]);
      value *= yardSize;
    }

    return value;
  }
}

/**
 * Container factory for creating containers from legacy data
 */
export class ContainerFactory {
  /**
   * Create container from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): ContainerModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Container> = {
      externalIds: [legacyData.container_id || legacyData.CONTAINER_ID || legacyData.asset_id || legacyData.id],
      type: this.mapLegacyContainerType(legacyData.container_type || legacyData.type || 'dumpster'),
      size: legacyData.size || legacyData.SIZE || '4_yard',
      material: this.mapLegacyMaterial(legacyData.material || legacyData.MATERIAL || 'steel'),
      color: legacyData.color || legacyData.COLOR,
      rfidTag: legacyData.rfid_tag || legacyData.RFID_TAG || legacyData.tag,
      assignedTo: legacyData.assigned_to || legacyData.ASSIGNED_TO || legacyData.site_id,
      currentLocation: this.mapLegacyLocation(legacyData),
      specifications: this.mapLegacySpecifications(legacyData),
      maintenanceRecords: this.mapLegacyMaintenanceRecords(legacyData),
      capacityGallons: legacyData.capacity_gallons || legacyData.CAPACITY_GALLONS || legacyData.capacity,
      capacityCubicYards: legacyData.capacity_yards || legacyData.CAPACITY_YARDS,
      isActive: this.mapLegacyStatus(legacyData.status || legacyData.STATUS || 'active'),
      purchaseDate: legacyData.purchase_date || legacyData.PURCHASE_DATE || legacyData.acquired_date,
      warrantyExpiry: legacyData.warranty_expiry || legacyData.WARRANTY_EXPIRY,
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy container management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
        containerData: {
          department: legacyData.department || 'operations',
          condition: legacyData.condition || 'good',
          lastInspection: legacyData.last_inspection,
          nextInspection: legacyData.next_inspection
        }
      }
    };

    return ContainerModel.create(mappedData as any);
  }

  /**
   * Map legacy container type
   */
  private static mapLegacyContainerType(legacyType: string): Container['type'] {
    const typeMap: Record<string, Container['type']> = {
      'cart': 'cart',
      'bin': 'bin',
      'dumpster': 'dumpster',
      'rolloff': 'rolloff',
      'roll_off': 'rolloff',
      'compactor': 'compactor',
      'container': 'bin',
      'tote': 'cart'
    };

    return typeMap[legacyType.toLowerCase()] || 'dumpster';
  }

  /**
   * Map legacy material
   */
  private static mapLegacyMaterial(legacyMaterial: string): Container['material'] {
    const materialMap: Record<string, Container['material']> = {
      'plastic': 'plastic',
      'metal': 'metal',
      'steel': 'steel',
      'aluminum': 'aluminum',
      'composite': 'composite',
      'fiberglass': 'fiberglass',
      'aluminium': 'aluminum',
      'steel': 'steel',
      'hdpe': 'plastic'
    };

    return materialMap[legacyMaterial.toLowerCase()] || 'steel';
  }

  /**
   * Map legacy status
   */
  private static mapLegacyStatus(legacyStatus: string): boolean {
    const activeStatuses = ['active', 'in_service', 'available', 'deployed', '1', 'true', 'yes'];
    return activeStatuses.includes(legacyStatus.toLowerCase());
  }

  /**
   * Map legacy location data
   */
  private static mapLegacyLocation(legacyData: Record<string, any>): Address | undefined {
    if (!legacyData.current_location && !legacyData.gps_coordinates) {
      return undefined;
    }

    if (legacyData.current_location) {
      return legacyData.current_location;
    }

    if (legacyData.gps_coordinates) {
      // Handle GPS coordinate format
      const coords = legacyData.gps_coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        return {
          street1: `GPS Location (${coords[0]}, ${coords[1]})`,
          city: 'GPS Tracked',
          state: 'N/A',
          zipCode: '00000',
          country: 'US'
        };
      }
    }

    return undefined;
  }

  /**
   * Map legacy specifications
   */
  private static mapLegacySpecifications(legacyData: Record<string, any>): Record<string, any> {
    const specs: Record<string, any> = {};

    // Common specifications
    if (legacyData.dimensions) specs.dimensions = legacyData.dimensions;
    if (legacyData.weight) specs.weight = legacyData.weight;
    if (legacyData.length) specs.length = legacyData.length;
    if (legacyData.width) specs.width = legacyData.width;
    if (legacyData.height) specs.height = legacyData.height;
    if (legacyData.wheels) specs.wheels = legacyData.wheels;
    if (legacyData.lid_type) specs.lidType = legacyData.lid_type;
    if (legacyData.lock_type) specs.lockType = legacyData.lock_type;
    if (legacyData.serial_number) specs.serialNumber = legacyData.serial_number;
    if (legacyData.model_number) specs.modelNumber = legacyData.model_number;

    return specs;
  }

  /**
   * Map legacy maintenance records
   */
  private static mapLegacyMaintenanceRecords(legacyData: Record<string, any>): MaintenanceRecord[] {
    if (!legacyData.maintenance_history && !legacyData.maintenance_records) {
      return [];
    }

    const maintenanceData = legacyData.maintenance_history || legacyData.maintenance_records || [];

    if (Array.isArray(maintenanceData)) {
      return maintenanceData.map((record: any) => ({
        id: record.id || uuidv4(),
        maintenanceType: record.type || record.maintenance_type || 'general',
        date: record.date || record.service_date || new Date().toISOString().split('T')[0],
        cost: record.cost || record.amount || 0,
        performedBy: record.performed_by || record.vendor || 'Unknown',
        description: record.description || record.notes,
        nextServiceDue: record.next_service || record.next_due
      }));
    }

    // Handle single maintenance record
    return [{
      id: uuidv4(),
      maintenanceType: maintenanceData.type || maintenanceData.maintenance_type || 'general',
      date: maintenanceData.date || maintenanceData.service_date || new Date().toISOString().split('T')[0],
      cost: maintenanceData.cost || maintenanceData.amount || 0,
      performedBy: maintenanceData.performed_by || maintenanceData.vendor || 'Unknown',
      description: maintenanceData.description || maintenanceData.notes,
      nextServiceDue: maintenanceData.next_service || maintenanceData.next_due
    }];
  }
}

/**
 * Container validator for external validation
 */
export class ContainerValidator {
  /**
   * Validate container data without creating instance
   */
  static validate(data: Partial<Container>): { isValid: boolean; errors: string[] } {
    try {
      new ContainerModel(data);
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
  static validateBusinessRules(container: ContainerModel): string[] {
    return container.validateBusinessRules();
  }
}

/**
 * Container management utilities
 */
export class ContainerManager {
  /**
   * Optimize container distribution across sites
   */
  static optimizeContainerDistribution(containers: ContainerModel[], sites: any[]): ContainerModel[] {
    const availableContainers = containers.filter(container => container.isAvailable());
    const sitesNeedingContainers = sites.filter(site => site.containers.length < site.getSiteCapacity());

    // Simple optimization - assign available containers to sites with capacity
    availableContainers.forEach((container, index) => {
      const targetSiteIndex = index % sitesNeedingContainers.length;
      const targetSite = sitesNeedingContainers[targetSiteIndex];

      if (targetSite) {
        container.assignToSite(targetSite.id);
      }
    });

    return containers;
  }

  /**
   * Get containers requiring maintenance
   */
  static getContainersRequiringMaintenance(containers: ContainerModel[]): ContainerModel[] {
    return containers.filter(container => container.requiresMaintenance());
  }

  /**
   * Get container utilization report
   */
  static getUtilizationReport(containers: ContainerModel[]): Record<string, any> {
    const activeContainers = containers.filter(container => container.isActive);
    const inUseContainers = containers.filter(container => container.isInUse());
    const availableContainers = containers.filter(container => container.isAvailable);

    const totalCapacityGallons = containers.reduce((sum, container) =>
      sum + (container.capacityGallons || 0), 0
    );

    const totalCapacityCubicYards = containers.reduce((sum, container) =>
      sum + (container.capacityCubicYards || 0), 0
    );

    const totalMaintenanceCost = containers.reduce((sum, container) =>
      sum + container.getTotalMaintenanceCost(), 0
    );

    return {
      totalContainers: containers.length,
      activeContainers: activeContainers.length,
      inUseContainers: inUseContainers.length,
      availableContainers: availableContainers.length,
      utilizationRate: containers.length > 0 ? (inUseContainers.length / containers.length) * 100 : 0,
      containersRequiringMaintenance: this.getContainersRequiringMaintenance(containers).length,
      totalCapacityGallons: Math.round(totalCapacityGallons),
      totalCapacityCubicYards: Math.round(totalCapacityCubicYards * 100) / 100,
      averageAgeInDays: containers.reduce((sum, container) => sum + container.getAgeInDays(), 0) / containers.length,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      containersWithRfid: containers.filter(container => container.rfidTag).length,
      containersWithGps: containers.filter(container => container.currentLocation).length
    };
  }

  /**
   * Check for container conflicts
   */
  static checkContainerConflicts(containers: ContainerModel[]): string[] {
    const conflicts: string[] = [];

    containers.forEach(container => {
      if (container.isActive && container.requiresMaintenance()) {
        conflicts.push(`Container ${container.type} ${container.size} (${container.id}) requires maintenance`);
      }

      if (container.isInUse() && !container.rfidTag) {
        conflicts.push(`In-use container ${container.type} ${container.size} (${container.id}) missing RFID tag`);
      }

      const businessRuleErrors = container.validateBusinessRules();
      conflicts.push(...businessRuleErrors.map(error => `${container.id}: ${error}`));
    });

    return conflicts;
  }

  /**
   * Get container replacement recommendations
   */
  static getReplacementRecommendations(containers: ContainerModel[]): Array<{ container: ContainerModel; reason: string; priority: 'low' | 'medium' | 'high' }> {
    const recommendations: Array<{ container: ContainerModel; reason: string; priority: 'low' | 'medium' | 'high' }> = [];

    containers.forEach(container => {
      const ageInDays = container.getAgeInDays();
      const efficiency = container.getEfficiencyScore();
      const estimatedValue = container.estimateContainerValue();

      if (ageInDays > 3650) { // 10 years
        recommendations.push({
          container,
          reason: 'Container has exceeded typical useful life (10+ years)',
          priority: 'high'
        });
      } else if (ageInDays > 2555 && efficiency < 60) { // 7 years
        recommendations.push({
          container,
          reason: 'Container is aging and has low efficiency',
          priority: 'medium'
        });
      } else if (efficiency < 40) {
        recommendations.push({
          container,
          reason: 'Container has very low efficiency score',
          priority: 'high'
        });
      } else if (estimatedValue > 2000 && !container.warrantyExpiry) {
        recommendations.push({
          container,
          reason: 'High-value container should have warranty tracking',
          priority: 'low'
        });
      }
    });

    return recommendations;
  }
}
