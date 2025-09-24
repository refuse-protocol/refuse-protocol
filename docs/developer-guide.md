# REFUSE Protocol Developer Guide

## Welcome to the REFUSE Protocol

The REFUSE Protocol is a comprehensive, open-source platform for waste management data exchange. This guide will help you get started with developing applications using the REFUSE Protocol, whether you're building integrations, creating new tools, or contributing to the core protocol.

## What You'll Learn

- How to set up your development environment
- Understanding the protocol architecture
- Creating your first REFUSE Protocol application
- Best practices for development
- Testing and debugging strategies
- Contributing to the project

---

## 1. Getting Started

### 1.1 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **TypeScript** (v4.9 or later) - [Installation Guide](https://www.typescriptlang.org/download)
- **Git** - [Download](https://git-scm.com/downloads)
- **A code editor** (VS Code, WebStorm, etc.)

### 1.2 Setting Up Your Development Environment

#### Step 1: Clone the Repository

```bash
git clone https://github.com/refuse-protocol/refuse-protocol.git
cd refuse-protocol
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Build the Project

```bash
npm run build
```

#### Step 4: Run Tests

```bash
npm test
```

### 1.3 Project Structure

```
refuse-protocol/
├── protocol/                    # Core protocol implementation
│   ├── implementations/         # Entity implementations
│   │   ├── customer.ts         # Customer entity
│   │   ├── service.ts          # Service entity
│   │   ├── route.ts            # Route entity
│   │   ├── facility.ts         # Facility entity
│   │   ├── material-ticket.ts  # Material ticket entity
│   │   ├── contract.ts         # Contract entity
│   │   ├── payment.ts          # Payment entity
│   │   └── common.ts           # Shared utilities
│   ├── specifications/         # Protocol specifications
│   │   ├── entities.ts         # Entity definitions
│   │   └── schemas/            # JSON schemas
│   └── tools/                  # Development tools
├── specs/                      # Feature specifications
├── tests/                      # Test suites
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   ├── load/                   # Load tests
│   └── performance/            # Performance tests
├── examples/                   # Example applications
├── docs/                       # Documentation
├── tools/                      # CLI tools and utilities
└── contracts/                  # JSON Schema contracts
```

---

## 2. Understanding the Protocol

### 2.1 Core Concepts

#### Entities
The REFUSE Protocol defines several core entities:

- **Customer**: Organizations or individuals receiving waste services
- **Service**: Specific waste collection or processing services
- **Route**: Collection routes with assigned stops and schedules
- **Facility**: Processing facilities (MRFs, landfills, transfer stations)
- **Material Ticket**: Records of collected materials and their processing
- **Contract**: Service agreements with pricing and terms
- **Payment**: Financial transactions and reconciliations

#### Base Entity Interface

All entities implement the `BaseEntity` interface:

```typescript
interface BaseEntity {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

#### Optimistic Locking

The protocol uses optimistic locking for concurrent updates:

```typescript
// Update with version check
const updatedCustomer = customer.update(updates, expectedVersion);

if (updatedCustomer.version !== expectedVersion + 1) {
  throw new Error('Version conflict - please retry');
}
```

### 2.2 Data Validation

#### JSON Schema Validation

All entities are validated against JSON Schema definitions:

```typescript
import { validateCustomer } from './contracts/customer-schema.json';

const isValid = validateCustomer(customerData);
if (!isValid) {
  console.log(validateCustomer.errors);
}
```

#### Business Rules Validation

Additional business rules are enforced by validators:

```typescript
import { CustomerValidator } from './protocol/implementations/customer';

const validation = CustomerValidator.validate(customerData);
if (!validation.isValid) {
  console.log(validation.errors);
}
```

### 2.3 Event-Driven Architecture

The protocol supports real-time event streaming:

```typescript
import { EventStreamingSystem } from './protocol/implementations/event-system';

const eventSystem = new EventStreamingSystem();

// Subscribe to events
eventSystem.subscribe(
  { entityType: 'customer', eventType: 'created' },
  (event) => console.log('Customer created:', event)
);

// Publish events
await eventSystem.publishEvent({
  entityType: 'customer',
  entityId: customer.id,
  eventType: 'updated',
  data: { status: 'active' }
});
```

---

## 3. Building Your First Application

### 3.1 Simple Customer Management

Let's create a basic customer management application:

#### Step 1: Create the Application Structure

```bash
mkdir my-refuse-app
cd my-refuse-app
npm init -y
npm install typescript @types/node
npx tsc --init
```

#### Step 2: Install REFUSE Protocol SDK

```bash
npm install @refuse-protocol/sdk
```

#### Step 3: Create Customer Manager

```typescript
// src/customer-manager.ts
import { CustomerModel } from '@refuse-protocol/sdk';
import { CustomerValidator } from '@refuse-protocol/sdk';

export class CustomerManager {
  private customers: Map<string, CustomerModel> = new Map();

  async createCustomer(data: any): Promise<CustomerModel> {
    // Validate input
    const validation = CustomerValidator.validate(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Create customer
    const customer = CustomerModel.create(data);

    // Store customer
    this.customers.set(customer.id, customer);

    return customer;
  }

  async getCustomer(id: string): Promise<CustomerModel | undefined> {
    return this.customers.get(id);
  }

  async updateCustomer(id: string, updates: any, expectedVersion: number): Promise<CustomerModel> {
    const customer = this.customers.get(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const updatedCustomer = customer.update(updates, expectedVersion);
    this.customers.set(id, updatedCustomer);

    return updatedCustomer;
  }

  async listCustomers(): Promise<CustomerModel[]> {
    return Array.from(this.customers.values());
  }
}
```

#### Step 4: Create Main Application

```typescript
// src/index.ts
import { CustomerManager } from './customer-manager';

async function main() {
  const customerManager = new CustomerManager();

  // Create a customer
  const customer = await customerManager.createCustomer({
    name: 'Acme Manufacturing',
    type: 'commercial',
    status: 'active',
    serviceAddress: {
      street: '123 Industrial Way',
      city: 'Manufacturing City',
      state: 'CA',
      zipCode: '94105'
    },
    primaryContact: {
      name: 'John Smith',
      email: 'john@acme.com',
      phone: '(555) 123-4567'
    }
  });

  console.log('Created customer:', customer.toJSON());

  // List customers
  const customers = await customerManager.listCustomers();
  console.log('Total customers:', customers.length);
}

main().catch(console.error);
```

#### Step 5: Configure TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Step 6: Add Scripts to package.json

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^4.9.0"
  }
}
```

#### Step 7: Run Your Application

```bash
npm run build
npm start
```

### 3.2 Advanced Example: Route Optimization

Let's create a more complex example with route optimization:

```typescript
// src/route-optimizer.ts
import { RouteModel, FacilityModel, CustomerModel } from '@refuse-protocol/sdk';

