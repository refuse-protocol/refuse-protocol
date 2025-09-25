/**
 * @fileoverview API adapter for existing waste management systems
 * @description RESTful API adapter for integrating with existing waste management systems
 * @version 1.0.0
 */

import { Event, Customer, Service, Route, Facility, MaterialTicket } from '../specifications/entities';
import express, { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * API Adapter for Existing Waste Management Systems
 * Provides RESTful API integration layer for legacy waste management systems
 */
export class WasteManagementAPIAdapter {
  private app: express.Application;
  private server: any;
  private port: number;
  private endpoints: Map<string, APIEndpoint> = new Map();
  private middleware: APIMiddleware[] = [];
  private authentication: APIAuthentication;
  private rateLimiter: RateLimiter;
  private requestLogger: RequestLogger;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.authentication = new APIAuthentication();
    this.rateLimiter = new RateLimiter();
    this.requestLogger = new RequestLogger();

    this.initializeMiddleware();
    this.initializeEndpoints();
    this.initializeErrorHandling();
  }

  /**
   * Start the API adapter server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`API Adapter listening on port ${this.port}`);
        resolve();
      });

      this.server.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Stop the API adapter server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Register a new API endpoint
   */
  registerEndpoint(path: string, endpoint: APIEndpoint): void {
    this.endpoints.set(path, endpoint);
    this.setupEndpointRoute(path, endpoint);
  }

  /**
   * Register middleware
   */
  registerMiddleware(middleware: APIMiddleware): void {
    this.middleware.push(middleware);
    this.app.use(middleware.handler);
  }

  /**
   * Get API adapter statistics
   */
  getStats(): APIAdapterStats {
    return {
      totalEndpoints: this.endpoints.size,
      totalMiddleware: this.middleware.length,
      uptime: process.uptime(),
      port: this.port,
      endpoints: Array.from(this.endpoints.keys()),
      middleware: this.middleware.map(m => m.name)
    };
  }

  /**
   * Initialize middleware stack
   */
  private initializeMiddleware(): void {
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // JSON parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(this.requestLogger.handler);

    // Rate limiting
    this.app.use(this.rateLimiter.handler);

    // Authentication middleware
    this.app.use(this.authentication.handler);
  }

  /**
   * Initialize API endpoints
   */
  private initializeEndpoints(): void {
    // Health check endpoint
    this.registerEndpoint('/health', {
      path: '/health',
      method: 'GET',
      handler: this.healthCheckHandler.bind(this),
      description: 'Health check endpoint',
      requiresAuth: false,
      rateLimit: 100
    });

    // Customer endpoints
    this.registerEndpoint('/customers', {
      path: '/customers',
      method: 'GET',
      handler: this.getCustomersHandler.bind(this),
      description: 'Get all customers',
      requiresAuth: true,
      rateLimit: 50,
      parameters: {
        query: {
          page: { type: 'number', required: false, description: 'Page number' },
          limit: { type: 'number', required: false, description: 'Items per page' },
          status: { type: 'string', required: false, description: 'Customer status filter' },
          type: { type: 'string', required: false, description: 'Customer type filter' }
        }
      }
    });

    this.registerEndpoint('/customers/:id', {
      path: '/customers/:id',
      method: 'GET',
      handler: this.getCustomerHandler.bind(this),
      description: 'Get customer by ID',
      requiresAuth: true,
      rateLimit: 50,
      parameters: {
        path: {
          id: { type: 'string', required: true, description: 'Customer ID' }
        }
      }
    });

    // Service endpoints
    this.registerEndpoint('/services', {
      path: '/services',
      method: 'GET',
      handler: this.getServicesHandler.bind(this),
      description: 'Get all services',
      requiresAuth: true,
      rateLimit: 50
    });

    this.registerEndpoint('/services/:id', {
      path: '/services/:id',
      method: 'GET',
      handler: this.getServiceHandler.bind(this),
      description: 'Get service by ID',
      requiresAuth: true,
      rateLimit: 50
    });

    // Route endpoints
    this.registerEndpoint('/routes', {
      path: '/routes',
      method: 'GET',
      handler: this.getRoutesHandler.bind(this),
      description: 'Get all routes',
      requiresAuth: true,
      rateLimit: 50
    });

    this.registerEndpoint('/routes/:id', {
      path: '/routes/:id',
      method: 'GET',
      handler: this.getRouteHandler.bind(this),
      description: 'Get route by ID',
      requiresAuth: true,
      rateLimit: 50
    });

    // Material ticket endpoints
    this.registerEndpoint('/material-tickets', {
      path: '/material-tickets',
      method: 'GET',
      handler: this.getMaterialTicketsHandler.bind(this),
      description: 'Get all material tickets',
      requiresAuth: true,
      rateLimit: 100
    });

    this.registerEndpoint('/material-tickets/:id', {
      path: '/material-tickets/:id',
      method: 'GET',
      handler: this.getMaterialTicketHandler.bind(this),
      description: 'Get material ticket by ID',
      requiresAuth: true,
      rateLimit: 50
    });

    // Event streaming endpoint
    this.registerEndpoint('/events', {
      path: '/events',
      method: 'GET',
      handler: this.getEventsHandler.bind(this),
      description: 'Get events with Server-Sent Events',
      requiresAuth: true,
      rateLimit: 25,
      streaming: true
    });

    // Webhook endpoints for external systems
    this.registerEndpoint('/webhooks/customer', {
      path: '/webhooks/customer',
      method: 'POST',
      handler: this.customerWebhookHandler.bind(this),
      description: 'Customer webhook endpoint',
      requiresAuth: false,
      webhook: true
    });

    this.registerEndpoint('/webhooks/route', {
      path: '/webhooks/route',
      method: 'POST',
      handler: this.routeWebhookHandler.bind(this),
      description: 'Route webhook endpoint',
      requiresAuth: false,
      webhook: true
    });

    this.registerEndpoint('/webhooks/facility', {
      path: '/webhooks/facility',
      method: 'POST',
      handler: this.facilityWebhookHandler.bind(this),
      description: 'Facility webhook endpoint',
      requiresAuth: false,
      webhook: true
    });
  }

  /**
   * Setup endpoint route
   */
  private setupEndpointRoute(path: string, endpoint: APIEndpoint): void {
    const routeHandler = async (req: express.Request, res: express.Response) => {
      try {
        const result = await endpoint.handler(req, res);

        if (endpoint.streaming && !res.headersSent) {
          // Handle streaming responses
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });

          if (result && typeof result === 'object' && 'stream' in result) {
            result.stream.pipe(res);
          }
        }

      } catch (error) {
        console.error(`Error handling ${endpoint.method} ${path}:`, error);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : String(error)
          });
        }
      }
    };

    // Apply rate limiting if specified
    let handler = routeHandler;
    if (endpoint.rateLimit) {
      handler = this.rateLimiter.createRateLimitedHandler(handler, endpoint.rateLimit);
    }

    // Register the route
    switch (endpoint.method) {
      case 'GET':
        this.app.get(path, handler);
        break;
      case 'POST':
        this.app.post(path, handler);
        break;
      case 'PUT':
        this.app.put(path, handler);
        break;
      case 'DELETE':
        this.app.delete(path, handler);
        break;
      default:
        console.warn(`Unsupported HTTP method: ${endpoint.method} for path: ${path}`);
    }
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableEndpoints: Array.from(this.endpoints.keys())
      });
    });

    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    });
  }

  // Endpoint handlers
  private async healthCheckHandler(req: express.Request, res: express.Response): Promise<void> {
    const stats = this.getStats();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      stats
    });
  }

  private async getCustomersHandler(req: express.Request, res: express.Response): Promise<void> {
    const { page = 1, limit = 50, status, type } = req.query;

    // Simulate customer data retrieval
    const customers = await this.fetchCustomersFromLegacy({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      type: type as string
    });

    res.json({
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: customers.length,
        hasMore: false // Would calculate from actual data
      }
    });
  }

  private async getCustomerHandler(req: express.Request, res: express.Response): Promise<void> {
    const { id } = req.params;

    const customer = await this.fetchCustomerFromLegacy(id);

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    res.json({ customer });
  }

  private async getServicesHandler(req: express.Request, res: express.Response): Promise<void> {
    const services = await this.fetchServicesFromLegacy();
    res.json({ services });
  }

  private async getServiceHandler(req: express.Request, res: express.Response): Promise<void> {
    const { id } = req.params;

    const service = await this.fetchServiceFromLegacy(id);

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json({ service });
  }

  private async getRoutesHandler(req: express.Request, res: express.Response): Promise<void> {
    const routes = await this.fetchRoutesFromLegacy();
    res.json({ routes });
  }

  private async getRouteHandler(req: express.Request, res: express.Response): Promise<void> {
    const { id } = req.params;

    const route = await this.fetchRouteFromLegacy(id);

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    res.json({ route });
  }

  private async getMaterialTicketsHandler(req: express.Request, res: express.Response): Promise<void> {
    const tickets = await this.fetchMaterialTicketsFromLegacy();
    res.json({ materialTickets: tickets });
  }

  private async getMaterialTicketHandler(req: express.Request, res: express.Response): Promise<void> {
    const { id } = req.params;

    const ticket = await this.fetchMaterialTicketFromLegacy(id);

    if (!ticket) {
      res.status(404).json({ error: 'Material ticket not found' });
      return;
    }

    res.json({ materialTicket: ticket });
  }

  private async getEventsHandler(req: express.Request, res: express.Response): Promise<any> {
    // Server-Sent Events implementation
    const eventStream = new EventEmitter();

    // Simulate event streaming
    const sendEvent = (event: any) => {
      eventStream.emit('data', `data: ${JSON.stringify(event)}\n\n`);
    };

    // Send initial connection event
    sendEvent({
      type: 'connection',
      message: 'Connected to event stream',
      timestamp: new Date().toISOString()
    });

    // Simulate periodic events
    const interval = setInterval(() => {
      sendEvent({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      });
    }, 5000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });

    return {
      stream: eventStream
    };
  }

  // Webhook handlers
  private async customerWebhookHandler(req: express.Request, res: express.Response): Promise<void> {
    console.log('Customer webhook received:', req.body);

    // Process webhook data
    const event: Event = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      entityType: 'customer',
      eventType: 'webhook_received',
      timestamp: new Date(),
      eventData: req.body,
      source: 'external_webhook'
    };

    // Emit event for processing
    this.emit('webhookReceived', event);

    res.json({ received: true, timestamp: new Date().toISOString() });
  }

  private async routeWebhookHandler(req: express.Request, res: express.Response): Promise<void> {
    console.log('Route webhook received:', req.body);

    const event: Event = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      entityType: 'route',
      eventType: 'webhook_received',
      timestamp: new Date(),
      eventData: req.body,
      source: 'external_webhook'
    };

    this.emit('webhookReceived', event);

    res.json({ received: true, timestamp: new Date().toISOString() });
  }

  private async facilityWebhookHandler(req: express.Request, res: express.Response): Promise<void> {
    console.log('Facility webhook received:', req.body);

    const event: Event = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      entityType: 'facility',
      eventType: 'webhook_received',
      timestamp: new Date(),
      eventData: req.body,
      source: 'external_webhook'
    };

    this.emit('webhookReceived', event);

    res.json({ received: true, timestamp: new Date().toISOString() });
  }

  // Legacy system data fetching (simulated)
  private async fetchCustomersFromLegacy(filters: any): Promise<Customer[]> {
    // Simulate fetching from legacy system
    console.log('Fetching customers from legacy system with filters:', filters);
    return [
      {
        id: 'CUST001',
        name: 'Acme Corporation',
        type: 'commercial',
        status: 'active',
        contactInfo: {
          primaryPhone: '555-0100',
          email: 'contact@acme.com',
          address: {
            street: '123 Business St',
            city: 'Business City',
            state: 'BC',
            zipCode: '12345'
          }
        },
        serviceArea: 'Area 1',
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-01-15'),
        version: 1
      }
    ];
  }

  private async fetchCustomerFromLegacy(id: string): Promise<Customer | null> {
    console.log('Fetching customer from legacy system:', id);
    return {
      id,
      name: 'Acme Corporation',
      type: 'commercial',
      status: 'active',
      contactInfo: {
        primaryPhone: '555-0100',
        email: 'contact@acme.com',
        address: {
          street: '123 Business St',
          city: 'Business City',
          state: 'BC',
          zipCode: '12345'
        }
      },
      serviceArea: 'Area 1',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-01-15'),
      version: 1
    };
  }

  private async fetchServicesFromLegacy(): Promise<Service[]> {
    console.log('Fetching services from legacy system');
    return [
      {
        id: 'SERV001',
        name: 'Weekly Waste Collection',
        type: 'waste_collection',
        status: 'active',
        frequency: 'weekly',
        pricing: {
          baseRate: 150.00,
          rateUnit: 'month',
          additionalCharges: 25.00
        },
        requirements: {
          containerTypes: ['dumpster'],
          specialHandling: null
        },
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-01-15'),
        version: 1
      }
    ];
  }

  private async fetchServiceFromLegacy(id: string): Promise<Service | null> {
    console.log('Fetching service from legacy system:', id);
    return {
      id,
      name: 'Weekly Waste Collection',
      type: 'waste_collection',
      status: 'active',
      frequency: 'weekly',
      pricing: {
        baseRate: 150.00,
        rateUnit: 'month',
        additionalCharges: 25.00
      },
      requirements: {
        containerTypes: ['dumpster'],
        specialHandling: null
      },
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-01-15'),
      version: 1
    };
  }

  private async fetchRoutesFromLegacy(): Promise<Route[]> {
    console.log('Fetching routes from legacy system');
    return [
      {
        id: 'ROUTE001',
        name: 'Monday Downtown',
        driver: 'John Driver',
        vehicle: 'TRUCK001',
        stops: [
          {
            customerId: 'CUST001',
            address: '123 Business St, Business City, BC 12345',
            scheduledTime: '08:00',
            serviceType: 'waste_collection'
          }
        ],
        status: 'active',
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-01-15'),
        version: 1
      }
    ];
  }

  private async fetchRouteFromLegacy(id: string): Promise<Route | null> {
    console.log('Fetching route from legacy system:', id);
    return {
      id,
      name: 'Monday Downtown',
      driver: 'John Driver',
      vehicle: 'TRUCK001',
      stops: [
        {
          customerId: 'CUST001',
          address: '123 Business St, Business City, BC 12345',
          scheduledTime: '08:00',
          serviceType: 'waste_collection'
        }
      ],
      status: 'active',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-01-15'),
      version: 1
    };
  }

  private async fetchMaterialTicketsFromLegacy(): Promise<MaterialTicket[]> {
    console.log('Fetching material tickets from legacy system');
    return [
      {
        id: 'TICKET001',
        customerId: 'CUST001',
        facilityId: 'FAC001',
        material: {
          id: 'MAT001',
          name: 'Mixed Waste',
          type: 'mixed_waste',
          classification: 'non_recyclable'
        },
        weight: {
          gross: 2500,
          tare: 500,
          net: 2000
        },
        pricing: {
          rate: 75.00,
          rateUnit: 'ton',
          totalAmount: 150.00
        },
        timestamp: new Date('2024-01-15T10:00:00Z'),
        status: 'processed',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        version: 1
      }
    ];
  }

  private async fetchMaterialTicketFromLegacy(id: string): Promise<MaterialTicket | null> {
    console.log('Fetching material ticket from legacy system:', id);
    return {
      id,
      customerId: 'CUST001',
      facilityId: 'FAC001',
      material: {
        id: 'MAT001',
        name: 'Mixed Waste',
        type: 'mixed_waste',
        classification: 'non_recyclable'
      },
      weight: {
        gross: 2500,
        tare: 500,
        net: 2000
      },
      pricing: {
        rate: 75.00,
        rateUnit: 'ton',
        totalAmount: 150.00
      },
      timestamp: new Date('2024-01-15T10:00:00Z'),
      status: 'processed',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      version: 1
    };
  }

  private emit(event: string, data: any): void {
    // EventEmitter mixin functionality would be implemented here
    console.log(`Event emitted: ${event}`, data);
  }
}

