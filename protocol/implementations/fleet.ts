import { join } from 'path';
/**
 * @fileoverview Fleet entity implementation with vehicle tracking capabilities
 * @description Complete Fleet model for managing vehicles, equipment, and containers with GPS tracking
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Fleet, BaseEntity, Address, MaintenanceRecord } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Fleet implementation with comprehensive vehicle tracking and maintenance management
 */
export class FleetModel implements Fleet {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  type: 'vehicle' | 'equipment' | 'container';
  make: string;
  model: string;
  year?: number;
  licensePlate?: string;
  vin?: string;
  assetTag?: string;
  status: 'active' | 'maintenance' | 'out_of_service' | 'retired' | 'reserved';
  assignedTo?: string;
  currentLocation?: Address;
  lastGpsUpdate?: Date;
  specifications: Record<string, any>;
  maintenanceRecords: MaintenanceRecord[];
  fuelEfficiency?: number;
  operatingHours?: number;

  private static readonly VALID_FLEET_TYPES: Fleet['type'][] = [
    'vehicle',
    'equipment',
    'container',
  ];

  private static readonly VALID_STATUSES: Fleet['status'][] = [
    'active',
    'maintenance',
    'out_of_service',
    'retired',
    'reserved',
  ];

  constructor(data: Partial<Fleet>) {
    this.validateAndAssign(data);
  }

