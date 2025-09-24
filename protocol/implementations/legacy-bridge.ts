/**
 * @fileoverview Legacy system data transformation bridge
 * @description Bridge for integrating with legacy waste management systems through data transformation
 * @version 1.0.0
 */

import { Event, Customer, Service, Route, Facility, MaterialTicket } from '../specifications/entities';
import { DataTransformer } from '../tools/data-transformer';

/**
 * Legacy System Data Transformation Bridge
 * Provides seamless integration with legacy waste management systems
 */
export class LegacySystemBridge {
  private transformers: Map<string, LegacyTransformer> = new Map();
  private connectors: Map<string, LegacyConnector> = new Map();
  private fieldMappings: Map<string, FieldMapping[]> = new Map();
  private systemAdapters: Map<string, SystemAdapter> = new Map();

  constructor() {
    this.initializeLegacyTransformers();
    this.initializeLegacyConnectors();
    this.initializeFieldMappings();
    this.initializeSystemAdapters();
  }

  /**
   * Transform legacy data to REFUSE Protocol format
   */
  async transformLegacyData(legacySystem: string, legacyData: any): Promise<TransformationResult> {
    const transformer = this.transformers.get(legacySystem);
    if (!transformer) {
      throw new Error(`No transformer found for legacy system: ${legacySystem}`);
    }

    try {
      const transformedData = await transformer.transform(legacyData);

      return {
        success: true,
        originalData: legacyData,
        transformedData,
        transformer: legacySystem,
        transformedAt: new Date(),
        metadata: {
          transformationRules: transformer.getTransformationRules(),
          fieldMappings: this.getFieldMappings(legacySystem)
        }
      };

    } catch (error) {
      return {
        success: false,
        originalData: legacyData,
        error: error instanceof Error ? error.message : String(error),
        transformer: legacySystem,
        transformedAt: new Date()
      };
    }
  }

  /**
   * Connect to legacy system
   */
  async connectToLegacySystem(systemName: string, connectionOptions: ConnectionOptions): Promise<ConnectionResult> {
    const connector = this.connectors.get(systemName);
    if (!connector) {
      throw new Error(`No connector found for legacy system: ${systemName}`);
    }

    try {
      const connection = await connector.connect(connectionOptions);
      return {
        success: true,
        systemName,
        connectionId: connection.connectionId,
        connectedAt: new Date(),
        capabilities: connection.capabilities
      };

    } catch (error) {
      return {
        success: false,
        systemName,
        error: error instanceof Error ? error.message : String(error),
        connectedAt: new Date()
      };
    }
  }

  /**
   * Sync data from legacy system
   */
  async syncFromLegacySystem(systemName: string, syncOptions: SyncOptions = {}): Promise<SyncResult> {
    const connector = this.connectors.get(systemName);
    if (!connector) {
      throw new Error(`No connector found for legacy system: ${systemName}`);
    }

    const startTime = Date.now();
    const syncResults: SyncOperationResult[] = [];

    try {
      // Get data from legacy system
      const legacyData = await connector.fetchData(syncOptions);

      // Transform data
      const transformationResult = await this.transformLegacyData(systemName, legacyData);

      if (transformationResult.success) {
        syncResults.push({
          operation: 'transform',
          success: true,
          recordCount: this.countRecords(transformationResult.transformedData),
          duration: Date.now() - startTime
        });
      } else {
        syncResults.push({
          operation: 'transform',
          success: false,
          error: transformationResult.error,
          duration: Date.now() - startTime
        });
      }

      return {
        success: syncResults.every(r => r.success),
        systemName,
        syncResults,
        totalDuration: Date.now() - startTime,
        syncedAt: new Date()
      };

    } catch (error) {
      return {
        success: false,
        systemName,
        syncResults: [{
          operation: 'sync',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime
        }],
        totalDuration: Date.now() - startTime,
        syncedAt: new Date()
      };
    }
  }

