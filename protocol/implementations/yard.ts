import { join } from 'path';
/**
 * @fileoverview Yard entity implementation with facility management
 * @description Complete Yard model for managing waste management facilities and operations
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Yard, BaseEntity, Address } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Yard implementation with comprehensive facility management and operational capabilities
 */
export class YardModel implements Yard {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  name: string;
  code: string;
  type: 'main' | 'satellite' | 'transfer' | 'storage' | 'maintenance' | 'administrative';
  address: Address;
  contactInformation: {
    name: string;
    title?: string;
    email: string;
    phone?: string;
    mobile?: string;
  };
  operatingHours: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
    holidays?: string[];
  };
  capacity: {
    totalArea: number; // square feet
    availableArea: number; // square feet
    maxContainers: number;
    maxVehicles: number;
    currentContainers: number;
    currentVehicles: number;
  };
  assignedFleet: string[];
  storedContainers: string[];
  facilities: Array<{
    type: string;
    capacity: number;
    currentUsage: number;
    operational: boolean;
  }>;
  status: 'operational' | 'maintenance' | 'closed' | 'planned' | 'limited';
  managerId?: string;
  certifications: string[];
  environmentalCompliance: {
    permits: Array<{
      type: string;
      number: string;
      issuingAuthority: string;
      validFrom: string;
      validTo: string;
      status: 'active' | 'expired' | 'pending' | 'suspended';
    }>;
    lastInspection: string;
    nextInspection: string;
    complianceScore: number;
  };

  private static readonly VALID_YARD_TYPES: Yard['type'][] = [
    'main',
    'satellite',
    'transfer',
    'storage',
    'maintenance',
    'administrative',
  ];

  private static readonly VALID_STATUSES: Yard['status'][] = [
    'operational',
    'maintenance',
    'closed',
    'planned',
    'limited',
  ];

  private static readonly VALID_FACILITY_TYPES = [
    'office',
    'warehouse',
    'garage',
    'maintenance_bay',
    'fuel_station',
    'wash_bay',
    'parking_lot',
    'storage_yard',
    'scale_house',
    'administrative',
  ];

  constructor(data: Partial<Yard>) {
    this.validateAndAssign(data);
    this.updateCapacityUtilization();
  }

  /**
   * Create a new yard with validation
   */
  static create(
    data: Omit<Yard, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>
  ): YardModel {
    const now = new Date();
    const yardData: Partial<Yard> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'facility_system',
      },
    };

    return new YardModel(yardData);
  }

  /**
   * Update yard with optimistic locking
   */
  update(updates: Partial<Omit<Yard, keyof BaseEntity>>, expectedVersion: number): YardModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Yard> = {
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

    return new YardModel(updatedData);
  }

  /**
   * Validate and assign yard data
   */
  private validateAndAssign(data: Partial<Yard>): void {
    // Required fields validation
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Yard name is required and must be a string');
    }

    if (!data.code || typeof data.code !== 'string') {
      throw new Error('Yard code is required and must be a string');
    }

    if (!data.type || !YardModel.VALID_YARD_TYPES.includes(data.type)) {
      throw new Error(`Yard type must be one of: ${YardModel.VALID_YARD_TYPES.join(', ')}`);
    }

    if (!data.address) {
      throw new Error('Address is required');
    }

    if (!data.contactInformation) {
      throw new Error('Contact information is required');
    }

    if (!data.contactInformation.email || !this.isValidEmail(data.contactInformation.email)) {
      throw new Error('Valid contact email is required');
    }

    if (!data.capacity) {
      throw new Error('Capacity information is required');
    }

    if (!data.status || !YardModel.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Status must be one of: ${YardModel.VALID_STATUSES.join(', ')}`);
    }

    // Validate operating hours
    if (data.operatingHours) {
      Object.entries(data.operatingHours).forEach(([day, hours]) => {
        if (hours && (!hours.open || !hours.close)) {
          throw new Error(`Operating hours for ${day} must include both open and close times`);
        }
      });
    }

    // Validate capacity values
    if (data.capacity.totalArea <= 0 || data.capacity.availableArea < 0) {
      throw new Error('Capacity areas must be positive values');
    }

    if (data.capacity.availableArea > data.capacity.totalArea) {
      throw new Error('Available area cannot exceed total area');
    }

    if (data.capacity.maxContainers < 0 || data.capacity.maxVehicles < 0) {
      throw new Error('Maximum containers and vehicles must be non-negative');
    }

    if (data.capacity.currentContainers < 0 || data.capacity.currentVehicles < 0) {
      throw new Error('Current containers and vehicles must be non-negative');
    }

    // Validate facilities
    if (data.facilities) {
      data.facilities.forEach((facility, index) => {
        if (!facility.type || !YardModel.VALID_FACILITY_TYPES.includes(facility.type)) {
          throw new Error(`Facility ${index}: invalid facility type`);
        }

        if (facility.capacity < 0 || facility.currentUsage < 0) {
          throw new Error(`Facility ${index}: capacity and usage must be non-negative`);
        }

        if (facility.currentUsage > facility.capacity) {
          throw new Error(`Facility ${index}: current usage cannot exceed capacity`);
        }
      });
    }

    // Validate certifications
    if (data.certifications) {
      data.certifications.forEach((cert, index) => {
        if (typeof cert !== 'string' || cert.trim().length === 0) {
          throw new Error(`Certification ${index} must be a non-empty string`);
        }
      });
    }

    // Validate environmental compliance
    if (data.environmentalCompliance) {
      if (!this.isValidDate(data.environmentalCompliance.lastInspection)) {
        throw new Error('Last inspection date must be valid');
      }

      if (!this.isValidDate(data.environmentalCompliance.nextInspection)) {
        throw new Error('Next inspection date must be valid');
      }

      if (
        data.environmentalCompliance.complianceScore < 0 ||
        data.environmentalCompliance.complianceScore > 100
      ) {
        throw new Error('Compliance score must be between 0 and 100');
      }
    }

    // Assign validated data
    Object.assign(this, data);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
   * Update capacity utilization
   */
  private updateCapacityUtilization(): void {
    this.capacity.availableArea = this.capacity.totalArea - this.storedContainers.length * 100; // Assume each container takes 100 sq ft
  }

  /**
   * Add fleet asset to yard
   */
  addFleetAsset(fleetId: string): YardModel {
    if (this.assignedFleet.includes(fleetId)) {
      throw new Error(`Fleet asset ${fleetId} is already assigned to this yard`);
    }

    if (this.capacity.currentVehicles >= this.capacity.maxVehicles) {
      throw new Error('Yard has reached maximum vehicle capacity');
    }

    const newFleet = [...this.assignedFleet, fleetId];
    return this.update({ assignedFleet: newFleet }, this.version);
  }

  /**
   * Remove fleet asset from yard
   */
  removeFleetAsset(fleetId: string): YardModel {
    const newFleet = this.assignedFleet.filter((id) => id !== fleetId);
    return this.update({ assignedFleet: newFleet }, this.version);
  }

  /**
   * Add container to yard storage
   */
  addContainer(containerId: string): YardModel {
    if (this.storedContainers.includes(containerId)) {
      throw new Error(`Container ${containerId} is already stored in this yard`);
    }

    if (this.capacity.currentContainers >= this.capacity.maxContainers) {
      throw new Error('Yard has reached maximum container capacity');
    }

    const newContainers = [...this.storedContainers, containerId];
    const updatedCapacity = {
      ...this.capacity,
      currentContainers: this.capacity.currentContainers + 1,
    };

    return this.update(
      { storedContainers: newContainers, capacity: updatedCapacity },
      this.version
    );
  }

  /**
   * Remove container from yard storage
   */
  removeContainer(containerId: string): YardModel {
    const newContainers = this.storedContainers.filter((id) => id !== containerId);
    const updatedCapacity = {
      ...this.capacity,
      currentContainers: Math.max(0, this.capacity.currentContainers - 1),
    };

    return this.update(
      { storedContainers: newContainers, capacity: updatedCapacity },
      this.version
    );
  }

  /**
   * Add facility to yard
   */
  addFacility(
    facility: Omit<Yard['facilities'][0], 'currentUsage'> & { currentUsage?: number }
  ): YardModel {
    if (!YardModel.VALID_FACILITY_TYPES.includes(facility.type)) {
      throw new Error('Invalid facility type');
    }

    if (facility.capacity <= 0) {
      throw new Error('Facility capacity must be positive');
    }

    const currentUsage = facility.currentUsage || 0;
    const newFacility = {
      ...facility,
      currentUsage,
    };

    const newFacilities = [...this.facilities, newFacility];
    return this.update({ facilities: newFacilities }, this.version);
  }

  /**
   * Remove facility from yard
   */
  removeFacility(facilityIndex: number): YardModel {
    if (facilityIndex < 0 || facilityIndex >= this.facilities.length) {
      throw new Error('Invalid facility index');
    }

    const newFacilities = this.facilities.filter((_, index) => index !== facilityIndex);
    return this.update({ facilities: newFacilities }, this.version);
  }

  /**
   * Update facility usage
   */
  updateFacilityUsage(facilityIndex: number, currentUsage: number): YardModel {
    if (facilityIndex < 0 || facilityIndex >= this.facilities.length) {
      throw new Error('Invalid facility index');
    }

    if (currentUsage < 0 || currentUsage > this.facilities[facilityIndex].capacity) {
      throw new Error('Current usage must be non-negative and not exceed capacity');
    }

    const newFacilities = [...this.facilities];
    newFacilities[facilityIndex] = { ...newFacilities[facilityIndex], currentUsage };

    return this.update({ facilities: newFacilities }, this.version);
  }

  /**
   * Add certification
   */
  addCertification(certification: string): YardModel {
    if (!certification || typeof certification !== 'string') {
      throw new Error('Certification must be a non-empty string');
    }

    if (this.certifications.includes(certification)) {
      throw new Error('Certification already exists');
    }

    const newCertifications = [...this.certifications, certification];
    return this.update({ certifications: newCertifications }, this.version);
  }

  /**
   * Remove certification
   */
  removeCertification(certification: string): YardModel {
    const newCertifications = this.certifications.filter((cert) => cert !== certification);
    return this.update({ certifications: newCertifications }, this.version);
  }

  /**
   * Check if yard is operational
   */
  isOperational(): boolean {
    return this.status === 'operational';
  }

  /**
   * Check if yard is at capacity
   */
  isAtCapacity(): boolean {
    return (
      this.capacity.currentContainers >= this.capacity.maxContainers ||
      this.capacity.currentVehicles >= this.capacity.maxVehicles
    );
  }

  /**
   * Get yard utilization rate
   */
  getUtilizationRate(): number {
    const containerUtilization =
      (this.capacity.currentContainers / this.capacity.maxContainers) * 100;
    const vehicleUtilization = (this.capacity.currentVehicles / this.capacity.maxVehicles) * 100;
    return (containerUtilization + vehicleUtilization) / 2;
  }

  /**
   * Get facility utilization
   */
  getFacilityUtilization(): number {
    if (this.facilities.length === 0) return 0;

    const totalCapacity = this.facilities.reduce((sum, facility) => sum + facility.capacity, 0);
    const totalUsage = this.facilities.reduce((sum, facility) => sum + facility.currentUsage, 0);

    return totalCapacity > 0 ? (totalUsage / totalCapacity) * 100 : 0;
  }

  /**
   * Check if yard requires maintenance
   */
  requiresMaintenance(): boolean {
    const utilization = this.getUtilizationRate();
    const facilityUtilization = this.getFacilityUtilization();

    // Maintenance needed if utilization is high or facilities are overused
    return utilization > 90 || facilityUtilization > 85;
  }

  /**
   * Get yard efficiency score
   */
  getEfficiencyScore(): number {
    let score = 100;

    // Reduce score based on utilization
    const utilization = this.getUtilizationRate();
    if (utilization > 80) score -= (utilization - 80) * 2;

    // Reduce score based on facility utilization
    const facilityUtilization = this.getFacilityUtilization();
    if (facilityUtilization > 75) score -= (facilityUtilization - 75) * 1.5;

    // Reduce score if at capacity
    if (this.isAtCapacity()) score -= 15;

    // Reduce score if requires maintenance
    if (this.requiresMaintenance()) score -= 10;

    // Reduce score if not operational
    if (!this.isOperational()) score -= 30;

    return Math.max(0, Math.round(score));
  }

  /**
   * Get yard age in days
   */
  getAgeInDays(): number {
    // This would typically use an established date, for now return 0
    return 0;
  }

  /**
   * Get yard summary for reporting
   */
  getSummary(): Record<string, any> {
    const activeFacilities = this.facilities.filter((facility) => facility.operational);
    const totalFacilityCapacity = this.facilities.reduce(
      (sum, facility) => sum + facility.capacity,
      0
    );
    const totalFacilityUsage = this.facilities.reduce(
      (sum, facility) => sum + facility.currentUsage,
      0
    );

    return {
      id: this.id,
      name: this.name,
      code: this.code,
      type: this.type,
      status: this.status,
      isOperational: this.isOperational(),
      isAtCapacity: this.isAtCapacity(),
      requiresMaintenance: this.requiresMaintenance(),
      efficiencyScore: this.getEfficiencyScore(),
      utilizationRate: Math.round(this.getUtilizationRate() * 100) / 100,
      facilityUtilization: Math.round(this.getFacilityUtilization() * 100) / 100,
      containerCount: this.capacity.currentContainers,
      vehicleCount: this.capacity.currentVehicles,
      maxContainers: this.capacity.maxContainers,
      maxVehicles: this.capacity.maxVehicles,
      totalArea: this.capacity.totalArea,
      availableArea: this.capacity.availableArea,
      activeFacilities: activeFacilities.length,
      totalFacilities: this.facilities.length,
      certificationsCount: this.certifications.length,
      complianceScore: this.environmentalCompliance?.complianceScore || 0,
      lastInspection: this.environmentalCompliance?.lastInspection || null,
      nextInspection: this.environmentalCompliance?.nextInspection || null,
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Yard {
    return {
      id: this.id,
      externalIds: this.externalIds,
      name: this.name,
      code: this.code,
      type: this.type,
      address: this.address,
      contactInformation: this.contactInformation,
      operatingHours: this.operatingHours,
      capacity: this.capacity,
      assignedFleet: this.assignedFleet,
      storedContainers: this.storedContainers,
      facilities: this.facilities,
      status: this.status,
      managerId: this.managerId,
      certifications: this.certifications,
      environmentalCompliance: this.environmentalCompliance,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Yard> {
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, version: _version, ...eventData  } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for yard changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'yard',
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

    // Business rule: Operational yards should have reasonable utilization
    if (this.isOperational()) {
      const utilization = this.getUtilizationRate();
      if (utilization > 95) {
        errors.push('Yard is over-utilized and may need expansion');
      } else if (utilization < 20) {
        errors.push('Yard is under-utilized and may be inefficient');
      }
    }

    // Business rule: Yards should have required certifications
    const requiredCertifications = ['OSHA', 'Environmental'];
    requiredCertifications.forEach((cert) => {
      if (!this.certifications.some((c) => c.toLowerCase().includes(cert.toLowerCase()))) {
        errors.push(`Yard should have ${cert} certification`);
      }
    });

    // Business rule: Maintenance yards should have adequate facilities
    if (this.type === 'maintenance') {
      const hasMaintenanceBay = this.facilities.some((f) => f.type === 'maintenance_bay');
      const hasGarage = this.facilities.some((f) => f.type === 'garage');

      if (!hasMaintenanceBay) {
        errors.push('Maintenance yards should have maintenance bay facilities');
      }

      if (!hasGarage) {
        errors.push('Maintenance yards should have garage facilities');
      }
    }

    // Business rule: Transfer yards should have scale facilities
    if (this.type === 'transfer') {
      const hasScaleHouse = this.facilities.some((f) => f.type === 'scale_house');
      if (!hasScaleHouse) {
        errors.push('Transfer yards should have scale house facilities');
      }
    }

    // Business rule: Environmental compliance should be current
    if (this.environmentalCompliance) {
      const nextInspection = new Date(this.environmentalCompliance.nextInspection);
      const now = new Date();
      const daysUntilInspection = Math.ceil(
        (nextInspection.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilInspection < 0) {
        errors.push('Yard environmental inspection is overdue');
      } else if (daysUntilInspection < 30) {
        errors.push('Yard environmental inspection is due within 30 days');
      }

      if (this.environmentalCompliance.complianceScore < 80) {
        errors.push('Yard environmental compliance score is below acceptable threshold');
      }
    }

    // Business rule: Contact information should be complete
    if (!this.contactInformation.phone && !this.contactInformation.mobile) {
      errors.push('Yard should have at least one phone number for contact');
    }

    return errors;
  }
}

/**
 * Yard factory for creating yards from legacy data
 */
export class YardFactory {
  /**
   * Create yard from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): YardModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Yard> = {
      externalIds: [
        legacyData.yard_id || legacyData.YARD_ID || legacyData.facility_id || legacyData.id,
      ],
      name:
        legacyData.yard_name || legacyData.YARD_NAME || legacyData.facility_name || legacyData.name,
      code:
        legacyData.yard_code || legacyData.YARD_CODE || legacyData.facility_code || legacyData.code,
      type: this.mapLegacyYardType(legacyData.yard_type || legacyData.type || 'main'),
      address: this.mapLegacyAddress(legacyData),
      contactInformation: this.mapLegacyContact(legacyData),
      operatingHours: this.mapLegacyOperatingHours(legacyData),
      capacity: this.mapLegacyCapacity(legacyData),
      assignedFleet: this.mapLegacyFleet(legacyData),
      storedContainers: this.mapLegacyContainers(legacyData),
      facilities: this.mapLegacyFacilities(legacyData),
      status: this.mapLegacyStatus(legacyData.status || legacyData.STATUS || 'operational'),
      managerId: legacyData.manager_id || legacyData.MANAGER_ID,
      certifications: this.mapLegacyCertifications(legacyData),
      environmentalCompliance: this.mapLegacyEnvironmentalCompliance(legacyData),
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy facility management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
        yardData: {
          establishedDate: legacyData.established_date,
          lastRenovation: legacyData.last_renovation,
          utilityProviders: legacyData.utility_providers,
        },
      },
    };

    return YardModel.create(mappedData as any);
  }

  /**
   * Map legacy yard type
   */
  private static mapLegacyYardType(legacyType: string): Yard['type'] {
    const typeMap: Record<string, Yard['type']> = {
      main: 'main',
      primary: 'main',
      satellite: 'satellite',
      transfer: 'transfer',
      storage: 'storage',
      maintenance: 'maintenance',
      admin: 'administrative',
      administrative: 'administrative',
      yard: 'storage',
    };

    return typeMap[legacyType.toLowerCase()] || 'main';
  }

  /**
   * Map legacy address
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
   * Map legacy contact information
   */
  private static mapLegacyContact(legacyData: Record<string, any>): Yard['contactInformation'] {
    return {
      name:
        legacyData.contact_name || legacyData.CONTACT_NAME || legacyData.manager_name || 'Unknown',
      title: legacyData.contact_title || legacyData.CONTACT_TITLE,
      email:
        legacyData.contact_email ||
        legacyData.CONTACT_EMAIL ||
        legacyData.email ||
        'unknown@example.com',
      phone: legacyData.contact_phone || legacyData.CONTACT_PHONE || legacyData.phone,
      mobile: legacyData.contact_mobile || legacyData.CONTACT_MOBILE || legacyData.mobile,
    };
  }

  /**
   * Map legacy operating hours
   */
  private static mapLegacyOperatingHours(legacyData: Record<string, any>): Yard['operatingHours'] {
    const operatingHours: Yard['operatingHours'] = {};

    // Try to extract hours from various legacy formats
    if (legacyData.operating_hours) {
      if (typeof legacyData.operating_hours === 'string') {
        // Parse string format like "Mon-Fri: 8AM-5PM, Sat: 8AM-12PM"
        // This is a simplified parser - production would be more robust
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        days.forEach((day) => {
          operatingHours[day] = { open: '08:00', close: '17:00' };
        });
        operatingHours.saturday = { open: '08:00', close: '12:00' };
      } else if (typeof legacyData.operating_hours === 'object') {
        Object.assign(operatingHours, legacyData.operating_hours);
      }
    }

    return operatingHours;
  }

  /**
   * Map legacy capacity data
   */
  private static mapLegacyCapacity(legacyData: Record<string, any>): Yard['capacity'] {
    return {
      totalArea: legacyData.total_area || legacyData.TOTAL_AREA || legacyData.square_feet || 0,
      availableArea: legacyData.available_area || legacyData.AVAILABLE_AREA || 0,
      maxContainers: legacyData.max_containers || legacyData.MAX_CONTAINERS || 0,
      maxVehicles: legacyData.max_vehicles || legacyData.MAX_VEHICLES || 0,
      currentContainers: legacyData.current_containers || legacyData.CURRENT_CONTAINERS || 0,
      currentVehicles: legacyData.current_vehicles || legacyData.CURRENT_VEHICLES || 0,
    };
  }

  /**
   * Map legacy fleet assignments
   */
  private static mapLegacyFleet(legacyData: Record<string, any>): string[] {
    if (legacyData.assigned_fleet && Array.isArray(legacyData.assigned_fleet)) {
      return legacyData.assigned_fleet;
    }

    if (legacyData.fleet_ids && Array.isArray(legacyData.fleet_ids)) {
      return legacyData.fleet_ids;
    }

    return [];
  }

  /**
   * Map legacy stored containers
   */
  private static mapLegacyContainers(legacyData: Record<string, any>): string[] {
    if (legacyData.stored_containers && Array.isArray(legacyData.stored_containers)) {
      return legacyData.stored_containers;
    }

    if (legacyData.container_ids && Array.isArray(legacyData.container_ids)) {
      return legacyData.container_ids;
    }

    return [];
  }

  /**
   * Map legacy facilities
   */
  private static mapLegacyFacilities(legacyData: Record<string, any>): Yard['facilities'] {
    if (!legacyData.facilities && !legacyData.buildings) {
      return [];
    }

    const facilitiesData = legacyData.facilities || legacyData.buildings || [];

    if (Array.isArray(facilitiesData)) {
      return facilitiesData.map((facility: any) => ({
        type: facility.type || facility.facility_type || 'warehouse',
        capacity: facility.capacity || 0,
        currentUsage: facility.current_usage || facility.usage || 0,
        operational: facility.operational !== undefined ? facility.operational : true,
      }));
    }

    return [];
  }

  /**
   * Map legacy certifications
   */
  private static mapLegacyCertifications(legacyData: Record<string, any>): string[] {
    if (legacyData.certifications && Array.isArray(legacyData.certifications)) {
      return legacyData.certifications;
    }

    if (legacyData.certifications && typeof legacyData.certifications === 'string') {
      return legacyData.certifications.split(',').map((cert: string) => cert.trim());
    }

    return [];
  }

  /**
   * Map legacy environmental compliance
   */
  private static mapLegacyEnvironmentalCompliance(
    legacyData: Record<string, any>
  ): Yard['environmentalCompliance'] {
    return {
      permits: this.mapLegacyPermits(legacyData.permits || legacyData.environmental_permits || []),
      lastInspection:
        legacyData.last_inspection ||
        legacyData.LAST_INSPECTION ||
        new Date().toISOString().split('T')[0],
      nextInspection:
        legacyData.next_inspection ||
        legacyData.NEXT_INSPECTION ||
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      complianceScore: legacyData.compliance_score || legacyData.COMPLIANCE_SCORE || 85,
    };
  }

  /**
   * Map legacy permits
   */
  private static mapLegacyPermits(permits: any[]): Yard['environmentalCompliance']['permits'] {
    if (!Array.isArray(permits)) return [];

    return permits.map((permit: any) => ({
      type: permit.type || permit.permit_type || 'environmental',
      number: permit.number || permit.permit_number || 'Unknown',
      issuingAuthority: permit.authority || permit.issuing_authority || 'Unknown',
      validFrom: permit.valid_from || permit.from || new Date().toISOString().split('T')[0],
      validTo:
        permit.valid_to ||
        permit.to ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: permit.status || 'active',
    }));
  }

  /**
   * Map legacy status
   */
  private static mapLegacyStatus(legacyStatus: string): Yard['status'] {
    const statusMap: Record<string, Yard['status']> = {
      operational: 'operational',
      active: 'operational',
      maintenance: 'maintenance',
      closed: 'closed',
      planned: 'planned',
      limited: 'limited',
    };

    return statusMap[legacyStatus.toLowerCase()] || 'operational';
  }
}

/**
 * Yard validator for external validation
 */
export class YardValidator {
  /**
   * Validate yard data without creating instance
   */
  static validate(data: Partial<Yard>): { isValid: boolean; errors: string[] } {
    try {
      new YardModel(data);
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
  static validateBusinessRules(yard: YardModel): string[] {
    return yard.validateBusinessRules();
  }
}

/**
 * Yard management utilities
 */
export class YardManager {
  /**
   * Optimize yard operations
   */
  static optimizeYardOperations(yards: YardModel[]): YardModel[] {
    const optimizedYards = [...yards];

    // Sort by efficiency score for optimal assignment
    optimizedYards.sort((a, b) => b.getEfficiencyScore() - a.getEfficiencyScore());

    return optimizedYards;
  }

  /**
   * Get yard utilization report
   */
  static getUtilizationReport(yards: YardModel[]): Record<string, any> {
    const operationalYards = yards.filter((yard) => yard.isOperational());
    const totalYards = yards.length;

    const totalUtilization = yards.reduce((sum, yard) => sum + yard.getUtilizationRate(), 0);
    const averageUtilization = yards.length > 0 ? totalUtilization / yards.length : 0;

    const totalFacilityUtilization = yards.reduce(
      (sum, yard) => sum + yard.getFacilityUtilization(),
      0
    );
    const averageFacilityUtilization =
      yards.length > 0 ? totalFacilityUtilization / yards.length : 0;

    const yardsRequiringMaintenance = yards.filter((yard) => yard.requiresMaintenance()).length;
    const maintenanceRate = totalYards > 0 ? (yardsRequiringMaintenance / totalYards) * 100 : 0;

    const totalArea = yards.reduce((sum, yard) => sum + yard.capacity.totalArea, 0);
    const availableArea = yards.reduce((sum, yard) => sum + yard.capacity.availableArea, 0);

    return {
      totalYards,
      operationalYards,
      utilizationRate: Math.round(averageUtilization * 100) / 100,
      facilityUtilizationRate: Math.round(averageFacilityUtilization * 100) / 100,
      maintenanceRate: Math.round(maintenanceRate * 100) / 100,
      totalArea: Math.round(totalArea),
      availableArea: Math.round(availableArea),
      spaceUtilization:
        totalArea > 0 ? Math.round(((totalArea - availableArea) / totalArea) * 10000) / 100 : 0,
      averageEfficiency:
        yards.reduce((sum, yard) => sum + yard.getEfficiencyScore(), 0) / yards.length,
      yardsAtCapacity: yards.filter((yard) => yard.isAtCapacity()).length,
      yardsRequiringMaintenance,
    };
  }

  /**
   * Check for yard conflicts
   */
  static checkYardConflicts(yards: YardModel[]): string[] {
    const conflicts: string[] = [];

    yards.forEach((yard) => {
      if (yard.isOperational() && yard.requiresMaintenance()) {
        conflicts.push(`Yard ${yard.name} (${yard.code}) requires maintenance`);
      }

      if (yard.isAtCapacity()) {
        conflicts.push(`Yard ${yard.name} (${yard.code}) is at capacity`);
      }

      const businessRuleErrors = yard.validateBusinessRules();
      conflicts.push(...businessRuleErrors.map((error) => `${yard.name} (${yard.code}): ${error}`));
    });

    return conflicts;
  }

  /**
   * Get maintenance schedule for yards
   */
  static getMaintenanceSchedule(
    yards: YardModel[]
  ): Array<{ yard: YardModel; priority: 'low' | 'medium' | 'high'; reason: string }> {
    const schedule: Array<{
      yard: YardModel;
      priority: 'low' | 'medium' | 'high';
      reason: string;
    }> = [];

    yards.forEach((yard) => {
      if (yard.requiresMaintenance()) {
        const utilization = yard.getUtilizationRate();
        let priority: 'low' | 'medium' | 'high' = 'low';
        let reason = 'Routine maintenance required';

        if (utilization > 90) {
          priority = 'high';
          reason = 'High utilization requires maintenance';
        } else if (utilization > 70) {
          priority = 'medium';
          reason = 'Moderate utilization requires maintenance';
        }

        schedule.push({ yard, priority, reason });
      }
    });

    return schedule.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}