export class RouteOptimizer {
  private routes: Map<string, RouteModel> = new Map();
  private facilities: Map<string, FacilityModel> = new Map();

  async optimizeRoutes(customerIds: string[]): Promise<RouteModel[]> {
    // Get customers
    const customers = customerIds.map(id => this.getCustomer(id));

    // Group customers by geographic area
    const areas = this.groupByArea(customers);

    // Create optimized routes for each area
    const routes: RouteModel[] = [];

    for (const area of areas) {
      const route = await this.createOptimizedRoute(area);
      routes.push(route);
    }

    return routes;
  }

  private async createOptimizedRoute(customers: CustomerModel[]): Promise<RouteModel> {
    // Find nearest facility
    const facility = this.findNearestFacility(customers[0]);

    // Create route with optimized sequence
    const routeData = {
      name: `Route ${Date.now()}`,
      code: `RT-${Date.now()}`,
      type: 'commercial',
      status: 'planned',
      schedule: {
        startTime: '08:00',
        endTime: '17:00',
        workingDays: ['monday', 'wednesday', 'friday']
      },
      assignedVehicle: this.assignVehicle(),
      assignedDriver: this.assignDriver(),
      assignedSites: customers.map(c => c.id),
      assignedServices: [], // Will be populated based on customer services
      serviceSequence: this.calculateOptimalSequence(customers),
      plannedStops: customers.length,
      efficiency: 0, // Will be calculated
      totalDistance: this.calculateTotalDistance(customers)
    };

    const route = RouteModel.create(routeData);
    this.routes.set(route.id, route);

    return route;
  }

