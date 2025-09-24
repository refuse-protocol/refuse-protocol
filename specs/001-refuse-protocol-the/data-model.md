# Data Model: REFUSE Protocol Core Entities

**Status**: Updated with Industry Expertise | **Generated**: 2025-09-24 | **Enhanced**: 2025-09-24
**Source**: REFUSE Protocol Specification, Industry Research, and 20+ Years Waste Management Experience
**Purpose**: Define comprehensive data entities and relationships for complete waste management standardization

## Model Overview

The REFUSE Protocol data model provides a standardized representation of waste management operations, incorporating critical industry entities identified by domain experts. This comprehensive model addresses the complete operational lifecycle from customer onboarding through service delivery, billing, compliance, and fleet management.

### Design Principles
- **Complete Industry Coverage**: All major waste management business entities included
- **Regulatory Compliance**: Built-in support for environmental, safety, and financial reporting
- **Real-World Operations**: Reflects actual hauler workflows and business processes
- **Legacy Integration**: Flexible schema evolution for data archaeology across decades-old systems
- **Real-Time Operations**: Event-driven architecture support for operational visibility
- **Scalable Architecture**: Supports enterprise-scale operations with complex relationships
- **LEED & Sustainability**: Built-in support for environmental compliance and reporting

## Core Entity Categories

### 1. Organizational Structure
**Purpose**: Define how haulers organize their service areas, facilities, and operational boundaries

#### Territory Entity
```typescript
interface Territory {
  // Core identification
  id: string;                       // Unique territory identifier
  externalIds: string[];            // Legacy system territory IDs

  // Basic information
  name: string;                     // Territory name (e.g., "North County", "Downtown")
  code: string;                     // Territory code for reporting
  type: TerritoryType;              // geographic | municipal | commercial | custom
  status: TerritoryStatus;          // active | inactive | planned

  // Geographic boundaries
  boundary: GeoBoundary;            // Geographic service area boundary
  zipCodes: string[];               // ZIP codes covered by territory
  municipalities: string[];         // Municipalities/jurisdictions covered

  // Pricing and service rules
  pricingRules: PricingRule[];      // Territory-specific pricing
  serviceRestrictions: ServiceRestriction[]; // Service limitations
  regulatoryZones: RegulatoryZone[]; // Environmental/safety zones

  // Operational details
  assignedRoutes: string[];         // Route IDs assigned to this territory
  serviceDays: ServiceDay[];        // Days when service is provided
  holidaySchedule: HolidaySchedule; // Holiday service adjustments

  // Performance metrics
  serviceLevel: ServiceLevel;       // Target service quality metrics
  utilization: UtilizationMetrics;  // Territory utilization statistics

  // Metadata
  metadata: {[key: string]: any};   // Extensible metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

#### Yard Entity
```typescript
interface Yard {
  // Core identification
  id: string;                       // Unique yard identifier
  externalIds: string[];            // Legacy system yard IDs

  // Basic information
  name: string;                     // Yard name
  code: string;                     // Yard code for operations
  type: YardType;                   // main | satellite | transfer | storage
  status: YardStatus;               // operational | maintenance | closed | planned

  // Location and facilities
  address: Address;                 // Physical yard location
  facilities: Facility[];           // Buildings and structures
  capacity: CapacityMetrics;        // Storage and operational capacity

  // Operations
  operatingHours: OperatingHours;    // Hours of operation
  assignedFleet: string[];          // Vehicle IDs assigned to this yard
  storedContainers: Container[];    // Containers stored at this yard
  serviceAreas: string[];           // Territories served from this yard

