/**
 * @fileoverview MaterialTicket entity implementation with scale calculations
 * @description Complete MaterialTicket model with weight calculations, material breakdowns, and LEED allocations
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { MaterialTicket, BaseEntity, MaterialBreakdown, LeedAllocation } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * MaterialTicket implementation with comprehensive scale calculations and compliance tracking
 */
export class MaterialTicketModel implements MaterialTicket {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  ticketNumber: string;
  sourceType: 'route' | 'order' | 'direct_dump';
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  materials: MaterialBreakdown[];
  leedAllocations?: LeedAllocation[];
  facilityId?: string;
  routeId?: string;
  orderId?: string;

  private static readonly VALID_SOURCE_TYPES: MaterialTicket['sourceType'][] = [
    'route', 'order', 'direct_dump'
  ];
  private static readonly LEED_CATEGORIES = [
    'MR Credit 2: Construction Waste Management',
    'MR Credit 4: Recycled Content',
    'MR Credit 5: Regional Materials',
    'IEQ Credit 4.1: Low-Emitting Materials',
    'IEQ Credit 4.2: Low-Emitting Materials',
    'Innovation in Design'
  ];

  constructor(data: Partial<MaterialTicket>) {
    this.validateAndAssign(data);
    this.calculateNetWeight();
  }

  /**
   * Create a new material ticket with validation
   */
  static create(data: Omit<MaterialTicket, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version' | 'ticketNumber'>): MaterialTicketModel {
    const now = new Date();
    const ticketNumber = this.generateTicketNumber();
    const materialTicketData: Partial<MaterialTicket> = {
      id: uuidv4(),
      ticketNumber,
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'scale_system'
      }
    };