  private calculateOptimalSequence(customers: CustomerModel[]): any[] {
    // Implement traveling salesman problem optimization
    // This is a simplified example
    return customers.map((customer, index) => ({
      stopNumber: index + 1,
      customerId: customer.id,
      estimatedArrival: this.calculateArrivalTime(index),
      estimatedServiceTime: 15 // minutes
    }));
  }

  private calculateTotalDistance(customers: CustomerModel[]): number {
    // Calculate total route distance
    let totalDistance = 0;
    for (let i = 0; i < customers.length - 1; i++) {
      totalDistance += this.calculateDistance(
        customers[i].serviceAddress,
        customers[i + 1].serviceAddress
      );
    }
    return totalDistance;
  }

  private calculateDistance(address1: any, address2: any): number {
    // Haversine formula implementation
    const R = 3959; // Earth's radius in miles
    const lat1 = this.toRadians(address1.latitude || 0);
    const lon1 = this.toRadians(address1.longitude || 0);
    const lat2 = this.toRadians(address2.latitude || 0);
    const lon2 = this.toRadians(address2.longitude || 0);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateArrivalTime(stopNumber: number): Date {
    const baseTime = new Date();
    baseTime.setHours(8, 0, 0, 0); // Start at 8:00 AM
    baseTime.setMinutes(baseTime.getMinutes() + (stopNumber * 30)); // 30 minutes per stop
    return baseTime;
  }

  private assignVehicle(): string {
    // Simple vehicle assignment logic
    return `VEH-${Math.floor(Math.random() * 10) + 1}`;
  }

  private assignDriver(): string {
    // Simple driver assignment logic
    return `DRV-${Math.floor(Math.random() * 5) + 1}`;
  }

  private groupByArea(customers: CustomerModel[]): CustomerModel[][] {
    // Group customers by geographic proximity
    const groups: CustomerModel[][] = [];
    const used = new Set<string>();

    for (const customer of customers) {
      if (used.has(customer.id)) continue;

      const group = [customer];
      used.add(customer.id);

      // Find nearby customers
      for (const otherCustomer of customers) {
        if (used.has(otherCustomer.id)) continue;

        const distance = this.calculateDistance(
          customer.serviceAddress,
          otherCustomer.serviceAddress
        );

        if (distance < 10) { // Within 10 miles
          group.push(otherCustomer);
          used.add(otherCustomer.id);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  private findNearestFacility(customer: CustomerModel): FacilityModel {
    // Find the nearest facility that can handle this customer type
    const facilities = Array.from(this.facilities.values());
    let nearestFacility = facilities[0];
    let shortestDistance = Infinity;

    for (const facility of facilities) {
      const distance = this.calculateDistance(
        customer.serviceAddress,
        facility.address
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestFacility = facility;
      }
    }

    return nearestFacility;
  }

  // Mock methods - replace with actual data access
  private getCustomer(id: string): CustomerModel {
    // Implement actual customer retrieval
    throw new Error('Not implemented');
  }
}
```

---

## 4. Testing Your Application

### 4.1 Unit Testing

```typescript
// tests/customer-manager.test.ts
import { CustomerManager } from '../src/customer-manager';

describe('CustomerManager', () => {
  let customerManager: CustomerManager;

  beforeEach(() => {
    customerManager = new CustomerManager();
  });

  test('should create customer successfully', async () => {
    const customerData = {
      name: 'Test Customer',
      type: 'commercial',
      status: 'active',
      serviceAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '94105'
      }
    };

    const customer = await customerManager.createCustomer(customerData);

    expect(customer.id).toBeDefined();
    expect(customer.name).toBe('Test Customer');
    expect(customer.type).toBe('commercial');
  });

  test('should handle validation errors', async () => {
    const invalidData = {
      name: '', // Invalid: empty name
      type: 'invalid_type', // Invalid: not a valid type
      status: 'active'
    };

    await expect(customerManager.createCustomer(invalidData))
      .rejects.toThrow('Validation failed');
  });
});
```

### 4.2 Integration Testing

```typescript
// tests/integration.test.ts
import { CustomerManager } from '../src/customer-manager';
import { RouteOptimizer } from '../src/route-optimizer';

describe('Integration Tests', () => {
  let customerManager: CustomerManager;
  let routeOptimizer: RouteOptimizer;

  beforeEach(() => {
    customerManager = new CustomerManager();
    routeOptimizer = new RouteOptimizer();
  });

  test('should create customer and optimize routes', async () => {
    // Create customers
    const customer1 = await customerManager.createCustomer({
      name: 'Customer 1',
      type: 'commercial',
      status: 'active',
      serviceAddress: {
        street: '100 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105'
      }
    });

    const customer2 = await customerManager.createCustomer({
      name: 'Customer 2',
      type: 'commercial',
      status: 'active',
      serviceAddress: {
        street: '200 Market St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102'
      }
    });

    // Optimize routes
    const routes = await routeOptimizer.optimizeRoutes([customer1.id, customer2.id]);

    expect(routes.length).toBeGreaterThan(0);
    expect(routes[0].assignedSites).toContain(customer1.id);
    expect(routes[0].assignedSites).toContain(customer2.id);
  });
});
```

### 4.3 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## 5. Best Practices

### 5.1 Code Organization

#### Follow Domain-Driven Design
```typescript
// Good: Domain-focused structure
src/
├── customers/
│   ├── Customer.ts
│   ├── CustomerRepository.ts
│   ├── CustomerService.ts
│   └── CustomerValidator.ts
├── routes/
│   ├── Route.ts
│   ├── RouteOptimizer.ts
│   └── RouteRepository.ts
└── shared/
    ├── types.ts
    ├── utils.ts
    └── errors.ts
```

#### Use Meaningful Names
```typescript
// Good
calculateOptimalCollectionSequence()
validateCustomerBusinessRules()
generateMaterialTicketAuditTrail()

// Bad
process()
check()
doSomething()
```

### 5.2 Error Handling

#### Use Custom Error Types
```typescript
export class CustomerNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Customer not found: ${customerId}`);
    this.name = 'CustomerNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### Handle Errors Appropriately
```typescript
async function getCustomer(customerId: string): Promise<Customer> {
  try {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      throw new CustomerNotFoundError(customerId);
    }
    return customer;
  } catch (error) {
    if (error instanceof CustomerNotFoundError) {
      // Log and re-throw
      logger.error('Customer not found', { customerId, error });
      throw error;
    }

    // Handle unexpected errors
    logger.error('Unexpected error fetching customer', { customerId, error });
    throw new InternalServerError('Failed to fetch customer');
  }
}
```

### 5.3 Data Validation

#### Validate at Boundaries
```typescript
export class CustomerService {
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    // Validate input
    const validation = CustomerValidator.validate(data);
    if (!validation.isValid) {
      throw new ValidationError('Invalid customer data', validation.errors);
    }

    // Business rules validation
    const businessRules = this.validateBusinessRules(data);
    if (!businessRules.isValid) {
      throw new BusinessRuleError('Business rules violation', businessRules.violations);
    }

    // Create customer
    return this.customerRepository.create(data);
  }
}
```

#### Use JSON Schema for Complex Validation
```typescript
import { validate } from 'jsonschema';

const customerSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 200 },
    type: { type: 'string', enum: ['residential', 'commercial', 'industrial'] },
    status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
    serviceAddress: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string', pattern: '^[A-Z]{2}$' },
        zipCode: { type: 'string', pattern: '^\\d{5}(-\\d{4})?$' }
      },
      required: ['street', 'city', 'state', 'zipCode']
    }
  },
  required: ['name', 'type', 'status', 'serviceAddress']
};