  // Safety and compliance
  safetyEquipment: SafetyEquipment[]; // Safety facilities and equipment
  environmentalControls: EnvironmentalControl[]; // Environmental protection measures

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### 2. Customer & Site Management
**Purpose**: Manage customer relationships and their physical service locations

#### Customer Entity
```typescript
interface Customer {
  // Core identification
  id: string;                       // Unique customer identifier
  externalIds: string[];            // Legacy system customer IDs

  // Basic information
  name: string;                     // Legal business/customer name
  type: CustomerType;               // residential | commercial | industrial | municipal
  status: CustomerStatus;           // active | inactive | suspended | pending
  taxId?: string;                   // Tax identification number
  creditRating?: CreditRating;      // Credit and payment history

  // Contact information
  primaryContact: Contact;          // Primary business contact
  billingContact: Contact;          // Billing contact (if different)
  operationalContacts: Contact[];   // Operational contacts

  // Business details
  industry: string;                 // Industry classification
  employeeCount?: number;           // Number of employees
  annualRevenue?: number;           // Annual revenue range
  businessHours: OperatingHours;    // Customer business hours

  // Contracts and pricing
  contracts: Contract[];            // Active customer contracts
  pricingTiers: PricingTier[];      // Customer-specific pricing
  paymentTerms: PaymentTerms;       // Payment terms and conditions

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

#### Site Entity
```typescript
interface Site {
  // Core identification
  id: string;                       // Unique site identifier
  customerId: string;               // Reference to customer
  externalIds: string[];            // Legacy system site IDs

  // Basic information
  name: string;                     // Site name (e.g., "Main Office", "Warehouse A")
  type: SiteType;                   // office | warehouse | retail | manufacturing | etc
  status: SiteStatus;               // active | inactive | seasonal | temporary

  // Location
  address: Address;                 // Physical site address
  serviceInstructions: string;      // Delivery and service instructions
  accessRestrictions: AccessRestriction[]; // Gate codes, access requirements

  // Services and containers
  services: Service[];              // Services provided at this site
  containers: Container[];          // Containers located at this site
  containerPlacements: ContainerPlacement[]; // Where containers are placed

  // Operational details
  serviceSchedule: ServiceSchedule; // When services are performed
  specialHandling: SpecialHandling[]; // Special service requirements
  siteContacts: SiteContact[];      // Site-specific contacts

  // Environmental compliance
  environmentalPermits: EnvironmentalPermit[]; // Site-specific permits
  leedAllocations: LeedAllocation[]; // LEED compliance allocations

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### 3. Service Operations
**Purpose**: Manage service delivery, scheduling, and operational workflows

#### Service Entity
```typescript
interface Service {
  // Core identification
  id: string;                       // Unique service identifier
  customerId: string;               // Reference to customer
  siteId: string;                   // Reference to service site
  externalIds: string[];            // Legacy system service IDs

  // Service specification
  serviceType: ServiceType;         // waste | recycling | organics | hazardous | bulk
  materialTypes: MaterialType[];    // Types of materials collected
  frequency: ServiceFrequency;      // weekly | biweekly | monthly | oncall | custom
  containerType: ContainerType;     // cart | dumpster | bin | rolloff | compactor
  containerSize: string;            // 96_gallon | 2_yard | 30_yard | etc

  // Scheduling
  schedule: ScheduleRule[];         // Service schedule rules
  nextServiceDate: Date;            // Next scheduled service
  lastServiceDate?: Date;           // Last completed service

  // Pricing
  pricing: ServicePricing;          // Base pricing and adjustments
  contractId?: string;              // Associated contract for guaranteed pricing

  // Operational status
  status: ServiceStatus;            // active | suspended | cancelled | pending
  priority: ServicePriority;        // Service priority level
  specialInstructions: string;      // Driver instructions and safety notes

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

#### Route Entity
```typescript
interface Route {
  // Core identification
  id: string;                       // Unique route identifier
  externalIds: string[];            // Legacy system route IDs

  // Basic information
  name: string;                     // Route name (e.g., "Residential Monday")
  code: string;                     // Route code for operations
  type: RouteType;                  // residential | commercial | mixed | special
  status: RouteStatus;              // active | inactive | planned | completed

  // Schedule and timing
  schedule: RouteSchedule;          // When route runs and duration
  estimatedDuration: number;        // Estimated route completion time (minutes)
  actualDuration?: number;          // Actual completion time when finished

  // Service assignments
  assignedSites: string[];          // Site IDs on this route
  assignedServices: string[];       // Service IDs on this route
  serviceSequence: ServiceSequence[]; // Order of service stops

  // Fleet assignment
  assignedVehicle?: string;         // Vehicle ID assigned to route
  assignedDriver?: string;          // Driver ID assigned to route

