import { RouteStop } from '../models/schemas'

export class DistanceCalculator {
  // Haversine formula to calculate distance between two coordinates
  private static readonly EARTH_RADIUS_KM = 6371

  calculateDistance(point1: RouteStop, point2: RouteStop): number {
    const lat1Rad = this.toRadians(point1.coordinates.latitude)
    const lat2Rad = this.toRadians(point2.coordinates.latitude)
    const deltaLatRad = this.toRadians(point2.coordinates.latitude - point1.coordinates.latitude)
    const deltaLngRad = this.toRadians(point2.coordinates.longitude - point1.coordinates.longitude)

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return DistanceCalculator.EARTH_RADIUS_KM * c
  }

  calculateRouteDistance(stops: RouteStop[]): number {
    if (stops.length < 2) return 0

    let totalDistance = 0
    for (let i = 0; i < stops.length - 1; i++) {
      totalDistance += this.calculateDistance(stops[i], stops[i + 1])
    }

    return totalDistance
  }

  calculateOptimizedDistance(stops: RouteStop[]): number {
    // For optimization, we might want to use a more efficient algorithm
    // like the nearest neighbor or 2-opt algorithm
    return this.calculateRouteDistance(stops)
  }

  // Estimate travel time based on distance and average speed
  estimateTravelTime(distanceKm: number, averageSpeedKmh: number = 50): number {
    // Convert to hours, then to minutes
    return (distanceKm / averageSpeedKmh) * 60
  }

  // Estimate service time based on materials and complexity
  estimateServiceTime(stop: RouteStop): number {
    let baseTime = 15 // Base service time in minutes

    // Add time based on material types and quantities
    stop.materials.forEach(material => {
      baseTime += material.estimatedQuantity * 0.5 // 30 seconds per unit
    })

    // Add time based on service priority
    if (stop.priority >= 8) {
      baseTime += 5 // Extra time for high priority
    }

    return baseTime
  }

  // Calculate total route time including travel and service
  calculateTotalRouteTime(stops: RouteStop[]): number {
    let totalTime = 0

    // Add service times for all stops
    stops.forEach(stop => {
      totalTime += this.estimateServiceTime(stop)
    })

    // Add travel time between stops
    if (stops.length >= 2) {
      for (let i = 0; i < stops.length - 1; i++) {
        const distance = this.calculateDistance(stops[i], stops[i + 1])
        totalTime += this.estimateTravelTime(distance)
      }
    }

    return totalTime
  }

  // Optimize route order using nearest neighbor algorithm
  optimizeRouteOrder(stops: RouteStop[]): RouteStop[] {
    if (stops.length <= 2) return stops

    const optimizedStops = [stops[0]] // Start with first stop
    const remainingStops = [...stops.slice(1)]

    while (remainingStops.length > 0) {
      const lastStop = optimizedStops[optimizedStops.length - 1]
      let nearestStopIndex = 0
      let nearestDistance = this.calculateDistance(lastStop, remainingStops[0])

      for (let i = 1; i < remainingStops.length; i++) {
        const distance = this.calculateDistance(lastStop, remainingStops[i])
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestStopIndex = i
        }
      }

      optimizedStops.push(remainingStops[nearestStopIndex])
      remainingStops.splice(nearestStopIndex, 1)
    }

    return optimizedStops
  }

  // Calculate efficiency score for a route
  calculateRouteEfficiency(stops: RouteStop[], totalTime: number, totalDistance: number): number {
    if (stops.length === 0 || totalTime === 0) return 0

    // Base efficiency on stops per hour
    const stopsPerHour = (stops.length / totalTime) * 60

    // Adjust for distance efficiency (stops per km)
    const stopsPerKm = stops.length / totalDistance

    // Combine metrics with weights
    const timeEfficiency = Math.min(stopsPerHour / 10, 1) // Normalize to max 10 stops/hour
    const distanceEfficiency = Math.min(stopsPerKm * 20, 1) // Normalize to max 0.05 stops/km

    return (timeEfficiency * 0.6 + distanceEfficiency * 0.4) * 100
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}
