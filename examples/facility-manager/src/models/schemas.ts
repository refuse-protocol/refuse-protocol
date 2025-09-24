import Joi from 'joi'

// REFUSE Protocol Facility entity
export interface Facility {
  id: string
  name: string
  code: string
  type: 'landfill' | 'mrf' | 'transfer' | 'composter' | 'recycling_center'
  status: 'operational' | 'maintenance' | 'closed' | 'planned'
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  contactInformation: {
    phone: string
    email: string
  }
  operatingHours: {
    open: string
    close: string
    timezone: string
  }
  capacity: {
    total: number
    available: number
    unit: string
  }
  acceptedMaterials: string[]
  pricing: {
    tippingFee: number
    minimumCharge: number
    surcharges: {
      material: string
      amount: number
    }[]
  }
  permits: string[]
  environmentalControls: string[]
  complianceRecords: string[]
  utilization: {
    currentRate: number
    peakRate: number
    averageRate: number
  }
  processingRates: {
    material: string
    rate: number
    unit: string
  }[]
  qualityStandards: {
    material: string
    minQuality: number
    maxContamination: number
  }[]
  assignedRoutes: string[]
  materialTickets: string[]
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface MaterialTicket {
  id: string
  customerId: string
  facilityId: string
  material: {
    id: string
    name: string
    type: string
    classification: string
  }
  weight: {
    gross: number
    tare: number
    net: number
  }
  pricing: {
    rate: number
    rateUnit: string
    totalAmount: number
  }
  timestamp: Date
  status: 'processed' | 'pending' | 'disputed'
  qualityGrade?: 'excellent' | 'good' | 'fair' | 'poor'
  contaminationNotes?: string
  leedAllocations: {
    category: string
    points: number
    verified: boolean
  }[]
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface FacilitySchedule {
  facilityId: string
  date: Date
  timeSlots: TimeSlot[]
  capacityUtilization: {
    slot: string
    utilized: number
    available: number
    percentage: number
  }[]
  materialBreakdown: {
    material: string
    volume: number
    weight: number
  }[]
  routeAssignments: {
    routeId: string
    estimatedArrival: Date
    materialTypes: string[]
    estimatedQuantity: number
  }[]
}

export interface TimeSlot {
  start: string
  end: string
  capacity: number
  utilized: number
  status: 'available' | 'partial' | 'full' | 'maintenance'
}

export interface CapacityOptimizationRequest {
  facilities: Facility[]
  materialTickets: MaterialTicket[]
  optimizationCriteria: CapacityOptimizationCriteria
  constraints: CapacityConstraints
  timeRange: {
    start: Date
    end: Date
  }
}

export interface CapacityOptimizationCriteria {
  maximizeThroughput: boolean
  minimizeWaitTime: boolean
  balanceLoad: boolean
  prioritizeQuality: boolean
  throughputWeight: number
  waitTimeWeight: number
  balanceWeight: number
  qualityWeight: number
}

export interface CapacityConstraints {
  maxCapacityPerSlot: number
  minQualityThreshold: number
  maxContaminationRate: number
  workingHours: {
    start: string
    end: string
  }
  maintenanceWindows: {
    start: Date
    end: Date
    duration: number
  }[]
  priorityConstraints: {
    highPriorityRoutes: boolean
    emergencyDeliveries: boolean
  }
}

export interface CapacityOptimizationResult {
  optimizedSchedule: FacilitySchedule[]
  capacityUtilization: {
    facilityId: string
    utilizationRate: number
    throughput: number
    waitTime: number
  }[]
  improvements: CapacityImprovements
  warnings: string[]
  errors: string[]
}

export interface CapacityImprovements {
  throughputIncrease: number
  waitTimeReduction: number
  loadBalanceImprovement: number
  qualityImprovement: number
}

// Joi validation schemas
export const facilitySchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  code: Joi.string().required(),
  type: Joi.string().valid('landfill', 'mrf', 'transfer', 'composter', 'recycling_center').required(),
  status: Joi.string().valid('operational', 'maintenance', 'closed', 'planned').required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required()
  }).required(),
  contactInformation: Joi.object({
    phone: Joi.string().required(),
    email: Joi.string().email().required()
  }).required(),
  operatingHours: Joi.object({
    open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    timezone: Joi.string().required()
  }).required(),
  capacity: Joi.object({
    total: Joi.number().positive().required(),
    available: Joi.number().min(0).required(),
    unit: Joi.string().required()
  }).required(),
  acceptedMaterials: Joi.array().items(Joi.string()).min(1).required(),
  assignedRoutes: Joi.array().items(Joi.string()),
  materialTickets: Joi.array().items(Joi.string())
})