  // Performance metrics
  plannedStops: number;             // Number of planned stops
  actualStops?: number;             // Number of actual stops completed
  efficiency: number;               // Route efficiency percentage

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

#### Order/Job Entity
```typescript
interface Order {
  // Core identification
  id: string;                       // Unique order identifier
  externalIds: string[];            // Legacy system order IDs

  // Basic information
  type: OrderType;                  // scheduled | emergency | special | maintenance
  status: OrderStatus;              // pending | scheduled | in_progress | completed | cancelled
  priority: OrderPriority;          // low | normal | high | critical

  // Customer and location
  customerId: string;               // Customer requesting service
  siteId: string;                   // Site where work needs to be done
  requestedBy: string;              // Person requesting the order

  // Service details
  serviceType: ServiceType;         // Type of service needed
  materialTypes: MaterialType[];    // Materials to be collected
  containerType?: ContainerType;    // Container needed (if applicable)
  estimatedQuantity: Quantity;      // Estimated volume/weight

  // Scheduling
  requestedDate: Date;              // When customer wants service
  scheduledDate?: Date;             // When hauler scheduled service
  actualStartTime?: Date;           // When work actually started
  actualEndTime?: Date;             // When work was completed

  // Fleet and crew
  assignedVehicle?: string;         // Vehicle assigned to order
  assignedCrew: string[];           // Crew member IDs assigned
  equipmentNeeded: Equipment[];     // Special equipment required

  // Pricing and billing
  pricing: OrderPricing;            // Order-specific pricing
  billable: boolean;                // Whether this order is billable

  // Completion details
  completionNotes?: string;         // Notes from crew about completion
  exceptions?: Exception[];         // Any issues encountered
  photos?: Photo[];                 // Photos from job completion
  materialsCollected?: MaterialTicket[]; // Scale tickets and material data

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### 4. Materials & Scale Data
**Purpose**: Track material collection, weights, and environmental compliance data

#### Material Entity
```typescript
interface Material {
  // Core identification
  id: string;                       // Unique material identifier
  externalIds: string[];            // Legacy system material IDs

  // Material details
  name: string;                     // Material name (e.g., "Mixed Paper", "Aluminum Cans")
  code: string;                     // Material code for sorting
  category: MaterialCategory;       // paper | plastic | metal | glass | organic | hazardous
  subcategory: string;              // Specific material classification

  // Physical properties
  weightPerCubicYard?: number;      // Weight per cubic yard
  volumePerTon?: number;            // Volume per ton
  recyclable: boolean;              // Whether material is recyclable
  hazardous: boolean;               // Whether material is hazardous

  // Processing requirements
  processingMethod: ProcessingMethod; // sorting | baling | shredding | etc
  marketValue?: number;             // Current market value per ton
  marketPriceDate?: Date;           // When market price was last updated

  // Environmental compliance
  leedCategory: LeedCategory;       // LEED classification for reporting
  recyclingRate?: number;           // Recycling rate percentage
  contaminationRate?: number;       // Contamination rate percentage

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

#### MaterialTicket Entity
```typescript
interface MaterialTicket {
  // Core identification
  id: string;                       // Unique ticket identifier
  externalIds: string[];            // Legacy system ticket IDs

  // Source information
  sourceType: TicketSourceType;     // route | order | direct_dump | transfer
  sourceId: string;                 // ID of route, order, or facility
  ticketNumber: string;             // Human-readable ticket number

  // Collection details
  collectionDate: Date;             // When material was collected
  collectionLocation: Address;      // Where material was collected
  haulerId: string;                 // Hauler company identifier
  driverId: string;                 // Driver who collected material

  // Vehicle and equipment
  vehicleId: string;                // Vehicle used for collection
  scaleId?: string;                 // Scale used for weighing
  grossWeight: number;              // Weight with material (lbs)
  tareWeight: number;               // Weight without material (lbs)
  netWeight: number;                // Calculated net weight (lbs)

  // Material breakdown
  materials: MaterialBreakdown[];   // Detailed material composition

  // Pricing and settlement
  pricing: TicketPricing;           // Material pricing at time of collection
  settlementStatus: SettlementStatus; // pending | settled | disputed
  settlementDate?: Date;            // When ticket was settled

  // Environmental compliance
  leedAllocations: LeedAllocation[]; // LEED compliance allocations
  environmentalCertificates: EnvironmentalCertificate[]; // Environmental certifications

  // Quality and validation
  qualityGrade?: QualityGrade;      // Material quality assessment
  contaminationNotes?: string;      // Notes about material quality
  photos?: Photo[];                 // Photos of material load

  // Processing
  processingStatus: ProcessingStatus; // received | sorted | processed | shipped
  processingFacilityId?: string;    // Where material was processed
  processedDate?: Date;             // When processing was completed

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### 5. Contracts & Pricing
**Purpose**: Manage customer contracts, pricing tiers, and financial agreements

#### Contract Entity
```typescript
interface Contract {
  // Core identification
  id: string;                       // Unique contract identifier
  customerId: string;               // Customer this contract is with
  externalIds: string[];            // Legacy system contract IDs