  /**
   * Create a new fleet asset with validation
   */
  static create(
    data: Omit<Fleet, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>
  ): FleetModel {
    const now = new Date();
    const fleetData: Partial<Fleet> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'fleet_system',
      },
    };

    return new FleetModel(fleetData);
  }

  /**
   * Update fleet asset with optimistic locking
   */
  update(updates: Partial<Omit<Fleet, keyof BaseEntity>>, expectedVersion: number): FleetModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Fleet> = {
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

    return new FleetModel(updatedData);
  }

  /**
   * Validate and assign fleet data
   */
  private validateAndAssign(data: Partial<Fleet>): void {
    // Required fields validation
    if (!data.type || !FleetModel.VALID_FLEET_TYPES.includes(data.type)) {
      throw new Error(`Fleet type must be one of: ${FleetModel.VALID_FLEET_TYPES.join(', ')}`);
    }

    if (!data.make || typeof data.make !== 'string') {
      throw new Error('Make is required and must be a string');
    }

    if (!data.model || typeof data.model !== 'string') {
      throw new Error('Model is required and must be a string');
    }

    if (!data.status || !FleetModel.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Status must be one of: ${FleetModel.VALID_STATUSES.join(', ')}`);
    }

    // Validate year if provided
    if (
      data.year &&
      (typeof data.year !== 'number' ||
        data.year < 1900 ||
        data.year > new Date().getFullYear() + 1)
    ) {
      throw new Error('Year must be a valid number between 1900 and next year');
    }

    // Validate license plate format if provided
    if (data.licensePlate && !this.isValidLicensePlate(data.licensePlate)) {
      throw new Error('License plate format is invalid');
    }

    // Validate VIN format if provided (17 characters)
    if (data.vin && (typeof data.vin !== 'string' || data.vin.length !== 17)) {
      throw new Error('VIN must be exactly 17 characters');
    }

    // Validate specifications
    if (data.specifications && typeof data.specifications !== 'object') {
      throw new Error('Specifications must be an object');
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

    // Validate fuel efficiency if provided
    if (
      data.fuelEfficiency &&
      (typeof data.fuelEfficiency !== 'number' || data.fuelEfficiency <= 0)
    ) {
      throw new Error('Fuel efficiency must be a positive number');
    }

    // Validate operating hours if provided
    if (
      data.operatingHours &&
      (typeof data.operatingHours !== 'number' || data.operatingHours < 0)
    ) {
      throw new Error('Operating hours must be a non-negative number');
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
   * Validate license plate format (basic validation)
   */
  private isValidLicensePlate(licensePlate: string): boolean {
    // Basic validation - alphanumeric with dashes and spaces allowed
    const licenseRegex = /^[A-Z0-9\s\-]+$/i;
    return licenseRegex.test(licensePlate) && licensePlate.length >= 3 && licensePlate.length <= 10;
  }

  /**
   * Update GPS location
   */
  updateLocation(location: Address, timestamp?: Date): FleetModel {
    const updateData: Partial<Fleet> = {
      currentLocation: location,
      lastGpsUpdate: timestamp || new Date(),
    };

    return this.update(updateData, this.version);
  }

  /**
   * Assign to route or yard
   */
  assignTo(assignmentId: string): FleetModel {
    return this.update({ assignedTo: assignmentId }, this.version);
  }

  /**
   * Unassign from current assignment
   */
  unassign(): FleetModel {
    return this.update({ assignedTo: undefined }, this.version);
  }

  /**
   * Add maintenance record
   */
  addMaintenanceRecord(record: Omit<MaintenanceRecord, 'id'>): FleetModel {
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
      ...record,
    };

    const newRecords = [...this.maintenanceRecords, newRecord];
    return this.update({ maintenanceRecords: newRecords }, this.version);
  }

  /**
   * Remove maintenance record
   */
  removeMaintenanceRecord(recordId: string): FleetModel {
    const newRecords = this.maintenanceRecords.filter((record) => record.id !== recordId);
    return this.update({ maintenanceRecords: newRecords }, this.version);
  }

  /**
   * Update operating hours
   */
  updateOperatingHours(hours: number): FleetModel {
    if (hours < 0) {
      throw new Error('Operating hours must be non-negative');
    }

    return this.update({ operatingHours: hours }, this.version);
  }

  /**
   * Update fuel efficiency
   */
  updateFuelEfficiency(efficiency: number): FleetModel {
    if (efficiency <= 0) {
      throw new Error('Fuel efficiency must be positive');
    }

    return this.update({ fuelEfficiency: efficiency }, this.version);
  }

  /**
   * Check if asset requires maintenance
   */
  requiresMaintenance(): boolean {
    if (this.status === 'maintenance' || this.status === 'out_of_service') {
      return false;
    }

    // Check based on operating hours if available
    if (this.operatingHours !== undefined) {
      const recentMaintenance = this.getLastMaintenanceDate();
      if (recentMaintenance) {
        const hoursSinceMaintenance = this.operatingHours - (recentMaintenance.operatingHours || 0);
        return hoursSinceMaintenance > 1000; // Maintenance every 1000 hours
      }
    }

    // Check based on maintenance schedule
    const daysSinceLastMaintenance = this.getDaysSinceLastMaintenance();
    return daysSinceLastMaintenance > 90; // Maintenance every 90 days minimum
  }

  /**
   * Get last maintenance date
   */
  getLastMaintenanceDate(): MaintenanceRecord | null {
    if (this.maintenanceRecords.length === 0) return null;

    return this.maintenanceRecords.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
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
      .filter((record) => record.date >= startDate && record.date <= endDate)
      .reduce((total, record) => total + record.cost, 0);
  }

  /**
   * Check if asset is currently active
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Check if asset is in maintenance
   */
  isInMaintenance(): boolean {
    return this.status === 'maintenance';
  }

  /**
   * Check if asset is out of service
   */
  isOutOfService(): boolean {
    return this.status === 'out_of_service' || this.status === 'retired';
  }

  /**
   * Get asset age in years
   */
  getAgeInYears(): number {
    if (!this.year) return 0;
    return new Date().getFullYear() - this.year;
  }

  /**
   * Calculate depreciation value
   */
  calculateDepreciationValue(originalValue: number, usefulLifeYears: number): number {
    const age = this.getAgeInYears();
    const depreciationRate = originalValue / usefulLifeYears;
    const currentValue = Math.max(0, originalValue - depreciationRate * age);
    return Math.round(currentValue * 100) / 100;
  }

  /**
   * Get asset efficiency score
   */
  getEfficiencyScore(): number {
    let score = 100;

    // Reduce score based on age
    const age = this.getAgeInYears();
    if (age > 10) score -= (age - 10) * 2;

    // Reduce score based on maintenance frequency
    const daysSinceMaintenance = this.getDaysSinceLastMaintenance();
    if (daysSinceMaintenance > 90) {
      score -= Math.min(20, (daysSinceMaintenance - 90) / 5);
    }

    // Reduce score if no fuel efficiency data
    if (this.fuelEfficiency === undefined) {
      score -= 10;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Get fleet asset summary for reporting
   */
  getSummary(): Record<string, any> {
    const lastMaintenance = this.getLastMaintenanceDate();
    const totalMaintenanceCost = this.getTotalMaintenanceCost();

    return {
      id: this.id,
      type: this.type,
      make: this.make,
      model: this.model,
      year: this.year,
      status: this.status,
      assignedTo: this.assignedTo,
      isActive: this.isActive(),
      requiresMaintenance: this.requiresMaintenance(),
      ageInYears: this.getAgeInYears(),
      efficiencyScore: this.getEfficiencyScore(),
      lastMaintenanceDate: lastMaintenance?.date || null,
      daysSinceLastMaintenance: this.getDaysSinceLastMaintenance(),
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      operatingHours: this.operatingHours || 0,
      fuelEfficiency: this.fuelEfficiency || null,
      hasGpsLocation: !!this.currentLocation,
      lastGpsUpdate: this.lastGpsUpdate?.toISOString() || null,
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Fleet {
    return {
      id: this.id,
      externalIds: this.externalIds,
      type: this.type,
      make: this.make,
      model: this.model,
      year: this.year,
      licensePlate: this.licensePlate,
      vin: this.vin,
      assetTag: this.assetTag,
      status: this.status,
      assignedTo: this.assignedTo,
      currentLocation: this.currentLocation,
      lastGpsUpdate: this.lastGpsUpdate,
      specifications: this.specifications,
      maintenanceRecords: this.maintenanceRecords,
      fuelEfficiency: this.fuelEfficiency,
      operatingHours: this.operatingHours,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Fleet> {
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, version: _version, ...eventData  } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for fleet changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'fleet',
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

    // Business rule: Active assets should have current location if they are vehicles
    if (this.status === 'active' && this.type === 'vehicle' && !this.currentLocation) {
      errors.push('Active vehicles must have current location tracking');
    }

    // Business rule: Assets over 10 years old should be reviewed
    if (this.getAgeInYears() > 10 && this.status === 'active') {
      errors.push('Asset is over 10 years old and should be reviewed for replacement');
    }

    // Business rule: High operating hours should have regular maintenance
    if (this.operatingHours && this.operatingHours > 5000) {
      const daysSinceMaintenance = this.getDaysSinceLastMaintenance();
      if (daysSinceMaintenance > 30) {
        errors.push('High-hour asset requires more frequent maintenance');
      }
    }

    // Business rule: Maintenance records should be current
    if (this.requiresMaintenance()) {
      errors.push('Asset requires maintenance');
    }

    // Business rule: License plate required for vehicles
    if (this.type === 'vehicle' && !this.licensePlate) {
      errors.push('Vehicles must have license plate information');
    }

    // Business rule: VIN required for newer vehicles
    if (this.type === 'vehicle' && this.year && this.year > 1980 && !this.vin) {
      errors.push('Vehicles manufactured after 1980 should have VIN information');
    }

    return errors;
  }
}

/**
 * Fleet factory for creating fleet assets from legacy data
 */
export class FleetFactory {
  /**
   * Create fleet asset from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): FleetModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Fleet> = {
      externalIds: [
        legacyData.asset_id || legacyData.ASSET_ID || legacyData.vehicle_id || legacyData.id,
      ],
      type: this.mapLegacyFleetType(legacyData.asset_type || legacyData.type || 'vehicle'),
      make: legacyData.make || legacyData.MAKE || legacyData.manufacturer || 'Unknown',
      model: legacyData.model || legacyData.MODEL || 'Unknown',
      year: legacyData.year || legacyData.YEAR || legacyData.manufacture_year,
      licensePlate: legacyData.license_plate || legacyData.LICENSE_PLATE || legacyData.license,
      vin: legacyData.vin || legacyData.VIN,
      assetTag: legacyData.asset_tag || legacyData.ASSET_TAG || legacyData.tag_number,
      status: this.mapLegacyStatus(legacyData.status || legacyData.STATUS || 'active'),
      assignedTo: legacyData.assigned_to || legacyData.ASSIGNED_TO || legacyData.route_id,
      currentLocation: this.mapLegacyLocation(legacyData),
      specifications: this.mapLegacySpecifications(legacyData),
      maintenanceRecords: this.mapLegacyMaintenanceRecords(legacyData),
      fuelEfficiency: legacyData.fuel_efficiency || legacyData.FUEL_EFFICIENCY || legacyData.mpg,
      operatingHours:
        legacyData.operating_hours || legacyData.OPERATING_HOURS || legacyData.odometer,
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy fleet management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
        fleetData: {
          department: legacyData.department || 'operations',
          acquisitionDate: legacyData.acquisition_date,
          warrantyExpiry: legacyData.warranty_expiry,
          insuranceProvider: legacyData.insurance_provider,
        },
      },
    };

    return FleetModel.create(mappedData as any);
  }

  /**
   * Map legacy fleet type
   */
  private static mapLegacyFleetType(legacyType: string): Fleet['type'] {
    const typeMap: Record<string, Fleet['type']> = {
      vehicle: 'vehicle',
      veh: 'vehicle',
      v: 'vehicle',
      equipment: 'equipment',
      equip: 'equipment',
      eq: 'equipment',
      container: 'container',
      cont: 'container',
      c: 'container',
      truck: 'vehicle',
      trailer: 'equipment',
    };

    return typeMap[legacyType.toLowerCase()] || 'vehicle';
  }

  /**
   * Map legacy status
   */
  private static mapLegacyStatus(legacyStatus: string): Fleet['status'] {
    const statusMap: Record<string, Fleet['status']> = {
      active: 'active',
      a: 'active',
      maintenance: 'maintenance',
      maint: 'maintenance',
      m: 'maintenance',
      out_of_service: 'out_of_service',
      oos: 'out_of_service',
      retired: 'retired',
      r: 'retired',
      reserved: 'reserved',
      res: 'reserved',
      in_service: 'active',
      available: 'active',
    };

    return statusMap[legacyStatus.toLowerCase()] || 'active';
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
          country: 'US',
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
    if (legacyData.capacity) specs.capacity = legacyData.capacity;
    if (legacyData.weight) specs.weight = legacyData.weight;
    if (legacyData.length) specs.length = legacyData.length;
    if (legacyData.width) specs.width = legacyData.width;
    if (legacyData.height) specs.height = legacyData.height;
    if (legacyData.color) specs.color = legacyData.color;
    if (legacyData.engine_type) specs.engineType = legacyData.engine_type;
    if (legacyData.fuel_type) specs.fuelType = legacyData.fuel_type;
    if (legacyData.transmission) specs.transmission = legacyData.transmission;
    if (legacyData.gvwr) specs.gvwr = legacyData.gvwr;
    if (legacyData.payload_capacity) specs.payloadCapacity = legacyData.payload_capacity;

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
        odometerReading: record.odometer || record.mileage,
        nextServiceDue: record.next_service || record.next_due,
      }));
    }

    // Handle single maintenance record
    return [
      {
        id: uuidv4(),
        maintenanceType: maintenanceData.type || maintenanceData.maintenance_type || 'general',
        date:
          maintenanceData.date ||
          maintenanceData.service_date ||
          new Date().toISOString().split('T')[0],
        cost: maintenanceData.cost || maintenanceData.amount || 0,
        performedBy: maintenanceData.performed_by || maintenanceData.vendor || 'Unknown',
        description: maintenanceData.description || maintenanceData.notes,
        odometerReading: maintenanceData.odometer || maintenanceData.mileage,
        nextServiceDue: maintenanceData.next_service || maintenanceData.next_due,
      },
    ];
  }
}

/**
 * Fleet validator for external validation
 */
export class FleetValidator {
  /**
   * Validate fleet data without creating instance
   */
  static validate(data: Partial<Fleet>): { isValid: boolean; errors: string[] } {
    try {
      new FleetModel(data);
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
  static validateBusinessRules(fleet: FleetModel): string[] {
    return fleet.validateBusinessRules();
  }
}

/**
 * Fleet management utilities
 */
export class FleetManager {
  /**
   * Optimize fleet utilization
   */
  static optimizeFleetUtilization(fleet: FleetModel[]): FleetModel[] {
    const optimizedFleet = [...fleet];

    // Sort by efficiency score (highest first)
    optimizedFleet.sort((a, b) => b.getEfficiencyScore() - a.getEfficiencyScore());

    // Update assignments based on optimization
    // This would implement more sophisticated optimization logic in production
    return optimizedFleet;
  }

  /**
   * Get maintenance schedule
   */
  static getMaintenanceSchedule(
    fleet: FleetModel[]
  ): Array<{ asset: FleetModel; dueDate: Date; priority: 'low' | 'medium' | 'high' }> {
    const schedule: Array<{
      asset: FleetModel;
      dueDate: Date;
      priority: 'low' | 'medium' | 'high';
    }> = [];

    fleet.forEach((asset) => {
      if (asset.requiresMaintenance()) {
        const daysSinceMaintenance = asset.getDaysSinceLastMaintenance();
        let priority: 'low' | 'medium' | 'high' = 'low';

        if (daysSinceMaintenance > 180) {
          priority = 'high';
        } else if (daysSinceMaintenance > 90) {
          priority = 'medium';
        }

        // Estimate due date based on maintenance needs
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.max(1, 30 - daysSinceMaintenance));

        schedule.push({ asset, dueDate, priority });
      }
    });

    return schedule.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Calculate fleet efficiency metrics
   */
  static getFleetEfficiencyMetrics(fleet: FleetModel[]): Record<string, any> {
    const activeAssets = fleet.filter((asset) => asset.isActive());
    const totalAssets = fleet.length;

    const totalEfficiency = fleet.reduce((sum, asset) => sum + asset.getEfficiencyScore(), 0);
    const averageEfficiency = fleet.length > 0 ? totalEfficiency / fleet.length : 0;

    const assetsRequiringMaintenance = fleet.filter((asset) => asset.requiresMaintenance()).length;
    const maintenanceRate = totalAssets > 0 ? (assetsRequiringMaintenance / totalAssets) * 100 : 0;

    const assetsWithGps = fleet.filter((asset) => asset.currentLocation !== undefined).length;
    const gpsCoverage = totalAssets > 0 ? (assetsWithGps / totalAssets) * 100 : 0;

    const totalMaintenanceCost = fleet.reduce(
      (sum, asset) => sum + asset.getTotalMaintenanceCost(),
      0
    );
    const averageMaintenanceCost = fleet.length > 0 ? totalMaintenanceCost / fleet.length : 0;

    return {
      totalAssets,
      activeAssets,
      utilizationRate: (activeAssets.length / totalAssets) * 100,
      averageEfficiency: Math.round(averageEfficiency * 100) / 100,
      maintenanceRate: Math.round(maintenanceRate * 100) / 100,
      gpsCoverage: Math.round(gpsCoverage * 100) / 100,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      averageMaintenanceCost: Math.round(averageMaintenanceCost * 100) / 100,
      averageAge: fleet.reduce((sum, asset) => sum + asset.getAgeInYears(), 0) / fleet.length,
    };
  }

  /**
   * Check for fleet conflicts
   */
  static checkFleetConflicts(fleet: FleetModel[]): string[] {
    const conflicts: string[] = [];

    fleet.forEach((asset) => {
      if (asset.status === 'active' && asset.requiresMaintenance()) {
        conflicts.push(`Asset ${asset.make} ${asset.model} (${asset.id}) requires maintenance`);
      }

      if (asset.type === 'vehicle' && asset.status === 'active' && !asset.licensePlate) {
        conflicts.push(`Vehicle ${asset.make} ${asset.model} (${asset.id}) missing license plate`);
      }

      const businessRuleErrors = asset.validateBusinessRules();
      conflicts.push(...businessRuleErrors.map((error) => `${asset.id}: ${error}`));
    });

    return conflicts;
  }

  /**
   * Get fleet replacement recommendations
   */
  static getReplacementRecommendations(
    fleet: FleetModel[]
  ): Array<{ asset: FleetModel; reason: string; priority: 'low' | 'medium' | 'high' }> {
    const recommendations: Array<{
      asset: FleetModel;
      reason: string;
      priority: 'low' | 'medium' | 'high';
    }> = [];

    fleet.forEach((asset) => {
      const age = asset.getAgeInYears();
      const efficiency = asset.getEfficiencyScore();

      if (age > 15) {
        recommendations.push({
          asset,
          reason: 'Asset has exceeded typical useful life (15+ years)',
          priority: 'high',
        });
      } else if (age > 10 && efficiency < 60) {
        recommendations.push({
          asset,
          reason: 'Asset is aging and has low efficiency',
          priority: 'medium',
        });
      } else if (efficiency < 40) {
        recommendations.push({
          asset,
          reason: 'Asset has very low efficiency score',
          priority: 'high',
        });
      }
    });

    return recommendations;
  }
}
