/**
 * @fileoverview Core TypeScript interfaces for all REFUSE Protocol entities
 * @description Defines the structure and relationships for all 16 entities
 * @version 1.0.0
 */

// Base entity interface
export interface BaseEntity {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;
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
}

// Facility entity
export interface Facility extends BaseEntity {
  name: string;
  code: string;
  type: 'landfill' | 'mrf' | 'transfer' | 'composter' | 'export' | 'cad' | 'incinerator' | 'recycling_center';
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
  serviceType: string;
  pricing: {
    baseRate: number;
    rateUnit: string;
    escalationClause?: number;
    fuelSurcharge?: number;
    environmentalFee?: number;
  };
  term: {
    startDate: string;
    endDate: string;
    renewalOptions?: number;
    noticePeriod?: number;
  };
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'draft';
  specialTerms?: string[];
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
  assignedTo?: string;
  currentLocation?: Address;
  rfidTag?: string;
  specifications?: Record<string, any>;
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

// MaterialTicket entity
export interface MaterialTicket extends BaseEntity {
  ticketNumber: string;
  sourceType: 'route' | 'order' | 'direct_dump';
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  materials: Array<{
    materialId: string;
    weight: number;
    percentage: number;
  }>;
  leedAllocations?: Array<{
    category: string;
    percentage: number;
    notes?: string;
  }>;
  facilityId?: string;
  routeId?: string;
  orderId?: string;
}

// Payment entity
export interface Payment extends BaseEntity {
  paymentNumber: string;
  customerId: string;
  invoiceId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'check' | 'ach' | 'credit_card' | 'cash' | 'other';
  status: 'pending' | 'processed' | 'failed' | 'cancelled';
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
}

// Event entity
export interface Event extends BaseEntity {
  entityType: 'customer' | 'service' | 'route' | 'facility' | 'customer_request';
  eventType: 'created' | 'updated' | 'completed' | 'cancelled';
  timestamp: Date;
  eventData: Record<string, any>;
  correlationId?: string;
  userId?: string;
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
