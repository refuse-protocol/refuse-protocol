# REFUSE Protocol Quickstart Guide

**Version**: 1.0.0 | **Updated**: 2025-09-24
**Audience**: Developers integrating with the REFUSE Protocol

## Welcome to REFUSE Protocol

REFUSE (REcyclable & Solid waste Unified Standard Exchange) is the first standardized data interchange format for waste management systems. This guide will help you get started with implementing REFUSE Protocol in your applications.

### What is REFUSE Protocol?

REFUSE Protocol normalizes billing, customer, service, and operational data across disparate legacy systems, enabling:
- **Universal Data Language**: Standardized schemas for all waste management data
- **Real-Time Integration**: Event-driven architecture for instant system communication
- **Legacy System Support**: Data archaeology capabilities for decades-old systems
- **Regulatory Compliance**: Built-in support for environmental and safety reporting

## Getting Started

### 1. Understand the Core Entities

The REFUSE Protocol defines comprehensive entities covering all aspects of waste management operations:

```typescript
// Organizational Structure
interface Territory {
  id: string;
  name: string;
  boundary: GeoBoundary;        // Geographic service areas
  pricingRules: PricingRule[];  // Territory-specific pricing
  assignedRoutes: string[];     // Routes in this territory
}

interface Yard {
  id: string;
  name: string;
  address: Address;             // Physical yard location
  assignedFleet: string[];      // Vehicles assigned to yard
  storedContainers: Container[]; // Containers stored here
}

// Customer & Site Management
interface Customer {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'industrial' | 'municipal';
  contracts: Contract[];        // Customer contracts
  sites: Site[];                // Multiple service locations
}

interface Site {
  id: string;
  customerId: string;
  name: string;                 // "Main Office", "Warehouse A", etc.
  address: Address;
  services: Service[];          // Services at this site
  containers: Container[];      // Containers at this site
  environmentalPermits: EnvironmentalPermit[];
}

// Service Operations
interface Service {
  id: string;
  customerId: string;
  siteId: string;
  serviceType: 'waste' | 'recycling' | 'organics' | 'hazardous' | 'bulk';
  containerType: 'cart' | 'dumpster' | 'bin' | 'rolloff' | 'compactor';
  schedule: ScheduleRule[];
  contractId?: string;          // Guaranteed pricing contract
}

interface Route {
  id: string;
  name: string;
  schedule: RouteSchedule;      // When route runs
  assignedSites: string[];      // Sites serviced by route
  assignedVehicle?: string;     // Assigned vehicle
  efficiency: number;           // Route efficiency percentage
  performanceMetrics: RoutePerformance;
}

// Materials & Scale Data
interface MaterialTicket {
  id: string;
  sourceType: 'route' | 'order' | 'direct_dump';
  grossWeight: number;          // Weight with material
  tareWeight: number;           // Weight without material
  netWeight: number;            // Calculated net weight
  materials: MaterialBreakdown[];
  leedAllocations: LeedAllocation[]; // Environmental compliance
}

// Fleet & Asset Management
interface Fleet {
  id: string;
  type: 'vehicle' | 'equipment' | 'container';
  make: string;
  model: string;
  status: 'active' | 'maintenance' | 'out_of_service';
  assignedTo?: string;          // Route or yard assignment
}

interface Container {
  id: string;
  type: 'cart' | 'dumpster' | 'bin' | 'rolloff' | 'compactor';
  size: string;
  assignedTo?: string;          // Site assignment
  currentLocation?: Address;    // GPS tracking
  rfidTag?: string;             // Asset tracking
}

// Facilities & Processing
interface Facility {
  id: string;
  name: string;
  type: 'landfill' | 'mrf' | 'transfer' | 'composter' | 'export' | 'cad';
  address: Address;
  acceptedMaterials: MaterialType[];
  operatingHours: OperatingHours;
  capacity: FacilityCapacity;   // Daily/monthly limits
  assignedRoutes: string[];     // Routes delivering here
}

interface CustomerRequest {
  id: string;
  requestNumber: string;
  type: 'new_service' | 'change_service' | 'one_time' | 'inquiry';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  customerId: string;
  serviceType: ServiceType;
  requestedDate: Date;
  approvalHistory: ApprovalStep[]; // Workflow tracking
  relatedServices?: string[];  // Services created from request
}

// Real-Time Events
interface Event {
  id: string;
  entityType: 'customer' | 'service' | 'route' | 'facility' | 'customer_request';
  eventType: 'created' | 'updated' | 'completed' | 'cancelled';
  timestamp: Date;
  eventData: EventData;         // Event-specific payload
}
```