    return new MaterialTicketModel(materialTicketData);
  }

  /**
   * Generate unique ticket number
   */
  private static generateTicketNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

    return `TICKET-${year}${month}${day}-${hour}${minute}${second}-${random}`;
  }

  /**
   * Update material ticket with optimistic locking
   */
  update(updates: Partial<Omit<MaterialTicket, keyof BaseEntity>>, expectedVersion: number): MaterialTicketModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<MaterialTicket> = {
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

    return new MaterialTicketModel(updatedData);
  }

  /**
   * Validate and assign material ticket data
   */
  private validateAndAssign(data: Partial<MaterialTicket>): void {
    // Required fields validation
    if (!data.ticketNumber || typeof data.ticketNumber !== 'string') {
      throw new Error('Ticket number is required and must be a string');
    }

    if (!data.sourceType || !MaterialTicketModel.VALID_SOURCE_TYPES.includes(data.sourceType)) {
      throw new Error(`Source type must be one of: ${MaterialTicketModel.VALID_SOURCE_TYPES.join(', ')}`);
    }

    if (typeof data.grossWeight !== 'number' || data.grossWeight < 0) {
      throw new Error('Gross weight must be a non-negative number');
    }

    if (typeof data.tareWeight !== 'number' || data.tareWeight < 0) {
      throw new Error('Tare weight must be a non-negative number');
    }

    if (!Array.isArray(data.materials) || data.materials.length === 0) {
      throw new Error('Materials breakdown must be a non-empty array');
    }

    // Validate gross weight is greater than tare weight
    if (data.grossWeight <= data.tareWeight) {
      throw new Error('Gross weight must be greater than tare weight');
    }

    // Validate materials breakdown
    let totalPercentage = 0;
    data.materials.forEach((material, index) => {
      if (!material.materialId || typeof material.materialId !== 'string') {
        throw new Error(`Material ${index}: material ID is required`);
      }

      if (typeof material.weight !== 'number' || material.weight < 0) {
        throw new Error(`Material ${index}: weight must be a non-negative number`);
      }

      if (typeof material.percentage !== 'number' || material.percentage < 0 || material.percentage > 100) {
        throw new Error(`Material ${index}: percentage must be between 0 and 100`);
      }

      totalPercentage += material.percentage;
    });

    // Validate total percentage equals 100%
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Material percentages must total 100%, got ${totalPercentage}%`);
    }

    // Validate LEED allocations if provided
    if (data.leedAllocations) {
      data.leedAllocations.forEach((allocation, index) => {
        if (!allocation.category || !MaterialTicketModel.LEED_CATEGORIES.includes(allocation.category)) {
          throw new Error(`LEED allocation ${index}: invalid LEED category`);
        }

        if (typeof allocation.percentage !== 'number' || allocation.percentage < 0 || allocation.percentage > 100) {
          throw new Error(`LEED allocation ${index}: percentage must be between 0 and 100`);
        }
      });
    }

    // Assign validated data
    Object.assign(this, data);
  }

  /**
   * Calculate net weight from gross and tare weights
   */
  private calculateNetWeight(): void {
    this.netWeight = this.grossWeight - this.tareWeight;
  }

  /**
   * Add material breakdown entry
   */
  addMaterial(materialId: string, weight: number, percentage: number): MaterialTicketModel {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Material percentage must be between 0 and 100');
    }

    if (weight < 0) {
      throw new Error('Material weight must be non-negative');
    }

    const newMaterials = [...this.materials, { materialId, weight, percentage }];
    const totalPercentage = newMaterials.reduce((sum, mat) => sum + mat.percentage, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Material percentages must total 100% after adding new material');
    }

    return this.update({ materials: newMaterials }, this.version);
  }

  /**
   * Remove material breakdown entry
   */
  removeMaterial(materialId: string): MaterialTicketModel {
    const newMaterials = this.materials.filter(mat => mat.materialId !== materialId);

    if (newMaterials.length === 0) {
      throw new Error('Cannot remove all materials from ticket');
    }

    const totalPercentage = newMaterials.reduce((sum, mat) => sum + mat.percentage, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Material percentages must total 100% after removing material');
    }

    return this.update({ materials: newMaterials }, this.version);
  }

  /**
   * Update material breakdown
   */
  updateMaterial(materialId: string, updates: Partial<MaterialBreakdown>): MaterialTicketModel {
    const materialIndex = this.materials.findIndex(mat => mat.materialId === materialId);

    if (materialIndex === -1) {
      throw new Error(`Material with ID ${materialId} not found`);
    }

    const newMaterials = [...this.materials];
    newMaterials[materialIndex] = { ...newMaterials[materialIndex], ...updates };

    // Re-validate percentages
    const totalPercentage = newMaterials.reduce((sum, mat) => sum + mat.percentage, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Material percentages must total 100% after update');
    }

    return this.update({ materials: newMaterials }, this.version);
  }

  /**
   * Add LEED allocation
   */
  addLeedAllocation(category: string, percentage: number, notes?: string): MaterialTicketModel {
    if (!MaterialTicketModel.LEED_CATEGORIES.includes(category)) {
      throw new Error(`Invalid LEED category: ${category}`);
    }

    if (percentage < 0 || percentage > 100) {
      throw new Error('LEED allocation percentage must be between 0 and 100');
    }

    const currentTotal = this.leedAllocations?.reduce((sum, alloc) => sum + alloc.percentage, 0) || 0;

    if (currentTotal + percentage > 100) {
      throw new Error('Total LEED allocations cannot exceed 100%');
    }

    const newAllocations = [...(this.leedAllocations || []), {
      category,
      percentage,
      notes
    }];

    return this.update({ leedAllocations: newAllocations }, this.version);
  }

  /**
   * Get total weight by material type
   */
  getWeightByMaterial(materialId: string): number {
    const material = this.materials.find(mat => mat.materialId === materialId);
    return material ? material.weight : 0;
  }

  /**
   * Get material breakdown summary
   */
  getMaterialSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    this.materials.forEach(material => {
      summary[material.materialId] = {
        weight: material.weight,
        percentage: material.percentage
      };
    });

    return summary;
  }

  /**
   * Get LEED compliance score
   */
  getLeedComplianceScore(): number {
    if (!this.leedAllocations || this.leedAllocations.length === 0) {
      return 0;
    }

    const totalAllocation = this.leedAllocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
    return Math.min(100, totalAllocation);
  }

  /**
   * Check if ticket is LEED compliant
   */
  isLeedCompliant(): boolean {
    return this.getLeedComplianceScore() >= 75; // 75% threshold for compliance
  }

  /**
   * Calculate average material density
   */
  getAverageDensity(): number {
    if (this.materials.length === 0) return 0;
    return this.materials.reduce((sum, mat) => sum + (mat.weight / this.materials.length), 0);
  }

  /**
   * Get recycling percentage
   */
  getRecyclingPercentage(): number {
    const recyclingMaterials = this.materials.filter(mat =>
      mat.materialId.toLowerCase().includes('recycl') ||
      mat.materialId.toLowerCase().includes('paper') ||
      mat.materialId.toLowerCase().includes('plastic') ||
      mat.materialId.toLowerCase().includes('metal') ||
      mat.materialId.toLowerCase().includes('glass')
    );

    return recyclingMaterials.reduce((sum, mat) => sum + mat.percentage, 0);
  }

  /**
   * Get ticket summary for reporting
   */
  getSummary(): Record<string, any> {
    return {
      id: this.id,
      ticketNumber: this.ticketNumber,
      sourceType: this.sourceType,
      grossWeight: this.grossWeight,
      tareWeight: this.tareWeight,
      netWeight: this.netWeight,
      materialCount: this.materials.length,
      leedAllocationsCount: this.leedAllocations?.length || 0,
      leedComplianceScore: this.getLeedComplianceScore(),
      isLeedCompliant: this.isLeedCompliant(),
      recyclingPercentage: Math.round(this.getRecyclingPercentage() * 100) / 100,
      averageDensity: Math.round(this.getAverageDensity() * 100) / 100
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): MaterialTicket {
    return {
      id: this.id,
      externalIds: this.externalIds,
      ticketNumber: this.ticketNumber,
      sourceType: this.sourceType,
      grossWeight: this.grossWeight,
      tareWeight: this.tareWeight,
      netWeight: this.netWeight,
      materials: this.materials,
      leedAllocations: this.leedAllocations,
      facilityId: this.facilityId,
      routeId: this.routeId,
      orderId: this.orderId,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<MaterialTicket> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for ticket changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'material_ticket',
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

    // Business rule: High net weight should have multiple material breakdowns
    if (this.netWeight > 10000 && this.materials.length < 2) {
      errors.push('Tickets with high net weight (>10 tons) should have multiple material breakdowns');
    }

    // Business rule: LEED allocations should be present for recycling materials
    const recyclingPercentage = this.getRecyclingPercentage();
    if (recyclingPercentage > 50 && (!this.leedAllocations || this.leedAllocations.length === 0)) {
      errors.push('High recycling content should have LEED allocations for compliance');
    }

    // Business rule: Net weight should be reasonable (not negative or excessive)
    if (this.netWeight < 0) {
      errors.push('Net weight cannot be negative');
    }

    if (this.netWeight > 50000) {
      errors.push('Net weight exceeds reasonable limits (50 tons)');
    }

    return errors;
  }
}

/**
 * MaterialTicket factory for creating tickets from legacy data
 */
export class MaterialTicketFactory {
  /**
   * Create ticket from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): MaterialTicketModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<MaterialTicket> = {
      externalIds: [legacyData.ticket_id || legacyData.TICKET_ID || legacyData.id],
      ticketNumber: legacyData.ticket_number || legacyData.TICKET_NUMBER || MaterialTicketModel['generateTicketNumber'](),
      sourceType: this.mapLegacySourceType(legacyData.source_type || legacyData.SOURCE_TYPE || legacyData.source),
      grossWeight: legacyData.gross_weight || legacyData.GROSS_WEIGHT || legacyData.gross,
      tareWeight: legacyData.tare_weight || legacyData.TARE_WEIGHT || legacyData.tare,
      materials: this.mapLegacyMaterials(legacyData),
      leedAllocations: this.mapLegacyLeedAllocations(legacyData),
      facilityId: legacyData.facility_id || legacyData.FACILITY_ID,
      routeId: legacyData.route_id || legacyData.ROUTE_ID,
      orderId: legacyData.order_id || legacyData.ORDER_ID,
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy scale system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
        scaleData: {
          scaleId: legacyData.scale_id,
          operator: legacyData.operator,
          weatherConditions: legacyData.weather_conditions
        }
      }
    };

    return MaterialTicketModel.create(mappedData as any);
  }

  /**
   * Map legacy source types
   */
  private static mapLegacySourceType(legacyType: string): MaterialTicket['sourceType'] {
    const typeMap: Record<string, MaterialTicket['sourceType']> = {
      'route': 'route',
      'order': 'order',
      'direct_dump': 'direct_dump',
      'direct': 'direct_dump',
      'dump': 'direct_dump'
    };

    return typeMap[legacyType.toLowerCase()] || 'direct_dump';
  }

  /**
   * Map legacy material breakdowns
   */
  private static mapLegacyMaterials(legacyData: Record<string, any>): MaterialBreakdown[] {
    const materials: MaterialBreakdown[] = [];

    // Handle various legacy material data formats
    if (legacyData.materials && Array.isArray(legacyData.materials)) {
      return legacyData.materials;
    }

    // Handle single material object
    if (legacyData.material_type && legacyData.material_weight) {
      return [{
        materialId: legacyData.material_type,
        weight: legacyData.material_weight,
        percentage: 100
      }];
    }

    // Handle comma-separated material types
    if (legacyData.material_types && legacyData.material_weights) {
      const materialTypes = legacyData.material_types.split(',').map((m: string) => m.trim());
      const materialWeights = legacyData.material_weights.split(',').map((w: string) => parseFloat(w.trim()));

      const totalWeight = materialWeights.reduce((sum, weight) => sum + weight, 0);

      return materialTypes.map((materialType, index) => ({
        materialId: materialType,
        weight: materialWeights[index],
        percentage: (materialWeights[index] / totalWeight) * 100
      }));
    }

    // Default fallback
    return [{
      materialId: legacyData.material_type || 'mixed_waste',
      weight: legacyData.net_weight || legacyData.NET_WEIGHT || 0,
      percentage: 100
    }];
  }

  /**
   * Map legacy LEED allocations
   */
  private static mapLegacyLeedAllocations(legacyData: Record<string, any>): LeedAllocation[] {
    if (!legacyData.leed_allocations && !legacyData.leed_data) {
      return [];
    }

    const allocations = legacyData.leed_allocations || legacyData.leed_data || [];

    if (Array.isArray(allocations)) {
      return allocations;
    }

    // Handle single allocation object
    return [allocations];
  }
}

/**
 * MaterialTicket validator for external validation
 */
export class MaterialTicketValidator {
  /**
   * Validate ticket data without creating instance
   */
  static validate(data: Partial<MaterialTicket>): { isValid: boolean; errors: string[] } {
    try {
      new MaterialTicketModel(data);
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
  static validateBusinessRules(ticket: MaterialTicketModel): string[] {
    return ticket.validateBusinessRules();
  }
}

/**
 * Scale calculation utilities
 */
export class ScaleCalculator {
  /**
   * Calculate net weight with moisture adjustment
   */
  static calculateNetWeightWithMoisture(grossWeight: number, tareWeight: number, moisturePercentage: number): number {
    const dryWeight = grossWeight * (1 - moisturePercentage / 100);
    return dryWeight - tareWeight;
  }

  /**
   * Calculate material density
   */
  static calculateDensity(weight: number, volume: number): number {
    return weight / volume; // kg/m³ or similar units
  }

  /**
   * Calculate weight distribution across multiple materials
   */
  static distributeWeight(totalWeight: number, materialPercentages: Record<string, number>): Record<string, number> {
    const distributedWeights: Record<string, number> = {};

    for (const [materialId, percentage] of Object.entries(materialPercentages)) {
      distributedWeights[materialId] = (totalWeight * percentage) / 100;
    }

    return distributedWeights;
  }

  /**
   * Validate weight consistency
   */
  static validateWeightConsistency(grossWeight: number, tareWeight: number, netWeight: number, tolerance: number = 0.1): boolean {
    const calculatedNetWeight = grossWeight - tareWeight;
    const difference = Math.abs(calculatedNetWeight - netWeight);
    const toleranceAmount = Math.abs(netWeight) * tolerance;

    return difference <= toleranceAmount;
  }
}
