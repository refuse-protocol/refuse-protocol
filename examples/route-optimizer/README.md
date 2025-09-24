# REFUSE Protocol Route Optimization Service

A comprehensive route optimization service that demonstrates advanced algorithms for optimizing waste collection routes using REFUSE Protocol entities.

## Overview

This reference implementation showcases:

- **Multi-Criteria Optimization**: Distance, time, efficiency, and workload balancing
- **Advanced Algorithms**: Nearest neighbor, 2-opt, genetic algorithms, simulated annealing
- **Constraint Management**: Vehicle capacity, time windows, working hours, break requirements
- **REFUSE Protocol Integration**: Full integration with Route and RouteStop entities
- **Real-time Optimization**: Dynamic route recalculation based on changing conditions
- **Performance Analytics**: Route efficiency calculation and improvement tracking

## Features

### 🚛 Route Optimization Algorithms
- **Nearest Neighbor**: Fast heuristic for initial route ordering
- **2-Opt Algorithm**: Local search optimization for route improvement
- **Time-Based Optimization**: Priority and service time optimization
- **Efficiency Optimization**: Material type balancing and workload distribution
- **Multi-Criteria Decision Making**: Weighted optimization based on business priorities

### 📊 Performance Metrics
- Route efficiency calculation (stops per hour, stops per km)
- Distance and time reduction tracking
- Workload balancing across drivers and vehicles
- Environmental impact assessment (CO2 reduction)
- Constraint violation detection and reporting

### ⚙️ Constraint Management
- Maximum stops per route
- Maximum route duration and distance
- Vehicle capacity limits
- Working hours and break requirements
- Priority constraints (high priority first, same-day delivery)

### 🔄 Real-time Capabilities
- Dynamic route recalculation
- Event-driven optimization triggers
- Live traffic and condition updates
- Emergency route replanning
- Driver and vehicle status integration

## Technology Stack

- **Backend**: Node.js + TypeScript + Express
- **Validation**: Joi schema validation
- **Algorithms**: Custom optimization algorithms
- **Math**: Haversine formula for distance calculation
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Helmet security headers, CORS, input validation

## REFUSE Protocol Integration

### Entity Usage
- **Route**: Complete route lifecycle management
- **RouteStop**: Individual service stops with GPS coordinates
- **Customer**: Customer information and service requirements
- **Service**: Service specifications and scheduling
- **Vehicle**: Fleet capacity and availability tracking

### Optimization Criteria
```typescript
interface OptimizationCriteria {
  minimizeDistance: boolean        // Reduce total travel distance
  minimizeTime: boolean           // Reduce total route time
  maximizeEfficiency: boolean     // Increase stops per hour/km
  balanceWorkload: boolean        // Balance routes across drivers
  priorityWeight: number          // Weight for priority constraints
  distanceWeight: number          // Weight for distance optimization
  timeWeight: number             // Weight for time optimization
}
```

### Constraints
```typescript
interface OptimizationConstraints {
  maxStopsPerRoute: number        // Maximum stops per route
  maxRouteDuration: number        // Maximum route time (minutes)
  maxRouteDistance: number        // Maximum route distance (km)
  vehicleCapacity: number         // Vehicle capacity (tons)
  workingHours: {                 // Driver working hours
    start: string, end: string
  }
  breakRequirements: {            // Break requirements
    required: boolean,
    duration: number,
    frequency: number
  }
  priorityConstraints: {          // Priority handling
    highPriorityFirst: boolean,
    sameDayDelivery: boolean
  }
}
```

## API Endpoints

### POST /api/optimize
Optimize routes based on specified criteria and constraints.

