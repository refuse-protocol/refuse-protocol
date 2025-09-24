/**
 * REFUSE Protocol Type Definitions for Customer Portal
 * Reference implementation demonstrating customer-facing entities
 */

export interface Customer {
  id: string
  name: string
  type: 'residential' | 'commercial' | 'industrial' | 'municipal'
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  contactInfo: {
    primaryPhone: string
    email: string
    address: Address
  }
  serviceArea: string
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
}

export interface Service {
  id: string
  name: string
  type: 'waste_collection' | 'recycling' | 'organics' | 'hazardous' | 'bulk'
  status: 'active' | 'suspended' | 'cancelled' | 'pending'
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'oncall' | 'custom'
  pricing: {
    baseRate: number
    rateUnit: 'month' | 'quarter' | 'year'
    additionalCharges: number
  }
  requirements: {
    containerTypes: string[]
    specialHandling: string | null
  }
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface Invoice {
  id: string
  customerId: string
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxes: number
  total: number
  payments: Payment[]
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface InvoiceLineItem {
  id: string
  serviceId: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Payment {
  id: string
  customerId: string
  invoiceId?: string
  amount: number
  paymentDate: Date
  paymentMethod: 'cash' | 'check' | 'credit_card' | 'ach' | 'wire'
  status: 'pending' | 'processed' | 'failed' | 'refunded'
  referenceNumber: string
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface CustomerRequest {
  id: string
  customerId: string
  requestNumber: string
  type: 'new_service' | 'change_service' | 'one_time' | 'inquiry'
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  description: string
  requestedDate: Date
  estimatedCost?: number
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface EnvironmentalCompliance {
  customerId: string
  siteId?: string
  complianceType: 'leed' | 'environmental' | 'carbon_credit' | 'sustainability'
  leedCategory: string
  leedPoints: number
  certificationYear: number
  verificationStatus: 'pending' | 'verified' | 'rejected'
  environmentalBenefits: EnvironmentalBenefit[]
  supportingDocuments: Document[]
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface EnvironmentalBenefit {
  type: 'carbon_reduction' | 'waste_diversion' | 'energy_savings' | 'water_conservation'
  amount: number
  unit: string
  description: string
}

export interface Document {
  id: string
  name: string
  type: string
  url: string
  uploadedAt: Date
  size: number
}

export interface ServiceSchedule {
  serviceId: string
  scheduledDate: Date
  completedDate?: Date
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed'
  notes?: string
  driverId?: string
  vehicleId?: string
}

export interface Container {
  id: string
  customerId: string
  siteId: string
  type: 'cart' | 'dumpster' | 'bin' | 'rolloff' | 'compactor'
  size: string
  status: 'in_service' | 'damaged' | 'lost' | 'retired'
  location?: Address
  lastServiced?: Date
  nextService?: Date
}

export interface Route {
  id: string
  name: string
  driverId: string
  vehicleId: string
  stops: RouteStop[]
  status: 'planned' | 'in_progress' | 'completed'
  scheduledDate: Date
  actualStartTime?: Date
  actualEndTime?: Date
  efficiency: number
}

export interface RouteStop {
  customerId: string
  siteId: string
  serviceId: string
  scheduledTime: string
  actualTime?: string
  status: 'pending' | 'completed' | 'missed'
  notes?: string
}

export interface Facility {
  id: string
  name: string
  type: 'landfill' | 'mrf' | 'transfer' | 'composter' | 'recycling_center'
  address: Address
  contactInfo: {
    phone: string
    email: string
  }
  operatingHours: {
    open: string
    close: string
    timezone: string
  }
  acceptedMaterials: string[]
  capacity: {
    total: number
    available: number
    unit: string
  }
  status: 'operational' | 'maintenance' | 'closed'
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
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface Contract {
  id: string
  customerId: string
  contractNumber: string
  type: 'service' | 'pricing' | 'master' | 'amendment'
  status: 'draft' | 'active' | 'expired' | 'terminated'
  effectiveDate: Date
  expirationDate: Date
  services: string[]
  pricing: {
    baseRate: number
    guaranteedMinimum?: number
    volumeCommitments?: {
      materialType: string
      minimumVolume: number
      unit: string
      rate: number
    }[]
  }
  paymentTerms: {
    paymentTerms: string
    dueDateOffset: number
    lateFeeRate?: number
  }
  createdAt: Date
  updatedAt: Date
  version: number
}
