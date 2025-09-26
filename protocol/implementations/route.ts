import { join } from 'path';
/**
 * @fileoverview Route entity implementation with optimization algorithms
 * @description Complete Route model with route optimization, scheduling, and performance tracking
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Route, BaseEntity } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Route implementation with comprehensive optimization and performance tracking
 */
export class RouteModel implements Route {
  id!: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  version!: number;

  name!: string;
  schedule!: {
    frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'on_call' | 'one_time';
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    holidays?: string[];
  };
  assignedSites!: string[];
  assignedVehicle?: string;
  efficiency!: number;
  performanceMetrics?: {
    averageServiceTime?: number;
    totalDistance?: number;
    fuelEfficiency?: number;
    onTimePercentage?: number;
  };

  private static readonly VALID_FREQUENCIES: Route['schedule']['frequency'][] = [
    'weekly',
    'bi_weekly',
    'monthly',
    'on_call',
    'one_time',
  ];
  private static readonly DAYS_OF_WEEK = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  constructor(data: Partial<Route>) {
    this.validateAndAssign(data);
  }

  /**
   * Create a new route with validation
   */
  static create(
    data: Omit<Route, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version' | 'metadata'> & {
      metadata?: Record<string, any>;
    }
  ): RouteModel {
    const now = new Date();
    const routeData: Partial<Route> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      efficiency: data.efficiency || 0,
      metadata: {
        createdBy: 'system',
        source: 'api',
        ...(data.metadata || {}),
      },
    };

    return new RouteModel(routeData);
  }

  /**
   * Update route with optimistic locking
   */
  update(
    updates: Partial<Omit<Route, keyof BaseEntity>> & { metadata?: Record<string, any> },
    expectedVersion: number
  ): RouteModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Route> = {
      ...updates,
      id: this.id,
      version: this.version + 1,
      updatedAt: new Date(),
      metadata: {
        lastModifiedBy: 'system',
        previousVersion: this.version,
        ...(this.metadata || {}),
        ...(updates.metadata || {}),
      },
    };

    return new RouteModel(updatedData);
  }

  /**
   * Validate and assign route data
   */
  private validateAndAssign(data: Partial<Route>): void {
    // Required fields validation
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Route name is required and must be a string');
    }

    if (!data.schedule) {
      throw new Error('Schedule is required');
    }

    if (
      !data.schedule.frequency ||
      !RouteModel.VALID_FREQUENCIES.includes(data.schedule.frequency)
    ) {
      throw new Error(
        `Schedule frequency must be one of: ${RouteModel.VALID_FREQUENCIES.join(', ')}`
      );
    }

    if (
      !data.schedule.dayOfWeek ||
      !RouteModel.DAYS_OF_WEEK.includes(data.schedule.dayOfWeek.toLowerCase())
    ) {
      throw new Error(`Schedule day of week must be one of: ${RouteModel.DAYS_OF_WEEK.join(', ')}`);
    }

    if (!data.schedule.startTime || !data.schedule.endTime) {
      throw new Error('Schedule start time and end time are required');
    }

    if (!Array.isArray(data.assignedSites)) {
      throw new Error('Assigned sites must be an array');
    }

    if (typeof data.efficiency !== 'number' || data.efficiency < 0 || data.efficiency > 100) {
      throw new Error('Efficiency must be a number between 0 and 100');
    }

    // Time validation
    if (!this.isValidTime(data.schedule.startTime)) {
      throw new Error('Start time must be in HH:MM format');
    }

    if (!this.isValidTime(data.schedule.endTime)) {
      throw new Error('End time must be in HH:MM format');
    }

    if (!this.isValidTimeRange(data.schedule.startTime, data.schedule.endTime)) {
      throw new Error('End time must be after start time');
    }

    // Assign validated data
    Object.assign(this, data);
  }

  /**
   * Validate time format (HH:MM)
   */
  private isValidTime(timeString: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  /**
   * Validate time range
   */
  private isValidTimeRange(startTime: string, endTime: string): boolean {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return end > start;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Check if route is active
   */
  isActive(): boolean {
    return this.assignedSites.length > 0;
  }

  /**
   * Get route duration in minutes
   */
  getDurationMinutes(): number {
    const start = this.timeToMinutes(this.schedule.startTime);
    const end = this.timeToMinutes(this.schedule.endTime);
    return end - start;
  }

  /**
   * Get route duration formatted as hours and minutes
   */
  getDurationFormatted(): string {
    const minutes = this.getDurationMinutes();
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  /**
   * Get stops per hour (estimated efficiency metric)
   */
  getStopsPerHour(): number {
    if (this.getDurationMinutes() === 0) return 0;
    return (this.assignedSites.length / this.getDurationMinutes()) * 60;
  }

  /**
   * Calculate optimal route sequence using basic optimization algorithm
   */
  optimizeRouteSequence(siteCoordinates: Map<string, { lat: number; lng: number }>): string[] {
    const sites = [...this.assignedSites];
    if (sites.length <= 1) return sites;

    // Simple nearest neighbor algorithm for route optimization
    const optimizedSites: string[] = [];
    let currentSite = sites[0]; // Start with first site as depot
    optimizedSites.push(currentSite);

    const remainingSites = new Set(sites.slice(1));

    while (remainingSites.size > 0) {
      let nearestSite = '';
      let nearestDistance = Infinity;

      for (const site of remainingSites) {
        const distance = this.calculateDistance(
          siteCoordinates.get(currentSite)!,
          siteCoordinates.get(site)!
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestSite = site;
        }
      }

      if (nearestSite) {
        optimizedSites.push(nearestSite);
        remainingSites.delete(nearestSite);
        currentSite = nearestSite;
      }
    }

    return optimizedSites;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) *
        Math.cos(this.toRadians(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate estimated travel time based on distance and average speed
   */
  calculateTravelTime(distance: number, averageSpeedMph: number = 25): number {
    return (distance / averageSpeedMph) * 60; // Time in minutes
  }

  /**
   * Get route efficiency score (0-100)
   */
  getEfficiencyScore(): number {
    let score = this.efficiency;

    // Adjust based on performance metrics
    if (this.performanceMetrics?.onTimePercentage !== undefined) {
      score = (score + this.performanceMetrics.onTimePercentage) / 2;
    }

    if (this.performanceMetrics?.fuelEfficiency !== undefined) {
      score = (score + this.performanceMetrics.fuelEfficiency) / 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Update performance metrics
   */
  updatePerformance(completedSites: string[], totalTime: number, onTime: boolean): void {
    if (!this.performanceMetrics) {
      this.performanceMetrics = {};
    }

    // Calculate average service time per site
    if (completedSites.length > 0) {
      this.performanceMetrics.averageServiceTime = totalTime / completedSites.length;
    }

    // Update on-time percentage
    const currentOnTime = this.performanceMetrics.onTimePercentage || 0;
    const newOnTime = onTime ? currentOnTime + 1 : currentOnTime;
    this.performanceMetrics.onTimePercentage = Math.max(0, Math.min(100, newOnTime));

    // Recalculate efficiency
    this.recalculateEfficiency();
  }

  /**
   * Recalculate route efficiency based on performance
   */
  private recalculateEfficiency(): void {
    const efficiencyFactors = [this.efficiency];

    if (this.performanceMetrics?.onTimePercentage !== undefined) {
      efficiencyFactors.push(this.performanceMetrics.onTimePercentage);
    }

    if (this.performanceMetrics?.fuelEfficiency !== undefined) {
      efficiencyFactors.push(this.performanceMetrics.fuelEfficiency);
    }

    // Weight current efficiency more heavily (70%) vs new metrics (30%)
    const weightedEfficiency = efficiencyFactors.reduce((sum, factor, index) => {
      const weight = index === 0 ? 0.7 : 0.3 / (efficiencyFactors.length - 1);
      return sum + factor * weight;
    }, 0);

    this.efficiency = Math.max(0, Math.min(100, weightedEfficiency));
  }

  /**
   * Get route summary for reporting
   */
  getSummary(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      siteCount: this.assignedSites.length,
      duration: this.getDurationFormatted(),
      stopsPerHour: Math.round(this.getStopsPerHour() * 10) / 10,
      efficiency: this.getEfficiencyScore(),
      isActive: this.isActive(),
      schedule: `${this.schedule.dayOfWeek} ${this.schedule.startTime}-${this.schedule.endTime}`,
      performanceMetrics: this.performanceMetrics,
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Route {
    return {
      id: this.id,
      externalIds: this.externalIds,
      name: this.name,
      schedule: this.schedule,
      assignedSites: this.assignedSites,
      assignedVehicle: this.assignedVehicle,
      efficiency: this.efficiency,
      performanceMetrics: this.performanceMetrics,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Route> {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, version: _version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for route changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    const now = new Date();
    return {
      id: uuidv4(),
      entityType: 'route',
      eventType,
      timestamp: now,
      eventData: this.toEventData(),
      metadata: {
        source: 'route-model',
        eventType,
        entityId: this.id,
      },
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
  }

  /**
   * Validate business rules
   */
  validateBusinessRules(): string[] {
    const errors: string[] = [];

    // Business rule: Routes should have at least one assigned site
    if (this.assignedSites.length === 0) {
      errors.push('Routes must have at least one assigned site');
    }

    // Business rule: Route duration should be reasonable (2-12 hours)
    const durationMinutes = this.getDurationMinutes();
    if (durationMinutes < 120 || durationMinutes > 720) {
      errors.push('Route duration should be between 2 and 12 hours');
    }

    // Business rule: High efficiency routes should have good performance metrics
    if (
      this.efficiency > 90 &&
      (!this.performanceMetrics?.onTimePercentage || this.performanceMetrics.onTimePercentage < 85)
    ) {
      errors.push('High efficiency routes should maintain on-time performance above 85%');
    }

    return errors;
  }
}

/**
 * Route factory for creating routes from legacy data
 */
export class RouteFactory {
  /**
   * Create route from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): RouteModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Route> = {
      externalIds: [legacyData.route_id || legacyData.ROUTE_ID || legacyData.id],
      name: legacyData.route_name || legacyData.ROUTE_NAME || legacyData.name,
      schedule: this.mapLegacySchedule(legacyData),
      assignedSites: legacyData.assigned_sites || legacyData.ASSIGNED_SITES || [],
      assignedVehicle: legacyData.assigned_vehicle || legacyData.ASSIGNED_VEHICLE,
      efficiency: legacyData.efficiency || legacyData.EFFICIENCY || 0,
      performanceMetrics: this.mapLegacyPerformanceMetrics(legacyData),
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy waste management system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
      },
    };

    return RouteModel.create(mappedData as any);
  }

  /**
   * Map legacy schedule formats
   */
  private static mapLegacySchedule(legacyData: Record<string, any>): Route['schedule'] {
    return {
      frequency: this.mapLegacyFrequency(legacyData.frequency || legacyData.FREQUENCY),
      dayOfWeek: this.mapLegacyDayOfWeek(
        legacyData.day_of_week || legacyData.DAY_OF_WEEK || legacyData.day
      ),
      startTime: legacyData.start_time || legacyData.START_TIME || '06:00',
      endTime: legacyData.end_time || legacyData.END_TIME || '15:00',
      holidays: legacyData.holidays || legacyData.HOLIDAYS,
    };
  }

  /**
   * Map legacy frequency formats
   */
  private static mapLegacyFrequency(legacyFrequency: string): Route['schedule']['frequency'] {
    const freqMap: Record<string, Route['schedule']['frequency']> = {
      weekly: 'weekly',
      week: 'weekly',
      bi_weekly: 'bi_weekly',
      biweekly: 'bi_weekly',
      monthly: 'monthly',
      month: 'monthly',
      on_call: 'on_call',
      oncall: 'on_call',
      one_time: 'one_time',
      onetime: 'one_time',
    };

    return freqMap[legacyFrequency.toLowerCase()] || 'weekly';
  }

  /**
   * Map legacy day of week formats
   */
  private static mapLegacyDayOfWeek(legacyDay: string): string {
    const dayMap: Record<string, string> = {
      monday: 'monday',
      mon: 'monday',
      tuesday: 'tuesday',
      tue: 'tuesday',
      tues: 'tuesday',
      wednesday: 'wednesday',
      wed: 'wednesday',
      thursday: 'thursday',
      thu: 'thursday',
      thurs: 'thursday',
      friday: 'friday',
      fri: 'friday',
      saturday: 'saturday',
      sat: 'saturday',
      sunday: 'sunday',
      sun: 'sunday',
    };

    return dayMap[legacyDay.toLowerCase()] || 'monday';
  }

  /**
   * Map legacy performance metrics
   */
  private static mapLegacyPerformanceMetrics(
    legacyData: Record<string, any>
  ): Route['performanceMetrics'] {
    return {
      averageServiceTime: legacyData.avg_service_time || legacyData.AVG_SERVICE_TIME,
      totalDistance: legacyData.total_distance || legacyData.TOTAL_DISTANCE,
      fuelEfficiency: legacyData.fuel_efficiency || legacyData.FUEL_EFFICIENCY,
      onTimePercentage: legacyData.on_time_percentage || legacyData.ON_TIME_PERCENTAGE,
    };
  }
}

/**
 * Route validator for external validation
 */
export class RouteValidator {
  /**
   * Validate route data without creating instance
   */
  static validate(data: Partial<Route>): { isValid: boolean; errors: string[] } {
    try {
      new RouteModel(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      };
    }
  }

  /**
   * Validate business rules
   */
  static validateBusinessRules(route: RouteModel): string[] {
    return route.validateBusinessRules();
  }
}

/**
 * Route optimization utilities
 */
export class RouteOptimizer {
  /**
   * Optimize multiple routes for better efficiency
   */
  static optimizeMultipleRoutes(routes: RouteModel[]): RouteModel[] {
    // Sort routes by efficiency (most efficient first)
    const sortedRoutes = [...routes].sort(
      (a, b) => b.getEfficiencyScore() - a.getEfficiencyScore()
    );

    // Rebalance sites between routes for better distribution
    return this.rebalanceRouteDistribution(sortedRoutes);
  }

  /**
   * Rebalance route distribution for optimal workload
   */
  private static rebalanceRouteDistribution(routes: RouteModel[]): RouteModel[] {
    const totalSites = routes.reduce((sum, route) => sum + route.assignedSites.length, 0);
    const averageSitesPerRoute = totalSites / routes.length;

    // Redistribute sites to balance workload
    const rebalancedRoutes = routes.map((route) => {
      if (Math.abs(route.assignedSites.length - averageSitesPerRoute) <= 1) {
        return route; // Route is already well-balanced
      }

      // Create a new route with adjusted site count
      const targetSiteCount = Math.round(averageSitesPerRoute);
      const newSites = route.assignedSites.slice(0, targetSiteCount);

      return new RouteModel({
        ...route,
        assignedSites: newSites,
        efficiency: Math.max(0, route.efficiency - 5), // Slightly reduce efficiency for rebalancing
      });
    });

    return rebalancedRoutes;