  // Basic information
  contractNumber: string;           // Human-readable contract number
  type: ContractType;               // service | pricing | master | amendment
  status: ContractStatus;           // draft | active | expired | terminated | renewed

  // Dates
  effectiveDate: Date;              // When contract becomes effective
  expirationDate: Date;             // Contract expiration date
  signedDate?: Date;                // When contract was signed
  terminationDate?: Date;           // If contract was terminated

  // Terms and conditions
  serviceTerms: ServiceTerm[];      // Services covered by contract
  pricingTerms: PricingTerm[];      // Pricing guarantees
  paymentTerms: PaymentTerms;       // Payment terms and conditions
  renewalTerms: RenewalTerms;       // Auto-renewal and notification terms

  // Financial details
  contractValue: number;            // Total contract value
  guaranteedMinimum?: number;       // Minimum billing commitment
  volumeCommitments?: VolumeCommitment[]; // Volume guarantees

  // Approval and signatures
  internalApprover: string;         // Internal approver name
  customerApprover?: string;        // Customer approver name
  approvalDate?: Date;              // Approval date

  // Amendments and changes
  parentContractId?: string;        // If this is an amendment
  amendments: Amendment[];          // Contract amendments
  changeHistory: ContractChange[];  // History of changes

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### 6. Fleet & Asset Management
**Purpose**: Manage vehicles, equipment, containers, and other operational assets

#### Fleet Entity
```typescript
interface Fleet {
  // Core identification
  id: string;                       // Unique fleet identifier
  externalIds: string[];            // Legacy system fleet IDs

  // Basic information
  name: string;                     // Fleet name
  type: FleetType;                  // vehicle | equipment | container | facility
  category: FleetCategory;          // trucks | trailers | containers | facilities

  // Specifications
  make: string;                     // Manufacturer
  model: string;                    // Model name/number
  year: number;                     // Model year
  vin?: string;                     // Vehicle identification number
  serialNumber?: string;            // Equipment serial number

  // Operational details
  status: FleetStatus;              // active | maintenance | out_of_service | retired
  assignedTo?: string;              // Route, driver, or yard assignment
  currentLocation?: Address;        // Current location (GPS tracked)

  // Maintenance and compliance
  maintenanceSchedule: MaintenanceSchedule; // Preventive maintenance
  lastMaintenanceDate?: Date;       // Last maintenance performed
  nextMaintenanceDate?: Date;       // Next scheduled maintenance
  complianceRecords: ComplianceRecord[]; // Regulatory compliance

  // Utilization and performance
  utilization: UtilizationMetrics;  // Usage and efficiency metrics
  fuelEfficiency?: FuelEfficiency;  // Fuel consumption data
  operatingCosts: OperatingCost[];  // Maintenance and operating costs

  // Specifications
  capacity?: Capacity;              // Load capacity, volume, etc
  dimensions?: Dimensions;          // Physical dimensions
  features: string[];               // Special features or equipment

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

#### Container Entity
```typescript
interface Container {
  // Core identification
  id: string;                       // Unique container identifier
  externalIds: string[];            // Legacy system container IDs

  // Basic information
  name: string;                     // Container name/tag
  type: ContainerType;              // cart | dumpster | bin | rolloff | compactor
  size: string;                     // 96_gallon | 2_yard | 30_yard | etc
  material: ContainerMaterial;      // plastic | metal | composite

  // Ownership and assignment
  ownerType: OwnerType;             // company_owned | customer_owned | leased
  assignedTo?: string;              // Customer or site assignment
  currentLocation?: Address;        // Current location

  // Physical specifications
  dimensions: Dimensions;           // Physical size and weight
  capacity: Capacity;               // Volume and weight capacity
  features: ContainerFeature[];     // Wheels, lids, locks, etc