export function validateCustomer(data: any): boolean {
  return validate(data, customerSchema).valid;
}
```

### 5.4 Performance Optimization

#### Use Caching Strategically
```typescript
export class CachedCustomerService {
  private cache = new Map<string, { data: Customer; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getCustomer(customerId: string): Promise<Customer> {
    // Check cache first
    const cached = this.cache.get(customerId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // Fetch from repository
    const customer = await this.customerRepository.findById(customerId);

    // Cache the result
    this.cache.set(customerId, { data: customer, timestamp: Date.now() });

    return customer;
  }
}
```

#### Batch Operations
```typescript
export class BatchCustomerService {
  async createCustomers(customersData: CreateCustomerRequest[]): Promise<Customer[]> {
    // Validate all customers first
    const validationErrors: string[] = [];
    const validCustomers: CreateCustomerRequest[] = [];

    customersData.forEach((data, index) => {
      try {
        CustomerValidator.validate(data);
        validCustomers.push(data);
      } catch (error) {
        validationErrors.push(`Customer ${index}: ${error.message}`);
      }
    });

    if (validationErrors.length > 0) {
      throw new ValidationError('Some customers failed validation', validationErrors);
    }

    // Create all valid customers in batch
    return this.customerRepository.createBatch(validCustomers);
  }
}
```

### 5.5 Security

#### Input Sanitization
```typescript
export class InputSanitizer {
  static sanitizeCustomerInput(data: any): CreateCustomerRequest {
    return {
      name: this.sanitizeString(data.name),
      type: data.type, // Already validated as enum
      status: data.status, // Already validated as enum
      serviceAddress: {
        street: this.sanitizeString(data.serviceAddress.street),
        city: this.sanitizeString(data.serviceAddress.city),
        state: data.serviceAddress.state.toUpperCase(),
        zipCode: this.sanitizeZipCode(data.serviceAddress.zipCode)
      },
      primaryContact: data.primaryContact ? {
        name: this.sanitizeString(data.primaryContact.name),
        email: this.sanitizeEmail(data.primaryContact.email),
        phone: this.sanitizePhone(data.primaryContact.phone)
      } : undefined
    };
  }

  private static sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '');
  }

