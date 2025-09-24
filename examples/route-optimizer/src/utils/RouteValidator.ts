import { Route, RouteStop, OptimizationRequest, OptimizationConstraints } from '../models/schemas'

export class RouteValidator {
  validateRoute(route: Route): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check required fields
    if (!route.id) errors.push('Route ID is required')
    if (!route.name) errors.push('Route name is required')
    if (!route.driverId) errors.push('Driver ID is required')
    if (!route.vehicleId) errors.push('Vehicle ID is required')
    if (!route.scheduledDate) errors.push('Scheduled date is required')

    // Check stops
    if (!route.stops || route.stops.length === 0) {
      errors.push('Route must have at least one stop')
    } else {
      route.stops.forEach((stop, index) => {
        const stopErrors = this.validateRouteStop(stop)
        if (stopErrors.length > 0) {
          errors.push(`Stop ${index + 1}: ${stopErrors.join(', ')}`)
        }
      })
    }

    // Check numeric fields
    if (route.totalDistance < 0) errors.push('Total distance must be non-negative')
    if (route.estimatedDuration <= 0) errors.push('Estimated duration must be positive')
    if (route.efficiency < 0 || route.efficiency > 100) errors.push('Efficiency must be between 0 and 100')

    // Check status
    const validStatuses = ['planned', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(route.status)) {
      errors.push(`Invalid status: ${route.status}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  validateRouteStop(stop: RouteStop): string[] {
    const errors: string[] = []

    // Check required fields
    if (!stop.id) errors.push('Stop ID is required')
    if (!stop.customerId) errors.push('Customer ID is required')
    if (!stop.siteId) errors.push('Site ID is required')
    if (!stop.serviceId) errors.push('Service ID is required')
    if (!stop.scheduledTime) errors.push('Scheduled time is required')

    // Check coordinates
    if (stop.coordinates.latitude < -90 || stop.coordinates.latitude > 90) {
      errors.push('Latitude must be between -90 and 90')
    }
    if (stop.coordinates.longitude < -180 || stop.coordinates.longitude > 180) {
      errors.push('Longitude must be between -180 and 180')
    }

    // Check priority
    if (stop.priority < 1 || stop.priority > 10) {
      errors.push('Priority must be between 1 and 10')
    }

    // Check estimated service time
    if (stop.estimatedServiceTime <= 0) {
      errors.push('Estimated service time must be positive')
    }

    // Check materials
    if (!stop.materials || stop.materials.length === 0) {
      errors.push('At least one material must be specified')
    } else {
      stop.materials.forEach((material, index) => {
        if (!material.type) errors.push(`Material ${index + 1}: Type is required`)
        if (material.estimatedQuantity <= 0) errors.push(`Material ${index + 1}: Quantity must be positive`)
        if (!material.unit) errors.push(`Material ${index + 1}: Unit is required`)
      })
    }

    return errors
  }

  validateOptimizationRequest(request: OptimizationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check routes
    if (!request.routes || request.routes.length === 0) {
      errors.push('At least one route is required')
    } else {
      request.routes.forEach((route, index) => {
        const validation = this.validateRoute(route)
        if (!validation.isValid) {
          errors.push(`Route ${index + 1}: ${validation.errors.join(', ')}`)
        }
      })
    }

    // Check time constraints
    if (request.startTime >= request.endTime) {
      errors.push('Start time must be before end time')
    }

    // Check optimization criteria
    const totalWeight = request.optimizationCriteria.priorityWeight +
                       request.optimizationCriteria.distanceWeight +
                       request.optimizationCriteria.timeWeight

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push('Optimization criteria weights must sum to 1.0')
    }

    // Check constraints
    const constraintValidation = this.validateOptimizationConstraints(request.constraints)
    errors.push(...constraintValidation.errors)

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  validateOptimizationConstraints(constraints: OptimizationConstraints): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check numeric constraints
    if (constraints.maxStopsPerRoute <= 0) errors.push('Max stops per route must be positive')
    if (constraints.maxRouteDuration <= 0) errors.push('Max route duration must be positive')
    if (constraints.maxRouteDistance <= 0) errors.push('Max route distance must be positive')
    if (constraints.vehicleCapacity <= 0) errors.push('Vehicle capacity must be positive')

    // Check working hours
    if (!constraints.workingHours.start || !constraints.workingHours.end) {
      errors.push('Working hours must be specified')
    } else {
      const startTime = this.parseTime(constraints.workingHours.start)
      const endTime = this.parseTime(constraints.workingHours.end)

      if (startTime >= endTime) {
        errors.push('Working hours start must be before end')
      }
    }

    // Check break requirements
    if (constraints.breakRequirements.required) {
      if (constraints.breakRequirements.duration <= 0) {
        errors.push('Break duration must be positive')
      }
      if (constraints.breakRequirements.frequency <= 0) {
        errors.push('Break frequency must be positive')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  validateOptimizedRoute(route: Route, constraints: OptimizationConstraints): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = []

    // Check constraints
    if (route.stops.length > constraints.maxStopsPerRoute) {
      warnings.push(`Route exceeds maximum stops per route (${constraints.maxStopsPerRoute})`)
    }

    const duration = route.actualDuration || route.estimatedDuration
    if (duration > constraints.maxRouteDuration) {
      warnings.push(`Route exceeds maximum duration (${constraints.maxRouteDuration} minutes)`)
    }

    if (route.totalDistance > constraints.maxRouteDistance) {
      warnings.push(`Route exceeds maximum distance (${constraints.maxRouteDistance} miles)`)
    }

    // Check break requirements
    if (constraints.breakRequirements.required && duration > constraints.breakRequirements.frequency * 60) {
      warnings.push(`Route may need breaks (duration: ${duration} minutes)`)
    }

    // Check working hours
    if (constraints.workingHours.start && constraints.workingHours.end) {
      const routeStartTime = this.parseTimeFromDate(route.scheduledDate, constraints.workingHours.start)
      const routeEndTime = new Date(routeStartTime.getTime() + duration * 60000)

      const workEndTime = this.parseTimeFromDate(route.scheduledDate, constraints.workingHours.end)

      if (routeEndTime > workEndTime) {
        warnings.push('Route may extend beyond working hours')
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings
    }
  }

  private parseTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  private parseTimeFromDate(baseDate: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date(baseDate)
    date.setHours(hours, minutes, 0, 0)
    return date
  }
}