  // Operational status
  status: ContainerStatus;          // in_service | damaged | lost | retired
  condition: ContainerCondition;    // excellent | good | fair | poor
  lastInspectionDate?: Date;        // Last inspection date

  // Maintenance history
  maintenanceHistory: MaintenanceRecord[]; // Maintenance and repairs
  cleaningSchedule: CleaningSchedule; // Cleaning and sanitization

  // Tracking
  rfidTag?: string;                 // RFID tracking tag
  barcode?: string;                 // Barcode for scanning
  gpsTracker?: string;              // GPS tracking device

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

#### Facility Entity
```typescript
interface Facility {
  // Core identification
  id: string;                       // Unique facility identifier
  externalIds: string[];            // Legacy system facility IDs

  // Basic information
  name: string;                     // Facility name
  code: string;                     // Facility code for operations
  type: FacilityType;               // landfill | mrf | transfer | composter | export | cad
  status: FacilityStatus;           // operational | maintenance | closed | planned

  // Location and operations
  address: Address;                 // Physical facility location
  contactInformation: Contact;      // Facility contact details
  operatingHours: OperatingHours;    // Hours of operation
  capacity: FacilityCapacity;       // Daily/monthly capacity limits

  // Services and pricing
  acceptedMaterials: MaterialType[]; // Materials accepted at this facility
  pricing: FacilityPricing;         // Tipping fees and pricing structure
  serviceRestrictions: ServiceRestriction[]; // Operational limitations

  // Regulatory compliance
  permits: FacilityPermit[];        // Operating permits and licenses
  environmentalControls: EnvironmentalControl[]; // Emission controls, monitoring
  complianceRecords: ComplianceRecord[]; // Regulatory compliance history

  // Performance and metrics
  utilization: UtilizationMetrics;   // Usage and efficiency metrics
  processingRates: ProcessingRate[]; // Material processing capabilities
  qualityStandards: QualityStandard[]; // Quality requirements for incoming materials

  // Relationships
  assignedRoutes: string[];         // Routes that deliver to this facility
  materialTickets: string[];        // Material tickets processed at this facility

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

#### CustomerRequest Entity
```typescript
interface CustomerRequest {
  // Core identification
  id: string;                       // Unique request identifier
  externalIds: string[];            // Legacy system request IDs

  // Basic information
  requestNumber: string;            // Human-readable request number
  type: RequestType;                // new_service | change_service | one_time | inquiry
  status: RequestStatus;            // pending | in_review | approved | rejected | completed
  priority: RequestPriority;        // low | normal | high | urgent

  // Customer context
  customerId: string;               // Customer making the request
  siteId?: string;                  // Site for the request (if applicable)
  requestedBy: string;              // Person making the request
  contactInformation: Contact;      // Contact for this request

  // Request details
  serviceType: ServiceType;         // Type of service requested
  materialTypes: MaterialType[];    // Materials involved
  containerType?: ContainerType;    // Container requirements
  containerSize?: string;           // Container size needed

  // Scheduling
  requestedDate: Date;              // When customer wants service
  preferredTimeSlot?: TimeSlot;     // Preferred time window
  frequency?: ServiceFrequency;     // How often service is needed

  // Location and logistics
  serviceAddress: Address;          // Where service should be provided
  accessInstructions?: string;      // Special access requirements
  specialHandling?: string;         // Special handling needs

  // Pricing and contracts
  estimatedPricing?: RequestPricing; // Estimated costs
  contractReference?: string;       // If related to existing contract
  budgetApprovalRequired: boolean;  // Whether budget approval is needed

  // Approval workflow
  assignedTo?: string;              // User assigned to review request
  reviewNotes?: string[];           // Review comments and notes
  approvalHistory: ApprovalStep[];  // Approval workflow history

  // Fulfillment
  fulfillmentStatus: FulfillmentStatus; // pending | scheduled | in_progress | completed
  scheduledDate?: Date;             // When request is scheduled for completion
  completedDate?: Date;             // When request was actually completed
  completionNotes?: string;         // Notes from completion

