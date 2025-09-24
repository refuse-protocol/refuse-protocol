import Joi from 'joi'
import { validateUUID, validatePositiveNumber } from '../middleware/validation'

// REFUSE Protocol Route entity
export interface Route {
  id: string
  name: string
  driverId: string
  vehicleId: string
  stops: RouteStop[]
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  scheduledDate: Date
  actualStartTime?: Date
  actualEndTime?: Date
  efficiency: number
  totalDistance: number
  estimatedDuration: number
  actualDuration?: number
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface RouteStop {
  id: string
  customerId: string
  siteId: string
  serviceId: string
  scheduledTime: string
  actualTime?: string
  status: 'pending' | 'completed' | 'missed' | 'skipped'
  priority: number
  coordinates: {
    latitude: number
    longitude: number
  }
  estimatedServiceTime: number
  notes?: string
  materials: {
    type: string
    estimatedQuantity: number
    unit: string
  }[]
}

// Optimization request and response types
export interface OptimizationRequest {
  routes: Route[]
  optimizationCriteria: OptimizationCriteria
  constraints: OptimizationConstraints
  startTime: Date
  endTime: Date
}

export interface OptimizationCriteria {
  minimizeDistance: boolean
  minimizeTime: boolean
  maximizeEfficiency: boolean
  balanceWorkload: boolean
  priorityWeight: number
  distanceWeight: number
  timeWeight: number
}

export interface OptimizationConstraints {
  maxStopsPerRoute: number
  maxRouteDuration: number
  maxRouteDistance: number
  vehicleCapacity: number
  workingHours: {
    start: string
    end: string
  }
  breakRequirements: {
    required: boolean
    duration: number
    frequency: number
  }
  priorityConstraints: {
    highPriorityFirst: boolean
    sameDayDelivery: boolean
  }
}

export interface OptimizationResult {
  optimizedRoutes: Route[]
  improvements: OptimizationImprovements
  statistics: OptimizationStatistics
  warnings: string[]
  errors: string[]
}

export interface OptimizationImprovements {
  distanceReduction: number
  timeReduction: number
  efficiencyGain: number
  routeBalanceImprovement: number
}

export interface OptimizationStatistics {
  totalRoutes: number
  totalStops: number
  totalDistance: number
  totalTime: number
  averageEfficiency: number
  processingTime: number
}

// Joi validation schemas
export const routeStopSchema = Joi.object({
  id: Joi.string().required(),
  customerId: Joi.string().required(),
  siteId: Joi.string().required(),
  serviceId: Joi.string().required(),
  scheduledTime: Joi.string().required(),
  actualTime: Joi.string().optional(),
  status: Joi.string().valid('pending', 'completed', 'missed', 'skipped').required(),
  priority: Joi.number().integer().min(1).max(10).required(),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  estimatedServiceTime: Joi.number().positive().required(),
  notes: Joi.string().optional(),
  materials: Joi.array().items(Joi.object({
    type: Joi.string().required(),
    estimatedQuantity: Joi.number().positive().required(),
    unit: Joi.string().required()
  })).min(1).required()
})

export const routeSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  driverId: Joi.string().required(),
  vehicleId: Joi.string().required(),
  stops: Joi.array().items(routeStopSchema).min(1).required(),
  status: Joi.string().valid('planned', 'in_progress', 'completed', 'cancelled').required(),
  scheduledDate: Joi.date().required(),
  actualStartTime: Joi.date().optional(),
  actualEndTime: Joi.date().optional(),
  efficiency: Joi.number().min(0).max(100).required(),
  totalDistance: Joi.number().positive().required(),
  estimatedDuration: Joi.number().positive().required(),
  actualDuration: Joi.number().positive().optional(),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required(),
  version: Joi.number().integer().positive().required()
})

export const optimizationCriteriaSchema = Joi.object({
  minimizeDistance: Joi.boolean().default(true),
  minimizeTime: Joi.boolean().default(true),
  maximizeEfficiency: Joi.boolean().default(true),
  balanceWorkload: Joi.boolean().default(true),
  priorityWeight: Joi.number().min(0).max(1).default(0.3),
  distanceWeight: Joi.number().min(0).max(1).default(0.4),
  timeWeight: Joi.number().min(0).max(1).default(0.3)
})

export const optimizationConstraintsSchema = Joi.object({
  maxStopsPerRoute: Joi.number().integer().positive().default(25),
  maxRouteDuration: Joi.number().positive().default(480), // 8 hours in minutes
  maxRouteDistance: Joi.number().positive().default(100), // 100 miles
  vehicleCapacity: Joi.number().positive().default(10), // tons
  workingHours: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  }).required(),
  breakRequirements: Joi.object({
    required: Joi.boolean().default(true),
    duration: Joi.number().positive().default(30), // 30 minutes
    frequency: Joi.number().positive().default(4) // every 4 hours
  }).required(),
  priorityConstraints: Joi.object({
    highPriorityFirst: Joi.boolean().default(true),
    sameDayDelivery: Joi.boolean().default(false)
  }).required()
})

export const optimizationRequestSchema = Joi.object({
  routes: Joi.array().items(routeSchema).min(1).required(),
  optimizationCriteria: optimizationCriteriaSchema.required(),
  constraints: optimizationConstraintsSchema.required(),
  startTime: Joi.date().required(),
  endTime: Joi.date().greater(Joi.ref('startTime')).required()
})

// Utility functions for schema validation
export const validateRoute = (route: Route): { isValid: boolean; errors: string[] } => {
  const { error } = routeSchema.validate(route)
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    }
  }
  return { isValid: true, errors: [] }
}

export const validateOptimizationRequest = (request: OptimizationRequest): { isValid: boolean; errors: string[] } => {
  const { error } = optimizationRequestSchema.validate(request)
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    }
  }
  return { isValid: true, errors: [] }
}