/**
 * API endpoint definition
 */
export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (req: express.Request, res: express.Response) => Promise<any>;
  description: string;
  requiresAuth: boolean;
  rateLimit?: number;
  streaming?: boolean;
  webhook?: boolean;
  parameters?: {
    path?: Record<string, ParameterDefinition>;
    query?: Record<string, ParameterDefinition>;
    body?: Record<string, ParameterDefinition>;
  };
}

/**
 * Parameter definition
 */
export interface ParameterDefinition {
  type: string;
  required: boolean;
  description: string;
}

/**
 * API middleware
 */
export interface APIMiddleware {
  name: string;
  handler: express.RequestHandler;
}

/**
 * API authentication
 */
export class APIAuthentication {
  private apiKeys: Set<string> = new Set(['test-key-123', 'production-key-456']);

  handler: express.RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] as string;

    // Check for Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (this.validateToken(token)) {
        return next();
      }
    }

    // Check for API key
    if (apiKey && this.apiKeys.has(apiKey)) {
      return next();
    }

    // Allow access to health check and webhooks without auth
    if (req.path === '/health' || req.path.startsWith('/webhooks')) {
      return next();
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication required'
    });
  };

  private validateToken(token: string): boolean {
    // Simple token validation - in production would use JWT or similar
    return token.length > 10;
  }
}