  /**
   * Create system adapter for specific legacy system
   */
  createSystemAdapter(systemName: string, adapterConfig: AdapterConfig): SystemAdapter {
    const baseAdapter = this.systemAdapters.get(systemName);
    if (!baseAdapter) {
      throw new Error(`No base adapter found for system: ${systemName}`);
    }

    const adapter = { ...baseAdapter, ...adapterConfig };

    // Register the adapter
    this.systemAdapters.set(`${systemName}-custom-${Date.now()}`, adapter);

    return adapter;
  }

  /**
   * Get field mappings for legacy system
   */
  getFieldMappings(systemName: string): FieldMapping[] {
    return this.fieldMappings.get(systemName) || [];
  }

  /**
   * Validate legacy data compatibility
   */
  validateLegacyData(systemName: string, legacyData: any): ValidationResult {
    const transformer = this.transformers.get(systemName);
    if (!transformer) {
      return {
        valid: false,
        errors: [`No transformer found for system: ${systemName}`],
        warnings: []
      };
    }

    return transformer.validate(legacyData);
  }

  /**
   * Count records in transformed data
   */
  private countRecords(data: any): number {
    if (Array.isArray(data)) {
      return data.length;
    } else if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length;
    }
    return 1;
  }

  /**
   * Initialize legacy transformers
   */
  private initializeLegacyTransformers(): void {
    // WasteWorks transformer
    this.transformers.set('wasteworks', {
      name: 'WasteWorks Transformer',
      systemType: 'waste_management',
      version: '1.0',

      transform: async (legacyData: any) => {
        const transformed: any = {};

        // Transform customer data
        if (legacyData.customers) {
          transformed.customers = legacyData.customers.map((customer: any) => ({
            id: customer.CUSTOMER_ID,
            name: customer.CUSTOMER_NAME,
            type: this.mapCustomerType(customer.CUSTOMER_TYPE),
            status: this.mapCustomerStatus(customer.STATUS),
            contactInfo: {
              primaryPhone: customer.PHONE,
              email: customer.EMAIL,
              address: {
                street: customer.ADDRESS_STREET,
                city: customer.ADDRESS_CITY,
                state: customer.ADDRESS_STATE,
                zipCode: customer.ADDRESS_ZIP
              }
            },
            serviceArea: customer.SERVICE_AREA,
            createdAt: new Date(customer.CREATED_DATE),
            updatedAt: new Date(customer.UPDATED_DATE)
          }));
        }

        // Transform service data
        if (legacyData.services) {
          transformed.services = legacyData.services.map((service: any) => ({
            id: service.SERVICE_ID,
            name: service.SERVICE_NAME,
            type: this.mapServiceType(service.SERVICE_TYPE),
            frequency: service.FREQUENCY,
            pricing: {
              baseRate: service.BASE_RATE,
              rateUnit: this.mapRateUnit(service.RATE_UNIT),
              additionalCharges: service.ADDITIONAL_CHARGES
            },
            requirements: {
              containerTypes: service.CONTAINER_TYPES,
              specialHandling: service.SPECIAL_HANDLING
            }
          }));
        }

        return transformed;
      },

      validate: (legacyData: any) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!legacyData.customers && !legacyData.services) {
          errors.push('Legacy data must contain either customers or services');
        }

        if (legacyData.customers && !Array.isArray(legacyData.customers)) {
          errors.push('Customers data must be an array');
        }

        if (legacyData.services && !Array.isArray(legacyData.services)) {
          errors.push('Services data must be an array');
        }

        return { valid: errors.length === 0, errors, warnings };
      },

      getTransformationRules: () => ({
        customerMapping: {
          CUSTOMER_ID: 'id',
          CUSTOMER_NAME: 'name',
          CUSTOMER_TYPE: 'type',
          STATUS: 'status'
        },
        serviceMapping: {
          SERVICE_ID: 'id',
          SERVICE_NAME: 'name',
          SERVICE_TYPE: 'type',
          FREQUENCY: 'frequency'
        }
      })
    });

    // TrashFlow transformer
    this.transformers.set('trashflow', {
      name: 'TrashFlow Transformer',
      systemType: 'waste_management',
      version: '2.0',

      transform: async (legacyData: any) => {
        const transformed: any = {};

        // Transform route data
        if (legacyData.routes) {
          transformed.routes = legacyData.routes.map((route: any) => ({
            id: route.ROUTE_ID,
            name: route.ROUTE_NAME,
            driver: route.DRIVER_NAME,
            vehicle: route.VEHICLE_ID,
            stops: route.STOPS.map((stop: any) => ({
              customerId: stop.CUSTOMER_ID,
              address: stop.ADDRESS,
              scheduledTime: stop.SCHEDULED_TIME,
              serviceType: stop.SERVICE_TYPE
            })),
            status: this.mapRouteStatus(route.STATUS),
            createdAt: new Date(route.CREATED_DATE),
            updatedAt: new Date(route.UPDATED_DATE)
          }));
        }

        return transformed;
      },

      validate: (legacyData: any) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (legacyData.routes && !Array.isArray(legacyData.routes)) {
          errors.push('Routes data must be an array');
        }

        return { valid: errors.length === 0, errors, warnings };
      },

      getTransformationRules: () => ({
        routeMapping: {
          ROUTE_ID: 'id',
          ROUTE_NAME: 'name',
          DRIVER_NAME: 'driver',
          VEHICLE_ID: 'vehicle',
          STATUS: 'status'
        }
      })
    });
  }

  /**
   * Initialize legacy connectors
   */
  private initializeLegacyConnectors(): void {
    this.connectors.set('wasteworks', {
      name: 'WasteWorks Connector',
      systemType: 'waste_management',

      connect: async (options: ConnectionOptions) => {
        // Simulate connection to WasteWorks system
        console.log(`Connecting to WasteWorks at ${options.host}:${options.port}`);

        return {
          connectionId: `wasteworks-${Date.now()}`,
          capabilities: ['customers', 'services', 'invoices']
        };
      },

      fetchData: async (syncOptions: SyncOptions) => {
        // Simulate data fetching from WasteWorks
        console.log(`Fetching data from WasteWorks with options:`, syncOptions);

        return {
          customers: [
            {
              CUSTOMER_ID: 'CUST001',
              CUSTOMER_NAME: 'Acme Corporation',
              CUSTOMER_TYPE: 'COMMERCIAL',
              STATUS: 'ACTIVE',
              PHONE: '555-0100',
              EMAIL: 'contact@acme.com',
              ADDRESS_STREET: '123 Business St',
              ADDRESS_CITY: 'Business City',
              ADDRESS_STATE: 'BC',
              ADDRESS_ZIP: '12345',
              SERVICE_AREA: 'Area 1',
              CREATED_DATE: '2023-01-15T10:00:00Z',
              UPDATED_DATE: '2024-01-15T10:00:00Z'
            }
          ],
          services: [
            {
              SERVICE_ID: 'SERV001',
              SERVICE_NAME: 'Weekly Waste Collection',
              SERVICE_TYPE: 'WASTE_COLLECTION',
              FREQUENCY: 'WEEKLY',
              BASE_RATE: 150.00,
              RATE_UNIT: 'MONTHLY',
              ADDITIONAL_CHARGES: 25.00,
              CONTAINER_TYPES: ['DUMPSTER'],
              SPECIAL_HANDLING: null
            }
          ]
        };
      }
    });

    this.connectors.set('trashflow', {
      name: 'TrashFlow Connector',
      systemType: 'routing_optimization',

      connect: async (options: ConnectionOptions) => {
        // Simulate connection to TrashFlow system
        console.log(`Connecting to TrashFlow at ${options.host}:${options.port}`);

        return {
          connectionId: `trashflow-${Date.now()}`,
          capabilities: ['routes', 'schedules', 'optimization']
        };
      },

      fetchData: async (syncOptions: SyncOptions) => {
        // Simulate data fetching from TrashFlow
        console.log(`Fetching data from TrashFlow with options:`, syncOptions);

        return {
          routes: [
            {
              ROUTE_ID: 'ROUTE001',
              ROUTE_NAME: 'Monday Downtown',
              DRIVER_NAME: 'John Driver',
              VEHICLE_ID: 'TRUCK001',
              STATUS: 'ACTIVE',
              STOPS: [
                {
                  CUSTOMER_ID: 'CUST001',
                  ADDRESS: '123 Business St, Business City, BC 12345',
                  SCHEDULED_TIME: '08:00',
                  SERVICE_TYPE: 'WASTE_COLLECTION'
                },
                {
                  CUSTOMER_ID: 'CUST002',
                  ADDRESS: '456 Commerce Ave, Business City, BC 12346',
                  SCHEDULED_TIME: '09:30',
                  SERVICE_TYPE: 'RECYCLING'
                }
              ],
              CREATED_DATE: '2023-01-15T10:00:00Z',
              UPDATED_DATE: '2024-01-15T10:00:00Z'
            }
          ]
        };
      }
    });
  }

  /**
   * Initialize field mappings
   */
  private initializeFieldMappings(): void {
    this.fieldMappings.set('wasteworks', [
      {
        legacyField: 'CUSTOMER_ID',
        refuseField: 'id',
        dataType: 'string',
        required: true,
        transformation: 'direct'
      },
      {
        legacyField: 'CUSTOMER_NAME',
        refuseField: 'name',
        dataType: 'string',
        required: true,
        transformation: 'direct'
      },
      {
        legacyField: 'CUSTOMER_TYPE',
        refuseField: 'type',
        dataType: 'string',
        required: true,
        transformation: 'map',
        mapping: {
          'COMMERCIAL': 'commercial',
          'RESIDENTIAL': 'residential',
          'INDUSTRIAL': 'industrial'
        }
      }
    ]);

    this.fieldMappings.set('trashflow', [
      {
        legacyField: 'ROUTE_ID',
        refuseField: 'id',
        dataType: 'string',
        required: true,
        transformation: 'direct'
      },
      {
        legacyField: 'DRIVER_NAME',
        refuseField: 'driver',
        dataType: 'string',
        required: false,
        transformation: 'direct'
      },
      {
        legacyField: 'STATUS',
        refuseField: 'status',
        dataType: 'string',
        required: true,
        transformation: 'map',
        mapping: {
          'ACTIVE': 'active',
          'INACTIVE': 'inactive',
          'COMPLETED': 'completed'
        }
      }
    ]);
  }

  /**
   * Initialize system adapters
   */
  private initializeSystemAdapters(): void {
    this.systemAdapters.set('wasteworks', {
      name: 'WasteWorks Adapter',
      systemType: 'waste_management',
      version: '1.0',
      capabilities: ['customer_management', 'service_management'],
      configuration: {
        apiEndpoint: '/api/v1',
        authType: 'basic',
        rateLimit: 100
      }
    });

    this.systemAdapters.set('trashflow', {
      name: 'TrashFlow Adapter',
      systemType: 'routing_optimization',
      version: '2.0',
      capabilities: ['route_optimization', 'scheduling'],
      configuration: {
        apiEndpoint: '/api/v2',
        authType: 'oauth2',
        rateLimit: 200
      }
    });
  }

  /**
   * Map customer type
   */
  private mapCustomerType(legacyType: string): string {
    const mapping: Record<string, string> = {
      'COMMERCIAL': 'commercial',
      'RESIDENTIAL': 'residential',
      'INDUSTRIAL': 'industrial',
      'GOVERNMENT': 'government'
    };
    return mapping[legacyType] || 'commercial';
  }

  /**
   * Map customer status
   */
  private mapCustomerStatus(legacyStatus: string): string {
    const mapping: Record<string, string> = {
      'ACTIVE': 'active',
      'INACTIVE': 'inactive',
      'SUSPENDED': 'suspended',
      'CLOSED': 'closed'
    };
    return mapping[legacyStatus] || 'active';
  }

  /**
   * Map service type
   */
  private mapServiceType(legacyType: string): string {
    const mapping: Record<string, string> = {
      'WASTE_COLLECTION': 'waste_collection',
      'RECYCLING': 'recycling',
      'HAZARDOUS_WASTE': 'hazardous_waste',
      'BULK_WASTE': 'bulk_waste'
    };
    return mapping[legacyType] || 'waste_collection';
  }

  /**
   * Map rate unit
   */
  private mapRateUnit(legacyUnit: string): string {
    const mapping: Record<string, string> = {
      'MONTHLY': 'month',
      'QUARTERLY': 'quarter',
      'ANNUALLY': 'year',
      'PER_PICKUP': 'pickup'
    };
    return mapping[legacyUnit] || 'month';
  }

  /**
   * Map route status
   */
  private mapRouteStatus(legacyStatus: string): string {
    const mapping: Record<string, string> = {
      'ACTIVE': 'active',
      'INACTIVE': 'inactive',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled'
    };
    return mapping[legacyStatus] || 'active';
  }
}

