import { basename } from 'path';
import { mkdirSync } from 'fs';
import { existsSync } from 'fs';
import { writeFileSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { resolve } from 'path';
/**
 * @fileoverview Protocol specification documentation generator for REFUSE Protocol
 * @description Automatically generates comprehensive documentation from entity implementations, schemas, and protocol artifacts
 * @version 1.0.0
 */

// REMOVED UNUSED IMPORT: // REMOVED UNUSED: import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
// REMOVED UNUSED IMPORT: // REMOVED UNUSED: import { join, resolve, dirname, basename, extname } from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import { JSDocParser } from './jsdoc-parser.js';

/**
 * REFUSE Protocol Specification Documentation Generator
 * Automatically creates comprehensive documentation from implementations and schemas
 */
export class SpecGenerator {
  private outputDir: string;
  private jsdocParser: JSDocParser;
  private generatedFiles: string[] = [];

  constructor(outputDir: string = './docs') {
    this.outputDir = resolve(outputDir);
    this.jsdocParser = new JSDocParser();

    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate complete protocol specification documentation
   */
  async generateFullSpecification(options: GenerationOptions = {}): Promise<GenerationResult> {
  console.log(chalk.blue('📚 Generating REFUSE Protocol specification documentation...'));

    const startTime = Date.now();
    const results: GenerationResult = {
      timestamp: new Date().toISOString(),
      totalFilesGenerated: 0,
      files: [],
      errors: [],
    };

    try {
      // Generate different types of documentation
      await this.generateProtocolOverview(options);
      await this.generateEntityDocumentation(options);
      await this.generateSchemaDocumentation(options);
      await this.generateAPIReference(options);
      await this.generateIntegrationGuide(options);
      await this.generateExamplesDocumentation(options);

      const generationTime = Date.now() - startTime;

      console.log(
        chalk.green(
          `✅ Generated ${results.files.length} documentation files in ${generationTime}ms`
        )
      );

      return results;
    } catch (error) {
// FIXED PARSING:       const errorMsg = error instanceof Error ? error.message : String(error);
  console.error(chalk.red(`❌ Documentation generation failed: ${errorMsg}`));
      results.errors.push(errorMsg);
      return results;
    }
  }

  /**
   * Generate protocol overview documentation
   */
  private async generateProtocolOverview(options: GenerationOptions): Promise<void> {
    const overviewPath = join(this.outputDir, 'protocol-overview.md');

    const overview = `# REFUSE Protocol Overview

## Introduction

The REFUSE (REcyclable & Solid waste Unified Standard Exchange) Protocol is a comprehensive data exchange standard designed specifically for the waste management industry. It provides a unified framework for standardizing billing, customer, service, and operational data across disparate legacy systems.

## Core Principles

### 1. RESTful API-first
All data exchange operations are accessible via REST endpoints. Protocol implementations expose standardized HTTP methods (GET, POST, PUT, DELETE) for all data operations.

### 2. JSON-native
Data structures use human-readable field names with semantic clarity. All protocol data is exchanged in JSON format with comprehensive schema validation.

### 3. Semantic Clarity
Field naming follows domain-specific terminology familiar to waste management professionals. No ambiguous abbreviations or technical jargon.

### 4. Extensible Design
The protocol supports system-specific extensions via metadata fields while maintaining core compatibility across implementations.

### 5. Backward Compatibility
Protocol updates maintain compatibility with existing implementations through careful versioning and migration strategies.

### 6. Data Archaeology
Comprehensive support for handling and transforming inconsistent legacy data patterns from decades-old waste management systems.

## Architecture Overview

The REFUSE Protocol is structured around 18 core entities that represent all major aspects of waste management operations:

### Core Entities
- **Customer** - Customer information and multi-site support
- **Service** - Service definitions with scheduling and pricing
- **Route** - Route optimization and performance tracking
- **Facility** - Processing facilities with capacity management
- **CustomerRequest** - Request workflow and approval tracking
- **MaterialTicket** - Scale ticketing and material tracking

### Advanced Entities
- **Territory** - Geographic service areas and pricing rules
- **Site** - Customer site management with containers
- **Contract** - Guaranteed pricing and service agreements
- **Fleet** - Vehicle and equipment tracking
- **Container** - Asset tracking with RFID/GPS support
- **Yard** - Facility and container storage management
- **Order/Job** - Work order scheduling and completion
- **Material** - Material classification and processing
- **Payment** - Financial reconciliation and audit trails
- **Allocation** - Environmental compliance and LEED tracking

## Data Exchange Standards

### Event-Driven Architecture
The protocol supports real-time event streaming for operational visibility:

\`\`\`typescript
interface Event {
  id: string;
  entityType: 'customer' | 'service' | 'route' | 'facility' | 'customer_request' | 'allocation';
  eventType: 'created' | 'updated' | 'completed' | 'cancelled';
  timestamp: Date;
  eventData: EventData;
  version: number;
}
\`\`\`

### Schema Validation
All data exchange is validated against comprehensive JSON Schema definitions with detailed error reporting and performance metrics.

## Implementation Requirements

### Technology Stack
- **Primary**: TypeScript/Node.js for protocol tooling
- **Validation**: AJV JSON Schema validator with custom keywords
- **Documentation**: Automated generation from code annotations
- **Testing**: Comprehensive test suites with TDD approach

### Governance
The protocol follows strict governance rules defined in the REFUSE Protocol Constitution, ensuring consistent evolution and industry adoption.

## Benefits

### For Waste Management Companies
- **Unified Data Standard**: Single protocol across all operations
- **Legacy Integration**: Seamless migration from existing systems
- **Regulatory Compliance**: Built-in environmental and safety reporting
- **Operational Efficiency**: Real-time visibility and optimization

### For Technology Providers
- **Clear Specifications**: Comprehensive documentation and schemas
- **Validation Tools**: Automated testing and conformance checking
- **Developer Experience**: Rich tooling and examples
- **Industry Focus**: Domain-specific design patterns

---

*Generated by REFUSE Protocol Spec Generator v1.0.0*
`;

    writeFileSync(overviewPath, overview, 'utf8');
    this.trackGeneratedFile(overviewPath, 'Protocol Overview');
  }

  /**
   * Generate entity documentation from implementation files
   */
  private async generateEntityDocumentation(options: GenerationOptions): Promise<void> {
    const implementationsDir = resolve(options.implementationsDir || './protocol/implementations');
    const entitiesPath = join(this.outputDir, 'entities.md');

    if (!existsSync(implementationsDir)) {
  console.warn(chalk.yellow(`⚠️ Implementations directory not found: ${implementationsDir}`));
      return;
    }

    const entityFiles = await glob('*.ts', { cwd: implementationsDir });

    let entitiesDoc = `# REFUSE Protocol Entities

This document provides comprehensive documentation for all REFUSE Protocol entities, automatically generated from the implementation code.

## Entity Overview

The REFUSE Protocol defines ${entityFiles.length} core entities that cover all aspects of waste management operations:

`;

    for (const file of entityFiles) {
      const filePath = join(implementationsDir, file);
      const entityName = basename(file, '.ts').replace(/Model$/, '');

      try {
        const content = readFileSync(filePath, 'utf8');
        const jsdoc = this.jsdocParser.parse(content);

        entitiesDoc += `## ${entityName}

${jsdoc.description || 'No description available'}

### Properties

`;

        if (jsdoc.properties && jsdoc.properties.length > 0) {
          for (const prop of jsdoc.properties) {
            entitiesDoc += `#### ${prop.name}
- **Type**: ${prop.type || 'any'}
- **Description**: ${prop.description || 'No description'}
${prop.optional ? '- **Optional**: Yes' : '- **Required**: Yes'}
${prop.default ? `- **Default**: ${prop.default}` : ''}

`;
          }
        }

        entitiesDoc += `### Methods

`;

        if (jsdoc.methods && jsdoc.methods.length > 0) {
          for (const method of jsdoc.methods) {
            entitiesDoc += `#### ${method.name}()
${method.description || 'No description'}

${
  method.parameters && method.parameters.length > 0
    ? `**Parameters:**
${method.parameters.map((p) => `- ${p.name}: ${p.type || 'any'} - ${p.description || 'No description'}`).join('\n')}

`
    : ''
}${
              method.returns
                ? `**Returns**: ${method.returns}
`
                : ''
            }`;
          }
        }

        entitiesDoc += `---

`;
      } catch (error) {
  console.warn(
          chalk.yellow(
            `⚠️ Failed to parse entity ${entityName}: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    }

    entitiesDoc += `*Generated from ${entityFiles.length} entity implementations*
`;

    writeFileSync(entitiesPath, entitiesDoc, 'utf8');
    this.trackGeneratedFile(entitiesPath, 'Entity Documentation');
  }

  /**
   * Generate schema documentation from JSON Schema files
   */
  private async generateSchemaDocumentation(options: GenerationOptions): Promise<void> {
    const contractsDir = resolve(
      options.contractsDir || './specs/001-refuse-protocol-the/contracts'
    );
    const schemasPath = join(this.outputDir, 'schemas.md');

    if (!existsSync(contractsDir)) {
  console.warn(chalk.yellow(`⚠️ Contracts directory not found: ${contractsDir}`));
      return;
    }

    const schemaFiles = await glob('*.json', { cwd: contractsDir });

    let schemasDoc = `# REFUSE Protocol Schemas

This document provides comprehensive documentation for all REFUSE Protocol JSON Schemas.

## Schema Overview

The REFUSE Protocol defines ${schemaFiles.length} JSON Schema files for data validation:

`;

    for (const file of schemaFiles) {
      const filePath = join(contractsDir, file);
      const schemaName = basename(file, '-schema.json');

      try {
        const content = readFileSync(filePath, 'utf8');
        const schema = JSON.parse(content);

        schemasDoc += `## ${schemaName} Schema

${schema.description || 'No description available'}

### Schema Details
- **ID**: ${schema.$id || 'Not specified'}
- **Version**: ${schema.version || 'Not specified'}
- **Type**: ${schema.type || 'object'}

### Properties

`;

        if (schema.properties) {
          for (const [propName, propDef] of Object.entries(schema.properties)) {
            const prop = propDef as any;
            schemasDoc += `#### ${propName}
- **Type**: ${prop.type || 'any'}
- **Description**: ${prop.description || 'No description'}
${prop.format ? `- **Format**: ${prop.format}` : ''}
${prop.minimum !== undefined ? `- **Minimum**: ${prop.minimum}` : ''}
${prop.maximum !== undefined ? `- **Maximum**: ${prop.maximum}` : ''}
${prop.minLength !== undefined ? `- **Min Length**: ${prop.minLength}` : ''}
${prop.maxLength !== undefined ? `- **Max Length**: ${prop.maxLength}` : ''}
${prop.enum ? `- **Allowed Values**: ${prop.enum.join(', ')}` : ''}

`;
          }
        }

        schemasDoc += `### Required Properties
${schema.required ? schema.required.map((req: string) => `- ${req}`).join('\n') : 'None specified'}

---

`;
      } catch (error) {
  console.warn(
          chalk.yellow(
            `⚠️ Failed to parse schema ${schemaName}: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    }

    schemasDoc += `*Generated from ${schemaFiles.length} schema definitions*
`;

    writeFileSync(schemasPath, schemasDoc, 'utf8');
    this.trackGeneratedFile(schemasPath, 'Schema Documentation');
  }

  /**
   * Generate API reference documentation
   */
  private async generateAPIReference(options: GenerationOptions): Promise<void> {
    const apiRefPath = join(this.outputDir, 'api-reference.md');

    const apiDoc = `# REFUSE Protocol API Reference

## Overview

This API reference provides comprehensive documentation for the REFUSE Protocol RESTful API endpoints and data structures.

## Base URL

All API endpoints are relative to the base URL of your REFUSE Protocol implementation:

\`\`\`
https://api.yourcompany.com/refuse/v1/
\`\`\`

## Authentication

The REFUSE Protocol supports multiple authentication methods:

- **API Key**: Include in request headers: \`X-API-Key: your-api-key\`
- **Bearer Token**: Include in authorization header: \`Authorization: Bearer your-token\`
- **Basic Auth**: Standard HTTP Basic Authentication

## Common Headers

All requests should include these headers:

\`\`\`
Content-Type: application/json
Accept: application/json
User-Agent: REFUSE-Client/1.0
\`\`\`

## Error Handling

### Error Response Format

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "customer.name",
        "message": "Name is required",
        "code": "REQUIRED"
      }
    ],
    "timestamp": "2025-01-01T12:00:00Z",
    "requestId": "req-12345678-90ab-cdef-1234-567890abcdef"
  }
}
\`\`\`

### Common Error Codes

- \`VALIDATION_ERROR\` (400) - Request data validation failed
- \`NOT_FOUND\` (404) - Resource not found
- \`UNAUTHORIZED\` (401) - Authentication required
- \`FORBIDDEN\` (403) - Insufficient permissions
- \`CONFLICT\` (409) - Resource conflict (e.g., version mismatch)
- \`INTERNAL_ERROR\` (500) - Server internal error

## Entity Endpoints

### Customer Management

#### List Customers
\`\`\`
GET /customers
\`\`\`

**Parameters:**
- \`limit\` (optional): Maximum number of results (default: 50)
- \`offset\` (optional): Pagination offset (default: 0)
- \`status\` (optional): Filter by customer status
- \`type\` (optional): Filter by customer type

**Response:**
\`\`\`json
{
  "data": [
    {
      "id": "customer-123",
      "name": "ABC Waste Management",
      "type": "commercial",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasNext": true,
    "hasPrevious": false
  }
}
\`\`\`

#### Get Customer
\`\`\`
GET /customers/{customerId}
\`\`\`

#### Create Customer
\`\`\`
POST /customers
\`\`\`

#### Update Customer
\`\`\`
PUT /customers/{customerId}
\`\`\`

#### Delete Customer
\`\`\`
DELETE /customers/{customerId}
\`\`\`

### Service Management

#### List Services
\`\`\`
GET /services
\`\`\`

#### Get Service
\`\`\`
GET /services/{serviceId}
\`\`\`

#### Create Service
\`\`\`
POST /services
\`\`\`

#### Update Service
\`\`\`
PUT /services/{serviceId}
\`\`\`

#### Delete Service
\`\`\`
DELETE /services/{serviceId}
\`\`\`

### Route Management

#### List Routes
\`\`\`
GET /routes
\`\`\`

#### Get Route
\`\`\`
GET /routes/{routeId}
\`\`\`

#### Create Route
\`\`\`
POST /routes
\`\`\`

#### Update Route
\`\`\`
PUT /routes/{routeId}
\`\`\`

#### Delete Route
\`\`\`
DELETE /routes/{routeId}
\`\`\`

### Facility Management

#### List Facilities
\`\`\`
GET /facilities
\`\`\`

#### Get Facility
\`\`\`
GET /facilities/{facilityId}
\`\`\`

#### Create Facility
\`\`\`
POST /facilities
\`\`\`

#### Update Facility
\`\`\`
PUT /facilities/{facilityId}
\`\`\`

#### Delete Facility
\`\`\`
DELETE /facilities/{facilityId}
\`\`\`

### Event Streaming

#### Subscribe to Events
\`\`\`
GET /events/stream?entityTypes=customer,service&eventTypes=created,updated
\`\`\`

**Parameters:**
- \`entityTypes\` (optional): Comma-separated list of entity types to monitor
- \`eventTypes\` (optional): Comma-separated list of event types to monitor
- \`since\` (optional): ISO timestamp to start streaming from

**Response:** Server-sent events stream

## Data Validation

All request and response data is validated against the REFUSE Protocol JSON Schemas. See the [Schemas](schemas.md) documentation for detailed validation rules.

## Rate Limiting

API endpoints are subject to rate limiting based on your plan:

- **Free Tier**: 100 requests per hour
- **Professional**: 1,000 requests per hour
- **Enterprise**: 10,000 requests per hour

Rate limit headers are included in all responses:

\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 945
X-RateLimit-Reset: 1609459200
\`\`\`

## Versioning

The REFUSE Protocol API is versioned. The current version is v1. Breaking changes will be introduced in new major versions.

\`\`\`
/refuse/v1/customers
\`\`\`

## SDKs and Libraries

Several SDKs are available for different programming languages:

- **JavaScript/TypeScript**: [refuse-js](https://github.com/refuse-protocol/refuse-js)
- **Python**: [refuse-py](https://github.com/refuse-protocol/refuse-py)
- **Java**: [refuse-java](https://github.com/refuse-protocol/refuse-java)
- **.NET**: [refuse-dotnet](https://github.com/refuse-protocol/refuse-dotnet)

## Support

For API support and questions:

- **Documentation**: [https://docs.refuse-protocol.org](https://docs.refuse-protocol.org)
- **Community**: [https://community.refuse-protocol.org](https://community.refuse-protocol.org)
- **Support**: support@refuse-protocol.org

---

*Generated by REFUSE Protocol Spec Generator v1.0.0*
`;

    writeFileSync(apiRefPath, apiDoc, 'utf8');
    this.trackGeneratedFile(apiRefPath, 'API Reference');
  }

  /**
   * Generate integration guide documentation
   */
  private async generateIntegrationGuide(options: GenerationOptions): Promise<void> {
    const integrationPath = join(this.outputDir, 'integration-guide.md');

    const integrationDoc = `# REFUSE Protocol Integration Guide

## Overview

This guide provides step-by-step instructions for integrating with the REFUSE Protocol, whether you're building a new waste management system or migrating from legacy systems.

## Quick Start

### 1. Get Your API Credentials

First, obtain your API credentials from the REFUSE Protocol dashboard:

\`\`\`bash
# Store your credentials securely
export REFUSE_API_KEY="your-api-key-here"
export REFUSE_BASE_URL="https://api.yourcompany.com/refuse/v1"
\`\`\`

### 2. Install SDK (Recommended)

Install the official SDK for your preferred language:

\`\`\`bash
# Node.js/JavaScript
npm install refuse-protocol-sdk

# Python
pip install refuse-protocol

# Java
# Download from https://github.com/refuse-protocol/refuse-java
\`\`\`

### 3. Basic Customer Integration

\`\`\`typescript
import { REFUSEClient } from 'refuse-protocol-sdk';

const client = new REFUSEClient({
  apiKey: process.env.REFUSE_API_KEY,
  baseURL: process.env.REFUSE_BASE_URL
});

// Create a customer
const customer = await client.customers.create({
  name: 'ABC Waste Management',
  type: 'commercial',
  serviceAddress: {
    street1: '123 Main Street',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'US'
  }
});
// 
  console.log('Created customer:', customer.id);
\`\`\`

## Migration from Legacy Systems

### Data Transformation

The REFUSE Protocol provides built-in support for migrating from legacy systems:

#### 1. Analyze Your Current Data

Use the data archaeology tools to understand your current data structure:

\`\`\`bash
# Analyze legacy data patterns
refuse-cli analyze ./legacy-data/
\`\`\`

#### 2. Map Legacy Fields

Create field mappings between your legacy system and REFUSE Protocol entities:

\`\`\`json
{
  "legacy_customer_id": "externalIds[0]",
  "customer_name": "name",
  "address_street": "serviceAddress.street1",
  "address_city": "serviceAddress.city",
  "address_state": "serviceAddress.state",
  "address_zip": "serviceAddress.zipCode"
}
\`\`\`

#### 3. Transform and Import

Use the data transformation utilities to migrate your data:

\`\`\`typescript
import { DataTransformer } from 'refuse-protocol-sdk';

const transformer = new DataTransformer({
  fieldMappings: './mappings/customer-mappings.json'
});

// Transform legacy data
const transformedCustomers = await transformer.transformBatch(
  './legacy-data/customers.csv',
  'customer'
);

// Import to REFUSE Protocol
for (const customer of transformedCustomers) {
  await client.customers.create(customer);
}
\`\`\`

### Common Migration Patterns

#### Customer Data Migration

Legacy customer data often has inconsistent field names and structures. The REFUSE Protocol handles common patterns:

- **Multiple Addresses**: Consolidated into primary service address
- **Contact Information**: Normalized into standard contact structure
- **Customer Types**: Mapped to standardized commercial/residential/industrial
- **Historical Data**: Preserved in metadata fields

#### Service Migration

Service data migration handles:

- **Service Types**: Standardized waste/recycling/organics/hazardous
- **Pricing Structures**: Normalized to standard pricing models
- **Scheduling**: Converted to ISO 8601 recurring schedules
- **Container Types**: Mapped to standardized container definitions

## Event Streaming Integration

### Real-time Updates

Subscribe to real-time events for operational visibility:

\`\`\`typescript
import { EventStreamer } from 'refuse-protocol-sdk';

const streamer = new EventStreamer({
  apiKey: process.env.REFUSE_API_KEY,
  baseURL: process.env.REFUSE_BASE_URL
});

// Subscribe to customer events
streamer.subscribe(['customer', 'service'], ['created', 'updated'], (event) => {
//   console.log('Received event:', event.entityType, event.eventType);

  switch (event.entityType) {
    case 'customer':
      handleCustomerEvent(event);
      break;
    case 'service':
      handleServiceEvent(event);
      break;
  }
});
\`\`\`

### Webhook Integration

Set up webhooks for external system integration:

\`\`\`json
{
  "url": "https://your-system.com/webhooks/refuse",
  "events": [
    "customer.created",
    "customer.updated",
    "service.created",
    "route.completed"
  ],
  "headers": {
    "Authorization": "Bearer your-token"
  }
}
\`\`\`

## Validation and Testing

### Schema Validation

Validate your data against REFUSE Protocol schemas:

\`\`\`bash
# Validate customer data
refuse-cli validate ./schemas/customer-schema.json ./data/customers.json

# Batch validate entire dataset
refuse-cli validate-batch ./schemas/ ./data/
\`\`\`

### Conformance Testing

Run protocol conformance tests:

\`\`\`bash
# Run all conformance tests
npm test -- --grep "conformance"

# Test specific entity conformance
npm test -- --grep "customer.conformance"
\`\`\`

## Error Handling

### Common Integration Errors

#### Validation Errors

\`\`\`typescript
try {
  const customer = await client.customers.create(customerData);
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
//   console.log('Validation failed:', error.details);
    // Handle specific validation errors
    for (const detail of error.details) {
//   console.log(\`Field \${detail.field}: \${detail.message}\`);
    }
  }
}
\`\`\`

#### Rate Limiting

\`\`\`typescript
const response = await client.customers.list();
if (response.headers['X-RateLimit-Remaining'] < 10) {
  // Implement backoff strategy
  await delay(1000); // Wait 1 second
}
\`\`\`

#### Network Errors

\`\`\`typescript
// Implement retry logic with exponential backoff
const retryWithBackoff = async (fn: Function, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
};
\`\`\`

## Performance Optimization

### Batch Operations

Use batch operations for bulk data processing:

\`\`\`typescript
// Batch create customers
const customers = [/* array of customer data */];
const results = await client.customers.createBatch(customers);

// Handle results
const successful = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success).length;
//   console.log(\`Batch completed: \${successful} successful, \${failed} failed\`);
\`\`\`

### Pagination

Handle large datasets efficiently:

\`\`\`typescript
let allCustomers = [];
let offset = 0;
const limit = 100;

while (true) {
  const response = await client.customers.list({ limit, offset });

  allCustomers = allCustomers.concat(response.data);

  if (response.data.length < limit) break; // Last page

  offset += limit;
}
// 
  console.log(\`Retrieved \${allCustomers.length} customers\`);
\`\`\`

### Caching

Implement caching for frequently accessed data:

\`\`\`typescript
const cache = new Map();

const getCustomerWithCache = async (id: string) => {
  if (cache.has(id)) {
    return cache.get(id);
  }

  const customer = await client.customers.get(id);
  cache.set(id, customer);

  // Set expiration (e.g., 5 minutes)
  setTimeout(() => cache.delete(id), 5 * 60 * 1000);

  return customer;
};
\`\`\`

## Security Best Practices

### API Key Security

- Store API keys securely (environment variables, key management systems)
- Rotate keys regularly
- Use different keys for development, staging, and production
- Never commit API keys to version control

### Data Protection

- Encrypt sensitive data in transit (HTTPS required)
- Implement proper access controls
- Log access for audit purposes
- Follow data retention policies

### Network Security

- Use firewalls to restrict access to REFUSE Protocol endpoints
- Implement DDoS protection
- Monitor for unusual activity patterns
- Use VPN for internal network access

## Monitoring and Logging

### Health Checks

Implement health check endpoints:

\`\`\`typescript
app.get('/health', async (req, res) => {
  try {
    // Check REFUSE Protocol connectivity
    await client.system.health();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      refuseProtocol: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
\`\`\`

### Logging

Log all REFUSE Protocol interactions:

\`\`\`typescript
const logger = {
  info: (message: string, meta?: any) => {
//   console.log(\`[INFO] \${message}\`, meta);
  },
  error: (message: string, error?: any) => {
//   console.error(\`[ERROR] \${message}\`, error);
  },
  warn: (message: string, meta?: any) => {
//   console.warn(\`[WARN] \${message}\`, meta);
  }
};

// Log API calls
const originalRequest = client._makeRequest;
client._makeRequest = async (method: string, path: string, data?: any) => {
  const startTime = Date.now();

  try {
    const result = await originalRequest.call(client, method, path, data);

    logger.info(\`API call successful\`, {
      method,
      path,
      duration: Date.now() - startTime,
      statusCode: result.status
    });

    return result;
  } catch (error) {
    logger.error(\`API call failed\`, {
      method,
      path,
      duration: Date.now() - startTime,
      error: error.message
    });

    throw error;
  }
};
\`\`\`

## Troubleshooting

### Common Issues

#### Authentication Failures

**Problem**: Getting 401 Unauthorized errors

**Solutions**:
1. Verify API key is correct and active
2. Check if API key has expired
3. Ensure correct authentication headers
4. Verify base URL is correct

#### Validation Errors

**Problem**: Getting 400 Bad Request with validation errors

**Solutions**:
1. Check data format matches schema requirements
2. Verify required fields are present
3. Ensure data types are correct (strings, numbers, etc.)
4. Check enum values are valid

#### Rate Limiting

**Problem**: Getting 429 Too Many Requests errors

**Solutions**:
1. Implement exponential backoff
2. Batch requests where possible
3. Upgrade to higher rate limit tier if needed
4. Cache frequently accessed data

#### Data Not Found

**Problem**: Getting 404 Not Found errors

**Solutions**:
1. Verify resource IDs are correct
2. Check if resources exist in the system
3. Ensure proper permissions to access resources
4. Verify API endpoint URLs

## Support Resources

### Documentation
- **API Reference**: [https://docs.refuse-protocol.org/api](https://docs.refuse-protocol.org/api)
- **Integration Guides**: [https://docs.refuse-protocol.org/guides](https://docs.refuse-protocol.org/guides)
- **Schema Documentation**: [https://docs.refuse-protocol.org/schemas](https://docs.refuse-protocol.org/schemas)

### Community
- **Discussion Forum**: [https://community.refuse-protocol.org](https://community.refuse-protocol.org)
- **GitHub Issues**: [https://github.com/refuse-protocol/refuse-protocol/issues](https://github.com/refuse-protocol/refuse-protocol/issues)
- **Discord Chat**: [https://discord.gg/refuse-protocol](https://discord.gg/refuse-protocol)

### Support
- **Email Support**: support@refuse-protocol.org
- **Enterprise Support**: enterprise@refuse-protocol.org
- **Phone Support**: +1 (555) 123-4567 (business hours)

## Next Steps

1. **Review the API Reference** for complete endpoint documentation
2. **Explore the SDKs** for your preferred programming language
3. **Set up testing** with the validation tools
4. **Plan your migration** using the data transformation utilities
5. **Join the community** for support and best practices

Happy integrating with the REFUSE Protocol! 🚀

---

*Generated by REFUSE Protocol Spec Generator v1.0.0*
`;

    writeFileSync(integrationPath, integrationDoc, 'utf8');
    this.trackGeneratedFile(integrationPath, 'Integration Guide');
  }

  /**
   * Generate examples documentation
   */
  private async generateExamplesDocumentation(options: GenerationOptions): Promise<void> {
    const examplesPath = join(this.outputDir, 'examples.md');

    const examplesDoc = `# REFUSE Protocol Examples

## Overview

This document provides practical examples of using the REFUSE Protocol in real-world scenarios. These examples demonstrate common patterns and best practices for waste management system integration.

## Customer Management Examples

### Creating a New Customer

\`\`\`typescript

const client = new REFUSEClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.yourcompany.com/refuse/v1'
});

// Create a commercial customer
const customer = await client.customers.create({
  name: 'GreenTech Solutions',
  type: 'commercial',
  status: 'active',
  serviceAddress: {
    street1: '456 Industrial Blvd',
    street2: 'Suite 200',
    city: 'Manufacturing City',
    state: 'TX',
    zipCode: '75001',
    country: 'US'
  },
  billingAddress: {
    street1: '456 Industrial Blvd',
    street2: 'Suite 200',
    city: 'Manufacturing City',
    state: 'TX',
    zipCode: '75001',
    country: 'US'
  },
  contactInformation: {
    primaryContact: {
      name: 'John Smith',
      title: 'Operations Manager',
      email: 'john.smith@greentechsolutions.com',
      phone: '+1-555-0123',
      mobile: '+1-555-0456'
    },
    billingContact: {
      name: 'Sarah Johnson',
      title: 'Accounts Payable',
      email: 'sarah.johnson@greentechsolutions.com',
      phone: '+1-555-0789'
    }
  },
  businessInfo: {
    industry: 'Manufacturing',
    employeeCount: 150,
    establishedYear: 2005,
    website: 'https://www.greentechsolutions.com'
  },
  metadata: {
    legacySystemId: 'CUST-2024-001',
    salesRep: 'mike.wilson',
    onboardingDate: '2024-01-15'
  }
});
// 
  console.log('Customer created:', customer.id);
\`\`\`

### Managing Customer Sites

\`\`\`typescript
// Add multiple service locations
const mainOfficeSite = await client.sites.create({
  customerId: customer.id,
  name: 'Main Office',
  address: {
    street1: '456 Industrial Blvd',
    street2: 'Building A',
    city: 'Manufacturing City',
    state: 'TX',
    zipCode: '75001',
    country: 'US'
  },
  services: ['service-1', 'service-2'],
  containers: ['container-1', 'container-2'],
  environmentalPermits: [{
    permitType: 'hazardous_waste',
    permitNumber: 'HW-2024-001',
    issuingAuthority: 'Texas Environmental Agency',
    validFrom: '2024-01-01',
    validTo: '2024-12-31'
  }]
});

const warehouseSite = await client.sites.create({
  customerId: customer.id,
  name: 'Warehouse Facility',
  address: {
    street1: '789 Distribution Way',
    city: 'Manufacturing City',
    state: 'TX',
    zipCode: '75002',
    country: 'US'
  },
  services: ['service-3'],
  containers: ['container-3', 'container-4']
});
\`\`\`

## Service Management Examples

### Creating Service Definitions

\`\`\`typescript
// Create waste collection service
const wasteService = await client.services.create({
  customerId: customer.id,
  siteId: mainOfficeSite.id,
  serviceType: 'waste',
  containerType: 'dumpster',
  schedule: {
    frequency: 'weekly',
    dayOfWeek: 'monday',
    startDate: '2024-02-01',
    endDate: '2024-12-31'
  },
  status: 'active',
  pricing: {
    baseRate: 150.00,
    rateUnit: 'month',
    fuelSurcharge: 0.05,
    environmentalFee: 10.00
  }
});

// Create recycling service
const recyclingService = await client.services.create({
  customerId: customer.id,
  siteId: mainOfficeSite.id,
  serviceType: 'recycling',
  containerType: 'cart',
  schedule: {
    frequency: 'bi-weekly',
    dayOfWeek: 'wednesday',
    startDate: '2024-02-01',
    endDate: '2024-12-31'
  },
  status: 'active'
});
\`\`\`

### Managing Service Schedules

\`\`\`typescript
// Update service schedule
const updatedService = await client.services.update(wasteService.id, {
  schedule: {
    frequency: 'weekly',
    dayOfWeek: 'tuesday', // Changed from Monday
    startDate: '2024-02-01',
    endDate: '2024-12-31'
  }
});

// Add extra pickup
const extraPickup = await client.services.scheduleExtraPickup(wasteService.id, {
  scheduledDate: '2024-02-15',
  reason: 'Special waste disposal',
  notes: 'Customer requested additional pickup for renovation waste'
});
\`\`\`

## Route Optimization Examples

### Creating Optimized Routes

\`\`\`typescript
// Create route with customer sites
const mondayRoute = await client.routes.create({
  name: 'Monday Commercial Route 1',
  schedule: {
    frequency: 'weekly',
    dayOfWeek: 'monday',
    startTime: '06:00',
    endTime: '15:00'
  },
  assignedSites: [mainOfficeSite.id, warehouseSite.id, 'other-site-1'],
  efficiency: 85.5,
  status: 'active'
});

// Optimize route based on geographic location
const optimizedRoute = await client.routes.optimize(mondayRoute.id, {
  optimizationType: 'geographic',
  maxStops: 25,
  timeWindows: true,
  trafficConsideration: true
});
// 
  console.log('Optimized route efficiency:', optimizedRoute.efficiency);
\`\`\`

### Route Performance Tracking

\`\`\`typescript
// Track route completion
const routeCompletion = await client.routes.complete(mondayRoute.id, {
  actualStartTime: '06:15', // Started 15 minutes late
  actualEndTime: '14:30',   // Finished 30 minutes early
  totalStops: 23,
  completedStops: 23,
  skippedStops: 0,
  notes: 'Good weather conditions, traffic was light',
  fuelUsed: 12.5, // gallons
  distanceTraveled: 45.2 // miles
});

// Get route performance metrics
const performance = await client.routes.getPerformance(mondayRoute.id, {
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
// 
  console.log('Average efficiency:', performance.averageEfficiency);
//   console.log('On-time performance:', performance.onTimePercentage);
\`\`\`

## Facility Management Examples

### Managing Processing Facilities

\`\`\`typescript
// Create material recovery facility
const mrf = await client.facilities.create({
  name: 'North County MRF',
  code: 'NCMRF-001',
  type: 'mrf',
  status: 'operational',
  address: {
    street1: '100 Recycling Drive',
    city: 'North County',
    state: 'CA',
    zipCode: '95000',
    country: 'US'
  },
  acceptedMaterials: ['recycling', 'organics', 'paper', 'plastic', 'metal', 'glass'],
  operatingHours: {
    monday: { open: '05:00', close: '17:00' },
    tuesday: { open: '05:00', close: '17:00' },
    wednesday: { open: '05:00', close: '17:00' },
    thursday: { open: '05:00', close: '17:00' },
    friday: { open: '05:00', close: '17:00' },
    saturday: { open: '07:00', close: '12:00' },
    sunday: { closed: true }
  },
  capacity: {
    dailyCapacity: 200, // tons per day
    monthlyCapacity: 6000 // tons per month
  }
});
\`\`\`

### Facility Capacity Management

\`\`\`typescript
// Check facility utilization
const utilization = await client.facilities.getUtilization(mrf.id, {
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
// 
  console.log('Daily average utilization:', utilization.averageDailyUtilization);
//   console.log('Peak utilization day:', utilization.peakUtilization.date);

// Check if facility can accept more material
const canAccept = await client.facilities.canAcceptMaterial(mrf.id, {
  materialType: 'recycling',
  quantity: 50, // tons
  deliveryDate: '2024-02-01'
});

if (canAccept.accepted) {
//   console.log('Facility can accept the material');
//   console.log('Available capacity:', canAccept.availableCapacity);
} else {
//   console.log('Facility cannot accept material:', canAccept.reason);
}
\`\`\`

## Event Streaming Examples

### Real-time Event Processing

\`\`\`typescript

const streamer = new EventStreamer({
  apiKey: 'your-api-key',
  baseURL: 'https://api.yourcompany.com/refuse/v1'
});

// Subscribe to multiple event types
streamer.subscribe(
  ['customer', 'service', 'route', 'facility'],
  ['created', 'updated', 'completed', 'cancelled'],
  async (event) => {
//   console.log(\`Event: \${event.entityType}.\${event.eventType}\`);

    // Handle different event types
    switch (event.entityType) {
      case 'customer':
        await handleCustomerEvent(event);
        break;
      case 'service':
        await handleServiceEvent(event);
        break;
      case 'route':
        await handleRouteEvent(event);
        break;
      case 'facility':
        await handleFacilityEvent(event);
        break;
    }
  }
);

async function handleCustomerEvent(event: any) {
  switch (event.eventType) {
    case 'created':
//   console.log('New customer onboarded:', event.eventData.name);
      // Trigger welcome email, setup billing, etc.
      break;
    case 'updated':
//   console.log('Customer updated:', event.eventData.name);
      // Update CRM, recalculate pricing, etc.
      break;
  }
}

async function handleServiceEvent(event: any) {
  switch (event.eventType) {
    case 'created':
//   console.log('New service created for customer');
      // Schedule initial pickup, assign containers, etc.
      break;
    case 'completed':
//   console.log('Service completed:', event.eventData.serviceType);
      // Process payment, update next service date, etc.
      break;
  }
}
\`\`\`

## Data Validation Examples

### Using the Schema Validator

\`\`\`typescript
import { SchemaValidator } from 'refuse-protocol-sdk';

const validator = new SchemaValidator();

// Load all schemas
await validator.loadAllSchemas('./schemas');

// Validate customer data
const customerData = {
  name: 'Test Customer',
  type: 'commercial',
  // ... other customer properties
};

const validationResult = validator.validate('./schemas/customer-schema.json', customerData);

if (validationResult.isValid) {
//   console.log('✅ Customer data is valid');
} else {
//   console.log('❌ Validation failed:');
  validationResult.errors.forEach(error => {
//   console.log(\`  - \${error.path}: \${error.message}\`);
//   console.log(\`    Suggestion: \${error.suggestion}\`);
  });
}
\`\`\`

## Error Handling Examples

### Comprehensive Error Handling

\`\`\`typescript
class REFUSEIntegrationService {
  private client: REFUSEClient;
  private logger: Logger;

  async createCustomerWithRetry(customerData: any, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const customer = await this.client.customers.create(customerData);

        this.logger.info('Customer created successfully', {
          customerId: customer.id,
          attempt,
          name: customerData.name
        });

        return customer;
      } catch (error) {
        this.logger.warn('Customer creation failed', {
          attempt,
          maxRetries,
          error: error.message,
          customerName: customerData.name
        });

        if (attempt === maxRetries) {
          throw new Error(\`Failed to create customer after \${maxRetries} attempts: \${error.message}\`);
        }

        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  async handleValidationError(error: any, data: any) {
    if (error.code === 'VALIDATION_ERROR') {
      const validationErrors = error.details;

      for (const validationError of validationErrors) {
        this.logger.warn('Validation error', {
          field: validationError.field,
          message: validationError.message,
          providedValue: this.getNestedValue(data, validationError.field)
        });
      }

      // Attempt to fix common validation errors
      const fixedData = await this.fixValidationErrors(data, validationErrors);

      if (fixedData) {
        return await this.createCustomerWithRetry(fixedData);
      }
    }

    throw error;
  }

  private getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async fixValidationErrors(data: any, errors: any[]) {
    const fixedData = { ...data };

    for (const error of errors) {
      switch (error.code) {
        case 'REQUIRED':
          // Skip - required fields should be provided by caller
          break;
        case 'TYPE_MISMATCH':
          fixedData[error.field] = this.convertType(fixedData[error.field], error.expectedType);
          break;
        case 'INVALID_FORMAT':
          fixedData[error.field] = this.formatValue(fixedData[error.field], error.format);
          break;
        // Add more error handling as needed
      }
    }

    return fixedData;
  }

  private convertType(value: any, targetType: string) {
    switch (targetType) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      default:
        return value;
    }
  }

  private formatValue(value: any, format: string) {
    // Implement format-specific conversions
    // (e.g., date formatting, phone number formatting)
    return value;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
\`\`\`

## Best Practices

### 1. Data Validation

Always validate data before sending to the API:

\`\`\`typescript
// Validate before creating
const validation = validator.validate('./schemas/customer-schema.json', customerData);
if (!validation.isValid) {
  throw new Error(\`Invalid customer data: \${validation.errors.map(e => e.message).join(', ')}\`);
}

const customer = await client.customers.create(customerData);
\`\`\`

### 2. Error Handling

Implement comprehensive error handling:

\`\`\`typescript
try {
  const result = await client.customers.create(customerData);
} catch (error) {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      handleValidationError(error);
      break;
    case 'RATE_LIMIT_EXCEEDED':
      await delay(1000); // Wait and retry
      break;
    case 'NETWORK_ERROR':
      // Retry with exponential backoff
      break;
    default:
      // Log and alert
  }
}
\`\`\`

### 3. Performance Optimization

Use batch operations for bulk processing:

\`\`\`typescript
// Batch create multiple customers
const customerDataArray = [/* array of customer data */];
const results = await client.customers.createBatch(customerDataArray);

// Process results
const successful = results.filter(r => r.success);
const failed = results.filter(r => !r.success);
// 
  console.log(\`Created \${successful.length} customers, \${failed.length} failed\`);
\`\`\`

### 4. Monitoring

Monitor API usage and performance:

\`\`\`typescript
// Monitor rate limits
const response = await client.customers.list();
const remainingRequests = response.headers['X-RateLimit-Remaining'];

if (remainingRequests < 100) {
  logger.warn('Approaching rate limit', { remainingRequests });
}

// Monitor performance
const startTime = Date.now();
const result = await client.customers.get(customerId);
const duration = Date.now() - startTime;

if (duration > 5000) { // 5 seconds
  logger.warn('Slow API response', { duration, endpoint: 'GET /customers/{id}' });
}
\`\`\`

## Conclusion

These examples demonstrate the key patterns for integrating with the REFUSE Protocol. For more detailed examples and specific use cases, see the [API Reference](api-reference.md) and [Integration Guide](integration-guide.md).

Remember to:

1. **Validate early and often** using the schema validation tools
2. **Handle errors gracefully** with appropriate retry logic
3. **Monitor performance** and rate limits
4. **Use batch operations** for bulk data processing
5. **Follow security best practices** for API key management

Happy coding! 🚀

---

*Generated by REFUSE Protocol Spec Generator v1.0.0*
`;

    writeFileSync(examplesPath, examplesDoc, 'utf8');
    this.trackGeneratedFile(examplesPath, 'Examples Documentation');
  }

  /**
   * Track generated file
   */
  private trackGeneratedFile(filePath: string, description: string): void {
    this.generatedFiles.push(filePath);
  }

  /**
   * Get list of generated files
   */
  getGeneratedFiles(): string[] {
    return [...this.generatedFiles];
  }
}

/**
 * Spec generator options
 */
export interface GenerationOptions {
  implementationsDir?: string;
  contractsDir?: string;
  outputDir?: string;
  verbose?: boolean;
  includePrivate?: boolean;
  includeInternal?: boolean;
}

/**
 * Generation result interface
 */
export interface GenerationResult {
  timestamp: string;
  totalFilesGenerated: number;
  files: Array<{ path: string; type: string; size: number }>;
  errors: string[];
}

/**
 * JSDoc parser for extracting documentation from TypeScript files
 */
export class JSDocParser {
  parse(content: string): ParsedJSDoc {
    const result: ParsedJSDoc = {
      description: '',
      properties: [],
      methods: [],
      examples: [],
      tags: {},
    };

    // Extract description (first JSDoc comment)
    const descriptionMatch = content.match(/\/\*\*\s*\n((?:\s*\*.*\n?)*?)\s*\*\//);
    if (descriptionMatch) {
      result.description = this.cleanJSDocComment(descriptionMatch[1]);
    }

    // Extract @property tags
    const propertyMatches = content.matchAll(
      /@property\s+{(\w+)}\s+(\w+)\s+-\s*(.*?)(?=\n\s*\*|$)/g
    );
    for (const match of propertyMatches) {
      result.properties.push({
        type: match[1],
        name: match[2],
        description: this.cleanJSDocComment(match[3]),
      });
    }

    // Extract @param tags
    const paramMatches = content.matchAll(/@param\s+{(\w+)}\s+(\w+)\s+-\s*(.*?)(?=\n\s*\*|$)/g);
    for (const match of paramMatches) {
      result.properties.push({
        type: match[1],
        name: match[2],
        description: this.cleanJSDocComment(match[3]),
        isParameter: true,
      });
    }

    // Extract @method tags
    const methodMatches = content.matchAll(/@method\s+(\w+)\s*\n\s*\*?\s*(.*?)(?=\n\s*\*|$)/g);
    for (const match of methodMatches) {
      result.methods.push({
        name: match[1],
        description: this.cleanJSDocComment(match[2]),
      });
    }

    // Extract @example tags
    const exampleMatches = content.matchAll(/@example\s*\n\s*\*?\s*(.*?)(?=\n\s*\*|$)/g);
    for (const match of exampleMatches) {
      result.examples.push(this.cleanJSDocComment(match[1]));
    }

    return result;
  }

  private cleanJSDocComment(comment: string): string {
    return comment
      .split('\n')
      .map((line) => line.replace(/^\s*\*/, '').trim())
      .join(' ')
      .trim();
  }
}

/**
 * Parsed JSDoc interface
 */
export interface ParsedJSDoc {
  description: string;
  properties: Array<{
    type?: string;
    name: string;
    description: string;
    optional?: boolean;
    default?: string;
    isParameter?: boolean;
  }>;
  methods: Array<{
    name: string;
    description: string;
    parameters?: Array<{
      name: string;
      type?: string;
      description: string;
    }>;
    returns?: string;
  }>;
  examples: string[];
  tags: Record<string, string>;
}

/**
 * CLI interface for spec generation
 */
export class SpecGeneratorCLI {
  private generator: SpecGenerator;

  constructor(outputDir?: string) {
    this.generator = new SpecGenerator(outputDir);
  }

  async run(args: string[]): Promise<void> {
    const command = args[0];

    switch (command) {
      case 'generate':
        await this.generateCommand(args.slice(1));
        break;
      case 'full':
        await this.fullCommand(args.slice(1));
        break;
      default:
        this.printUsage();
    }
  }

  private async generateCommand(args: string[]): Promise<void> {
    const options: GenerationOptions = {};

    // Parse options
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--implementations') {
        options.implementationsDir = args[++i];
      } else if (arg === '--contracts') {
        options.contractsDir = args[++i];
      } else if (arg === '--output') {
        options.outputDir = args[++i];
      } else if (arg === '--verbose') {
        options.verbose = true;
      }
    }

    try {
      const result = await this.generator.generateFullSpecification(options);

  console.log(chalk.green(`✅ Generated ${result.files.length} documentation files`));
  console.log(chalk.blue('Generated files:'));
      result.files.forEach((file) => {
  console.log(`  📄 ${file.path} (${file.size} bytes)`);
      });

      if (result.errors.length > 0) {
  console.warn(chalk.yellow(`⚠️ ${result.errors.length} errors occurred:`));
  result.errors.forEach((error) => console.warn(`  - ${error}`));
      }
    } catch (error) {
  console.error(
        chalk.red(`❌ Generation failed: ${error instanceof Error ? error.message : String(error)}`)
      );
      process.exit(1);
    }
  }

  private async fullCommand(args: string[]): Promise<void> {
    // Full generation with all default options
    await this.generateCommand(['--verbose', ...args]);
  }

  private printUsage(): void {
  console.log(chalk.blue('\nREFUSE Protocol Specification Generator'));
  console.log(chalk.gray('Usage: spec-generator <command> [options]\n'));

  console.log(chalk.green('Commands:'));
//   console.log('  generate [options]    Generate documentation with custom options');
  console.log('  full [options]        Generate complete documentation (same as generate)\n');

  console.log(chalk.green('Options:'));
//   console.log('  --implementations <dir>  Path to entity implementation directory');
//   console.log('  --contracts <dir>        Path to JSON schema contracts directory');
//   console.log('  --output <dir>           Output directory for generated docs');
//   console.log('  --verbose                Enable verbose logging\n');

  console.log(chalk.green('Examples:'));
  console.log('  spec-generator generate --output ./docs --verbose');
  console.log(
      '  spec-generator generate --implementations ./protocol/implementations --contracts ./contracts'
    );
//   console.log('  spec-generator full --output ./documentation --verbose\n');
  }
}

/**
 * Export factory functions
 */
export function createSpecGenerator(outputDir?: string): SpecGenerator {
  return new SpecGenerator(outputDir);
}

export function createSpecGeneratorCLI(outputDir?: string): SpecGeneratorCLI {
  return new SpecGeneratorCLI(outputDir);
}

// Export types
export type { GenerationOptions, GenerationResult, ParsedJSDoc };