  // Related entities
  relatedServices?: string[];       // Services created from this request
  relatedOrders?: string[];         // Orders created from this request
  relatedQuotes?: string[];         // Quotes provided for this request

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### 7. Financial Management
**Purpose**: Track payments, billing, and financial transactions

#### Payment Entity
```typescript
interface Payment {
  // Core identification
  id: string;                       // Unique payment identifier
  customerId: string;               // Customer who made payment
  invoiceId?: string;               // Associated invoice (if applicable)
  externalIds: string[];            // Legacy system payment IDs

  // Payment details
  amount: number;                   // Payment amount
  paymentDate: Date;                // When payment was received
  paymentMethod: PaymentMethod;     // cash | check | credit_card | ach | wire
  referenceNumber: string;          // Check number, transaction ID, etc

  // Processing details
  processingStatus: PaymentStatus;  // pending | processed | failed | refunded
  processedBy: string;              // User who processed payment
  processingDate?: Date;            // When payment was processed

  // Bank and transaction details
  bankReference?: string;           // Bank transaction reference
  merchantId?: string;              // Payment processor merchant ID
  authorizationCode?: string;       // Payment authorization code

  // Adjustments and refunds
  adjustments?: PaymentAdjustment[]; // Partial refunds or adjustments
  relatedPayments?: string[];       // Related payment IDs (refunds, etc)

  // Reconciliation
  reconciled: boolean;              // Whether payment is reconciled
  reconciledDate?: Date;            // Reconciliation date
  reconciliationNotes?: string;     // Reconciliation notes

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### 8. Compliance & Environmental
**Purpose**: Track regulatory compliance, environmental impact, and sustainability metrics

#### Allocation Entity
```typescript
interface Allocation {
  // Core identification
  id: string;                       // Unique allocation identifier
  materialTicketId: string;         // Associated material ticket
  externalIds: string[];            // Legacy system allocation IDs

  // Allocation details
  allocationType: AllocationType;   // leed | environmental | carbon_credit | etc
  customerId: string;               // Customer receiving allocation
  siteId?: string;                  // Site receiving allocation (if applicable)

  // LEED and sustainability
  leedCategory: LeedCategory;       // LEED point category
  leedPoints: number;               // LEED points allocated
  certificationYear: number;        // Year for certification
  certificationBody?: string;       // Certifying organization

  // Environmental impact
  carbonCredits?: number;           // Carbon credits generated
  environmentalBenefit: EnvironmentalBenefit; // Environmental benefits

  // Verification and audit
  verificationStatus: VerificationStatus; // pending | verified | rejected
  verificationDate?: Date;          // Verification completion date
  verifier?: string;                // Verifying organization
  auditTrail: AuditEvent[];         // Allocation audit history

  // Documentation
  supportingDocuments: Document[];  // Supporting documentation
  notes?: string;                   // Allocation notes

  // Financial settlement
  allocationValue?: number;         // Monetary value of allocation
  settlementStatus: SettlementStatus; // pending | settled | disputed
  settlementDate?: Date;            // Settlement date

