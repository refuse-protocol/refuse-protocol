/**
 * @fileoverview Core TypeScript interfaces for all REFUSE Protocol entities
 * @description Defines the structure and relationships for all 16 entities
 * @version 1.0.0
 */

// Base entity interface
export interface BaseEntity {
  id: string;
  externalIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
  metadata?: Record<string, any>;
}

// Supporting types
export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Contact {
  name: string;
  title?: string;
  email: string;
  phone?: string;
  mobile?: string;
}

export interface OperatingHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
  holidays?: string[];
}

// Customer entity
export interface Customer extends BaseEntity {
  name: string;
  type: 'residential' | 'commercial' | 'industrial' | 'municipal';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  taxId?: string;
  primaryContact?: Contact;
  billingContact?: Contact;
  serviceContacts?: Contact[];
  serviceAddress: Address;
  billingAddress?: Address;
  serviceTypes?: string[];
  specialInstructions?: string;
  contactInfo?: {
    email: string;
    primaryPhone: string;
    secondaryPhone?: string;
    emergencyContact?: Contact;
  };
  serviceArea?: string;
  metadata?: Record<string, any>;
}

// Service entity
export interface Service extends BaseEntity {
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
  metadata?: Record<string, any>;
}

// Route entity
export interface Route extends BaseEntity {
  name: string;
  schedule: {
    frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'on_call' | 'one_time';
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    holidays?: string[];
  };
  assignedSites: string[];
  assignedVehicle?: string;
  efficiency: number;
  performanceMetrics?: {
    averageServiceTime?: number;
    totalDistance?: number;
    fuelEfficiency?: number;
    onTimePercentage?: number;
  };
  metadata?: Record<string, any>;

  // Method signatures
  getDurationMinutes(): number;
  getDurationFormatted(): string;
  getStopsPerHour(): number;
}

// Facility entity
export interface Facility extends BaseEntity {
  name: string;
  code: string;
  type:
    | 'landfill'
    | 'mrf'
    | 'transfer'
    | 'composter'
    | 'export'
    | 'cad'
    | 'incinerator'
    | 'recycling_center';
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
  metadata?: Record<string, any>;
}

// CustomerRequest entity
export interface CustomerRequest extends BaseEntity {
  requestNumber: string;
  type: 'new_service' | 'change_service' | 'one_time' | 'inquiry';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  customerId: string;
  serviceType: string;
  requestedDate: Date;
  approvalHistory: Array<{
    step: string;
    timestamp: Date;
    userId: string;
    notes?: string;
  }>;
  relatedServices?: string[];
  metadata?: Record<string, any>;

  // Method signatures
  getDaysSinceSubmission(): number;
}

// Territory entity
export interface Territory extends BaseEntity {
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
}

// Site entity
export interface Site extends BaseEntity {
  customerId: string;
  name: string;
  address: Address;
  services: string[];
  containers: string[];
  environmentalPermits?: Array<{
    permitType: string;
    permitNumber: string;
    issuingAuthority: string;
    validFrom: string;
    validTo: string;
  }>;
}

// Contract entity
export interface Contract extends BaseEntity {
  contractNumber: string;
  customerId: string;
  siteId?: string;
  serviceTypes: string[];
  guaranteedServices: string[];
  contractStatus: 'draft' | 'active' | 'expired' | 'cancelled' | 'renewed' | 'pending_approval';
  pricing: {
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
  term: {
    startDate: string;
    endDate: string;
    autoRenewal?: boolean;
    renewalTerms?: string;
    renewalOptions?: number;
    noticePeriod?: number;
  };
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'draft';
  specialTerms?: string[];
  serviceType: string;
  metadata?: Record<string, any>;
}

// Fleet entity
export interface Fleet extends BaseEntity {
  type: 'vehicle' | 'equipment' | 'container';
  make: string;
  model: string;
  year?: number;
  status: 'active' | 'maintenance' | 'out_of_service';
  assignedTo?: string;
  specifications?: Record<string, any>;
}

// Container entity
export interface Container extends BaseEntity {
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
}

// MaintenanceRecord type
export interface MaintenanceRecord {
  id: string;
  containerId: string;
  maintenanceType: string;
  scheduledDate: Date;
  completedDate?: Date;
  technician: string;
  cost: number;
  description: string;
  nextScheduledDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

// Yard entity
export interface Yard extends BaseEntity {
  name: string;
  address: Address;
  assignedFleet: string[];
  storedContainers: string[];
  operatingHours?: OperatingHours;
}

// Order/Job entity
export interface Order extends BaseEntity {
  orderNumber: string;
  customerId: string;
  siteId: string;
  serviceType: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  scheduledDate: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedFleet?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  notes?: string;
}

// Material entity
export interface Material extends BaseEntity {
  name: string;
  code: string;
  category: 'waste' | 'recycling' | 'organics' | 'hazardous' | 'bulk';
  description?: string;
  specifications?: Record<string, any>;
}

// Supporting types for MaterialTicket
export interface MaterialBreakdown {
  materialId: string;
  weight: number;
  percentage: number;
}

export interface LeedAllocation {
  category: string;
  percentage: number;
  notes?: string;
}

// MaterialTicket entity
export interface MaterialTicket extends BaseEntity {
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
  metadata?: Record<string, any>;
}

// Payment entity
export interface Payment extends BaseEntity {
  paymentNumber: string;
  type:
    | 'invoice_payment'
    | 'advance_payment'
    | 'refund'
    | 'adjustment'
    | 'deposit'
    | 'final_payment';
  customerId: string;
  customerName: string;
  invoiceIds: string[];
  orderIds: string[];
  contractIds: string[];
  amount: number;
  currency: string;
  paymentDate: string;
  dueDate: string;
  processedDate?: string;
  paymentMethod:
    | 'check'
    | 'wire'
    | 'ach'
    | 'credit_card'
    | 'cash'
    | 'bank_transfer'
    | 'digital_wallet';
  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'disputed'
    | 'refunded'
    | 'partial';

