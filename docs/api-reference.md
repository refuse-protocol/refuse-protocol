# REFUSE Protocol API Reference

## Overview

The REFUSE Protocol provides a comprehensive RESTful API for waste management data exchange. This API follows RESTful conventions and uses JSON for all data exchange. All endpoints support standard HTTP methods (GET, POST, PUT, DELETE) with appropriate status codes.

## Base URL

```
https://api.refuse-protocol.org/v1
```

## Authentication

The REFUSE Protocol supports multiple authentication methods:

### API Key Authentication
```http
Authorization: Bearer YOUR_API_KEY
```

### OAuth 2.0
```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Basic Authentication
```http
Authorization: Basic BASE64_ENCODED_CREDENTIALS
```

## Common Response Format

All API responses follow a consistent format:

```json
{
  "data": {
    // Entity data or array of entities
  },
  "meta": {
    "version": "1.0.0",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-12345",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  },
  "links": {
    "self": "/v1/customers",
    "next": "/v1/customers?page=2",
    "prev": null
  }
}
```

## Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    },
    "requestId": "req-12345",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Common HTTP Status Codes

- `200` - OK: Request successful
- `201` - Created: Entity created successfully
- `204` - No Content: Operation successful, no response body
- `400` - Bad Request: Invalid input data
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Version conflict or business rule violation
- `422` - Unprocessable Entity: Validation error
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Standard Tier**: 1000 requests per hour
- **Professional Tier**: 10000 requests per hour
- **Enterprise Tier**: 100000 requests per hour

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1704067200
```

---

# Entity Endpoints

## Customer Endpoints

### List Customers

```http
GET /v1/customers
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 10, max: 100)
- `type` (string): Filter by customer type
- `status` (string): Filter by customer status
- `search` (string): Search in name and email
- `sort` (string): Sort field (name, createdAt, updatedAt)
- `order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "data": [
    {
      "id": "cust-123",
      "name": "Acme Manufacturing",
      "type": "commercial",
      "status": "active",
      "serviceAddress": {
        "street": "123 Industrial Way",
        "city": "Manufacturing City",
        "state": "CA",
        "zipCode": "94105"
      },
      "primaryContact": {
        "name": "John Smith",
        "email": "john@acme.com",
        "phone": "(555) 123-4567"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "version": 2
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  }
}
```

### Get Customer by ID

```http
GET /v1/customers/{id}
```

**Response:**
```json
{
  "data": {
    "id": "cust-123",
    "name": "Acme Manufacturing",
    "type": "commercial",
    "status": "active",
    "taxId": "12-3456789",
    "serviceAddress": {
      "street": "123 Industrial Way",
      "city": "Manufacturing City",
      "state": "CA",
      "zipCode": "94105"
    },
    "billingAddress": {
      "street": "PO Box 123",
      "city": "Manufacturing City",
      "state": "CA",
      "zipCode": "94105"
    },
    "primaryContact": {
      "name": "John Smith",
      "email": "john@acme.com",
      "phone": "(555) 123-4567"
    },
    "billingContact": {
      "name": "Jane Doe",
      "email": "billing@acme.com",
      "phone": "(555) 987-6543"
    },
    "serviceTypes": ["waste", "recycling"],
    "specialInstructions": "Handle with care",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "version": 2
  }
}
```

### Create Customer

```http
POST /v1/customers
```

**Request Body:**
```json
{
  "name": "Acme Manufacturing",
  "type": "commercial",
  "status": "active",
  "taxId": "12-3456789",
  "serviceAddress": {
    "street": "123 Industrial Way",
    "city": "Manufacturing City",
    "state": "CA",
    "zipCode": "94105"
  },
  "primaryContact": {
    "name": "John Smith",
    "email": "john@acme.com",
    "phone": "(555) 123-4567"
  },
  "serviceTypes": ["waste", "recycling"],
  "specialInstructions": "Handle with care"
}
```

**Response:** 201 Created with the created customer object.

### Update Customer

```http
PUT /v1/customers/{id}
```

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "status": "active",
  "serviceTypes": ["waste", "recycling", "organics"],
  "version": 2
}
```

**Note:** Include the current `version` in the request body for optimistic locking.

### Delete Customer

```http
DELETE /v1/customers/{id}
```

**Note:** Only inactive customers can be deleted.

---

## Service Endpoints

### List Services

```http
GET /v1/services
```

**Query Parameters:**
- `customerId` (string): Filter by customer
- `type` (string): Filter by service type
- `status` (string): Filter by service status
- `dateFrom` (string): Filter services from date
- `dateTo` (string): Filter services to date

### Get Service by ID

```http
GET /v1/services/{id}
```

### Create Service

```http
POST /v1/services
```

**Request Body:**
```json
{
  "customerId": "cust-123",
  "serviceType": "waste",
  "materialTypes": ["mixed_waste"],
  "frequency": "weekly",
  "containerType": "dumpster",
  "containerSize": "4_yard",
  "nextServiceDate": "2024-01-22",
  "pricing": {
    "baseRate": 150.00,
    "rateUnit": "month",
    "additionalCharges": 25.00
  }
}
```

### Update Service

```http
PUT /v1/services/{id}
```

### Delete Service

```http
DELETE /v1/services/{id}
```

---

## Route Endpoints

### List Routes

```http
GET /v1/routes
```

### Get Route by ID

```http
GET /v1/routes/{id}
```

### Create Route

```http
POST /v1/routes
```

**Request Body:**
```json
{
  "name": "Monday Route 1",
  "code": "MON-01",
  "type": "commercial",
  "schedule": {
    "startTime": "08:00",
    "endTime": "17:00",
    "workingDays": ["monday", "wednesday", "friday"]
  },
  "assignedVehicle": "VEH-001",
  "assignedDriver": "DRIVER-001",
  "assignedSites": ["SITE-001", "SITE-002"],
  "assignedServices": ["SERV-001", "SERV-002"]
}
```

### Update Route

```http
PUT /v1/routes/{id}
```

### Delete Route

```http
DELETE /v1/routes/{id}
```

---

## Facility Endpoints

### List Facilities

```http
GET /v1/facilities
```

### Get Facility by ID

```http
GET /v1/facilities/{id}
```

### Create Facility

```http
POST /v1/facilities
```

**Request Body:**
```json
{
  "name": "Main Processing Facility",
  "code": "MPF-01",
  "type": "mrf",
  "address": {
    "street": "100 Processing Blvd",
    "city": "Industrial City",
    "state": "CA",
    "zipCode": "94107"
  },
  "capacity": {
    "total": 1000,
    "available": 750,
    "unit": "tons/day"
  },
  "acceptedMaterials": ["mixed_waste", "recycling", "organics"]
}
```

### Update Facility

```http
PUT /v1/facilities/{id}
```

### Delete Facility

```http
DELETE /v1/facilities/{id}
```

---

## Material Ticket Endpoints

### List Material Tickets

```http
GET /v1/material-tickets
```

### Get Material Ticket by ID

```http
GET /v1/material-tickets/{id}
```

### Create Material Ticket

```http
POST /v1/material-tickets
```

**Request Body:**
```json
{
  "sourceType": "route",
  "sourceId": "route-123",
  "ticketNumber": "T-2024-001",
  "collectionDate": "2024-01-15",
  "materials": [{
    "name": "Mixed Waste",
    "category": "waste",
    "weight": 2000,
    "recyclable": false
  }],
  "pricing": {
    "rate": 45.00,
    "rateUnit": "ton",
    "totalAmount": 90.00
  }
}
```

### Update Material Ticket

```http
PUT /v1/material-tickets/{id}
```

### Delete Material Ticket

```http
DELETE /v1/material-tickets/{id}
```

---

## Contract Endpoints

### List Contracts

```http
GET /v1/contracts
```

### Get Contract by ID

```http
GET /v1/contracts/{id}
```

### Create Contract

```http
POST /v1/contracts
```

**Request Body:**
```json
{
  "customerId": "cust-123",
  "contractNumber": "CONT-2024-001",
  "effectiveDate": "2024-01-01",
  "expirationDate": "2024-12-31",
  "serviceTerms": [{
    "serviceType": "waste",
    "frequency": "weekly",
    "guaranteedRate": 150.00,
    "rateUnit": "month"
  }],
  "pricingTerms": [{
    "baseRate": 150.00,
    "guaranteedMinimum": 1800.00
  }]
}
```

### Update Contract

```http
PUT /v1/contracts/{id}
```

### Delete Contract

```http
DELETE /v1/contracts/{id}
```

---

## Payment Endpoints

### List Payments

```http
GET /v1/payments
```

### Get Payment by ID

```http
GET /v1/payments/{id}
```

### Create Payment

```http
POST /v1/payments
```

**Request Body:**
```json
{
  "customerId": "cust-123",
  "invoiceId": "inv-123",
  "amount": 150.00,
  "paymentDate": "2024-01-15",
  "paymentMethod": "ach",
  "referenceNumber": "ACH-2024-001"
}
```

### Update Payment

```http
PUT /v1/payments/{id}
```

### Delete Payment

```http
DELETE /v1/payments/{id}
```

---

# Event Streaming API

## WebSocket Connection

```javascript
const ws = new WebSocket('wss://api.refuse-protocol.org/v1/events');

ws.onopen = function(event) {
  // Subscribe to events
  ws.send(JSON.stringify({
    type: 'subscribe',
    filters: {
      entityTypes: ['customer', 'service'],
      eventTypes: ['created', 'updated']
    }
  }));
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received event:', data);
};
```

## Server-Sent Events (SSE)

```javascript
const eventSource = new EventSource('/v1/events/stream?entityTypes=customer,service');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received event:', data);
};

eventSource.addEventListener('customer.created', function(event) {
  const customer = JSON.parse(event.data);
  console.log('New customer created:', customer);
});
```

---

# Data Validation

## Schema Validation

All entities are validated against JSON Schema definitions:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://refuse-protocol.org/schemas/customer.json",
  "title": "Customer Entity",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "type": {
      "type": "string",
      "enum": ["residential", "commercial", "industrial", "municipal"]
    }
  },
  "required": ["id", "name", "type", "serviceAddress"]
}
```

## Business Rules Validation

Additional business rules are enforced:

- Commercial customers must have tax ID
- Active customers must have primary contact
- Service dates must be in the future
- Route capacity cannot exceed facility limits

---

# Error Handling

## Error Types

### Validation Errors
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Business Rule Errors
```json
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Commercial customers must have a tax ID",
    "details": {
      "rule": "commercial_customer_tax_id_required",
      "entityType": "customer",
      "entityId": "cust-123"
    }
  }
}
```

### Concurrency Errors
```json
{
  "error": {
    "code": "CONCURRENCY_ERROR",
    "message": "Version conflict",
    "details": {
      "expectedVersion": 2,
      "actualVersion": 3,
      "entityType": "customer",
      "entityId": "cust-123"
    }
  }
}
```

---

# SDK and Libraries

## JavaScript/TypeScript SDK

```javascript
import { RefuseProtocolSDK } from '@refuse-protocol/sdk';