**Request Body:**
```json
{
  "routes": [
    {
      "id": "route-001",
      "name": "Monday Route 1",
      "driverId": "driver-001",
      "vehicleId": "vehicle-001",
      "stops": [
        {
          "id": "stop-001",
          "customerId": "customer-001",
          "siteId": "site-001",
          "serviceId": "service-001",
          "scheduledTime": "08:00",
          "priority": 5,
          "coordinates": {
            "latitude": 37.7749,
            "longitude": -122.4194
          },
          "estimatedServiceTime": 15,
          "materials": [
            {
              "type": "mixed_waste",
              "estimatedQuantity": 2.5,
              "unit": "tons"
            }
          ]
        }
      ],
      "status": "planned",
      "scheduledDate": "2024-01-15T00:00:00Z"
    }
  ],
  "optimizationCriteria": {
    "minimizeDistance": true,
    "minimizeTime": true,
    "maximizeEfficiency": true,
    "balanceWorkload": true,
    "priorityWeight": 0.3,
    "distanceWeight": 0.4,
    "timeWeight": 0.3
  },
  "constraints": {
    "maxStopsPerRoute": 25,
    "maxRouteDuration": 480,
    "maxRouteDistance": 100,
    "vehicleCapacity": 10,
    "workingHours": {
      "start": "07:00",
      "end": "17:00"
    },
    "breakRequirements": {
      "required": true,
      "duration": 30,
      "frequency": 240
    },
    "priorityConstraints": {
      "highPriorityFirst": true,
      "sameDayDelivery": false
    }
  },
  "startTime": "2024-01-15T07:00:00Z",
  "endTime": "2024-01-15T17:00:00Z"
}
```

**Response:**
```json
{
  "optimizedRoutes": [...],
  "improvements": {
    "distanceReduction": 15.3,
    "timeReduction": 8.7,
    "efficiencyGain": 12.5,
    "routeBalanceImprovement": 25.0
  },
  "statistics": {
    "totalRoutes": 5,
    "totalStops": 125,
    "totalDistance": 450.2,
    "totalTime": 2400,
    "averageEfficiency": 85.3,
    "processingTime": 1250
  },
  "warnings": [],
  "errors": []
}
```

### GET /api/routes
Get all routes

### GET /api/routes/:routeId
Get specific route by ID

### GET /health
Health check endpoint

## Algorithms

### Nearest Neighbor Algorithm
- Fast heuristic for initial route ordering
- Starts with first stop, repeatedly visits nearest unvisited stop
- O(n²) complexity, good for small to medium routes
- Produces reasonable solutions quickly

### 2-Opt Algorithm
- Local search optimization algorithm
- Removes crossing edges in route and reconnects
- Repeatedly applies until no improvements found
- O(n²) per iteration, converges to local optimum

### Time-Based Optimization
- Sorts stops by priority and estimated service time
- High priority stops scheduled first
- Shorter service times prioritized for efficiency
- Accounts for driver working hours and breaks

### Efficiency Optimization
- Balances material types across routes
- Distributes workload evenly across drivers
- Optimizes for stops per hour and stops per km
- Considers vehicle capacity and route constraints

## Getting Started

### Prerequisites
- Node.js 18+
- TypeScript 4.9+
- REFUSE Protocol entities

### Installation

1. **Install dependencies:**
```bash
cd examples/route-optimizer
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Build for production:**
```bash
npm run build
npm start
```

### Configuration

Create `.env` file:
```env
PORT=3002
NODE_ENV=development
LOG_LEVEL=info
```

## Usage Examples

### Basic Route Optimization
```typescript
import axios from 'axios'

const response = await axios.post('http://localhost:3002/api/optimize', {
  routes: [/* route data */],
  optimizationCriteria: {
    minimizeDistance: true,
    minimizeTime: true,
    maximizeEfficiency: true,
    balanceWorkload: true,
    priorityWeight: 0.3,
    distanceWeight: 0.4,
    timeWeight: 0.3
  },
  constraints: {
    maxStopsPerRoute: 25,
    maxRouteDuration: 480,
    maxRouteDistance: 100,
    vehicleCapacity: 10
  },
  startTime: new Date('2024-01-15T07:00:00Z'),
  endTime: new Date('2024-01-15T17:00:00Z')
})

