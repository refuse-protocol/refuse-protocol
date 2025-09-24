# REFUSE Protocol Facility Capacity Management Service

A comprehensive facility capacity management service that demonstrates advanced optimization algorithms for managing waste processing facilities using REFUSE Protocol entities.

## Overview

This reference implementation showcases:

- **Multi-Facility Optimization**: Capacity management across multiple processing facilities
- **Real-time Scheduling**: Dynamic scheduling based on material types and processing rates
- **Quality Management**: Material quality tracking and contamination monitoring
- **LEED Integration**: Environmental compliance and sustainability tracking
- **Predictive Analytics**: Wait time prediction and throughput optimization
- **REFUSE Protocol Integration**: Full integration with Facility and MaterialTicket entities

## Features

### 🏭 Facility Capacity Management
- **Multi-criteria optimization** for capacity allocation
- **Material type balancing** across facilities
- **Quality-based routing** for optimal processing
- **Real-time capacity monitoring** and updates
- **Predictive scheduling** with wait time estimation

### 📊 Quality & Environmental Tracking
- **Material quality assessment** and grading
- **Contamination monitoring** and reporting
- **LEED point allocation** and verification
- **Environmental compliance** tracking
- **Sustainability metrics** calculation

### ⚙️ Optimization Algorithms
- **Capacity balancing** across facilities
- **Material flow optimization** based on processing rates
- **Quality prioritization** routing
- **Time-window scheduling** with constraints
- **Multi-objective optimization** with weighted criteria

### 🔄 Real-time Processing
- **Live material ticket processing**
- **Dynamic capacity updates**
- **Route assignment optimization**
- **Emergency handling** and priority routing
- **Event-driven updates**

## Technology Stack

- **Backend**: Node.js + TypeScript + Express
- **Validation**: Joi schema validation
- **Caching**: Redis for real-time data
- **Algorithms**: Custom optimization algorithms
- **Date Handling**: date-fns
- **Error Handling**: Comprehensive error handling
- **Security**: Helmet security headers, CORS

## REFUSE Protocol Integration

### Entity Usage
- **Facility**: Complete facility lifecycle management
- **MaterialTicket**: Material processing and quality tracking
- **Route**: Route assignment and scheduling
- **Customer**: Customer and material source tracking
- **EnvironmentalCompliance**: LEED and sustainability tracking

### Optimization Criteria
```typescript
interface CapacityOptimizationCriteria {
  maximizeThroughput: boolean        // Maximize material processing
  minimizeWaitTime: boolean          // Minimize facility wait times
  balanceLoad: boolean               // Balance load across facilities
  prioritizeQuality: boolean         // Prioritize quality over speed
  throughputWeight: number           // Weight for throughput optimization
  waitTimeWeight: number            // Weight for wait time optimization
  balanceWeight: number             // Weight for load balancing
  qualityWeight: number             // Weight for quality optimization
}
```

### Constraints
```typescript
interface CapacityConstraints {
  maxCapacityPerSlot: number         // Maximum capacity per time slot
  minQualityThreshold: number        // Minimum quality threshold
  maxContaminationRate: number       // Maximum contamination allowed
  workingHours: { start: string, end: string }
  maintenanceWindows: MaintenanceWindow[]
  priorityConstraints: {
    highPriorityRoutes: boolean      // Handle high priority routes first
    emergencyDeliveries: boolean     // Allow emergency deliveries
  }
}
```

## API Endpoints

### POST /api/capacity/optimize
Optimize facility capacity allocation based on material tickets and constraints.