### 2. Schema Validation

All REFUSE Protocol data should be validated against the official JSON Schemas:

```bash
# Download core schemas
curl -o customer-schema.json https://refuse-protocol.org/schemas/customer.json
curl -o service-schema.json https://refuse-protocol.org/schemas/service.json
curl -o event-schema.json https://refuse-protocol.org/schemas/event.json
curl -o territory-schema.json https://refuse-protocol.org/schemas/territory.json
curl -o route-schema.json https://refuse-protocol.org/schemas/route.json
curl -o material-ticket-schema.json https://refuse-protocol.org/schemas/material-ticket.json
curl -o contract-schema.json https://refuse-protocol.org/schemas/contract.json
curl -o fleet-schema.json https://refuse-protocol.org/schemas/fleet.json
curl -o container-schema.json https://refuse-protocol.org/schemas/container.json
curl -o facility-schema.json https://refuse-protocol.org/schemas/facility.json
curl -o customer-request-schema.json https://refuse-protocol.org/schemas/customer-request.json
```

### 3. Event Streaming Setup

REFUSE Protocol uses real-time event streaming for system integration:

```typescript
// Set up event consumer
const eventConsumer = new EventConsumer({
  endpoint: 'wss://api.refuse-protocol.org/events',
  apiKey: 'your-api-key',
  filters: {
    entityTypes: ['customer', 'service'],
    eventTypes: ['created', 'updated', 'completed']
  }
});

// Handle incoming events
eventConsumer.on('event', (event: Event) => {
  switch (event.entityType) {
    case 'customer':
      handleCustomerEvent(event);
      break;
    case 'service':
      handleServiceEvent(event);
      break;
    // ... handle other entity types
  }
});
```

## Implementation Examples

### Basic Customer Integration

```typescript
import { validate } from 'refuse-protocol-validator';

class CustomerIntegration {
  async createCustomer(customerData: Partial<Customer>) {
    // Validate against REFUSE schema
    const validCustomer = validate('customer', customerData);

    // Send to REFUSE Protocol endpoint
    const response = await fetch('https://api.refuse-protocol.org/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(validCustomer)
    });

    return await response.json();
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>) {
    const response = await fetch(`https://api.refuse-protocol.org/customers/${customerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(updates)
    });

    return await response.json();
  }
}
```

### Service Event Handling

```typescript
class ServiceEventHandler {
  async handleServiceCompleted(event: Event) {
    if (event.eventType !== 'completed') return;

    const serviceData = event.eventData.serviceCompleted;
    if (!serviceData) return;

    // Update your system with completion data
    await this.updateServiceStatus(event.entityId, {
      lastServiceDate: event.timestamp,
      driverId: serviceData.driverId,
      weight: serviceData.weight,
      volume: serviceData.volume
    });

    // Log any exceptions
    if (serviceData.exceptions && serviceData.exceptions.length > 0) {
      await this.logServiceExceptions(event.entityId, serviceData.exceptions);
    }
  }