  private static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private static sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+\-\s()]/g, '');
  }

  private static sanitizeZipCode(zipCode: string): string {
    return zipCode.replace(/[^\d-]/g, '');
  }
}
```

#### Authorization
```typescript
export class CustomerAuthorization {
  async canUserAccessCustomer(userId: string, customerId: string): Promise<boolean> {
    const customer = await this.customerRepository.findById(customerId);

    // Check if user owns the customer or has admin access
    return customer.metadata.createdBy === userId ||
           await this.userService.hasRole(userId, 'admin');
  }

  async canUserModifyCustomer(userId: string, customerId: string): Promise<boolean> {
    const customer = await this.customerRepository.findById(customerId);

    // Only allow modification if user created the customer or is admin
    return customer.metadata.createdBy === userId ||
           await this.userService.hasRole(userId, 'admin');
  }
}
```

---

## 6. Debugging and Troubleshooting

### 6.1 Common Issues

#### Version Conflicts
```typescript
// Problem: Optimistic locking conflicts
async function updateCustomer(customerId: string, updates: any) {
  const customer = await getCustomer(customerId);

  try {
    return await customerRepository.update(customerId, {
      ...updates,
      version: customer.version // Always include current version
    });
  } catch (error) {
    if (error.code === 'CONCURRENCY_ERROR') {
      // Handle conflict: retry or show to user
      console.log('Version conflict - retrying...');
      return updateCustomer(customerId, updates); // Retry once
    }
    throw error;
  }
}
```

#### Validation Errors
```typescript
// Problem: Unexpected validation errors
try {
  const customer = await customerService.create(data);
} catch (error) {
  if (error.name === 'ValidationError') {
    console.log('Validation details:', error.details);
    // Show specific field errors to user
  } else {
    console.log('Unexpected error:', error);
    // Handle other errors
  }
}
```

#### Performance Issues
```typescript
// Problem: Slow queries
const slowCustomers = await customerRepository.findAll(); // Avoid!

// Solution: Use pagination or specific queries
const activeCustomers = await customerRepository.findByStatus('active');
const customersPage = await customerRepository.findWithPagination({ page: 1, limit: 50 });
```

### 6.2 Debugging Tools

#### Logging
```typescript
import { logger } from './utils/logger';

export class CustomerService {
  async createCustomer(data: any): Promise<Customer> {
    logger.info('Creating customer', { name: data.name, type: data.type });

    try {
      const customer = await this.customerRepository.create(data);
      logger.info('Customer created successfully', { customerId: customer.id });
      return customer;
    } catch (error) {
      logger.error('Failed to create customer', {
        error: error.message,
        data: { name: data.name, type: data.type }
      });
      throw error;
    }
  }
}
```

#### Monitoring
```typescript
export class MetricsCollector {
  private metrics = new Map<string, number>();

  recordOperation(operation: string, duration: number): void {
    this.metrics.set(operation, duration);
  }

  getAverageTime(operation: string): number {
    return this.metrics.get(operation) || 0;
  }

  async reportMetrics(): Promise<void> {
    // Send metrics to monitoring service
    console.log('Performance metrics:', Object.fromEntries(this.metrics));
  }
}
```

---

## 7. Deployment

### 7.1 Development Environment

```bash
# Set up environment variables
cp .env.example .env.local