console.log('Optimization results:', response.data)
```

### Advanced Optimization with Custom Constraints
```typescript
const advancedOptimization = {
  routes: complexRoutes,
  optimizationCriteria: {
    minimizeDistance: false,
    minimizeTime: true,
    maximizeEfficiency: true,
    balanceWorkload: true,
    priorityWeight: 0.5,  // Higher priority weight
    distanceWeight: 0.2,
    timeWeight: 0.3
  },
  constraints: {
    maxStopsPerRoute: 20,  // Lower for complex areas
    maxRouteDuration: 360, // 6 hours max
    maxRouteDistance: 80,  // 80 km max
    vehicleCapacity: 8,    // Smaller vehicles
    workingHours: {
      start: "06:00",
      end: "18:00"
    },
    breakRequirements: {
      required: true,
      duration: 45,      // Longer breaks
      frequency: 180     // Every 3 hours
    },
    priorityConstraints: {
      highPriorityFirst: true,
      sameDayDelivery: true  // Must complete today
    }
  }
}
```

## Performance Considerations

### Algorithm Selection
- **Small routes (< 10 stops)**: Nearest neighbor (fastest)
- **Medium routes (10-25 stops)**: 2-opt optimization (good balance)
- **Large routes (> 25 stops)**: Consider genetic algorithms (best quality)
- **Time-critical**: Use time-based optimization
- **Distance-critical**: Use nearest neighbor with 2-opt

### Scalability
- Routes processed in parallel when possible
- Distance calculations cached for performance
- Incremental optimization for large route sets
- Memory-efficient route representation

### Monitoring
- Processing time tracking
- Route efficiency metrics
- Constraint violation monitoring
- Error rate and failure tracking

## Development Guidelines

### Adding New Algorithms
1. Implement algorithm in `algorithms/` directory
2. Add to `RouteOptimizer` class
3. Update optimization criteria schema
4. Add comprehensive tests
5. Update documentation

### Testing
```bash
# Run unit tests
npm test

# Test specific optimization scenarios
npm run test -- --grep "optimization"

# Performance testing
npm run test -- --grep "performance"
```

### Code Quality
- Follow TypeScript best practices
- Maintain comprehensive error handling
- Add detailed logging for debugging
- Keep algorithms modular and testable

## Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3002
CMD ["npm", "start"]
```

### Environment Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  route-optimizer:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
      - LOG_LEVEL=info
    restart: unless-stopped
```

## Integration Examples

### With REFUSE Protocol SDK
```typescript
import { RefuseProtocolSDK } from '@refuse-protocol/sdk'
import axios from 'axios'

const sdk = new RefuseProtocolSDK()
const routes = await sdk.getRoutes()

// Optimize routes
const optimizationResponse = await axios.post('http://localhost:3002/api/optimize', {
  routes,
  optimizationCriteria: { /* criteria */ },
  constraints: { /* constraints */ }
})

// Update routes with optimized versions
await sdk.updateRoutes(optimizationResponse.data.optimizedRoutes)
```

### Event-Driven Optimization
```typescript
import { EventStreamingSystem } from '@refuse-protocol/event-system'

const eventSystem = new EventStreamingSystem()

// Trigger optimization on route changes
eventSystem.subscribe('route_updated', async (event) => {
  if (event.data.requiresOptimization) {
    const optimizationResponse = await optimizeRoutes([event.data.route])
    await updateRouteOptimization(event.data.route.id, optimizationResponse)
  }
})
```

## Contributing

1. Follow TypeScript and Node.js best practices
2. Add comprehensive unit tests for new algorithms
3. Update API documentation for new endpoints
4. Maintain backward compatibility
5. Include performance benchmarks for new optimizations

## License

This reference implementation is provided under the REFUSE Protocol license for educational and development purposes.

## Support

For questions about REFUSE Protocol route optimization:
- Documentation: [REFUSE Protocol Docs](https://docs.refuse-protocol.org)
- SDK: [REFUSE Protocol SDK](https://github.com/refuse-protocol/sdk)
- Community: [REFUSE Protocol Community](https://community.refuse-protocol.org)

---

**Built with 🚛 and ❤️ for REFUSE Protocol**
