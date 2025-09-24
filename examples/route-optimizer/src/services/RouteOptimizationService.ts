import { v4 as uuidv4 } from 'uuid'
import { addMinutes, differenceInMinutes } from 'date-fns'
import {
  Route,
  RouteStop,
  OptimizationRequest,
  OptimizationResult,
  OptimizationCriteria,
  OptimizationConstraints,
  OptimizationImprovements,
  OptimizationStatistics
} from '../models/schemas'
import { RouteOptimizer } from '../algorithms/RouteOptimizer'
import { DistanceCalculator } from '../utils/DistanceCalculator'
import { RouteValidator } from '../utils/RouteValidator'

export class RouteOptimizationService {
  private optimizer: RouteOptimizer
  private distanceCalculator: DistanceCalculator
  private validator: RouteValidator
  private routes: Map<string, Route> = new Map()

  constructor() {
    this.optimizer = new RouteOptimizer()
    this.distanceCalculator = new DistanceCalculator()
    this.validator = new RouteValidator()
  }

  async optimizeRoutes(request: OptimizationRequest): Promise<OptimizationResult> {
    const startTime = new Date()

    try {
      // Validate input
      const validation = this.validator.validateOptimizationRequest(request)
      if (!validation.isValid) {
        throw new Error(`Invalid optimization request: ${validation.errors.join(', ')}`)
      }

      // Store original routes for comparison
      const originalRoutes = this.deepCloneRoutes(request.routes)
      const originalStats = this.calculateStatistics(originalRoutes)

      // Perform optimization
      const optimizedRoutes = await this.optimizer.optimize(
        originalRoutes,
        request.optimizationCriteria,
        request.constraints
      )

      // Calculate improvements
      const optimizedStats = this.calculateStatistics(optimizedRoutes)
      const improvements = this.calculateImprovements(originalStats, optimizedStats)

      // Validate optimized routes
      const warnings = this.validateOptimizedRoutes(optimizedRoutes, request.constraints)
      const errors: string[] = []

      const processingTime = differenceInMinutes(new Date(), startTime)

      return {
        optimizedRoutes,
        improvements,
        statistics: {
          ...optimizedStats,
          processingTime
        },
        warnings,
        errors
      }
    } catch (error) {
      const processingTime = differenceInMinutes(new Date(), startTime)
      return {
        optimizedRoutes: request.routes,
        improvements: {
          distanceReduction: 0,
          timeReduction: 0,
          efficiencyGain: 0,
          routeBalanceImprovement: 0
        },
        statistics: this.calculateStatistics(request.routes),
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown optimization error']
      }
    }
  }

  async getRoute(routeId: string): Promise<Route | null> {
    return this.routes.get(routeId) || null
  }

  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values())
  }

  private deepCloneRoutes(routes: Route[]): Route[] {
    return routes.map(route => ({
      ...route,
      stops: route.stops.map(stop => ({ ...stop })),
      scheduledDate: new Date(route.scheduledDate),
      actualStartTime: route.actualStartTime ? new Date(route.actualStartTime) : undefined,
      actualEndTime: route.actualEndTime ? new Date(route.actualEndTime) : undefined,
      createdAt: new Date(route.createdAt),
      updatedAt: new Date(route.updatedAt)
    }))
  }

  private calculateStatistics(routes: Route[]): OptimizationStatistics {
    const totalRoutes = routes.length
    const totalStops = routes.reduce((sum, route) => sum + route.stops.length, 0)
    const totalDistance = routes.reduce((sum, route) => sum + route.totalDistance, 0)
    const totalTime = routes.reduce((sum, route) => sum + (route.actualDuration || route.estimatedDuration), 0)
    const averageEfficiency = routes.length > 0
      ? routes.reduce((sum, route) => sum + route.efficiency, 0) / routes.length
      : 0

    return {
      totalRoutes,
      totalStops,
      totalDistance,
      totalTime,
      averageEfficiency,
      processingTime: 0 // Will be set by caller
    }
  }

  private calculateImprovements(
    original: OptimizationStatistics,
    optimized: OptimizationStatistics
  ): OptimizationImprovements {
    return {
      distanceReduction: original.totalDistance > 0
        ? ((original.totalDistance - optimized.totalDistance) / original.totalDistance) * 100
        : 0,
      timeReduction: original.totalTime > 0
        ? ((original.totalTime - optimized.totalTime) / original.totalTime) * 100
        : 0,
      efficiencyGain: optimized.averageEfficiency - original.averageEfficiency,
      routeBalanceImprovement: this.calculateRouteBalanceImprovement(original, optimized)
    }
  }

  private calculateRouteBalanceImprovement(
    original: OptimizationStatistics,
    optimized: OptimizationStatistics
  ): number {
    // Calculate standard deviation of route durations as a measure of balance
    const originalDurations = this.getRouteDurations(original)
    const optimizedDurations = this.getRouteDurations(optimized)

    const originalStdDev = this.calculateStandardDeviation(originalDurations)
    const optimizedStdDev = this.calculateStandardDeviation(optimizedDurations)

    if (originalStdDev === 0) return 0

    return ((originalStdDev - optimizedStdDev) / originalStdDev) * 100
  }

  private getRouteDurations(stats: OptimizationStatistics): number[] {
    // This would need access to individual route data
    // For now, return estimated durations based on statistics
    return stats.totalRoutes > 0
      ? Array.from({ length: stats.totalRoutes }, (_, i) => stats.totalTime / stats.totalRoutes)
      : []
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length

    return Math.sqrt(variance)
  }

  private validateOptimizedRoutes(routes: Route[], constraints: OptimizationConstraints): string[] {
    const warnings: string[] = []

    routes.forEach(route => {
      if (route.stops.length > constraints.maxStopsPerRoute) {
        warnings.push(`Route ${route.id} exceeds maximum stops per route (${constraints.maxStopsPerRoute})`)
      }

      const duration = route.actualDuration || route.estimatedDuration
      if (duration > constraints.maxRouteDuration) {
        warnings.push(`Route ${route.id} exceeds maximum route duration (${constraints.maxRouteDuration} minutes)`)
      }

      if (route.totalDistance > constraints.maxRouteDistance) {
        warnings.push(`Route ${route.id} exceeds maximum route distance (${constraints.maxRouteDistance} miles)`)
      }

      // Check break requirements
      if (constraints.breakRequirements.required && duration > constraints.breakRequirements.frequency * 60) {
        warnings.push(`Route ${route.id} may need breaks (duration: ${duration} minutes)`)
      }
    })

    return warnings
  }
}