**Request Body:**
```json
{
  "facilities": [
    {
      "id": "facility-001",
      "name": "Main Processing Facility",
      "type": "mrf",
      "capacity": {
        "total": 1000,
        "available": 750,
        "unit": "tons/day"
      },
      "acceptedMaterials": ["mixed_waste", "recycling", "organics"],
      "operatingHours": {
        "open": "06:00",
        "close": "18:00",
        "timezone": "America/Los_Angeles"
      }
    }
  ],
  "materialTickets": [
    {
      "id": "ticket-001",
      "customerId": "customer-001",
      "facilityId": "facility-001",
      "material": {
        "id": "mat-001",
        "name": "Mixed Paper",
        "type": "recycling",
        "classification": "paper"
      },
      "weight": {
        "gross": 2500,
        "tare": 500,
        "net": 2000
      },
      "qualityGrade": "excellent",
      "leedAllocations": [
        {
          "category": "materials_reuse",
          "points": 2,
          "verified": true
        }
      ]
    }
  ],
  "optimizationCriteria": {
    "maximizeThroughput": true,
    "minimizeWaitTime": true,
    "balanceLoad": true,
    "prioritizeQuality": true,
    "throughputWeight": 0.3,
    "waitTimeWeight": 0.3,
    "balanceWeight": 0.2,
    "qualityWeight": 0.2
  },
  "constraints": {
    "maxCapacityPerSlot": 100,
    "minQualityThreshold": 70,
    "maxContaminationRate": 5,
    "workingHours": {
      "start": "06:00",
      "end": "18:00"
    },
    "priorityConstraints": {
      "highPriorityRoutes": true,
      "emergencyDeliveries": true
    }
  },
  "timeRange": {
    "start": "2024-01-15T06:00:00Z",
    "end": "2024-01-15T18:00:00Z"
  }
}
```

**Response:**
```json
{
  "optimizedSchedule": [...],
  "capacityUtilization": [
    {
      "facilityId": "facility-001",
      "utilizationRate": 75.5,
      "throughput": 850,
      "waitTime": 15
    }
  ],
  "improvements": {
    "throughputIncrease": 12.3,
    "waitTimeReduction": 25.7,
    "loadBalanceImprovement": 8.5,
    "qualityImprovement": 15.2
  },
  "warnings": [],
  "errors": []
}
```

### GET /api/facilities/:facilityId/capacity
Get facility capacity information

### GET /api/facilities/:facilityId/schedule
Get facility schedule for the current period

### POST /api/facilities/:facilityId/material-tickets
Process a material ticket at a facility

### GET /api/facilities
Get all facilities

### GET /health
Health check endpoint

## Algorithms

### Capacity Optimization Algorithm
- **Multi-objective optimization** balancing throughput, wait time, load balance, and quality
- **Material type routing** based on facility capabilities and processing rates
- **Time-slot allocation** with capacity constraints
- **Quality-based prioritization** for optimal environmental outcomes
- **Real-time adjustment** based on actual vs. planned utilization

### Quality Assessment
- **Material grading** (excellent, good, fair, poor)
- **Contamination detection** and measurement
- **LEED point calculation** and allocation
- **Environmental impact scoring**
- **Sustainability metrics** tracking

### Predictive Analytics
- **Wait time prediction** based on current utilization
- **Throughput forecasting** using historical data
- **Capacity utilization modeling**
- **Material flow prediction**
- **Environmental impact estimation**

## Getting Started

### Prerequisites
- Node.js 18+
- TypeScript 4.9+
- Redis (for caching)
- REFUSE Protocol entities

### Installation

1. **Install dependencies:**
```bash
cd examples/facility-manager
npm install
```

2. **Start Redis server:**
```bash
redis-server
```

3. **Start development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
npm start
```

### Configuration

Create `.env` file:
```env
PORT=3003
NODE_ENV=development
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

## Usage Examples

### Basic Capacity Optimization
```typescript
import axios from 'axios'

const response = await axios.post('http://localhost:3003/api/capacity/optimize', {
  facilities: [/* facility data */],
  materialTickets: [/* ticket data */],
  optimizationCriteria: {
    maximizeThroughput: true,
    minimizeWaitTime: true,
    balanceLoad: true,
    prioritizeQuality: true
  },
  constraints: {
    maxCapacityPerSlot: 100,
    minQualityThreshold: 70,
    maxContaminationRate: 5
  },
  timeRange: {
    start: new Date('2024-01-15T06:00:00Z'),
    end: new Date('2024-01-15T18:00:00Z')
  }
})

console.log('Optimization results:', response.data)
```

