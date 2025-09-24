/**
 * @fileoverview Order/Job entity implementation with work scheduling
 * @description Complete Order model for managing work orders, job scheduling, and operational workflows
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Order, BaseEntity, Address } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Order implementation with comprehensive work scheduling and operational workflow management
 */
export class OrderModel implements Order {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  orderNumber: string;
  type: 'pickup' | 'delivery' | 'service' | 'maintenance' | 'emergency' | 'scheduled';
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | 'pending_approval';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency';

  // Customer and Location Information
  customerId: string;
  siteId?: string;
  location: Address;

  // Scheduling Information
  scheduledDate: string;
  scheduledTime?: string;
  estimatedDuration?: number; // minutes
  actualStartTime?: string;
  actualEndTime?: string;
  completedDate?: string;

  // Work Details
  serviceType: string;
  description?: string;
  instructions?: string;
  specialRequirements?: string[];

  // Resource Assignment
  assignedFleet?: string;
  assignedPersonnel?: string[];
  requiredEquipment?: string[];

  // Material and Waste Information
  expectedMaterials?: Array<{
    materialType: string;
    estimatedQuantity: number;
    unit: string;
    actualQuantity?: number;
  }>;

  // Financial Information
  estimatedCost?: number;
  actualCost?: number;
  billingStatus: 'pending' | 'billed' | 'paid' | 'disputed';

  // Quality and Compliance
  qualityCheck?: {
    performed: boolean;
    score?: number;
    notes?: string;
    inspectorId?: string;
  };

  environmentalCompliance?: {
    wasteClassification: string;
    disposalMethod: string;
    permitsRequired: string[];
    actualPermitsUsed: string[];
    environmentalImpact: 'low' | 'medium' | 'high';
    notes?: string;
  };

  // Workflow and Approval
  approvalHistory: Array<{
    step: string;
    status: 'approved' | 'rejected' | 'pending';
    userId?: string;
    timestamp: string;
    notes?: string;
  }>;

  // Progress Tracking
  progressUpdates: Array<{
    timestamp: string;
    status: string;
    notes?: string;
    updatedBy?: string;
    location?: Address;
  }>;

  // Dependencies and Relationships
  parentOrderId?: string;
  childOrderIds?: string[];
  relatedRequests?: string[];

  private static readonly VALID_ORDER_TYPES: Order['type'][] = [
    'pickup', 'delivery', 'service', 'maintenance', 'emergency', 'scheduled'
  ];

  private static readonly VALID_STATUSES: Order['status'][] = [
    'draft', 'scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold', 'pending_approval'
  ];

  private static readonly VALID_PRIORITIES: Order['priority'][] = [
    'low', 'medium', 'high', 'critical', 'emergency'
  ];

  private static readonly VALID_SERVICE_TYPES = [
    'waste_collection', 'recycling_collection', 'organics_collection', 'bulk_waste',
    'hazardous_waste', 'container_delivery', 'container_pickup', 'maintenance',
    'inspection', 'cleaning', 'repair', 'emergency_response'
  ];

  private static readonly VALID_BILLING_STATUSES: Order['billingStatus'][] = [
    'pending', 'billed', 'paid', 'disputed'
  ];

  private static readonly VALID_ENVIRONMENTAL_IMPACTS: Order['environmentalCompliance']['environmentalImpact'][] = [
    'low', 'medium', 'high'
  ];

  constructor(data: Partial<Order>) {
    this.validateAndAssign(data);
  }