export const materialTicketSchema = Joi.object({
  id: Joi.string().required(),
  customerId: Joi.string().required(),
  facilityId: Joi.string().required(),
  material: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    type: Joi.string().required(),
    classification: Joi.string().required()
  }).required(),
  weight: Joi.object({
    gross: Joi.number().positive().required(),
    tare: Joi.number().positive().required(),
    net: Joi.number().positive().required()
  }).required(),
  pricing: Joi.object({
    rate: Joi.number().positive().required(),
    rateUnit: Joi.string().required(),
    totalAmount: Joi.number().positive().required()
  }).required(),
  timestamp: Joi.date().required(),
  status: Joi.string().valid('processed', 'pending', 'disputed').required(),
  qualityGrade: Joi.string().valid('excellent', 'good', 'fair', 'poor').optional(),
  contaminationNotes: Joi.string().optional(),
  leedAllocations: Joi.array().items(Joi.object({
    category: Joi.string().required(),
    points: Joi.number().positive().required(),
    verified: Joi.boolean().required()
  }))
})

export const capacityOptimizationCriteriaSchema = Joi.object({
  maximizeThroughput: Joi.boolean().default(true),
  minimizeWaitTime: Joi.boolean().default(true),
  balanceLoad: Joi.boolean().default(true),
  prioritizeQuality: Joi.boolean().default(true),
  throughputWeight: Joi.number().min(0).max(1).default(0.3),
  waitTimeWeight: Joi.number().min(0).max(1).default(0.3),
  balanceWeight: Joi.number().min(0).max(1).default(0.2),
  qualityWeight: Joi.number().min(0).max(1).default(0.2)
})

export const capacityConstraintsSchema = Joi.object({
  maxCapacityPerSlot: Joi.number().positive().default(100),
  minQualityThreshold: Joi.number().min(0).max(100).default(70),
  maxContaminationRate: Joi.number().min(0).max(100).default(5),
  workingHours: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  }).required(),
  maintenanceWindows: Joi.array().items(Joi.object({
    start: Joi.date().required(),
    end: Joi.date().required(),
    duration: Joi.number().positive().required()
  })),
  priorityConstraints: Joi.object({
    highPriorityRoutes: Joi.boolean().default(true),
    emergencyDeliveries: Joi.boolean().default(true)
  }).required()
})

export const capacityRequestSchema = Joi.object({
  facilities: Joi.array().items(facilitySchema).min(1).required(),
  materialTickets: Joi.array().items(materialTicketSchema),
  optimizationCriteria: capacityOptimizationCriteriaSchema.required(),
  constraints: capacityConstraintsSchema.required(),
  timeRange: Joi.object({
    start: Joi.date().required(),
    end: Joi.date().greater(Joi.ref('start')).required()
  }).required()
})

// Utility functions for schema validation
export const validateFacility = (facility: Facility): { isValid: boolean; errors: string[] } => {
  const { error } = facilitySchema.validate(facility)
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    }
  }
  return { isValid: true, errors: [] }
}

export const validateMaterialTicket = (ticket: MaterialTicket): { isValid: boolean; errors: string[] } => {
  const { error } = materialTicketSchema.validate(ticket)
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    }
  }
  return { isValid: true, errors: [] }
}

export const validateCapacityRequest = (request: CapacityOptimizationRequest): { isValid: boolean; errors: string[] } => {
  const { error } = capacityRequestSchema.validate(request)
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    }
  }
  return { isValid: true, errors: [] }
}