### Material Ticket Processing
```typescript
const ticketResponse = await axios.post('http://localhost:3003/api/facilities/facility-001/material-tickets', {
  id: 'ticket-001',
  customerId: 'customer-001',
  material: {
    id: 'mat-001',
    name: 'Mixed Paper',
    type: 'recycling',
    classification: 'paper'
  },
  weight: {
    gross: 2500,
    tare: 500,
    net: 2000
  },
  qualityGrade: 'excellent',
  leedAllocations: [
    {
      category: 'materials_reuse',
      points: 2,
      verified: true
    }
  ]
})

console.log('Ticket processed:', ticketResponse.data)
```

## Performance Considerations

### Scalability
- **Horizontal scaling** across multiple facility managers
- **Redis caching** for real-time data
- **Database optimization** for high-volume material tickets
- **Background processing** for complex optimizations

### Monitoring
- **Capacity utilization tracking**
- **Wait time monitoring**
- **Quality metrics dashboard**
- **Performance analytics**
- **Alert system** for capacity issues

### Quality Assurance
- **Material quality validation**
- **Contamination detection**
- **LEED compliance verification**
- **Environmental impact tracking**

## Development Guidelines

### Adding New Features
1. Define new optimization criteria in schemas
2. Implement algorithms in `algorithms/` directory
3. Add validation rules
4. Update API documentation
5. Add comprehensive tests

### Testing
```bash
# Run unit tests
npm test

# Test optimization scenarios
npm run test -- --grep "optimization"

# Performance testing
npm run test -- --grep "performance"
```

## Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3003
CMD ["npm", "start"]
```

### Docker Compose with Redis
```yaml
version: '3.8'
services:
  facility-manager:
    build: .
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - PORT=3003
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

## Integration Examples

### With REFUSE Protocol SDK
```typescript
import { RefuseProtocolSDK } from '@refuse-protocol/sdk'
import axios from 'axios'

const sdk = new RefuseProtocolSDK()

// Get facilities and material tickets
const facilities = await sdk.getFacilities()
const materialTickets = await sdk.getMaterialTickets()

// Optimize capacity
const optimizationResponse = await axios.post('http://localhost:3003/api/capacity/optimize', {
  facilities,
  materialTickets,
  optimizationCriteria: { /* criteria */ },
  constraints: { /* constraints */ },
  timeRange: {
    start: new Date(),
    end: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
  }
})

// Update facility schedules
await sdk.updateFacilitySchedules(optimizationResponse.data.optimizedSchedule)
```

### Event-Driven Updates
```typescript
import { EventStreamingSystem } from '@refuse-protocol/event-system'

const eventSystem = new EventStreamingSystem()

// Trigger optimization on material ticket arrival
eventSystem.subscribe('material_ticket_created', async (event) => {
  const optimizationResponse = await optimizeFacilityCapacity()
  await updateFacilitySchedules(optimizationResponse.optimizedSchedule)
})
```

## Contributing

1. Follow TypeScript and Node.js best practices
2. Add comprehensive unit tests for new algorithms
3. Update API documentation for new endpoints
4. Maintain REFUSE Protocol entity relationships
5. Include performance benchmarks for new optimizations

## License

This reference implementation is provided under the REFUSE Protocol license for educational and development purposes.

## Support

For questions about REFUSE Protocol facility management:
- Documentation: [REFUSE Protocol Docs](https://docs.refuse-protocol.org)
- SDK: [REFUSE Protocol SDK](https://github.com/refuse-protocol/sdk)
- Community: [REFUSE Protocol Community](https://community.refuse-protocol.org)

---

**Built with 🏭 and ❤️ for REFUSE Protocol**
