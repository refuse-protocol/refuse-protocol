import { join } from 'path';
/**
 * @fileoverview Territory entity implementation with geographic boundary validation
 * @description Complete Territory model with geographic boundaries, pricing rules, and spatial operations
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Territory, BaseEntity } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Territory implementation with comprehensive geographic boundary validation and spatial operations
 */
export class TerritoryModel implements Territory {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  name: string;
  boundary: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][];
  };
  pricingRules: Array<{
    serviceType: string;
    baseRate: number;
    rateUnit: string;
    effectiveDate?: string;
  }>;
  assignedRoutes: string[];

  private static readonly VALID_GEOMETRY_TYPES: Territory['boundary']['type'][] = [
    'Polygon',
    'MultiPolygon',
  ];
  private static readonly VALID_SERVICE_TYPES = [
    'waste',
    'recycling',
    'organics',
    'hazardous',
    'bulk',
  ];

  constructor(data: Partial<Territory>) {
    this.validateAndAssign(data);
    this.validateGeometry();
  }

  /**
   * Create a new territory with validation
   */
  static create(
    data: Omit<Territory, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>
  ): TerritoryModel {
    const now = new Date();
    const territoryData: Partial<Territory> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'gis_system',
      },
    };

    return new TerritoryModel(territoryData);
  }

  /**
   * Update territory with optimistic locking
   */
  update(
    updates: Partial<Omit<Territory, keyof BaseEntity>>,
    expectedVersion: number
  ): TerritoryModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Territory> = {
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

    return new TerritoryModel(updatedData);
  }

  /**
   * Validate and assign territory data
   */
  private validateAndAssign(data: Partial<Territory>): void {
    // Required fields validation
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Territory name is required and must be a string');
    }

    if (!data.boundary) {
      throw new Error('Geographic boundary is required');
    }

    if (!data.boundary.type || !TerritoryModel.VALID_GEOMETRY_TYPES.includes(data.boundary.type)) {
      throw new Error(
        `Boundary type must be one of: ${TerritoryModel.VALID_GEOMETRY_TYPES.join(', ')}`
      );
    }

    if (!Array.isArray(data.boundary.coordinates) || data.boundary.coordinates.length === 0) {
      throw new Error('Boundary coordinates must be a non-empty array');
    }

    if (!Array.isArray(data.pricingRules)) {
      throw new Error('Pricing rules must be an array');
    }

    if (!Array.isArray(data.assignedRoutes)) {
      throw new Error('Assigned routes must be an array');
    }

    // Validate pricing rules
    data.pricingRules.forEach((rule, index) => {
      if (!rule.serviceType || !TerritoryModel.VALID_SERVICE_TYPES.includes(rule.serviceType)) {
        throw new Error(`Pricing rule ${index}: invalid service type`);
      }

      if (typeof rule.baseRate !== 'number' || rule.baseRate < 0) {
        throw new Error(`Pricing rule ${index}: base rate must be a non-negative number`);
      }

      if (!rule.rateUnit || typeof rule.rateUnit !== 'string') {
        throw new Error(`Pricing rule ${index}: rate unit is required`);
      }

      if (rule.effectiveDate && !this.isValidDate(rule.effectiveDate)) {
        throw new Error(`Pricing rule ${index}: invalid effective date format`);
      }
    });

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
   * Validate geographic boundary geometry
   */
  private validateGeometry(): void {
    if (this.boundary.type === 'Polygon') {
      this.validatePolygon(this.boundary.coordinates);
    } else if (this.boundary.type === 'MultiPolygon') {
      this.boundary.coordinates.forEach((polygon, index) => {
        this.validatePolygon(polygon, index);
      });
    }
  }

  /**
   * Validate polygon geometry
   */
  private validatePolygon(coordinates: number[][], polygonIndex?: number): void {
    if (!Array.isArray(coordinates) || coordinates.length < 4) {
      throw new Error(
        `Polygon ${polygonIndex !== undefined ? polygonIndex : ''} must have at least 4 coordinate pairs`
      );
    }

    // Check if polygon is closed (first and last coordinates should be the same)
    const firstCoord = coordinates[0];
    const lastCoord = coordinates[coordinates.length - 1];

    if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
      throw new Error(
        `Polygon ${polygonIndex !== undefined ? polygonIndex : ''} must be closed (first and last coordinates should be identical)`
      );
    }

    // Validate coordinate format
    coordinates.forEach((coord, coordIndex) => {
      if (!Array.isArray(coord) || coord.length < 2) {
        throw new Error(
          `Polygon ${polygonIndex !== undefined ? polygonIndex : ''} coordinate ${coordIndex} must be an array with at least 2 elements`
        );
      }

      const [lng, lat] = coord;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error(
          `Polygon ${polygonIndex !== undefined ? polygonIndex : ''} coordinate ${coordIndex} must contain valid numbers`
        );
      }

      if (lat < -90 || lat > 90) {
        throw new Error(
          `Polygon ${polygonIndex !== undefined ? polygonIndex : ''} coordinate ${coordIndex} latitude must be between -90 and 90`
        );
      }

      if (lng < -180 || lng > 180) {
        throw new Error(
          `Polygon ${polygonIndex !== undefined ? polygonIndex : ''} coordinate ${coordIndex} longitude must be between -180 and 180`
        );
      }
    });
  }

  /**
   * Add pricing rule
   */
  addPricingRule(
    serviceType: string,
    baseRate: number,
    rateUnit: string,
    effectiveDate?: string
  ): TerritoryModel {
    if (!TerritoryModel.VALID_SERVICE_TYPES.includes(serviceType)) {
      throw new Error(`Invalid service type: ${serviceType}`);
    }

    if (baseRate < 0) {
      throw new Error('Base rate must be non-negative');
    }

    if (effectiveDate && !this.isValidDate(effectiveDate)) {
      throw new Error('Invalid effective date format');
    }

    const newRule = {
      serviceType,
      baseRate,
      rateUnit,
      effectiveDate,
    };

    return this.update({ pricingRules: [...this.pricingRules, newRule] }, this.version);
  }

  /**
   * Update pricing rule
   */
  updatePricingRule(
    serviceType: string,
    updates: Partial<Territory['pricingRules'][0]>
  ): TerritoryModel {
    const ruleIndex = this.pricingRules.findIndex((rule) => rule.serviceType === serviceType);

    if (ruleIndex === -1) {
      throw new Error(`Pricing rule for service type ${serviceType} not found`);
    }

    const newRules = [...this.pricingRules];
    newRules[ruleIndex] = { ...newRules[ruleIndex], ...updates };

    return this.update({ pricingRules: newRules }, this.version);
  }

  /**
   * Remove pricing rule
   */
  removePricingRule(serviceType: string): TerritoryModel {
    const newRules = this.pricingRules.filter((rule) => rule.serviceType !== serviceType);

    if (newRules.length === 0) {
      throw new Error('Cannot remove all pricing rules');
    }

    return this.update({ pricingRules: newRules }, this.version);
  }

  /**
   * Get pricing rule for service type
   */
  getPricingRule(serviceType: string): Territory['pricingRules'][0] | null {
    return this.pricingRules.find((rule) => rule.serviceType === serviceType) || null;
  }

  /**
   * Calculate area of territory in square kilometers
   */
  getArea(): number {
    if (this.boundary.type === 'Polygon') {
      return this.calculatePolygonArea(this.boundary.coordinates);
    } else if (this.boundary.type === 'MultiPolygon') {
      return this.boundary.coordinates.reduce(
        (total, polygon) => total + this.calculatePolygonArea(polygon),
        0
      );
    }

    return 0;
  }

  /**
   * Calculate polygon area using the shoelace formula
   */
  private calculatePolygonArea(coordinates: number[][]): number {
    if (coordinates.length < 3) return 0;

    let area = 0;
    const coords = coordinates.slice(0, -1); // Remove closing coordinate

    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i][0] * coords[j][1];
      area -= coords[j][0] * coords[i][1];
    }

    area = Math.abs(area) / 2;

    // Convert from square degrees to square kilometers (approximate)
    const latRad = this.toRadians(this.getCenter()[1]);
    const meterPerDegree = 111319.5 * Math.cos(latRad);

    return (area * meterPerDegree * meterPerDegree) / 1000000; // Convert to km²
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get center point of territory
   */
  getCenter(): [number, number] {
    if (this.boundary.type === 'Polygon') {
      return this.calculatePolygonCenter(this.boundary.coordinates);
    } else if (this.boundary.type === 'MultiPolygon') {
      // Return center of first polygon for MultiPolygon
      return this.calculatePolygonCenter(this.boundary.coordinates[0]);
    }

    return [0, 0];
  }

  /**
   * Calculate polygon center
   */
  private calculatePolygonCenter(coordinates: number[][]): [number, number] {
    if (coordinates.length < 3) return [0, 0];

    let totalLng = 0;
    let totalLat = 0;
    const coords = coordinates.slice(0, -1); // Remove closing coordinate

    coords.forEach((coord) => {
      totalLng += coord[0];
      totalLat += coord[1];
    });

    return [totalLng / coords.length, totalLat / coords.length];
  }

  /**
   * Check if point is inside territory boundary
   */
  containsPoint(latitude: number, longitude: number): boolean {
    if (this.boundary.type === 'Polygon') {
      return this.pointInPolygon([longitude, latitude], this.boundary.coordinates);
    } else if (this.boundary.type === 'MultiPolygon') {
      return this.boundary.coordinates.some((polygon) =>
        this.pointInPolygon([longitude, latitude], polygon)
      );
    }

    return false;
  }

  /**
   * Ray casting algorithm to check if point is inside polygon
   */
  private pointInPolygon(point: [number, number], polygon: number[][]): boolean {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Calculate distance from center to a point
   */
  distanceToPoint(latitude: number, longitude: number): number {
    const [centerLng, centerLat] = this.getCenter();
    const R = 6371; // Earth's radius in kilometers

    const dLat = this.toRadians(latitude - centerLat);
    const dLng = this.toRadians(longitude - centerLng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(centerLat)) *
        Math.cos(this.toRadians(latitude)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get territory summary for reporting
   */
  getSummary(): Record<string, any> {
    const center = this.getCenter();
    const area = this.getArea();

    return {
      id: this.id,
      name: this.name,
      areaKm2: Math.round(area * 100) / 100,
      center: center,
      pricingRulesCount: this.pricingRules.length,
      assignedRoutesCount: this.assignedRoutes.length,
      boundaryType: this.boundary.type,
      coordinateCount: this.boundary.coordinates.reduce((sum, poly) => sum + poly.length, 0),
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Territory {
    return {
      id: this.id,
      externalIds: this.externalIds,
      name: this.name,
      boundary: this.boundary,
      pricingRules: this.pricingRules,
      assignedRoutes: this.assignedRoutes,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Territory> {
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, version: _version, ...eventData  } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for territory changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'territory',
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

    // Business rule: Territory should have reasonable area
    const area = this.getArea();
    if (area > 10000) {
      errors.push('Territory area exceeds reasonable limits (10,000 km²)');
    }

    if (area < 1) {
      errors.push('Territory area is too small (< 1 km²)');
    }

    // Business rule: Territory should have pricing rules for common services
    const requiredServices = ['waste', 'recycling'];
    requiredServices.forEach((serviceType) => {
      if (!this.pricingRules.some((rule) => rule.serviceType === serviceType)) {
        errors.push(`Territory should have pricing rule for ${serviceType}`);
      }
    });

    // Business rule: Territory with assigned routes should have reasonable boundaries
    if (this.assignedRoutes.length > 0) {
      const boundaryComplexity = this.boundary.coordinates.reduce(
        (sum, poly) => sum + poly.length,
        0
      );
      if (boundaryComplexity > 1000) {
        errors.push('Complex territory boundaries may impact route optimization performance');
      }
    }

    return errors;
  }
}

/**
 * Territory factory for creating territories from legacy data
 */
export class TerritoryFactory {
  /**
   * Create territory from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): TerritoryModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Territory> = {
      externalIds: [legacyData.territory_id || legacyData.TERRITORY_ID || legacyData.id],
      name: legacyData.territory_name || legacyData.TERRITORY_NAME || legacyData.name,
      boundary: this.mapLegacyBoundary(legacyData),
      pricingRules: this.mapLegacyPricingRules(legacyData),
      assignedRoutes: legacyData.assigned_routes || legacyData.ASSIGNED_ROUTES || [],
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy GIS system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
        gisData: {
          sourceSystem: legacyData.gis_source,
          projection: legacyData.projection || 'WGS84',
          accuracy: legacyData.accuracy || 'high',
        },
      },
    };

    return TerritoryModel.create(mappedData as any);
  }

  /**
   * Map legacy boundary formats
   */
  private static mapLegacyBoundary(legacyData: Record<string, any>): Territory['boundary'] {
    // Handle GeoJSON format
    if (legacyData.geometry && legacyData.geometry.type && legacyData.geometry.coordinates) {
      return {
        type: legacyData.geometry.type,
        coordinates: legacyData.geometry.coordinates,
      };
    }

    // Handle legacy boundary format
    if (legacyData.boundary_coordinates || legacyData.BOUNDARY_COORDINATES) {
      const coords = legacyData.boundary_coordinates || legacyData.BOUNDARY_COORDINATES;

      if (Array.isArray(coords) && coords.length > 0) {
        // Assume Polygon format for legacy data
        return {
          type: 'Polygon',
          coordinates: coords,
        };
      }
    }

    // Handle WKT-like format
    if (legacyData.boundary_wkt || legacyData.BOUNDARY_WKT) {
      return this.parseWKTBoundary(legacyData.boundary_wkt || legacyData.BOUNDARY_WKT);
    }

    // Default fallback - create a simple bounding box
    return {
      type: 'Polygon',
      coordinates: [
        [
          [-74.0, 40.7],
          [-74.0, 40.8],
          [-73.9, 40.8],
          [-73.9, 40.7],
          [-74.0, 40.7],
        ],
      ],
    };
  }

  /**
   * Parse WKT (Well-Known Text) boundary format
   */
  private static parseWKTBoundary(wktString: string): Territory['boundary'] {
    // Simplified WKT parser - in production this would be more robust
    if (wktString.includes('POLYGON')) {
      const coordMatch = wktString.match(/\(\(([^)]+)\)\)/);
      if (coordMatch) {
        const coords = coordMatch[1].split(',').map((pair: string) => {
          const [lng, lat] = pair.trim().split(' ').map(Number);
          return [lng, lat];
        });

        return {
          type: 'Polygon',
          coordinates: [coords],
        };
      }
    }

    // Default fallback
    return {
      type: 'Polygon',
      coordinates: [
        [
          [-74.0, 40.7],
          [-74.0, 40.8],
          [-73.9, 40.8],
          [-73.9, 40.7],
          [-74.0, 40.7],
        ],
      ],
    };
  }

  /**
   * Map legacy pricing rules
   */
  private static mapLegacyPricingRules(legacyData: Record<string, any>): Territory['pricingRules'] {
    const pricingRules: Territory['pricingRules'] = [];

    // Handle array of pricing rules
    if (legacyData.pricing_rules && Array.isArray(legacyData.pricing_rules)) {
      return legacyData.pricing_rules.map((rule: any) => ({
        serviceType: rule.service_type || rule.serviceType || 'waste',
        baseRate: rule.base_rate || rule.baseRate || 0,
        rateUnit: rule.rate_unit || rule.rateUnit || 'month',
        effectiveDate: rule.effective_date || rule.effectiveDate,
      }));
    }

    // Handle individual pricing fields
    if (legacyData.waste_rate || legacyData.recycling_rate) {
      if (legacyData.waste_rate) {
        pricingRules.push({
          serviceType: 'waste',
          baseRate: legacyData.waste_rate,
          rateUnit: 'month',
          effectiveDate: legacyData.effective_date,
        });
      }

      if (legacyData.recycling_rate) {
        pricingRules.push({
          serviceType: 'recycling',
          baseRate: legacyData.recycling_rate,
          rateUnit: 'month',
          effectiveDate: legacyData.effective_date,
        });
      }
    }

    // Default fallback
    if (pricingRules.length === 0) {
      pricingRules.push({
        serviceType: 'waste',
        baseRate: 150,
        rateUnit: 'month',
      });
    }

    return pricingRules;
  }
}

/**
 * Territory validator for external validation
 */
export class TerritoryValidator {
  /**
   * Validate territory data without creating instance
   */
  static validate(data: Partial<Territory>): { isValid: boolean; errors: string[] } {
    try {
      new TerritoryModel(data);
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
  static validateBusinessRules(territory: TerritoryModel): string[] {
    return territory.validateBusinessRules();
  }
}

/**
 * Geographic utilities for territory operations
 */
export class TerritoryGeographicUtils {
  /**
   * Calculate optimal service area based on population density
   */
  static calculateOptimalServiceArea(territory: TerritoryModel, targetPopulation: number): number {
    const currentArea = territory.getArea();
    const populationDensity = targetPopulation / currentArea;

    // Optimal density ranges (people per km²)
    const optimalMinDensity = 100; // Urban areas
    const optimalMaxDensity = 1000; // City centers

    if (populationDensity < optimalMinDensity) {
      // Area is too large for population - suggest reducing area
      return currentArea * (populationDensity / optimalMinDensity);
    } else if (populationDensity > optimalMaxDensity) {
      // Area is too small for population - suggest increasing area
      return currentArea * (populationDensity / optimalMaxDensity);
    }

    return currentArea; // Already optimal
  }

  /**
   * Check if territory overlaps with other territories
   */
  static checkOverlap(territory1: TerritoryModel, territory2: TerritoryModel): boolean {
    // Simplified overlap detection - in production this would use spatial libraries
    const center1 = territory1.getCenter();
    const center2 = territory2.getCenter();
    const distance = Math.sqrt(
      Math.pow(center1[0] - center2[0], 2) + Math.pow(center1[1] - center2[1], 2)
    );

    const combinedRadius =
      Math.sqrt(territory1.getArea() / Math.PI) + Math.sqrt(territory2.getArea() / Math.PI);

    return distance < combinedRadius;
  }

  /**
   * Merge two territories
   */
  static mergeTerritories(
    territory1: TerritoryModel,
    territory2: TerritoryModel,
    mergedName: string
  ): TerritoryModel {
    if (territory1.boundary.type !== 'Polygon' || territory2.boundary.type !== 'Polygon') {
      throw new Error('Can only merge Polygon territories');
    }

    // Create MultiPolygon from both territories
    const mergedBoundary = {
      type: 'MultiPolygon' as const,
      coordinates: [territory1.boundary.coordinates, territory2.boundary.coordinates],
    };

    // Merge pricing rules (use highest rates)
    const mergedPricingRules = [...territory1.pricingRules];
    territory2.pricingRules.forEach((rule2) => {
      const existingRule = mergedPricingRules.find(
        (rule1) => rule1.serviceType === rule2.serviceType
      );
      if (existingRule) {
        existingRule.baseRate = Math.max(existingRule.baseRate, rule2.baseRate);
      } else {
        mergedPricingRules.push(rule2);
      }
    });

    // Combine assigned routes
    const mergedRoutes = [...new Set([...territory1.assignedRoutes, ...territory2.assignedRoutes])];

    const mergedData: Omit<Territory, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'> = {
      name: mergedName,
      boundary: mergedBoundary,
      pricingRules: mergedPricingRules,
      assignedRoutes: mergedRoutes,
      metadata: {
        ...territory1.metadata,
        mergeSource: `Merged from ${territory1.name} and ${territory2.name}`,
        mergeDate: new Date().toISOString(),
      },
    };

    return TerritoryModel.create(mergedData);
  }
}