# Run in development mode
npm run dev

# Run with hot reload
npm run dev:watch
```

### 7.2 Production Deployment

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```bash
# Build and run
docker build -t my-refuse-app .
docker run -p 3000:3000 my-refuse-app
```

#### Environment Configuration
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/refuse_db
REDIS_URL=redis://host:6379
API_KEY_SECRET=your-secret-key
LOG_LEVEL=info
```

---

## 8. Contributing to REFUSE Protocol

### 8.1 Development Workflow

#### 1. Fork the Repository
```bash
git clone https://github.com/your-username/refuse-protocol.git
cd refuse-protocol
```

#### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

#### 3. Make Your Changes
```bash
# Implement your feature
git add .
git commit -m "Add your feature description"
```

#### 4. Run Tests
```bash
npm test
npm run test:integration
npm run test:load
```

#### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

### 8.2 Code Style and Standards

#### TypeScript Guidelines
- Use strict type checking
- Prefer interfaces over types for object definitions
- Use `readonly` for immutable properties
- Avoid `any` type - use specific types or generics

#### Naming Conventions
```typescript
// Classes: PascalCase
class CustomerService {}

// Methods: camelCase
getCustomerById() {}

// Interfaces: PascalCase, prefixed with I
interface ICustomerRepository {}

// Types: PascalCase
type CustomerType = 'residential' | 'commercial' | 'industrial';

// Constants: UPPER_CASE
const MAX_CUSTOMERS = 1000;

// Variables: camelCase
const customerId = '123';
```

#### File Organization
```
src/
├── domain/           # Business logic and entities
├── infrastructure/   # External dependencies and services
├── interfaces/       # API controllers and interfaces
├── application/      # Use cases and application services
└── shared/          # Shared utilities and types
```

### 8.3 Documentation Requirements

#### Code Documentation
```typescript
/**
 * Creates a new customer with validation and business rules.
 *
 * @param data - Customer creation data
 * @returns Promise resolving to the created customer
 * @throws {ValidationError} When input data is invalid
 * @throws {BusinessRuleError} When business rules are violated
 *
 * @example
 * ```typescript
 * const customer = await customerService.createCustomer({
 *   name: 'Acme Corp',
 *   type: 'commercial',
 *   serviceAddress: { /* ... */ }
 * });
 * ```
 */
async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
  // Implementation
}
```

#### API Documentation
- Document all public APIs
- Include request/response examples
- Specify error conditions
- Add authentication requirements

### 8.4 Testing Requirements

#### Unit Tests
- Test all public methods
- Mock external dependencies
- Test error conditions
- Aim for >80% code coverage

#### Integration Tests
- Test complete workflows
- Use test database
- Test external service interactions

#### Performance Tests
- Benchmark critical paths
- Test with realistic data volumes
- Monitor memory usage

---

## 9. Getting Help

### 9.1 Community Resources

- **GitHub Issues**: [Report bugs and request features](https://github.com/refuse-protocol/refuse-protocol/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/refuse-protocol/refuse-protocol/discussions)
- **Discord**: [Chat with the community](https://discord.gg/refuse-protocol)

### 9.2 Documentation

- **API Reference**: [Complete API documentation](https://docs.refuse-protocol.org/api)
- **Examples**: [Code examples and tutorials](https://docs.refuse-protocol.org/examples)
- **Architecture**: [Protocol architecture guide](https://docs.refuse-protocol.org/architecture)

### 9.3 Support

- **Email**: support@refuse-protocol.org
- **Support Portal**: [Get help from the team](https://support.refuse-protocol.org)

---

## 10. What's Next?

Congratulations! You've completed the REFUSE Protocol Developer Guide. Here's what you can explore next:

1. **Build a Complete Application**: Use the examples in this guide to build a full-featured waste management application
2. **Explore Advanced Features**: Dive into event streaming, data archaeology, and compliance validation
3. **Contribute**: Help improve the protocol by contributing code or documentation
4. **Integrate**: Connect the REFUSE Protocol with your existing systems

Remember, the REFUSE Protocol is designed to be flexible and extensible. Don't hesitate to experiment and adapt it to your specific needs!

---

*Happy coding with the REFUSE Protocol! 🌍♻️*
