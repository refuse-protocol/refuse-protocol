// REFUSE Protocol Material Tracking Types
export interface Material {
  id: string
  name: string
  type: string
  classification: string
  recyclable: boolean
  hazardous: boolean
  processingMethod: string
  marketValue?: number
  leedCategory: string
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface MaterialTicket {
  id: string
  material: Material
  weight: { gross: number; tare: number; net: number }
  qualityGrade?: 'excellent' | 'good' | 'fair' | 'poor'
  contaminationNotes?: string
  leedAllocations: Array<{
    category: string
    points: number
    verified: boolean
  }>
  timestamp: Date
  status: 'processed' | 'pending' | 'disputed'
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface EnvironmentalCompliance {
  materialTickets: string[]
  leedPoints: number
  carbonCredits?: number
  environmentalBenefits: Array<{
    type: string
    amount: number
    unit: string
  }>
  verificationStatus: 'pending' | 'verified' | 'rejected'
  createdAt: Date
  updatedAt: Date
  version: number
}