/**
 * Legacy transformer interface
 */
export interface LegacyTransformer {
  name: string;
  systemType: string;
  version: string;

  transform(legacyData: any): Promise<any>;
  validate(legacyData: any): ValidationResult;
  getTransformationRules(): TransformationRules;
}

/**
 * Legacy connector interface
 */
export interface LegacyConnector {
  name: string;
  systemType: string;

  connect(options: ConnectionOptions): Promise<ConnectionResult>;
  fetchData(syncOptions: SyncOptions): Promise<any>;
}

/**
 * System adapter interface
 */
export interface SystemAdapter {
  name: string;
  systemType: string;
  version: string;
  capabilities: string[];
  configuration: AdapterConfiguration;
}

/**
 * Field mapping
 */
export interface FieldMapping {
  legacyField: string;
  refuseField: string;
  dataType: string;
  required: boolean;
  transformation: 'direct' | 'map' | 'custom';
  mapping?: Record<string, string>;
  customTransform?: (value: any) => any;
}

/**
 * Transformation result
 */
export interface TransformationResult {
  success: boolean;
  originalData: any;
  transformedData?: any;
  transformer: string;
  transformedAt: Date;
  error?: string;
  metadata?: {
    transformationRules: TransformationRules;
    fieldMappings: FieldMapping[];
  };
}

