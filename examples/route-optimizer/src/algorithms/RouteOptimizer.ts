import { Route, RouteStop, OptimizationCriteria, OptimizationConstraints } from '../models/schemas'
import { DistanceCalculator } from '../utils/DistanceCalculator'

export class RouteOptimizer {
  private distanceCalculator: DistanceCalculator

  constructor() {
    this.distanceCalculator = new DistanceCalculator()
  }

  async optimize(
    routes: Route[],
    criteria: OptimizationCriteria,
    constraints: OptimizationConstraints
  ): Promise<Route[]> {
    const optimizedRoutes = [...routes]

    // Apply different optimization strategies based on criteria
    if (criteria.minimizeDistance) {
      optimizedRoutes.forEach(route => {
        route.stops = this.optimizeRouteOrder(route.stops, 'distance')
        this.updateRouteMetrics(route)
      })
    }

    if (criteria.minimizeTime) {
      optimizedRoutes.forEach(route => {
        route.stops = this.optimizeRouteOrder(route.stops, 'time')
        this.updateRouteMetrics(route)
      })
    }

    if (criteria.maximizeEfficiency) {
      optimizedRoutes.forEach(route => {
        route.stops = this.optimizeRouteOrder(route.stops, 'efficiency')
        this.updateRouteMetrics(route)
      })
    }

    if (criteria.balanceWorkload) {
      optimizedRoutes.sort((a, b) => {
        const aComplexity = this.calculateRouteComplexity(a)
        const bComplexity = this.calculateRouteComplexity(b)
        return aComplexity - bComplexity
      })
    }

    // Apply constraints
    this.applyConstraints(optimizedRoutes, constraints)

    // Update route efficiencies
    optimizedRoutes.forEach(route => {
      this.updateRouteEfficiency(route)
    })

    return optimizedRoutes
  }

  private optimizeRouteOrder(stops: RouteStop[], strategy: 'distance' | 'time' | 'efficiency'): RouteStop[] {
    if (stops.length <= 2) return stops

    switch (strategy) {
      case 'distance':
        return this.nearestNeighborOptimization(stops)
      case 'time':
        return this.timeBasedOptimization(stops)
      case 'efficiency':
        return this.efficiencyBasedOptimization(stops)
      default:
        return stops
    }
  }

  private nearestNeighborOptimization(stops: RouteStop[]): RouteStop[] {
    const optimized = [stops[0]] // Start with first stop
    const remaining = [...stops.slice(1)]

    while (remaining.length > 0) {
      const lastStop = optimized[optimized.length - 1]
      let nearestIndex = 0
      let nearestDistance = this.distanceCalculator.calculateDistance(lastStop, remaining[0])

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.distanceCalculator.calculateDistance(lastStop, remaining[i])
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIndex = i
        }
      }