  // Metadata
  metadata: {[key: string]: any};
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

## Entity Relationships

### Core Operational Relationships
```
Customer (1) ─── (many) ── Site
Customer (1) ─── (many) ── Service
Customer (1) ─── (many) ── Contract
Customer (1) ─── (many) ── Payment
Customer (1) ─── (many) ── Invoice
Customer (1) ─── (many) ── CustomerRequest

Site (1) ─── (many) ── Service
Site (1) ─── (many) ── Container
Site (1) ─── (many) ── Order
Site (1) ─── (many) ── CustomerRequest

Service (1) ─── (many) ── Route
Service (1) ─── (many) ── Schedule
Service (1) ─── (many) ── Order
Service (1) ─── (many) ── Contract (guaranteed pricing)

Route (1) ─── (many) ── MaterialTicket
Route (1) ─── (many) ── Order
Route (many) ─── (many) ── Facility (delivery destinations)

Order (1) ─── (many) ── MaterialTicket
Order (1) ─── (1) ── Fleet (assigned vehicle)
Order (1) ─── (many) ── CustomerRequest (created from requests)

MaterialTicket (1) ─── (many) ── Allocation
MaterialTicket (1) ─── (many) ── MaterialBreakdown
MaterialTicket (many) ─── (many) ── Facility (processing location)

Facility (1) ─── (many) ── MaterialTicket (processed materials)
Facility (many) ─── (many) ── Route (delivery routes)
Facility (1) ─── (many) ── FacilityPermit
Facility (1) ─── (many) ── EnvironmentalControl

Fleet (many) ─── (many) ── Yard (storage location)
Fleet (many) ─── (many) ── Container (assigned equipment)
Fleet (1) ─── (many) ── MaintenanceRecord

Container (many) ─── (many) ── Site (placement location)
Container (1) ─── (many) ── MaintenanceRecord
Container (many) ─── (many) ── Fleet (assigned vehicles)
```

### Event-Driven Relationships
```
Entity ─── (many) ── Event ─── (1) ── EventData
All Core Entities ─── (many) ── ComplianceRecord
Customer/Site ─── (many) ── EnvironmentalPermit
Contract ─── (many) ── Amendment
Payment ─── (many) ── PaymentAdjustment
```

## Supporting Types and Enumerations

### Territory and Geographic Types
```typescript
type TerritoryType = 'geographic' | 'municipal' | 'commercial' | 'custom';
type TerritoryStatus = 'active' | 'inactive' | 'planned';
type YardType = 'main' | 'satellite' | 'transfer' | 'storage';
type YardStatus = 'operational' | 'maintenance' | 'closed' | 'planned';

interface GeoBoundary {
  type: 'polygon' | 'circle' | 'rectangle';
  coordinates: number[][][];        // GeoJSON coordinate format
  centerPoint?: GeoLocation;
  radius?: number;                  // For circular boundaries
}
```

### Customer and Site Types
```typescript
type CustomerType = 'residential' | 'commercial' | 'industrial' | 'municipal' | 'government';
type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'prospect';
type SiteType = 'office' | 'warehouse' | 'retail' | 'manufacturing' | 'construction' | 'other';
type SiteStatus = 'active' | 'inactive' | 'seasonal' | 'temporary';
```

### Service and Operations Types
```typescript
type ServiceType = 'waste' | 'recycling' | 'organics' | 'hazardous' | 'bulk' | 'special';
type ContainerType = 'cart' | 'dumpster' | 'bin' | 'rolloff' | 'compactor' | 'trailer';
type ServiceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'oncall' | 'custom' | 'one_time';
type ServiceStatus = 'active' | 'suspended' | 'cancelled' | 'pending' | 'completed';
type ServicePriority = 'low' | 'normal' | 'high' | 'rush';

type RouteType = 'residential' | 'commercial' | 'mixed' | 'special' | 'transfer';
type RouteStatus = 'active' | 'inactive' | 'planned' | 'completed';

type OrderType = 'scheduled' | 'emergency' | 'special' | 'maintenance' | 'relocation';
type OrderStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
type OrderPriority = 'low' | 'normal' | 'high' | 'critical';
```

### Materials and Environmental Types
```typescript
type MaterialCategory = 'paper' | 'plastic' | 'metal' | 'glass' | 'organic' | 'hazardous' | 'other';
type ProcessingMethod = 'sorting' | 'baling' | 'shredding' | 'composting' | 'incineration' | 'landfill';
type LeedCategory = 'materials_reuse' | 'recycled_content' | 'regional_materials' | 'rapidly_renewable' | 'certified_wood';

type AllocationType = 'leed' | 'environmental' | 'carbon_credit' | 'sustainability' | 'compliance';
type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';
```

### Fleet and Equipment Types
```typescript
type FleetType = 'vehicle' | 'equipment' | 'container' | 'facility';
type FleetCategory = 'trucks' | 'trailers' | 'containers' | 'facilities' | 'other';
type FleetStatus = 'active' | 'maintenance' | 'out_of_service' | 'retired';

type ContainerMaterial = 'plastic' | 'metal' | 'composite' | 'wood';
type ContainerStatus = 'in_service' | 'damaged' | 'lost' | 'retired' | 'maintenance';
type ContainerCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

type OwnerType = 'company_owned' | 'customer_owned' | 'leased' | 'rented';
```

### Facility and Request Types
```typescript
type FacilityType = 'landfill' | 'mrf' | 'transfer' | 'composter' | 'export' | 'cad' | 'incinerator' | 'recycling_center';
type FacilityStatus = 'operational' | 'maintenance' | 'closed' | 'planned' | 'limited';

type RequestType = 'new_service' | 'change_service' | 'one_time' | 'inquiry' | 'complaint' | 'cancellation';
type RequestStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed' | 'cancelled';
type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';

type FulfillmentStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'on_hold';

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'weekend' | 'any';
```

### Financial and Contract Types
```typescript
type ContractType = 'service' | 'pricing' | 'master' | 'amendment' | 'addendum';
type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'renewed' | 'pending_approval';

type PaymentMethod = 'cash' | 'check' | 'credit_card' | 'ach' | 'wire' | 'online' | 'auto_pay';
type PaymentStatus = 'pending' | 'processed' | 'failed' | 'refunded' | 'disputed';

type SettlementStatus = 'pending' | 'settled' | 'disputed' | 'partial' | 'cancelled';
type ProcessingStatus = 'received' | 'sorted' | 'processed' | 'shipped' | 'delivered';
```

This comprehensive data model now covers all the essential entities in waste management operations as identified by industry experts with 20+ years of experience. The model supports:

- **Complete operational coverage** from customer management to fleet operations
- **Regulatory compliance** including environmental, safety, and financial reporting
- **Real-time operations** with event-driven architecture
- **Legacy system integration** with data archaeology capabilities
- **Scalability** for enterprise-level operations
- **Extensibility** for future industry requirements

## Data Validation Rules

### Identity & Uniqueness
- Customer IDs must be unique across all systems
- Service IDs must be unique per customer
- Invoice numbers must be unique per customer
- Event IDs must be globally unique (UUID)
- Route codes must be unique within a territory
- Container tracking numbers must be unique
- Material ticket numbers must be unique per day

### Referential Integrity
- All foreign key references must be valid
- Orphaned records must be handled gracefully
- Cascade operations for entity deletion
- Territory boundaries must be valid geographic areas
- Service schedules must align with route assignments

### Business Rules
- Service frequency must align with container type capacity
- Invoice totals must equal sum of line items + taxes + fees - discounts
- Compliance records must have valid review dates
- Event timestamps must be monotonically increasing
- Route efficiency must be calculated based on actual vs planned stops
- Container capacity must not exceed vehicle limits
- Material weights must be realistic for container sizes
- Payment amounts must match invoice totals (with adjustments)

## Performance Considerations

### Indexing Strategy
- Primary keys and foreign keys indexed
- Event timestamps for time-series queries
- Customer status and service status for operational queries
- Compliance review dates for regulatory reporting
- Route schedules for daily operations
- Container locations for asset tracking
- Material ticket dates for settlement processing

### Partitioning Strategy
- Customer data partitioned by territory
- Events partitioned by timestamp and entity type
- Material tickets partitioned by collection date
- Historical data archived after regulatory retention periods
- Large datasets distributed across geographic regions

## Security & Privacy

### Data Classification
- **Public**: Geographic boundaries, service types, container specifications
- **Internal**: Operational schedules, route assignments, fleet utilization
- **Sensitive**: Customer PII, contract terms, pricing information
- **Restricted**: Payment details, compliance violations, environmental permits

### Access Control
- Role-based access to entities and fields
- Field-level encryption for sensitive data
- Audit logging for all data access
- Geographic access restrictions for territory-based data
- Customer data isolation for multi-tenant systems

## Extensibility Framework

### Metadata Support
All entities support extensible metadata for system-specific requirements:
```typescript
metadata: {
  // System-specific fields
  legacySystemId: string;
  customField1: string;
  customField2: number;

  // Integration flags
  syncStatus: 'pending' | 'synced' | 'failed';
  lastSyncDate: Date;
  sourceSystem: string;

  // Data archaeology
  originalFieldNames: string[];
  transformationNotes: string;
  dataQualityScore: number;
}
```

### Version Evolution
- Schema versioning for backward compatibility
- Migration paths for data transformation
- Deprecated field handling with transition periods
- Additive-only changes for major versions

## Implementation Considerations

### Event-Driven Architecture
- All entity changes generate events for real-time processing
- Event correlation for tracking related operations
- Event sourcing for audit trails and debugging
- Event filtering for performance optimization

### Data Archaeology
- Legacy field name preservation in metadata
- Data quality scoring and validation
- Transformation history tracking
- Fallback mechanisms for missing data

### Regulatory Compliance
- Built-in compliance checking for all operations
- Automated reporting data aggregation
- Audit trail maintenance for compliance periods
- Environmental impact calculations and tracking

This comprehensive data model transforms the REFUSE Protocol from a basic data exchange standard into a complete operational platform that addresses all aspects of waste management operations as practiced by industry professionals.
