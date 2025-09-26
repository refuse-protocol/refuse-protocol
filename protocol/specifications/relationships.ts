import { join } from 'path';
/**
 * @fileoverview Entity relationship mappings and foreign key validation
 * @description Defines relationships between all REFUSE Protocol entities with validation
 * @version 1.0.0
 */

import {
  Customer,
  Service,
  Route,
  Facility,
  CustomerRequest,
  Territory,
  Site,
  Contract,
  Fleet,
  Container,
  Yard,
  Order,
  Material,
  MaterialTicket,
  Payment,
  Allocation,
  Event,
  EntityRelationships,
  BaseEntity,
} from './entities';

/**
 * Entity relationship validator for foreign key constraints and data integrity
 */
export class EntityRelationshipValidator {
  /**
   * Validate foreign key relationships between entities
   */
  static validateForeignKey(
    entity: any,
    entityType: keyof EntityRelationships
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (entityType) {
      case 'Customer':
        errors.push(...this.validateCustomerRelationships(entity));
        break;
      case 'Service':
        errors.push(...this.validateServiceRelationships(entity));
        break;
      case 'Route':
        errors.push(...this.validateRouteRelationships(entity));
        break;
      case 'Facility':
        errors.push(...this.validateFacilityRelationships(entity));
        break;
      case 'Site':
        errors.push(...this.validateSiteRelationships(entity));
        break;
      // Note: Contract, CustomerRequest, and MaterialTicket relationships
      // are not yet defined in EntityRelationships interface
      // These validations can be called directly when needed
      default:
        errors.push(`Unknown entity type: ${entityType}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Customer entity relationships
   */
  private static validateCustomerRelationships(customer: Customer): string[] {
    const errors: string[] = [];

    // Customer should have at least one service contact if it's commercial/industrial
    if (
      (customer.type === 'commercial' || customer.type === 'industrial') &&
      (!customer.serviceContacts || customer.serviceContacts.length === 0)
    ) {
      errors.push('Commercial and industrial customers must have at least one service contact');
    }

    // Customer should have a billing address if it has a billing contact
    if (customer.billingContact && !customer.billingAddress) {
      errors.push('Customer with billing contact must have billing address');
    }

    // Customer should have tax ID if it's commercial
    if (customer.type === 'commercial' && !customer.taxId) {
      errors.push('Commercial customers must have a tax ID');
    }

    return errors;
  }

  /**
   * Validate Service entity relationships
   */
  private static validateServiceRelationships(service: Service): string[] {
    const errors: string[] = [];

    // Service should have pricing if it has a contract
    if (service.contractId && !service.pricing) {
      errors.push('Services with contracts must have pricing information');
    }

    // Service should have a route if it's active
    if (service.status === 'active' && !service.routeId) {
      errors.push('Active services must have a route assigned');
    }

    // Service should have performance tracking if it's been active for more than 30 days
    if (service.status === 'active' && service.serviceStartDate) {
      const serviceStart = new Date(service.serviceStartDate);
      const daysActive = Math.floor((Date.now() - serviceStart.getTime()) / (1000 * 60 * 60 * 24));

      if (daysActive > 30 && !service.performance) {
        errors.push('Services active for more than 30 days must have performance tracking');
      }
    }

    return errors;
  }

  /**
   * Validate Route entity relationships
   */
  private static validateRouteRelationships(route: Route): string[] {
    const errors: string[] = [];

    // Route should have performance metrics if it has assigned sites
    if (route.assignedSites.length > 0 && !route.performanceMetrics) {
      errors.push('Routes with assigned sites must have performance metrics');
    }

    // Route should have reasonable duration (2-12 hours)
    const durationMinutes = route.getDurationMinutes();
    if (durationMinutes < 120 || durationMinutes > 720) {
      errors.push('Route duration should be between 2 and 12 hours');
    }

    // Route efficiency should be tracked if it has performance metrics
    if (route.performanceMetrics && typeof route.efficiency !== 'number') {
      errors.push('Routes with performance metrics must have efficiency score');
    }

    return errors;
  }

  /**
   * Validate Facility entity relationships
   */
  private static validateFacilityRelationships(facility: Facility): string[] {
    const errors: string[] = [];

    // Facility should have utilization tracking if operational
    if (facility.status === 'operational' && !facility.utilization) {
      errors.push('Operational facilities must track utilization');
    }

    // Facility should have permits for accepted materials
    if (facility.acceptedMaterials.includes('hazardous')) {
      const hasHazardousPermit = facility.permits?.some(
        (permit) =>
          permit.permitType.toLowerCase().includes('hazardous') &&
          new Date(permit.validTo) > new Date()
      );

      if (!hasHazardousPermit) {
        errors.push(
          'Facilities accepting hazardous materials must have valid hazardous waste permits'
        );
      }
    }

    // Facility should have environmental controls if it's a landfill
    if (
      facility.type === 'landfill' &&
      (!facility.environmentalControls || facility.environmentalControls.length === 0)
    ) {
      errors.push('Landfills must have environmental controls');
    }

    return errors;
  }

  /**
   * Validate Site entity relationships
   */
  private static validateSiteRelationships(site: Site): string[] {
    const errors: string[] = [];

    // Site should have services if it has containers
    if (site.containers.length > 0 && site.services.length === 0) {
      errors.push('Sites with containers must have associated services');
    }

    // Site should have environmental permits for industrial customers
    if (site.environmentalPermits && site.environmentalPermits.length === 0) {
      errors.push('Sites should have appropriate environmental permits');
    }

    return errors;
  }

  /**
   * Validate Contract entity relationships
   */
  private static validateContractRelationships(contract: Contract): string[] {
    const errors: string[] = [];

    // Contract should have pricing information
    if (!contract.pricing || contract.pricing.baseRate <= 0) {
      errors.push('Contracts must have valid pricing information');
    }

    // Contract should have reasonable term dates
    if (new Date(contract.term.startDate) >= new Date(contract.term.endDate)) {
      errors.push('Contract start date must be before end date');
    }

    // Contract should have special terms for complex agreements
    if (
      contract.pricing.baseRate > 10000 &&
      (!contract.specialTerms || contract.specialTerms.length === 0)
    ) {
      errors.push('High-value contracts should have special terms documented');
    }

    return errors;
  }

  /**
   * Validate CustomerRequest entity relationships
   */
  private static validateCustomerRequestRelationships(request: CustomerRequest): string[] {
    const errors: string[] = [];

    // Request should have approval history
    if (!request.approvalHistory || request.approvalHistory.length === 0) {
      errors.push('Customer requests must have approval history');
    }

    // Completed requests should have related services
    if (
      request.status === 'completed' &&
      (!request.relatedServices || request.relatedServices.length === 0)
    ) {
      errors.push('Completed requests must have associated services');
    }

    // Request should not be overdue
    const daysSinceSubmission = request.getDaysSinceSubmission();
    if (daysSinceSubmission > 30) {
      errors.push('Request is overdue and requires immediate attention');
    }

    return errors;
  }

  /**
   * Validate MaterialTicket entity relationships
   */
  private static validateMaterialTicketRelationships(ticket: MaterialTicket): string[] {
    const errors: string[] = [];

    // Ticket should have material breakdown with 100% total
    const totalPercentage = ticket.materials.reduce(
      (sum, material) => sum + material.percentage,
      0
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      errors.push('Material percentages must total 100%');
    }

    // Ticket should have facility reference
    if (!ticket.facilityId) {
      errors.push('Material tickets must reference a facility');
    }

    // High-weight tickets should have multiple material breakdowns
    if (ticket.netWeight > 10000 && ticket.materials.length < 2) {
      errors.push('High-weight tickets (>10 tons) should have multiple material breakdowns');
    }

    return errors;
  }
}

/**
 * Entity relationship manager for cross-entity operations
 */
export class EntityRelationshipManager {
  /**
   * Get entities that reference a specific entity
   */
  static getReferencingEntities(
    targetEntityId: string,
    entityType: string,
    allEntities: Record<string, any[]>
  ): string[] {
    const referencingEntities: string[] = [];

    // This would be expanded to check all entity relationships
    // For now, returning a basic implementation
    switch (entityType) {
      case 'customer':
        // Check services, contracts, payments, requests that reference this customer
        if (allEntities.services) {
          referencingEntities.push(
            ...allEntities.services
              .filter((service: Service) => service.customerId === targetEntityId)
              .map((service) => `service:${service.id}`)
          );
        }
        break;

      case 'facility':
        // Check routes and material tickets that reference this facility
        if (allEntities.routes) {
          referencingEntities.push(
            ...allEntities.routes
              .filter((route: Route) =>
                route.assignedSites.some((siteId) => siteId.startsWith(targetEntityId))
              )
              .map((route) => `route:${route.id}`)
          );
        }
        break;

      case 'route':
        // Check services that reference this route
        if (allEntities.services) {
          referencingEntities.push(
            ...allEntities.services
              .filter((service: Service) => service.routeId === targetEntityId)
              .map((service) => `service:${service.id}`)
          );
        }
        break;
    }

    return referencingEntities;
  }

  /**
   * Validate entity deletion (check for dependent entities)
   */
  static canDeleteEntity(
    entityId: string,
    entityType: string,
    allEntities: Record<string, any[]>
  ): { canDelete: boolean; blockingEntities: string[] } {
    const referencingEntities = this.getReferencingEntities(entityId, entityType, allEntities);
    const blockingEntities = referencingEntities.filter((ref) => {
      // Define which references should block deletion
      const [refType, refId] = ref.split(':');
      switch (refType) {
        case 'service':
          return true; // Services reference customers - should block deletion
        case 'route':
          return true; // Routes reference facilities - should block deletion
        default:
          return false;
      }
    });

    return {
      canDelete: blockingEntities.length === 0,
      blockingEntities,
    };
  }

  /**
   * Get entity dependency graph
   */
  static getEntityDependencyGraph(entities: Record<string, any[]>): Record<string, string[]> {
    const dependencyGraph: Record<string, string[]> = {};

    // Build dependency relationships
    Object.keys(entities).forEach((entityType) => {
      dependencyGraph[entityType] = [];

      entities[entityType].forEach((entity: any) => {
        // Analyze entity properties to find foreign key references
        Object.values(entity).forEach((value: any) => {
          if (typeof value === 'string' && value.includes('-') && value.length > 10) {
            // Potential foreign key reference
            const referencedType = this.inferEntityTypeFromId(value);
            if (referencedType && !dependencyGraph[entityType].includes(referencedType)) {
              dependencyGraph[entityType].push(referencedType);
            }
          }
        });
      });
    });

    return dependencyGraph;
  }

  /**
   * Infer entity type from ID format
   */
  private static inferEntityTypeFromId(id: string): string | null {
    // This is a simplified implementation - in production this would use ID patterns
    if (id.startsWith('CUST-')) return 'customer';
    if (id.startsWith('SERVICE-')) return 'service';
    if (id.startsWith('ROUTE-')) return 'route';
    if (id.startsWith('FACILITY-')) return 'facility';
    if (id.startsWith('REQ-')) return 'customer_request';
    if (id.startsWith('TICKET-')) return 'material_ticket';
    if (id.startsWith('CONTRACT-')) return 'contract';
    if (id.startsWith('SITE-')) return 'site';
    if (id.startsWith('FLEET-')) return 'fleet';
    if (id.startsWith('CONTAINER-')) return 'container';
    if (id.startsWith('YARD-')) return 'yard';
    if (id.startsWith('ORDER-')) return 'order';
    if (id.startsWith('MATERIAL-')) return 'material';
    if (id.startsWith('PAYMENT-')) return 'payment';
    if (id.startsWith('ALLOCATION-')) return 'allocation';
    if (id.startsWith('TERRITORY-')) return 'territory';

    return null;
  }
}

/**
 * Entity integrity checker for data consistency
 */
export class EntityIntegrityChecker {
  /**
   * Check data integrity across all entities
   */
  static checkIntegrity(entities: Record<string, any[]>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for orphaned references
    errors.push(...this.checkOrphanedReferences(entities));

    // Check for circular dependencies
    errors.push(...this.checkCircularDependencies(entities));

    // Check for data consistency
    errors.push(...this.checkDataConsistency(entities));

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for orphaned references (entities that reference non-existent entities)
   */
  private static checkOrphanedReferences(entities: Record<string, any[]>): string[] {
    const errors: string[] = [];
    const entityIds = new Map<string, Set<string>>();

    // Build ID maps for all entities
    Object.keys(entities).forEach((entityType) => {
      entityIds.set(entityType, new Set(entities[entityType].map((entity) => entity.id)));
    });

    // Check for orphaned references
    Object.keys(entities).forEach((entityType) => {
      entities[entityType].forEach((entity: any) => {
        Object.entries(entity).forEach(([key, value]: [string, any]) => {
          if (typeof value === 'string' && value.includes('-') && value.length > 10) {
            const referencedType = EntityRelationshipManager['inferEntityTypeFromId'](value);
            if (referencedType && entityIds.has(referencedType)) {
              if (!entityIds.get(referencedType)!.has(value)) {
                errors.push(
                  `${entityType}:${entity.id} references non-existent ${referencedType}:${value}`
                );
              }
            }
          }
        });
      });
    });

    return errors;
  }

  /**
   * Check for circular dependencies
   */
  private static checkCircularDependencies(entities: Record<string, any[]>): string[] {
    const errors: string[] = [];
    const dependencyGraph = EntityRelationshipManager.getEntityDependencyGraph(entities);

    // Simplified circular dependency detection
    // In production this would use a proper graph algorithm
    Object.keys(dependencyGraph).forEach((entityType) => {
      if (dependencyGraph[entityType].includes(entityType)) {
        errors.push(`Circular dependency detected in ${entityType}`);
      }
    });

    return errors;
  }

  /**
   * Check for data consistency issues
   */
  private static checkDataConsistency(entities: Record<string, any[]>): string[] {
    const errors: string[] = [];

    // Check for duplicate IDs
    Object.keys(entities).forEach((entityType) => {
      const ids = entities[entityType].map((entity) => entity.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

      if (duplicates.length > 0) {
        errors.push(`${entityType} has duplicate IDs: ${duplicates.join(', ')}`);
      }
    });

    return errors;
  }
}

/**
 * Entity relationship utilities for common operations
 */
export class EntityRelationshipUtils {
  /**
   * Get entity hierarchy for a given entity
   */
  static getEntityHierarchy(
    entityId: string,
    entityType: string,
    entities: Record<string, any[]>
  ): Record<string, any[]> {
    const hierarchy: Record<string, any[]> = {};

    // Get direct references
    const referencingEntities = EntityRelationshipManager.getReferencingEntities(
      entityId,
      entityType,
      entities
    );

    hierarchy[`${entityType}_references`] = referencingEntities;

    // Get entities that this entity references
    const entity = entities[entityType]?.find((e) => e.id === entityId);
    if (entity) {
      const referencedEntities: string[] = [];

      Object.values(entity).forEach((value: any) => {
        if (typeof value === 'string' && value.includes('-') && value.length > 10) {
          const referencedType = EntityRelationshipManager['inferEntityTypeFromId'](value);
          if (referencedType) {
            referencedEntities.push(`${referencedType}:${value}`);
          }
        }
      });

      hierarchy[`${entityType}_dependencies`] = referencedEntities;
    }

    return hierarchy;
  }

  /**
   * Validate entity relationships before save
   */
  static validateBeforeSave(
    entity: any,
    entityType: string,
    entities: Record<string, any[]>
  ): { isValid: boolean; errors: string[] } {
    // Use the entity relationship validator
    return EntityRelationshipValidator.validateForeignKey(
      entity,
      entityType as keyof EntityRelationships
    );
  }

  /**
   * Get relationship summary for reporting
   */
  static getRelationshipSummary(entities: Record<string, any[]>): Record<string, any> {
    const summary: Record<string, any> = {
      totalEntities: 0,
      relationshipCounts: {},
      orphanedReferences: 0,
      circularDependencies: 0,
    };

    // Count total entities
    Object.keys(entities).forEach((entityType) => {
      summary.totalEntities += entities[entityType].length;
    });

    // Get integrity check results
    const integrityCheck = EntityIntegrityChecker.checkIntegrity(entities);

    summary.orphanedReferences = integrityCheck.errors.filter((error) =>
      error.includes('references non-existent')
    ).length;

    summary.circularDependencies = integrityCheck.errors.filter((error) =>
      error.includes('Circular dependency')
    ).length;

    return summary;
  }
}