  async handlePaymentReceived(event: Event) {
    if (event.eventType !== 'updated') return;

    const paymentData = event.eventData.paymentReceived;
    if (!paymentData) return;

    await this.processPayment({
      invoiceId: event.entityId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      referenceNumber: paymentData.referenceNumber
    });
  }
}
```

## API Reference

### Core Endpoints

#### Territories & Yards
```
GET    /territories            # List all territories
POST   /territories            # Create new territory
GET    /territories/{id}       # Get territory details
PUT    /territories/{id}       # Update territory
DELETE /territories/{id}       # Delete territory

GET    /yards                  # List all yards
POST   /yards                  # Create new yard
GET    /yards/{id}             # Get yard details
PUT    /yards/{id}             # Update yard
```

#### Customers & Sites
```
GET    /customers              # List all customers
POST   /customers              # Create new customer
GET    /customers/{id}         # Get customer details
PUT    /customers/{id}         # Update customer
DELETE /customers/{id}         # Delete customer

GET    /customers/{id}/sites   # Get customer sites
POST   /customers/{id}/sites   # Add site to customer
GET    /sites/{id}             # Get site details
PUT    /sites/{id}             # Update site
```

#### Services & Routes
```
GET    /services               # List all services
POST   /services               # Create new service
GET    /services/{id}          # Get service details
PUT    /services/{id}          # Update service
DELETE /services/{id}          # Delete service

GET    /routes                 # List all routes
POST   /routes                 # Create new route
GET    /routes/{id}            # Get route details
PUT    /routes/{id}            # Update route
GET    /routes/{id}/optimize  # Optimize route sequence
```

#### Materials & Scale Data
```
GET    /material-tickets       # List all material tickets
POST   /material-tickets       # Create new material ticket
GET    /material-tickets/{id}  # Get ticket details
PUT    /material-tickets/{id}  # Update ticket

GET    /materials              # List all materials
POST   /materials              # Create new material
GET    /materials/{id}         # Get material details
```

#### Fleet & Assets
```
GET    /fleet                  # List all fleet assets
POST   /fleet                  # Add new asset
GET    /fleet/{id}             # Get asset details
PUT    /fleet/{id}             # Update asset
DELETE /fleet/{id}             # Remove asset

GET    /containers             # List all containers
POST   /containers             # Add new container
GET    /containers/{id}        # Get container details
PUT    /containers/{id}        # Update container
```

#### Financial & Contracts
```
GET    /contracts              # List all contracts
POST   /contracts              # Create new contract
GET    /contracts/{id}         # Get contract details
PUT    /contracts/{id}         # Update contract

GET    /payments               # List all payments
POST   /payments               # Record new payment
GET    /payments/{id}          # Get payment details
```

#### Facilities & Customer Requests
```
GET    /facilities             # List all facilities
POST   /facilities             # Add new facility
GET    /facilities/{id}        # Get facility details
PUT    /facilities/{id}        # Update facility
DELETE /facilities/{id}        # Remove facility
GET    /facilities/{id}/routes # Routes delivering to facility

GET    /customer-requests      # List all customer requests
POST   /customer-requests      # Create new request
GET    /customer-requests/{id} # Get request details
PUT    /customer-requests/{id} # Update request
GET    /customers/{id}/requests # Customer's requests
```

#### Real-Time Events
```
GET    /events                 # List events (with filtering)
POST   /events                 # Create custom event
GET    /events/stream          # Real-time event stream (WebSocket)
GET    /events/types           # Available event types
```

### Authentication

REFUSE Protocol uses API key authentication:

```typescript
const headers = {
  'Authorization': `Bearer ${process.env.REFUSE_API_KEY}`,
  'Content-Type': 'application/json',
  'X-Source-System': 'your-system-name'  // Required for event tracking
};
```

## Data Transformation

### Legacy System Migration

REFUSE Protocol includes data archaeology capabilities for migrating from legacy systems:

```typescript
import { DataTransformer } from 'refuse-protocol-transformer';