  // Transaction Details
  transactionReference?: string;
  authorizationCode?: string;
  confirmationNumber?: string;
  bankReference?: string;

  // Customer and Billing Information
  billingAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // Fee and Adjustment Information
  fees: Array<{
    type: string;
    amount: number;
    description: string;
    taxable: boolean;
  }>;

  adjustments: Array<{
    type: 'discount' | 'surcharge' | 'tax_adjustment' | 'fee_waiver' | 'penalty' | 'credit';
    amount: number;
    reason: string;
    appliedDate: string;
    approvedBy?: string;
  }>;

  // Reconciliation Information
  reconciliationStatus:
    | 'unreconciled'
    | 'matched'
    | 'partially_matched'
    | 'disputed'
    | 'reconciled';
  reconciledAmount?: number;
  reconciliationDate?: string;
  reconciledBy?: string;
  reconciliationNotes?: string;

  // Bank and Processing Information
  bankInformation: {
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    checkNumber?: string;
    depositReference?: string;
  };

  // Audit and Compliance
  auditTrail: Array<{
    action: string;
    timestamp: string;
    userId?: string;
    previousStatus?: string;
    newStatus: string;
    notes?: string;
    ipAddress?: string;
  }>;

  complianceChecks: Array<{
    checkType: string;
    status: 'passed' | 'failed' | 'pending' | 'waived';
    checkedDate: string;
    checkedBy?: string;
    notes?: string;
    referenceId?: string;
  }>;

  // Payment Processing Details
  processingDetails: {
    processor: string;
    gatewayTransactionId?: string;
    processingFee?: number;
    exchangeRate?: number;
    originalCurrency?: string;
    metadata?: Record<string, any>;
  };

  // Legacy and additional metadata
  referenceNumber?: string;
  notes?: string;
}

// Allocation entity
export interface Allocation extends BaseEntity {
  materialTicketId: string;
  leedCategory: string;
  allocationType: 'weight' | 'volume' | 'percentage';
  amount: number;
  unit: string;
  reportingPeriod: string;
  verifiedBy?: string;
  verificationDate?: string;