      optimized.push(remaining[nearestIndex])
      remaining.splice(nearestIndex, 1)
    }

    return optimized
  }

  private timeBasedOptimization(stops: RouteStop[]): RouteStop[] {
    // Sort by priority first, then by estimated service time
    return [...stops].sort((a, b) => {
      // High priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      // Then by estimated service time (shorter first for efficiency)
      return a.estimatedServiceTime - b.estimatedServiceTime
    })
  }

  private efficiencyBasedOptimization(stops: RouteStop[]): RouteStop[] {
    // Balance stops by material types and quantities
    const materialGroups = this.groupByMaterialType(stops)

    // Interleave different material types to balance workload
    const optimized: RouteStop[] = []

    // Find the maximum group size
    const maxGroupSize = Math.max(...materialGroups.map(group => group.length))

    // Interleave stops from different material groups
    for (let i = 0; i < maxGroupSize; i++) {
      materialGroups.forEach(group => {
        if (i < group.length) {
          optimized.push(group[i])
        }
      })
    }

    return optimized
  }

  private groupByMaterialType(stops: RouteStop[]): RouteStop[][] {
    const groups: { [key: string]: RouteStop[] } = {}

    stops.forEach(stop => {
      // Use the first material type as the grouping key
      const materialType = stop.materials[0]?.type || 'unknown'

      if (!groups[materialType]) {
        groups[materialType] = []
      }

      groups[materialType].push(stop)
    })

    return Object.values(groups)
  }

  private calculateRouteComplexity(route: Route): number {
    // Calculate route complexity based on:
    // - Number of stops
    // - Total distance
    // - Total estimated time
    // - Priority distribution
    // - Material diversity

    const stopCount = route.stops.length
    const distance = route.totalDistance
    const time = route.estimatedDuration

    // Material diversity score (more diverse = more complex)
    const materialTypes = new Set(
      route.stops.flatMap(stop => stop.materials.map(m => m.type))
    )
    const materialDiversity = materialTypes.size / route.stops.length

    // Priority variance (more variance = more complex)
    const priorities = route.stops.map(stop => stop.priority)
    const avgPriority = priorities.reduce((sum, p) => sum + p, 0) / priorities.length
    const priorityVariance = priorities.reduce((sum, p) => sum + Math.pow(p - avgPriority, 2), 0) / priorities.length

    return stopCount * 0.3 + distance * 0.2 + time * 0.2 + materialDiversity * 0.15 + priorityVariance * 0.15
  }

  private applyConstraints(routes: Route[], constraints: OptimizationConstraints): void {
    routes.forEach(route => {
      // Check if route exceeds constraints and split if necessary
      if (route.stops.length > constraints.maxStopsPerRoute) {
        // This would implement route splitting logic
        // For now, just log a warning
        console.warn(`Route ${route.id} exceeds max stops: ${route.stops.length} > ${constraints.maxStopsPerRoute}`)
      }

      const duration = route.actualDuration || route.estimatedDuration
      if (duration > constraints.maxRouteDuration) {
        console.warn(`Route ${route.id} exceeds max duration: ${duration} > ${constraints.maxRouteDuration}`)
      }

      if (route.totalDistance > constraints.maxRouteDistance) {
        console.warn(`Route ${route.id} exceeds max distance: ${route.totalDistance} > ${constraints.maxRouteDistance}`)
      }
    })
  }

  private updateRouteMetrics(route: Route): void {
    // Recalculate total distance
    route.totalDistance = this.distanceCalculator.calculateRouteDistance(route.stops)

    // Recalculate estimated duration
    route.estimatedDuration = this.distanceCalculator.calculateTotalRouteTime(route.stops)
  }

  private updateRouteEfficiency(route: Route): void {
    route.efficiency = this.distanceCalculator.calculateRouteEfficiency(
      route.stops,
      route.estimatedDuration,
      route.totalDistance
    )
  }

  // Two-opt algorithm for route improvement (simplified)
  private twoOptOptimization(stops: RouteStop[]): RouteStop[] {
    if (stops.length < 4) return stops

    let improved = true
    let optimizedStops = [...stops]

    while (improved) {
      improved = false

      for (let i = 1; i < optimizedStops.length - 2; i++) {
        for (let j = i + 1; j < optimizedStops.length - 1; j++) {
          // Try reversing segment between i and j
          const newStops = [...optimizedStops]
          const segment = newStops.splice(i, j - i + 1)
          newStops.splice(i, 0, ...segment.reverse())

          const originalDistance = this.distanceCalculator.calculateRouteDistance(optimizedStops)
          const newDistance = this.distanceCalculator.calculateRouteDistance(newStops)

          if (newDistance < originalDistance) {
            optimizedStops = newStops
            improved = true
          }
        }
      }
    }

    return optimizedStops
  }

  // Genetic algorithm approach (placeholder for advanced optimization)
  private geneticOptimization(stops: RouteStop[]): RouteStop[] {
    // This would implement a genetic algorithm for route optimization
    // For now, just return the nearest neighbor result
    return this.nearestNeighborOptimization(stops)
  }

  // Simulated annealing optimization (placeholder)
  private simulatedAnnealingOptimization(stops: RouteStop[]): RouteStop[] {
    // This would implement simulated annealing for route optimization
    // For now, just return the two-opt result
    return this.twoOptOptimization(stops)
  }
}