class LegacyMigration {
  async migrateCustomerData(legacyData: any) {
    const transformer = new DataTransformer();

    // Transform legacy customer format to REFUSE standard
    const customer = transformer.transform('legacy-customer', legacyData, {
      fieldMapping: {
        'customer_number': 'externalIds',
        'customer_name': 'name',
        'service_address': 'serviceAddress'
      },
      dataArchaeology: true  // Preserve original field names in metadata
    });

    return await this.createCustomer(customer);
  }
}
```

### Schema Evolution

Handle schema changes gracefully:

```typescript
const schemaValidator = new SchemaValidator();

// Check for schema updates
const latestSchema = await schemaValidator.getLatestSchema('customer');

// Migrate existing data if needed
if (currentVersion < latestSchema.version) {
  await migrateCustomerData(existingCustomers, latestSchema);
}
```

## Error Handling

### Common Error Scenarios

```typescript
class ErrorHandler {
  async handleApiError(error: any) {
    switch (error.status) {
      case 400: // Validation error
        return this.handleValidationError(error);
      case 401: // Authentication error
        return this.refreshApiKey();
      case 409: // Conflict (concurrent modification)
        return this.handleConflict(error);
      case 429: // Rate limit exceeded
        return this.implementBackoff();
      default:
        return this.logAndRetry(error);
    }
  }

  async handleValidationError(error: any) {
    // Log specific validation failures
    console.error('Validation failed:', error.details);

    // Attempt to fix common issues
    if (error.code === 'INVALID_EMAIL') {
      return this.fixEmailFormat(error.field);
    }

    // Escalate to user for manual review
    return this.escalateToUser(error);
  }
}
```

## Testing Your Integration

### Protocol Conformance Testing

```typescript
import { ConformanceTester } from 'refuse-protocol-tester';

class IntegrationTester {
  async runConformanceTests() {
    const tester = new ConformanceTester({
      apiEndpoint: 'https://api.refuse-protocol.org',
      apiKey: process.env.REFUSE_API_KEY
    });

    const results = await tester.runAllTests();

    if (results.passed) {
      console.log('✅ All conformance tests passed');
    } else {
      console.log('❌ Some tests failed:', results.failures);
    }

    return results;
  }

  async testDataTransformation() {
    // Test legacy data transformation
    const legacyData = this.getLegacyTestData();
    const transformed = await this.transformer.transform('legacy-service', legacyData);

    // Validate against REFUSE schema
    const isValid = validate('service', transformed);

    return { transformed, isValid };
  }
}
```

## Best Practices

### 1. Event Processing
- Always process events asynchronously
- Implement idempotent event handlers
- Use correlation IDs to track related events
- Handle processing errors gracefully

### 2. Data Validation
- Validate all data against REFUSE schemas before submission
- Preserve original field names in metadata for data archaeology
- Implement optimistic concurrency control using version numbers

### 3. Error Recovery
- Implement exponential backoff for retry logic
- Log all errors with sufficient context for debugging
- Have fallback mechanisms for critical operations

### 4. Performance Optimization
- Batch operations when possible
- Use event streaming for real-time updates
- Implement caching for frequently accessed data
- Monitor API rate limits and usage

## Next Steps

1. **Review the full specification**: Read the complete REFUSE Protocol specification
2. **Explore examples**: Check out implementation examples in the repository
3. **Join the community**: Participate in the REFUSE Protocol developer community
4. **Contribute**: Help improve the protocol by submitting feedback and contributions

## Support

- **Documentation**: https://docs.refuse-protocol.org
- **Community Forum**: https://community.refuse-protocol.org
- **GitHub Issues**: https://github.com/refuse-protocol/issues
- **Email Support**: support@refuse-protocol.org

## Version History

- **v1.0.0** (2025-09-24): Initial release with core entities and event streaming
- **v0.9.0** (Pre-release): Beta testing with early adopters

---

*This quickstart guide is part of the REFUSE Protocol v1.0.0 specification. For the complete technical specification, see the protocol documentation.*