  // Extended properties for implementation
  destination?: {
    type: 'landfill' | 'mrf' | 'transfer' | 'composter' | 'export';
    facilityId: string;
    location: Address;
    capacity?: number;
    restrictions?: string[];
  };
  processingMethod?: {
    method: string;
    efficiency: number;
    quality: string;
    certifications?: string[];
  };
  environmentalImpact?: {
    carbonFootprint: number;
    waterUsage: number;
    energyConsumption: number;
    emissions: Record<string, number>;
  };
  leedCompliance?: {
    certificationLevel: 'certified' | 'silver' | 'gold' | 'platinum';
    creditsEarned: number;
    totalCredits: number;
    categories: Record<string, number>;
  };
  qualityMetrics?: Array<{
    metricType: string;
    value: number;
    unit: string;
    complianceStatus: 'pass' | 'fail' | 'warning';
    threshold?: number;
  }>;
  transportation?: {
    distance: number;
    fuelType: string;
    fuelEfficiency: number;
    routeId?: string;
    vehicleType?: string;
  };
  costBreakdown?: {
    baseCost: number;
    transportationCost: number;
    processingCost: number;
    disposalCost: number;
    totalCost: number;
    currency: string;
  };
  regulatoryCompliance?: Array<{
    regulation: string;
    status: 'compliant' | 'non_compliant' | 'exempt' | 'pending';
    lastChecked: Date;
    nextDue: Date;
    violations?: string[];
  }>;
  documentation?: Array<{
    documentType: string;
    documentId: string;
    status: 'submitted' | 'approved' | 'rejected' | 'pending';
    submittedDate: Date;
    approvedDate?: Date;
    url?: string;
  }>;
  auditTrail?: Array<{
    action: string;
    timestamp: Date;
    userId: string;
    changes: Record<string, any>;
    notes?: string;
  }>;
  metadata?: Record<string, any>;
}

// Event entity
export interface Event extends BaseEntity {
  entityType:
    | 'customer'
    | 'service'
    | 'route'
    | 'facility'
    | 'customer_request'
    | 'material_ticket'
    | 'contract'
    | 'payment'
    | 'container';
  eventType: 'created' | 'updated' | 'completed' | 'cancelled' | 'webhook_received';
  timestamp: Date;
  eventData: Record<string, any>;
  correlationId?: string;
  userId?: string;
  source?: string;
  metadata?: Record<string, any>;
}

// Entity relationship mappings
export interface EntityRelationships {
  Customer: {
    sites: Site[];
    services: Service[];
    contracts: Contract[];
    payments: Payment[];
    requests: CustomerRequest[];
  };
  Service: {
    customer: Customer;
    site: Site;
    route?: Route;
    contract?: Contract;
  };
  Route: {
    services: Service[];
    facility?: Facility;
    assignedSites: Site[];
  };
  Facility: {
    routes: Route[];
    materialTickets: MaterialTicket[];
  };
  Site: {
    customer: Customer;
    services: Service[];
    containers: Container[];
    orders: Order[];
  };
}

// Export all entities
export type RefuseEntities =
  | Customer
  | Service
  | Route
  | Facility
  | CustomerRequest
  | Territory
  | Site
  | Contract
  | Fleet
  | Container
  | Yard
  | Order
  | Material
  | MaterialTicket
  | Payment
  | Allocation
  | Event;

// Data archaeology types
export interface AnalysisOptions {
  maxDepth?: number;
  includeInactive?: boolean;
  sampleSize?: number;
  analysisTypes?: string[];
}

export interface EntityInfo {
  name: string;
  type: string;
  count: number;
  properties: PropertyInfo[];
  relationships: RelationshipInfo[];
  constraints: ConstraintInfo[];
}

export interface PropertyInfo {
  name: string;
  type: string;
  required: boolean;
  nullable: boolean;
  defaultValue?: any;
  length?: number;
  precision?: number;
  scale?: number;
}

export interface RelationshipInfo {
  name: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
  relatedEntity: string;
  foreignKey?: string;
  cardinality?: string;
}

export interface ConstraintInfo {
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null';
  name?: string;
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  checkCondition?: string;
}

export interface DataPattern {
  patternType: string;
  entities: string[];
  description: string;
  confidence: number;
  examples: string[];
  recommendation?: string;
}

export interface MigrationStrategy {
  phases: MigrationPhase[];
  totalComplexity: number;
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  dependencies: string[];
}

export interface MigrationPhase {
  phaseNumber: number;
  name: string;
  description: string;
  entities: string[];
  complexity: number;
  estimatedDuration: number;
  prerequisites: string[];
  riskFactors: string[];
  rollbackStrategy?: string;
}

export interface DataTransformation {
  entity: string;
  transformationType: string;
  fieldMappings: Record<string, string>;
  validationRules: string[];
  defaultValues: Record<string, any>;
}

export interface DataLineageReport {
  entity: string;
  sourceSystems: string[];
  transformations: DataTransformation[];
  qualityMetrics: Record<string, number>;
  dependencies: string[];
}

export interface ArchaeologyReport {
  analysisSummary: AnalysisSummary;
  dataPatterns: DataPattern[];
  migrationStrategy: MigrationStrategy;
  recommendations: string[];
  riskAssessment: string[];
  dataQuality: string;
  feasibility: string;
}

export interface AnalysisSummary {
  totalEntities: number;
  totalProperties: number;
  totalRelationships: number;
  dataQualityScore: number;
  migrationComplexity: number;
  estimatedCost: number;
}

export interface LegacySystemAnalysis {
  entities: EntityInfo[];
  patterns: DataPattern[];
  strategy: MigrationStrategy;
  report: ArchaeologyReport;
}