/**
 * Connection options
 */
export interface ConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  apiKey?: string;
  database?: string;
  options?: Record<string, any>;
}

/**
 * Connection result
 */
export interface ConnectionResult {
  success: boolean;
  systemName: string;
  connectionId?: string;
  connectedAt: Date;
  capabilities?: string[];
  error?: string;
}

/**
 * Sync options
 */
export interface SyncOptions {
  entityTypes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  incremental?: boolean;
  lastSyncToken?: string;
  batchSize?: number;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  systemName: string;
  syncResults: SyncOperationResult[];
  totalDuration: number;
  syncedAt: Date;
}

/**
 * Sync operation result
 */
export interface SyncOperationResult {
  operation: string;
  success: boolean;
  recordCount?: number;
  duration: number;
  error?: string;
}

/**
 * Adapter configuration
 */
export interface AdapterConfiguration {
  apiEndpoint: string;
  authType: 'basic' | 'oauth2' | 'apikey';
  rateLimit: number;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Adapter config
 */
export interface AdapterConfig {
  name?: string;
  version?: string;
  capabilities?: string[];
  configuration?: Partial<AdapterConfiguration>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Transformation rules
 */
export interface TransformationRules {
  [key: string]: Record<string, string>;
}

/**
 * Export factory functions
 */
export function createLegacySystemBridge(): LegacySystemBridge {
  return new LegacySystemBridge();
}

// Export types
export type {
  LegacyTransformer,
  LegacyConnector,
  SystemAdapter,
  FieldMapping,
  TransformationResult,
  ConnectionOptions,
  ConnectionResult,
  SyncOptions,
  SyncResult,
  SyncOperationResult,
  AdapterConfiguration,
  AdapterConfig,
  ValidationResult,
  TransformationRules
};