/**
 * Rate limiter
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 100;

  handler: express.RequestHandler = (req, res, next) => {
    const clientId = this.getClientId(req);
    const now = Date.now();

    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }

    const clientRequests = this.requests.get(clientId)!;

    // Remove old requests outside the window
    const validRequests = clientRequests.filter(timestamp => now - timestamp < this.windowMs);
    this.requests.set(clientId, validRequests);

    if (validRequests.length >= this.maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil(this.windowMs / 1000)
      });
      return;
    }

    validRequests.push(now);
    next();
  };

  createRateLimitedHandler(handler: express.RequestHandler, maxRequests: number): express.RequestHandler {
    return (req, res, next) => {
      const clientId = this.getClientId(req);
      const now = Date.now();

      if (!this.requests.has(clientId)) {
        this.requests.set(clientId, []);
      }

      const clientRequests = this.requests.get(clientId)!;
      const validRequests = clientRequests.filter(timestamp => now - timestamp < this.windowMs);

      if (validRequests.length >= maxRequests) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded for this endpoint',
          retryAfter: Math.ceil(this.windowMs / 1000)
        });
        return;
      }

      validRequests.push(now);
      handler(req, res, next);
    };
  }

  private getClientId(req: express.Request): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
}

/**
 * Request logger
 */
export class RequestLogger {
  handler: express.RequestHandler = (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${timestamp}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });

    next();
  };
}

/**
 * API adapter statistics
 */
export interface APIAdapterStats {
  totalEndpoints: number;
  totalMiddleware: number;
  uptime: number;
  port: number;
  endpoints: string[];
  middleware: string[];
}

/**
 * Export factory functions
 */
export function createWasteManagementAPIAdapter(port?: number): WasteManagementAPIAdapter {
  return new WasteManagementAPIAdapter(port);
}

// Export types
export type {
  APIEndpoint,
  ParameterDefinition,
  APIMiddleware
};
