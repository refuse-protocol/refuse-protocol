import { v4 as uuidv4 } from 'uuid'
import { addHours, differenceInHours, startOfDay, endOfDay } from 'date-fns'
import {
  Facility,
  MaterialTicket,
  FacilitySchedule,
  TimeSlot,
  CapacityOptimizationRequest,
  CapacityOptimizationResult,
  CapacityOptimizationCriteria,
  CapacityConstraints,
  CapacityImprovements
} from '../models/schemas'
import { CapacityOptimizer } from '../algorithms/CapacityOptimizer'
import { FacilityValidator } from '../utils/FacilityValidator'

export class FacilityCapacityService {
  private optimizer: CapacityOptimizer
  private validator: FacilityValidator
  private facilities: Map<string, Facility> = new Map()
  private schedules: Map<string, FacilitySchedule[]> = new Map()

  constructor() {
    this.optimizer = new CapacityOptimizer()
    this.validator = new FacilityValidator()
  }

  async optimizeCapacity(request: CapacityOptimizationRequest): Promise<CapacityOptimizationResult> {
    try {
      // Validate input
      const validation = this.validator.validateCapacityRequest(request)
      if (!validation.isValid) {
        throw new Error(`Invalid capacity request: ${validation.errors.join(', ')}`)
      }

      // Store original data for comparison
      const originalSchedules = this.getCurrentSchedules(request.facilities, request.timeRange)
      const originalUtilization = this.calculateUtilization(request.facilities, originalSchedules)

      // Perform optimization
      const optimizedSchedules = await this.optimizer.optimize(
        request.facilities,
        request.materialTickets,
        request.optimizationCriteria,
        request.constraints,
        request.timeRange
      )

      // Calculate improvements
      const optimizedUtilization = this.calculateUtilization(request.facilities, optimizedSchedules)
      const improvements = this.calculateImprovements(originalUtilization, optimizedUtilization)

      // Validate optimized schedules
      const warnings = this.validateOptimizedSchedules(optimizedSchedules, request.constraints)
      const errors: string[] = []

      return {
        optimizedSchedule: optimizedSchedules,
        capacityUtilization: optimizedUtilization,
        improvements,
        warnings,
        errors
      }
    } catch (error) {
      return {
        optimizedSchedule: this.getCurrentSchedules(request.facilities, request.timeRange),
        capacityUtilization: this.calculateUtilization(request.facilities, []),
        improvements: {
          throughputIncrease: 0,
          waitTimeReduction: 0,
          loadBalanceImprovement: 0,
          qualityImprovement: 0
        },
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown optimization error']
      }
    }
  }

  async getFacilityCapacity(facilityId: string): Promise<Facility | null> {
    return this.facilities.get(facilityId) || null
  }

  async getFacilitySchedule(facilityId: string): Promise<FacilitySchedule[]> {
    return this.schedules.get(facilityId) || []
  }

  async processMaterialTicket(facilityId: string, ticketData: any): Promise<any> {
    // Process incoming material ticket
    const facility = await this.getFacilityCapacity(facilityId)
    if (!facility) {
      throw new Error('Facility not found')
    }

    // Validate ticket against facility constraints
    const validation = this.validator.validateMaterialTicket(ticketData)
    if (!validation.isValid) {
      throw new Error(`Invalid material ticket: ${validation.errors.join(', ')}`)
    }

    // Check if facility can accept the material
    if (!facility.acceptedMaterials.includes(ticketData.material.type)) {
      throw new Error(`Facility does not accept material type: ${ticketData.material.type}`)
    }

    // Update facility utilization
    await this.updateFacilityUtilization(facilityId, ticketData)

    return {
      success: true,
      ticketId: ticketData.id,
      facilityId,
      processedAt: new Date(),
      estimatedWaitTime: this.calculateWaitTime(facilityId)
    }
  }

  async getAllFacilities(): Promise<Facility[]> {
    return Array.from(this.facilities.values())
  }

  private getCurrentSchedules(facilities: Facility[], timeRange: { start: Date; end: Date }): FacilitySchedule[] {
    const schedules: FacilitySchedule[] = []

    facilities.forEach(facility => {
      const facilitySchedule: FacilitySchedule = {
        facilityId: facility.id,
        date: startOfDay(timeRange.start),
        timeSlots: this.generateTimeSlots(facility, timeRange),
        capacityUtilization: [],
        materialBreakdown: [],
        routeAssignments: []
      }
      schedules.push(facilitySchedule)
    })

    return schedules
  }

  private generateTimeSlots(facility: Facility, timeRange: { start: Date; end: Date }): TimeSlot[] {
    const slots: TimeSlot[] = []
    const hours = differenceInHours(timeRange.end, timeRange.start)

    for (let i = 0; i < hours; i++) {
      const slotStart = addHours(timeRange.start, i)
      const slotEnd = addHours(slotStart, 1)

      slots.push({
        start: this.formatTime(slotStart),
        end: this.formatTime(slotEnd),
        capacity: facility.capacity.total / 24, // Distribute daily capacity
        utilized: 0,
        status: 'available'
      })
    }

    return slots
  }