// Initialize SDK
const sdk = new RefuseProtocolSDK({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.refuse-protocol.org/v1'
});

// Create a customer
const customer = await sdk.customers.create({
  name: 'Acme Manufacturing',
  type: 'commercial',
  serviceAddress: {
    street: '123 Industrial Way',
    city: 'Manufacturing City',
    state: 'CA',
    zipCode: '94105'
  }
});

console.log('Created customer:', customer);
```

## Python SDK

```python
from refuse_protocol import Client

client = Client(api_key='your-api-key')

customer = client.customers.create(
    name='Acme Manufacturing',
    type='commercial',
    service_address={
        'street': '123 Industrial Way',
        'city': 'Manufacturing City',
        'state': 'CA',
        'zip_code': '94105'
    }
)

print(f"Created customer: {customer}")
```

## Java SDK

```java
import com.refuseprotocol.Client;
import com.refuseprotocol.models.Customer;

Client client = new Client("your-api-key");

Customer customer = client.customers().create(
    new Customer()
        .setName("Acme Manufacturing")
        .setType(Customer.Type.COMMERCIAL)
        .setServiceAddress(
            new Address()
                .setStreet("123 Industrial Way")
                .setCity("Manufacturing City")
                .setState("CA")
                .setZipCode("94105")
        )
);