  /**
   * Create a new order with validation
   */
  static create(data: Omit<Order, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>): OrderModel {
    const now = new Date();
    const orderData: Partial<Order> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'order_system'
      }
    };

    return new OrderModel(orderData);
  }

  /**
   * Update order with optimistic locking
   */
  update(updates: Partial<Omit<Order, keyof BaseEntity>>, expectedVersion: number): OrderModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Order> = {
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

    return new OrderModel(updatedData);
  }

  /**
   * Validate and assign order data
   */
  private validateAndAssign(data: Partial<Order>): void {
    // Required fields validation
    if (!data.orderNumber || typeof data.orderNumber !== 'string') {
      throw new Error('Order number is required and must be a string');
    }

    if (!data.type || !OrderModel.VALID_ORDER_TYPES.includes(data.type)) {
      throw new Error(`Order type must be one of: ${OrderModel.VALID_ORDER_TYPES.join(', ')}`);
    }

    if (!data.status || !OrderModel.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Status must be one of: ${OrderModel.VALID_STATUSES.join(', ')}`);
    }

    if (!data.priority || !OrderModel.VALID_PRIORITIES.includes(data.priority)) {
      throw new Error(`Priority must be one of: ${OrderModel.VALID_PRIORITIES.join(', ')}`);
    }

    if (!data.customerId || typeof data.customerId !== 'string') {
      throw new Error('Customer ID is required and must be a string');
    }

    if (!data.location) {
      throw new Error('Location is required');
    }

    if (!this.isValidDate(data.scheduledDate)) {
      throw new Error('Scheduled date must be a valid date');
    }

    if (!data.serviceType || !OrderModel.VALID_SERVICE_TYPES.includes(data.serviceType)) {
      throw new Error(`Service type must be one of: ${OrderModel.VALID_SERVICE_TYPES.join(', ')}`);
    }

    if (!data.billingStatus || !OrderModel.VALID_BILLING_STATUSES.includes(data.billingStatus)) {
      throw new Error(`Billing status must be one of: ${OrderModel.VALID_BILLING_STATUSES.join(', ')}`);
    }

    // Validate estimated duration if provided
    if (data.estimatedDuration && (typeof data.estimatedDuration !== 'number' || data.estimatedDuration <= 0)) {
      throw new Error('Estimated duration must be a positive number');
    }

    // Validate estimated cost if provided
    if (data.estimatedCost && (typeof data.estimatedCost !== 'number' || data.estimatedCost < 0)) {
      throw new Error('Estimated cost must be a non-negative number');
    }

    // Validate actual cost if provided
    if (data.actualCost && (typeof data.actualCost !== 'number' || data.actualCost < 0)) {
      throw new Error('Actual cost must be a non-negative number');
    }

    // Validate expected materials if provided
    if (data.expectedMaterials) {
      data.expectedMaterials.forEach((material, index) => {
        if (!material.materialType || typeof material.materialType !== 'string') {
          throw new Error(`Expected material ${index}: material type is required`);
        }

        if (typeof material.estimatedQuantity !== 'number' || material.estimatedQuantity <= 0) {
          throw new Error(`Expected material ${index}: estimated quantity must be positive`);
        }

        if (!material.unit || typeof material.unit !== 'string') {
          throw new Error(`Expected material ${index}: unit is required`);
        }

        if (material.actualQuantity && (typeof material.actualQuantity !== 'number' || material.actualQuantity < 0)) {
          throw new Error(`Expected material ${index}: actual quantity must be non-negative`);
        }
      });
    }

    // Validate approval history if provided
    if (data.approvalHistory) {
      data.approvalHistory.forEach((approval, index) => {
        if (!approval.step || typeof approval.step !== 'string') {
          throw new Error(`Approval history ${index}: step is required`);
        }

        if (!['approved', 'rejected', 'pending'].includes(approval.status)) {
          throw new Error(`Approval history ${index}: status must be approved, rejected, or pending`);
        }

        if (!this.isValidDate(approval.timestamp)) {
          throw new Error(`Approval history ${index}: timestamp must be valid`);
        }
      });
    }

    // Validate progress updates if provided
    if (data.progressUpdates) {
      data.progressUpdates.forEach((update, index) => {
        if (!update.status || typeof update.status !== 'string') {
          throw new Error(`Progress update ${index}: status is required`);
        }

        if (!this.isValidDate(update.timestamp)) {
          throw new Error(`Progress update ${index}: timestamp must be valid`);
        }
      });
    }

    // Validate environmental compliance if provided
    if (data.environmentalCompliance) {
      if (!data.environmentalCompliance.wasteClassification || typeof data.environmentalCompliance.wasteClassification !== 'string') {
        throw new Error('Waste classification is required for environmental compliance');
      }

      if (!data.environmentalCompliance.disposalMethod || typeof data.environmentalCompliance.disposalMethod !== 'string') {
        throw new Error('Disposal method is required for environmental compliance');
      }

      if (!OrderModel.VALID_ENVIRONMENTAL_IMPACTS.includes(data.environmentalCompliance.environmentalImpact)) {
        throw new Error(`Environmental impact must be one of: ${OrderModel.VALID_ENVIRONMENTAL_IMPACTS.join(', ')}`);
      }
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
   * Start order execution
   */
  startOrder(): OrderModel {
    if (this.status !== 'scheduled') {
      throw new Error('Can only start scheduled orders');
    }

    const now = new Date().toISOString();
    const updateData: Partial<Order> = {
      status: 'in_progress',
      actualStartTime: now
    };

    return this.update(updateData, this.version);
  }

  /**
   * Complete order execution
   */
  completeOrder(): OrderModel {
    if (this.status !== 'in_progress') {
      throw new Error('Can only complete orders that are in progress');
    }

    const now = new Date().toISOString();
    const updateData: Partial<Order> = {
      status: 'completed',
      actualEndTime: now,
      completedDate: now.split('T')[0]
    };

    return this.update(updateData, this.version);
  }

  /**
   * Cancel order
   */
  cancelOrder(reason: string): OrderModel {
    if (this.status === 'completed' || this.status === 'cancelled') {
      throw new Error('Cannot cancel completed or already cancelled orders');
    }

    const updateData: Partial<Order> = {
      status: 'cancelled'
    };

    return this.update(updateData, this.version);
  }

  /**
   * Put order on hold
   */
  putOnHold(reason: string): OrderModel {
    if (this.status === 'completed' || this.status === 'cancelled') {
      throw new Error('Cannot put completed or cancelled orders on hold');
    }

    const updateData: Partial<Order> = {
      status: 'on_hold'
    };

    return this.update(updateData, this.version);
  }

  /**
   * Resume order from hold
   */
  resumeOrder(): OrderModel {
    if (this.status !== 'on_hold') {
      throw new Error('Can only resume orders that are on hold');
    }

    const updateData: Partial<Order> = {
      status: 'scheduled'
    };

    return this.update(updateData, this.version);
  }

  /**
   * Add progress update
   */
  addProgressUpdate(status: string, notes?: string, location?: Address): OrderModel {
    const progressUpdate = {
      timestamp: new Date().toISOString(),
      status,
      notes,
      location
    };

    const newProgressUpdates = [...this.progressUpdates, progressUpdate];
    return this.update({ progressUpdates: newProgressUpdates }, this.version);
  }

  /**
   * Assign fleet to order
   */
  assignFleet(fleetId: string): OrderModel {
    return this.update({ assignedFleet: fleetId }, this.version);
  }

  /**
   * Assign personnel to order
   */
  assignPersonnel(personnelIds: string[]): OrderModel {
    const newPersonnel = [...(this.assignedPersonnel || []), ...personnelIds];
    return this.update({ assignedPersonnel: newPersonnel }, this.version);
  }

  /**
   * Remove personnel from order
   */
  removePersonnel(personnelId: string): OrderModel {
    const newPersonnel = (this.assignedPersonnel || []).filter(id => id !== personnelId);
    return this.update({ assignedPersonnel: newPersonnel }, this.version);
  }

  /**
   * Add required equipment
   */
  addRequiredEquipment(equipmentId: string): OrderModel {
    const newEquipment = [...(this.requiredEquipment || []), equipmentId];
    return this.update({ requiredEquipment: newEquipment }, this.version);
  }

  /**
   * Update material quantities
   */
  updateMaterialQuantity(materialType: string, actualQuantity: number): OrderModel {
    const newExpectedMaterials = this.expectedMaterials?.map(material => {
      if (material.materialType === materialType) {
        return { ...material, actualQuantity };
      }
      return material;
    }) || [];

    return this.update({ expectedMaterials: newExpectedMaterials }, this.version);
  }

  /**
   * Update actual cost
   */
  updateActualCost(cost: number): OrderModel {
    return this.update({ actualCost: cost }, this.version);
  }

  /**
   * Perform quality check
   */
  performQualityCheck(score: number, notes?: string, inspectorId?: string): OrderModel {
    const qualityCheck = {
      performed: true,
      score,
      notes,
      inspectorId
    };

    return this.update({ qualityCheck }, this.version);
  }

  /**
   * Check if order is overdue
   */
  isOverdue(): boolean {
    if (this.status === 'completed' || this.status === 'cancelled') {
      return false;
    }

    const scheduledDate = new Date(this.scheduledDate);
    const now = new Date();
    return scheduledDate < now && this.status !== 'in_progress';
  }

  /**
   * Check if order is within schedule
   */
  isWithinSchedule(): boolean {
    if (this.status === 'completed' || this.status === 'cancelled') {
      return true;
    }

    const scheduledDate = new Date(this.scheduledDate);
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    return scheduledDate <= threeDaysFromNow;
  }

  /**
   * Get order duration in minutes
   */
  getDurationMinutes(): number {
    if (this.actualStartTime && this.actualEndTime) {
      const start = new Date(this.actualStartTime);
      const end = new Date(this.actualEndTime);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    return this.estimatedDuration || 0;
  }

  /**
   * Get order efficiency score
   */
  getEfficiencyScore(): number {
    let score = 100;

    // Reduce score for overdue orders
    if (this.isOverdue()) score -= 30;

    // Reduce score for orders on hold
    if (this.status === 'on_hold') score -= 20;

    // Reduce score for high priority orders not in progress
    if (this.priority === 'critical' && this.status !== 'in_progress') score -= 25;

    // Reduce score for emergency orders not completed
    if (this.priority === 'emergency' && this.status !== 'completed') score -= 40;

    // Reduce score based on duration variance
    if (this.estimatedDuration && this.getDurationMinutes() > 0) {
      const variance = Math.abs(this.getDurationMinutes() - this.estimatedDuration) / this.estimatedDuration;
      if (variance > 0.5) score -= 15; // More than 50% variance
    }

    // Reduce score for quality issues
    if (this.qualityCheck?.score && this.qualityCheck.score < 80) {
      score -= (80 - this.qualityCheck.score) / 2;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Get order age in hours
   */
  getAgeInHours(): number {
    const createdDate = new Date(this.createdAt);
    const now = new Date();
    return Math.round((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Check if order requires approval
   */
  requiresApproval(): boolean {
    // High cost orders require approval
    if (this.estimatedCost && this.estimatedCost > 1000) return true;

    // Emergency orders require approval
    if (this.priority === 'emergency') return true;

    // Orders with special requirements require approval
    if (this.specialRequirements && this.specialRequirements.length > 0) return true;

    return false;
  }

  /**
   * Get order summary for reporting
   */
  getSummary(): Record<string, any> {
    const isOverdue = this.isOverdue();
    const ageInHours = this.getAgeInHours();
    const durationMinutes = this.getDurationMinutes();

    return {
      id: this.id,
      orderNumber: this.orderNumber,
      type: this.type,
      status: this.status,
      priority: this.priority,
      customerId: this.customerId,
      serviceType: this.serviceType,
      scheduledDate: this.scheduledDate,
      scheduledTime: this.scheduledTime,
      isOverdue,
      isWithinSchedule: this.isWithinSchedule(),
      requiresApproval: this.requiresApproval(),
      efficiencyScore: this.getEfficiencyScore(),
      ageInHours,
      estimatedDuration: this.estimatedDuration,
      actualDuration: durationMinutes,
      durationVariance: this.estimatedDuration ? Math.round(((durationMinutes - this.estimatedDuration) / this.estimatedDuration) * 100) : 0,
      estimatedCost: this.estimatedCost,
      actualCost: this.actualCost,
      costVariance: this.estimatedCost && this.actualCost ? Math.round(((this.actualCost - this.estimatedCost) / this.estimatedCost) * 100) : 0,
      assignedFleet: this.assignedFleet,
      assignedPersonnelCount: this.assignedPersonnel?.length || 0,
      expectedMaterialsCount: this.expectedMaterials?.length || 0,
      progressUpdatesCount: this.progressUpdates.length,
      approvalHistoryCount: this.approvalHistory.length,
      billingStatus: this.billingStatus,
      qualityScore: this.qualityCheck?.score || null,
      environmentalImpact: this.environmentalCompliance?.environmentalImpact || 'low'
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Order {
    return {
      id: this.id,
      externalIds: this.externalIds,
      orderNumber: this.orderNumber,
      type: this.type,
      status: this.status,
      priority: this.priority,
      customerId: this.customerId,
      siteId: this.siteId,
      location: this.location,
      scheduledDate: this.scheduledDate,
      scheduledTime: this.scheduledTime,
      estimatedDuration: this.estimatedDuration,
      actualStartTime: this.actualStartTime,
      actualEndTime: this.actualEndTime,
      completedDate: this.completedDate,
      serviceType: this.serviceType,
      description: this.description,
      instructions: this.instructions,
      specialRequirements: this.specialRequirements,
      assignedFleet: this.assignedFleet,
      assignedPersonnel: this.assignedPersonnel,
      requiredEquipment: this.requiredEquipment,
      expectedMaterials: this.expectedMaterials,
      estimatedCost: this.estimatedCost,
      actualCost: this.actualCost,
      billingStatus: this.billingStatus,
      qualityCheck: this.qualityCheck,
      environmentalCompliance: this.environmentalCompliance,
      approvalHistory: this.approvalHistory,
      progressUpdates: this.progressUpdates,
      parentOrderId: this.parentOrderId,
      childOrderIds: this.childOrderIds,
      relatedRequests: this.relatedRequests,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Order> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for order changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'order',
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

    // Business rule: Emergency orders should be completed quickly
    if (this.priority === 'emergency' && this.getAgeInHours() > 24 && this.status !== 'completed') {
      errors.push('Emergency orders should be completed within 24 hours');
    }

    // Business rule: High priority orders should not be on hold
    if ((this.priority === 'high' || this.priority === 'critical') && this.status === 'on_hold') {
      errors.push('High priority orders should not be put on hold');
    }

    // Business rule: Orders with high estimated cost should have approval
    if (this.estimatedCost && this.estimatedCost > 1000 && this.approvalHistory.length === 0) {
      errors.push('High-value orders should have approval history');
    }

    // Business rule: Completed orders should have actual costs
    if (this.status === 'completed' && this.actualCost === undefined) {
      errors.push('Completed orders should have actual cost recorded');
    }

    // Business rule: Quality check required for certain service types
    const qualityRequiredServices = ['hazardous_waste', 'maintenance', 'repair'];
    if (qualityRequiredServices.includes(this.serviceType) && this.status === 'completed' && !this.qualityCheck?.performed) {
      errors.push('Quality check required for this service type');
    }

    // Business rule: Environmental compliance required for waste orders
    if (this.serviceType.includes('waste') && !this.environmentalCompliance) {
      errors.push('Environmental compliance information required for waste orders');
    }

    // Business rule: Orders should not be overdue
    if (this.isOverdue()) {
      errors.push('Order is overdue and requires immediate attention');
    }

    // Business rule: Duration should be reasonable
    if (this.estimatedDuration && this.estimatedDuration > 480) { // 8 hours
      errors.push('Estimated duration exceeds 8 hours - consider splitting order');
    }

    return errors;
  }
}

/**
 * Order factory for creating orders from legacy data
 */
export class OrderFactory {
  /**
   * Create order from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): OrderModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Order> = {
      externalIds: [legacyData.order_id || legacyData.ORDER_ID || legacyData.work_order_id || legacyData.id],
      orderNumber: legacyData.order_number || legacyData.ORDER_NUMBER || legacyData.work_order_number || `WO-${Date.now()}`,
      type: this.mapLegacyOrderType(legacyData.order_type || legacyData.type || 'service'),
      status: this.mapLegacyStatus(legacyData.status || legacyData.STATUS || 'scheduled'),
      priority: this.mapLegacyPriority(legacyData.priority || legacyData.PRIORITY || 'medium'),
      customerId: legacyData.customer_id || legacyData.CUSTOMER_ID,
      siteId: legacyData.site_id || legacyData.SITE_ID,
      location: this.mapLegacyLocation(legacyData),
      scheduledDate: legacyData.scheduled_date || legacyData.SCHEDULED_DATE || new Date().toISOString().split('T')[0],
      scheduledTime: legacyData.scheduled_time || legacyData.SCHEDULED_TIME,
      estimatedDuration: legacyData.estimated_duration || legacyData.ESTIMATED_DURATION,
      serviceType: this.mapLegacyServiceType(legacyData.service_type || legacyData.SERVICE_TYPE || 'waste_collection'),
      description: legacyData.description || legacyData.DESCRIPTION || legacyData.notes,
      instructions: legacyData.instructions || legacyData.INSTRUCTIONS,
      specialRequirements: this.mapLegacySpecialRequirements(legacyData),
      assignedFleet: legacyData.assigned_fleet || legacyData.ASSIGNED_FLEET || legacyData.vehicle_id,
      assignedPersonnel: this.mapLegacyPersonnel(legacyData),
      requiredEquipment: this.mapLegacyEquipment(legacyData),
      expectedMaterials: this.mapLegacyMaterials(legacyData),
      estimatedCost: legacyData.estimated_cost || legacyData.ESTIMATED_COST,
      actualCost: legacyData.actual_cost || legacyData.ACTUAL_COST,
      billingStatus: this.mapLegacyBillingStatus(legacyData.billing_status || legacyData.BILLING_STATUS || 'pending'),
      qualityCheck: this.mapLegacyQualityCheck(legacyData),
      environmentalCompliance: this.mapLegacyEnvironmentalCompliance(legacyData),
      approvalHistory: this.mapLegacyApprovalHistory(legacyData),
      progressUpdates: this.mapLegacyProgressUpdates(legacyData),
      parentOrderId: legacyData.parent_order_id || legacyData.PARENT_ORDER_ID,
      childOrderIds: legacyData.child_order_ids || legacyData.CHILD_ORDER_IDS,
      relatedRequests: legacyData.related_requests || legacyData.RELATED_REQUESTS,
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy work order management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
        orderData: {
          department: legacyData.department || 'operations',
          costCenter: legacyData.cost_center,
          projectCode: legacyData.project_code
        }
      }
    };

    return OrderModel.create(mappedData as any);
  }

  /**
   * Map legacy order type
   */
  private static mapLegacyOrderType(legacyType: string): Order['type'] {
    const typeMap: Record<string, Order['type']> = {
      'pickup': 'pickup',
      'delivery': 'delivery',
      'service': 'service',
      'maintenance': 'maintenance',
      'emergency': 'emergency',
      'scheduled': 'scheduled',
      'work_order': 'service',
      'wo': 'service'
    };

    return typeMap[legacyType.toLowerCase()] || 'service';
  }

  /**
   * Map legacy status
   */
  private static mapLegacyStatus(legacyStatus: string): Order['status'] {
    const statusMap: Record<string, Order['status']> = {
      'draft': 'draft',
      'scheduled': 'scheduled',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'on_hold': 'on_hold',
      'pending_approval': 'pending_approval',
      'pending': 'pending_approval',
      'approved': 'scheduled',
      'in progress': 'in_progress',
      'complete': 'completed',
      'canceled': 'cancelled',
      'hold': 'on_hold'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'scheduled';
  }

  /**
   * Map legacy priority
   */
  private static mapLegacyPriority(legacyPriority: string): Order['priority'] {
    const priorityMap: Record<string, Order['priority']> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical',
      'emergency': 'emergency',
      '1': 'low',
      '2': 'medium',
      '3': 'high',
      '4': 'critical',
      '5': 'emergency'
    };

    return priorityMap[legacyPriority.toLowerCase()] || 'medium';
  }

  /**
   * Map legacy location
   */
  private static mapLegacyLocation(legacyData: Record<string, any>): Address {
    return {
      street1: legacyData.location_street1 || legacyData.LOCATION_STREET1 || legacyData.address1 || 'Unknown',
      street2: legacyData.location_street2 || legacyData.LOCATION_STREET2 || legacyData.address2,
      city: legacyData.location_city || legacyData.LOCATION_CITY || legacyData.city || 'Unknown',
      state: legacyData.location_state || legacyData.LOCATION_STATE || legacyData.state || 'Unknown',
      zipCode: legacyData.location_zip || legacyData.LOCATION_ZIP || legacyData.zipcode || '00000',
      country: legacyData.location_country || legacyData.LOCATION_COUNTRY || legacyData.country || 'US'
    };
  }

  /**
   * Map legacy service type
   */
  private static mapLegacyServiceType(legacyServiceType: string): string {
    const serviceMap: Record<string, string> = {
      'waste_collection': 'waste_collection',
      'recycling_collection': 'recycling_collection',
      'organics_collection': 'organics_collection',
      'bulk_waste': 'bulk_waste',
      'hazardous_waste': 'hazardous_waste',
      'container_delivery': 'container_delivery',
      'container_pickup': 'container_pickup',
      'maintenance': 'maintenance',
      'inspection': 'inspection',
      'cleaning': 'cleaning',
      'repair': 'repair',
      'emergency_response': 'emergency_response',
      'waste': 'waste_collection',
      'recycling': 'recycling_collection',
      'delivery': 'container_delivery',
      'pickup': 'container_pickup'
    };

    return serviceMap[legacyServiceType.toLowerCase()] || 'waste_collection';
  }

  /**
   * Map legacy special requirements
   */
  private static mapLegacySpecialRequirements(legacyData: Record<string, any>): string[] {
    if (legacyData.special_requirements && Array.isArray(legacyData.special_requirements)) {
      return legacyData.special_requirements;
    }

    if (legacyData.special_requirements && typeof legacyData.special_requirements === 'string') {
      return legacyData.special_requirements.split(',').map((req: string) => req.trim());
    }

    return [];
  }

  /**
   * Map legacy personnel assignments
   */
  private static mapLegacyPersonnel(legacyData: Record<string, any>): string[] {
    if (legacyData.assigned_personnel && Array.isArray(legacyData.assigned_personnel)) {
      return legacyData.assigned_personnel;
    }

    if (legacyData.personnel_ids && Array.isArray(legacyData.personnel_ids)) {
      return legacyData.personnel_ids;
    }

    if (legacyData.crew_members && Array.isArray(legacyData.crew_members)) {
      return legacyData.crew_members;
    }

    return [];
  }

  /**
   * Map legacy equipment requirements
   */
  private static mapLegacyEquipment(legacyData: Record<string, any>): string[] {
    if (legacyData.required_equipment && Array.isArray(legacyData.required_equipment)) {
      return legacyData.required_equipment;
    }

    if (legacyData.equipment_ids && Array.isArray(legacyData.equipment_ids)) {
      return legacyData.equipment_ids;
    }

    return [];
  }

  /**
   * Map legacy materials
   */
  private static mapLegacyMaterials(legacyData: Record<string, any>): Order['expectedMaterials'] {
    if (!legacyData.expected_materials && !legacyData.materials) {
      return [];
    }

    const materialsData = legacyData.expected_materials || legacyData.materials || [];

    if (Array.isArray(materialsData)) {
      return materialsData.map((material: any) => ({
        materialType: material.type || material.material_type || 'mixed_waste',
        estimatedQuantity: material.quantity || material.estimated_quantity || 0,
        unit: material.unit || 'cubic_yards',
        actualQuantity: material.actual_quantity
      }));
    }

    return [];
  }

  /**
   * Map legacy billing status
   */
  private static mapLegacyBillingStatus(legacyStatus: string): Order['billingStatus'] {
    const statusMap: Record<string, Order['billingStatus']> = {
      'pending': 'pending',
      'billed': 'billed',
      'paid': 'paid',
      'disputed': 'disputed',
      'unbilled': 'pending',
      'invoiced': 'billed'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'pending';
  }

  /**
   * Map legacy quality check
   */
  private static mapLegacyQualityCheck(legacyData: Record<string, any>): Order['qualityCheck'] {
    if (!legacyData.quality_check && !legacyData.inspection_result) {
      return undefined;
    }

    const qcData = legacyData.quality_check || legacyData.inspection_result || {};

    return {
      performed: qcData.performed !== undefined ? qcData.performed : true,
      score: qcData.score || qcData.rating,
      notes: qcData.notes || qcData.comments,
      inspectorId: qcData.inspector_id || qcData.inspector
    };
  }

  /**
   * Map legacy environmental compliance
   */
  private static mapLegacyEnvironmentalCompliance(legacyData: Record<string, any>): Order['environmentalCompliance'] {
    if (!legacyData.environmental_compliance && !legacyData.waste_classification) {
      return undefined;
    }

    const ecData = legacyData.environmental_compliance || {};

    return {
      wasteClassification: ecData.waste_classification || legacyData.waste_classification || 'non_hazardous',
      disposalMethod: ecData.disposal_method || 'landfill',
      permitsRequired: ecData.permits_required || [],
      actualPermitsUsed: ecData.actual_permits_used || [],
      environmentalImpact: ecData.environmental_impact || 'low',
      notes: ecData.notes
    };
  }

  /**
   * Map legacy approval history
   */
  private static mapLegacyApprovalHistory(legacyData: Record<string, any>): Order['approvalHistory'] {
    if (!legacyData.approval_history && !legacyData.approvals) {
      return [];
    }

    const approvalData = legacyData.approval_history || legacyData.approvals || [];

    if (Array.isArray(approvalData)) {
      return approvalData.map((approval: any) => ({
        step: approval.step || approval.approval_step || 'approval',
        status: approval.status || approval.approval_status || 'approved',
        userId: approval.user_id || approval.approver_id,
        timestamp: approval.timestamp || approval.date || new Date().toISOString(),
        notes: approval.notes || approval.comments
      }));
    }

    return [];
  }

  /**
   * Map legacy progress updates
   */
  private static mapLegacyProgressUpdates(legacyData: Record<string, any>): Order['progressUpdates'] {
    if (!legacyData.progress_updates && !legacyData.status_history) {
      return [];
    }

    const progressData = legacyData.progress_updates || legacyData.status_history || [];

    if (Array.isArray(progressData)) {
      return progressData.map((update: any) => ({
        timestamp: update.timestamp || update.date || new Date().toISOString(),
        status: update.status || 'updated',
        notes: update.notes || update.description,
        updatedBy: update.updated_by || update.user_id,
        location: update.location
      }));
    }

    return [];
  }
}

/**
 * Order validator for external validation
 */
export class OrderValidator {
  /**
   * Validate order data without creating instance
   */
  static validate(data: Partial<Order>): { isValid: boolean; errors: string[] } {
    try {
      new OrderModel(data);
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
  static validateBusinessRules(order: OrderModel): string[] {
    return order.validateBusinessRules();
  }
}

/**
 * Order management utilities
 */
export class OrderManager {
  /**
   * Optimize order scheduling
   */
  static optimizeOrderScheduling(orders: OrderModel[]): OrderModel[] {
    const optimizedOrders = [...orders];

    // Sort by priority and scheduled date
    optimizedOrders.sort((a, b) => {
      const priorityOrder = { 'emergency': 5, 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;

      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });

    return optimizedOrders;
  }

  /**
   * Get overdue orders
   */
  static getOverdueOrders(orders: OrderModel[]): OrderModel[] {
    return orders.filter(order => order.isOverdue());
  }

  /**
   * Get orders requiring approval
   */
  static getOrdersRequiringApproval(orders: OrderModel[]): OrderModel[] {
    return orders.filter(order => order.requiresApproval());
  }

  /**
   * Get order performance report
   */
  static getPerformanceReport(orders: OrderModel[]): Record<string, any> {
    const completedOrders = orders.filter(order => order.status === 'completed');
    const overdueOrders = this.getOverdueOrders(orders);
    const totalOrders = orders.length;

    const totalEstimatedCost = orders.reduce((sum, order) => sum + (order.estimatedCost || 0), 0);
    const totalActualCost = completedOrders.reduce((sum, order) => sum + (order.actualCost || 0), 0);

    const costVariance = totalEstimatedCost > 0 ?
      ((totalActualCost - totalEstimatedCost) / totalEstimatedCost) * 100 : 0;

    const averageEfficiency = orders.reduce((sum, order) => sum + order.getEfficiencyScore(), 0) / orders.length;

    const ordersByPriority = orders.reduce((acc, order) => {
      acc[order.priority] = (acc[order.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      completedOrders: completedOrders.length,
      overdueOrders: overdueOrders.length,
      ordersRequiringApproval: this.getOrdersRequiringApproval(orders).length,
      completionRate: totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0,
      overdueRate: totalOrders > 0 ? (overdueOrders.length / totalOrders) * 100 : 0,
      averageEfficiency: Math.round(averageEfficiency * 100) / 100,
      totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
      totalActualCost: Math.round(totalActualCost * 100) / 100,
      costVariance: Math.round(costVariance * 100) / 100,
      ordersByPriority,
      ordersByStatus,
      averageAgeInHours: orders.reduce((sum, order) => sum + order.getAgeInHours(), 0) / orders.length
    };
  }

  /**
   * Check for order conflicts
   */
  static checkOrderConflicts(orders: OrderModel[]): string[] {
    const conflicts: string[] = [];

    orders.forEach(order => {
      if (order.isOverdue()) {
        conflicts.push(`Order ${order.orderNumber} is overdue`);
      }

      if (order.requiresApproval() && order.approvalHistory.length === 0) {
        conflicts.push(`Order ${order.orderNumber} requires approval but has no approval history`);
      }

      const businessRuleErrors = order.validateBusinessRules();
      conflicts.push(...businessRuleErrors.map(error => `${order.orderNumber}: ${error}`));
    });

    return conflicts;
  }

  /**
   * Get emergency orders requiring immediate attention
   */
  static getEmergencyOrders(orders: OrderModel[]): OrderModel[] {
    return orders.filter(order =>
      order.priority === 'emergency' ||
      order.priority === 'critical' ||
      (order.type === 'emergency' && order.status !== 'completed')
    );
  }
}
