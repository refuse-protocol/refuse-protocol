# REFUSE Protocol Customer Portal Reference Implementation

This is a comprehensive reference implementation demonstrating how to build a customer-facing portal using the REFUSE Protocol entities and specifications.

## Overview

The Customer Portal showcases real-world implementation patterns for:

- **REFUSE Protocol Integration**: Full integration with REFUSE Protocol entities
- **Customer Experience**: Modern, responsive UI for waste management operations
- **Environmental Compliance**: Built-in sustainability tracking and reporting
- **Service Management**: Complete service request and tracking workflow
- **Financial Management**: Invoice viewing and payment tracking

## Features

### 🏠 Dashboard
- Real-time service status overview
- Environmental impact metrics
- Upcoming service schedules
- Service request tracking
- Account information display

### 🚛 Services Management
- View active waste collection services
- Service details and pricing information
- Container specifications and requirements
- Service history and performance metrics
- Contract and guaranteed pricing visibility

### 💰 Invoice Management
- Complete invoice lifecycle tracking
- Line item breakdown and details
- Payment history and status
- Due date management and notifications
- Integration with financial systems

### 📋 Service Requests
- Create new service requests
- Track request status and progress
- Priority-based request handling
- Cost estimation and approval workflow
- Request history and audit trail

### 🌱 Environmental Compliance
- LEED certification progress tracking
- Carbon credit and environmental impact metrics
- Waste diversion rate monitoring
- Sustainability achievement certificates
- Compliance reporting and documentation

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom components
- **Routing**: React Router v6
- **State Management**: React Context API
- **Date Handling**: date-fns
- **HTTP Client**: Axios
- **Maps**: Leaflet + React Leaflet
- **Build Tool**: Vite
- **Linting**: ESLint + TypeScript

## REFUSE Protocol Integration

This implementation demonstrates:

### Entity Usage
- **Customer**: Account management and contact information
- **Service**: Waste collection service specifications and scheduling
- **Invoice**: Billing and payment tracking
- **Payment**: Transaction processing and reconciliation
- **CustomerRequest**: Service request workflow management
- **EnvironmentalCompliance**: Sustainability tracking and reporting
- **MaterialTicket**: Waste collection data and environmental allocations
- **Contract**: Service agreements and guaranteed pricing

### Event-Driven Architecture
- Real-time service status updates
- Environmental compliance notifications
- Invoice and payment event handling
- Service request status changes

### Data Validation
- JSON Schema validation for all entities
- Business rule validation for service requests
- Environmental compliance rule checking
- Contract and pricing validation

### Legacy System Integration
- Data transformation between legacy formats
- Field mapping and data archaeology
- Migration strategy demonstration
- Backward compatibility patterns

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- REFUSE Protocol SDK (optional for real integration)

### Installation

1. **Clone and install dependencies:**
```bash
cd examples/customer-portal
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Open browser:**
Navigate to `http://localhost:3001`

### Configuration

The portal can be configured to connect to different REFUSE Protocol endpoints:

```typescript
// src/services/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
```

## Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
│   └── Layout.tsx       # Main application layout
├── contexts/           # React Context providers
│   ├── CustomerContext.tsx
│   └── ServiceContext.tsx
├── pages/              # Main application pages
│   ├── Dashboard.tsx
│   ├── Services.tsx
│   ├── Invoices.tsx
│   ├── ServiceRequests.tsx
│   └── EnvironmentalCompliance.tsx
├── services/           # API and external service integrations
├── types/              # TypeScript type definitions
│   └── refuse-protocol.ts
└── utils/              # Utility functions and helpers
```

### Context Architecture
- **CustomerContext**: Manages customer data, services, invoices, and payments
- **ServiceContext**: Handles service requests, schedules, containers, and routes

### Component Design
- **Atomic Design**: Components follow atomic design principles
- **Responsive**: Mobile-first responsive design
- **Accessible**: WCAG 2.1 AA compliance
- **Performance**: Optimized rendering and state management

## REFUSE Protocol Best Practices

### Entity Relationships
```typescript
// Demonstrates proper entity relationships
Customer (1) ─── (many) ── Service
Customer (1) ─── (many) ── Invoice
Customer (1) ─── (many) ── CustomerRequest
Service (1) ─── (many) ── MaterialTicket
MaterialTicket (1) ─── (many) ── EnvironmentalCompliance
```

### Event Handling
```typescript
// Event-driven updates for real-time data
const handleServiceUpdate = (event: ServiceEvent) => {
  switch (event.type) {
    case 'service_completed':
      updateServiceStatus(event.serviceId, 'completed')
      break
    case 'environmental_allocation':
      updateComplianceData(event.allocationData)
      break
  }
}
```

### Data Validation
```typescript
// Schema validation using REFUSE Protocol contracts
const validateCustomerRequest = (request: CustomerRequest) => {
  const schema = getCustomerRequestSchema()
  return schema.validate(request)
}
```

## Development Guidelines

### Adding New Features
1. Define REFUSE Protocol entities in `types/refuse-protocol.ts`
2. Create context providers for state management
3. Implement UI components following existing patterns
4. Add routing in `App.tsx`
5. Update navigation in `Layout.tsx`

### Testing
```bash
# Run linting
npm run lint

# Type checking
npm run type-check

# Build for production
npm run build
```

### Environment Variables
```bash
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
```

## Deployment

### Build for Production
```bash
npm run build
```

### Docker Deployment
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Integration Examples

### Connecting to REFUSE Protocol API
```typescript
import { RefuseProtocolSDK } from '@refuse-protocol/sdk'

const sdk = new RefuseProtocolSDK({
  baseURL: 'https://api.refuse-protocol.org',
  customerId: 'CUST-001'
})

// Fetch customer data
const customer = await sdk.getCustomer()
const services = await sdk.getServices(customer.id)
```

### Real-time Event Streaming
```typescript
import { EventStreamingSystem } from '@refuse-protocol/event-system'

const eventSystem = new EventStreamingSystem()
eventSystem.subscribe('service_updated', (event) => {
  console.log('Service updated:', event.data)
})
```

### Environmental Compliance Tracking
```typescript
// Track LEED points and environmental impact
const compliance = await sdk.getEnvironmentalCompliance(customer.id)
const leedProgress = compliance.leedPoints / compliance.totalPossible
```

## Contributing

1. Follow TypeScript best practices
2. Maintain REFUSE Protocol entity relationships
3. Ensure responsive design principles
4. Add comprehensive error handling
5. Include accessibility features
6. Write clear documentation

## License

This reference implementation is provided under the REFUSE Protocol license for educational and development purposes.

## Support

For questions about REFUSE Protocol integration:
- Documentation: [REFUSE Protocol Docs](https://docs.refuse-protocol.org)
- SDK: [REFUSE Protocol SDK](https://github.com/refuse-protocol/sdk)
- Community: [REFUSE Protocol Community](https://community.refuse-protocol.org)

---

**Built with ❤️ using REFUSE Protocol**