System.out.println("Created customer: " + customer);
```

---

# Webhooks

## Webhook Configuration

```http
POST /v1/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["customer.created", "customer.updated", "service.created"],
  "secret": "your-webhook-secret",
  "active": true
}
```

## Webhook Events

### Customer Created
```json
{
  "event": "customer.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "cust-123",
    "name": "Acme Manufacturing",
    "type": "commercial",
    "status": "active"
  }
}
```

### Service Updated
```json
{
  "event": "service.updated",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "serv-123",
    "customerId": "cust-123",
    "status": "active",
    "changes": {
      "status": {
        "from": "pending",
        "to": "active"
      }
    }
  }
}
```

### Material Ticket Processed
```json
{
  "event": "material-ticket.processed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "ticket-123",
    "sourceType": "route",
    "netWeight": 2000,
    "qualityGrade": "excellent",
    "leedsAllocations": [
      {
        "category": "materials_reuse",
        "points": 2
      }
    ]
  }
}
```

---

# Data Export and Import

## Export Data

```http
GET /v1/export/customers
```

**Query Parameters:**
- `format` (string): Export format (json, csv, xml)
- `fields` (string): Comma-separated list of fields to export
- `dateFrom` (string): Export records from date
- `dateTo` (string): Export records to date

## Import Data

```http
POST /v1/import
```

**Request Body:**
```json
{
  "entityType": "customers",
  "format": "json",
  "data": [
    {
      "name": "Imported Customer",
      "type": "commercial",
      "serviceAddress": {
        "street": "456 Import Lane",
        "city": "Import City",
        "state": "CA",
        "zipCode": "94105"
      }
    }
  ],
  "options": {
    "skipDuplicates": true,
    "validateOnly": false
  }
}
```

---

# Monitoring and Analytics

## Health Check

```http
GET /v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": "healthy",
    "eventBus": "healthy",
    "storage": "healthy"
  }
}
```

## Metrics

```http
GET /v1/metrics
```

**Response:**
```json
{
  "requests": {
    "total": 150000,
    "successful": 148500,
    "failed": 1500,
    "averageResponseTime": 125
  },
  "entities": {
    "customers": 5000,
    "services": 12000,
    "routes": 150,
    "facilities": 25
  },
  "events": {
    "published": 45000,
    "processed": 44500,
    "failed": 500
  }
}
```

---

# Best Practices

## Pagination
Always implement pagination for list endpoints to handle large datasets:

```javascript
async function getAllCustomers() {
  let allCustomers = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const response = await fetch(`/v1/customers?page=${page}&limit=${limit}`);
    const data = await response.json();

    allCustomers = allCustomers.concat(data.data);

    if (data.meta.pagination.page >= data.meta.pagination.pages) {
      break;
    }

    page++;
  }

  return allCustomers;
}
```

## Error Handling
Implement comprehensive error handling:

```javascript
async function createCustomer(customerData) {
  try {
    const response = await fetch('/v1/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(customerData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create customer:', error);
    throw error;
  }
}
```

## Optimistic Locking
Handle version conflicts gracefully:

```javascript
async function updateCustomer(customerId, updates) {
  // Get current customer to get version
  const current = await getCustomer(customerId);

  try {
    const response = await fetch(`/v1/customers/${customerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        ...updates,
        version: current.data.version
      })
    });

    if (response.status === 409) {
      // Version conflict - handle retry logic
      throw new Error('Version conflict - please retry');
    }

    return await response.json();
  } catch (error) {
    // Handle conflict by retrying or asking user to resolve
    console.error('Update failed:', error);
  }
}
```

## Caching
Implement caching for frequently accessed data:

```javascript
const cache = new Map();

async function getCustomer(customerId) {
  if (cache.has(customerId)) {
    const cached = cache.get(customerId);
    if (Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.data;
    }
  }

  const response = await fetch(`/v1/customers/${customerId}`);
  const data = await response.json();

  cache.set(customerId, {
    data: data.data,
    timestamp: Date.now()
  });

  return data.data;
}
```

---

# Support and Resources

## API Status
Check API status and uptime: [https://status.refuse-protocol.org](https://status.refuse-protocol.org)

## Documentation
Full documentation: [https://docs.refuse-protocol.org](https://docs.refuse-protocol.org)

## Community
- GitHub: [https://github.com/refuse-protocol](https://github.com/refuse-protocol)
- Discord: [https://discord.gg/refuse-protocol](https://discord.gg/refuse-protocol)
- Forum: [https://forum.refuse-protocol.org](https://forum.refuse-protocol.org)

## Support
- Email: support@refuse-protocol.org
- Support Portal: [https://support.refuse-protocol.org](https://support.refuse-protocol.org)

---

*This API reference is automatically generated and kept in sync with the REFUSE Protocol implementation.*