  private calculateUtilization(facilities: Facility[], schedules: FacilitySchedule[]): Array<{
    facilityId: string
    utilizationRate: number
    throughput: number
    waitTime: number
  }> {
    return facilities.map(facility => {
      const facilitySchedule = schedules.find(s => s.facilityId === facility.id)
      if (!facilitySchedule) {
        return {
          facilityId: facility.id,
          utilizationRate: 0,
          throughput: 0,
          waitTime: 0
        }
      }

      const totalCapacity = facilitySchedule.timeSlots.reduce((sum, slot) => sum + slot.capacity, 0)
      const totalUtilized = facilitySchedule.timeSlots.reduce((sum, slot) => sum + slot.utilized, 0)
      const utilizationRate = totalCapacity > 0 ? (totalUtilized / totalCapacity) * 100 : 0

      return {
        facilityId: facility.id,
        utilizationRate,
        throughput: totalUtilized,
        waitTime: this.calculateWaitTime(facility.id)
      }
    })
  }

  private calculateImprovements(
    original: Array<{ utilizationRate: number; throughput: number; waitTime: number }>,
    optimized: Array<{ utilizationRate: number; throughput: number; waitTime: number }>
  ): CapacityImprovements {
    if (original.length === 0 || optimized.length === 0) {
      return {
        throughputIncrease: 0,
        waitTimeReduction: 0,
        loadBalanceImprovement: 0,
        qualityImprovement: 0
      }
    }

    const originalAvgUtilization = original.reduce((sum, f) => sum + f.utilizationRate, 0) / original.length
    const optimizedAvgUtilization = optimized.reduce((sum, f) => sum + f.utilizationRate, 0) / optimized.length

    const originalTotalThroughput = original.reduce((sum, f) => sum + f.throughput, 0)
    const optimizedTotalThroughput = optimized.reduce((sum, f) => sum + f.throughput, 0)

    const originalAvgWaitTime = original.reduce((sum, f) => sum + f.waitTime, 0) / original.length
    const optimizedAvgWaitTime = optimized.reduce((sum, f) => sum + f.waitTime, 0) / optimized.length

    return {
      throughputIncrease: originalTotalThroughput > 0
        ? ((optimizedTotalThroughput - originalTotalThroughput) / originalTotalThroughput) * 100
        : 0,
      waitTimeReduction: originalAvgWaitTime > 0
        ? ((originalAvgWaitTime - optimizedAvgWaitTime) / originalAvgWaitTime) * 100
        : 0,
      loadBalanceImprovement: optimizedAvgUtilization - originalAvgUtilization,
      qualityImprovement: 0 // Would need quality metrics to calculate
    }
  }

  private validateOptimizedSchedules(schedules: FacilitySchedule[], constraints: CapacityConstraints): string[] {
    const warnings: string[] = []

    schedules.forEach(schedule => {
      schedule.timeSlots.forEach(slot => {
        if (slot.utilized > slot.capacity) {
          warnings.push(`Facility ${schedule.facilityId} oversubscribed in slot ${slot.start}-${slot.end}`)
        }

        if (slot.status === 'full' && slot.utilized > 0) {
          warnings.push(`Facility ${schedule.facilityId} at full capacity in slot ${slot.start}-${slot.end}`)
        }
      })
    })

    return warnings
  }

  private calculateWaitTime(facilityId: string): number {
    // Simple wait time calculation based on current utilization
    const facility = this.facilities.get(facilityId)
    if (!facility) return 0

    const utilizationRate = facility.utilization.currentRate
    if (utilizationRate < 50) return 0
    if (utilizationRate < 75) return 15
    if (utilizationRate < 90) return 30
    if (utilizationRate < 100) return 60
    return 120 // 2 hours for fully utilized facilities
  }

  private async updateFacilityUtilization(facilityId: string, ticketData: any): Promise<void> {
    const facility = this.facilities.get(facilityId)
    if (!facility) return

    // Update utilization metrics
    facility.utilization.currentRate = Math.min(
      facility.utilization.currentRate + (ticketData.weight.net / facility.capacity.total) * 100,
      100
    )

    // Update material tickets list
    if (!facility.materialTickets.includes(ticketData.id)) {
      facility.materialTickets.push(ticketData.id)
    }

    // Update processing rates based on material type
    const materialType = ticketData.material.type
    const existingRate = facility.processingRates.find(r => r.material === materialType)
    if (existingRate) {
      existingRate.rate = (existingRate.rate + ticketData.weight.net) / 2 // Simple moving average
    } else {
      facility.processingRates.push({
        material: materialType,
        rate: ticketData.weight.net,
        unit: 'tons'
      })
    }
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5)
  }
}
