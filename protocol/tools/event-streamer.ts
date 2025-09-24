/**
 * @fileoverview Event streaming protocol with WebSocket support for REFUSE Protocol
 * @description Real-time event streaming with guaranteed delivery, filtering, and multi-transport support
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { WebSocket, Server as WebSocketServer } from 'ws';
import { createServer, Server as HTTPServer } from 'http';
import { createServer as createHTTPSServer, Server as HTTPSServer } from 'https';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';
import { Event } from '../specifications/entities';

/**
 * REFUSE Protocol Event Streaming Engine
 * Provides real-time event streaming with guaranteed delivery and multi-transport support
 */
export class EventStreamer extends EventEmitter {
  private wsServer?: WebSocketServer;
  private httpServer?: HTTPServer | HTTPSServer;
  private connections: Map<string, StreamConnection> = new Map();
  private eventBuffer: Event[] = [];
  private subscribers: Map<string, Subscriber> = new Map();
  private isRunning = false;
  private config: StreamerConfig;

  constructor(config: StreamerConfig) {
    super();
    this.config = { ...defaultStreamerConfig, ...config };
    this.setupEventHandling();
  }

  /**
   * Start the event streaming server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Event streamer is already running');
    }

    try {
      console.log(chalk.blue('🚀 Starting REFUSE Protocol Event Streamer...'));

      // Create HTTP/HTTPS server
      if (this.config.ssl?.enabled) {
        this.httpServer = createHTTPSServer(this.config.ssl.options, this.createHTTPHandler());
      } else {
        this.httpServer = createServer(this.createHTTPHandler());
      }

      // Create WebSocket server
      this.wsServer = new WebSocketServer({
        server: this.httpServer,
        path: this.config.websocket.path,
        perMessageDeflate: this.config.websocket.compression,
        maxPayload: this.config.websocket.maxPayloadSize
      });

      // Setup WebSocket handlers
      this.setupWebSocketHandlers();

      // Start HTTP server
      const port = this.config.server.port;
      const protocol = this.config.ssl?.enabled ? 'https' : 'http';
      const host = this.config.server.host;

      await new Promise<void>((resolve, reject) => {
        this.httpServer!.listen(port, host, () => {
          console.log(chalk.green(`✅ Event streamer listening on ${protocol}://${host}:${port}`));
          console.log(chalk.gray(`   WebSocket endpoint: ${protocol}://${host}:${port}${this.config.websocket.path}`));
          resolve();
        });

        this.httpServer!.on('error', (error) => {
          console.error(chalk.red(`❌ Failed to start server: ${error.message}`));
          reject(error);
        });
      });

      this.isRunning = true;

      // Start health check and cleanup
      this.startMaintenanceTasks();

      console.log(chalk.green('✅ REFUSE Protocol Event Streamer started successfully'));
    } catch (error) {
      throw new Error(`Failed to start event streamer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Stop the event streaming server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log(chalk.blue('🛑 Stopping REFUSE Protocol Event Streamer...'));

    // Close all connections
    for (const [connectionId, connection] of this.connections) {
      try {
        connection.socket.close(1000, 'Server shutting down');
        console.log(chalk.gray(`  Disconnected client: ${connectionId}`));
      } catch (error) {
        console.warn(chalk.yellow(`⚠️ Error closing connection ${connectionId}: ${error instanceof Error ? error.message : String(error)}`));
      }
    }

    this.connections.clear();
    this.subscribers.clear();

    // Stop WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
    }

    // Stop HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
    }

    this.isRunning = false;
    console.log(chalk.green('✅ Event streamer stopped'));
  }

  /**
   * Stream an event to all subscribers
   */
  streamEvent(event: Event): void {
    if (!this.isRunning) {
      console.warn(chalk.yellow('⚠️ Cannot stream event: server not running'));
      return;
    }

    // Add to buffer for new connections
    this.eventBuffer.push(event);

    // Keep buffer within limits
    if (this.eventBuffer.length > this.config.buffer.maxSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.config.buffer.maxSize);
    }

    // Emit event for internal listeners
    this.emit('event', event);

    // Stream to active subscribers
    this.streamToSubscribers(event);

    console.log(chalk.gray(`📡 Streamed event: ${event.entityType}.${event.eventType} to ${this.subscribers.size} subscribers`));
  }

  /**
   * Subscribe to events with filtering
   */
  subscribe(
    clientId: string,
    filters: EventFilters,
    callback: (event: Event) => void | Promise<void>
  ): Subscription {
    const subscriber: Subscriber = {
      id: clientId,
      filters,
      callback,
      subscriptionTime: new Date(),
      eventCount: 0,
      lastEventTime: undefined
    };

    this.subscribers.set(clientId, subscriber);

    // Send buffered events that match filters
    const matchingBufferedEvents = this.eventBuffer.filter(event =>
      this.matchesFilters(event, filters)
    );

    if (matchingBufferedEvents.length > 0) {
      console.log(chalk.gray(`📚 Sending ${matchingBufferedEvents.length} buffered events to ${clientId}`));

      // Send buffered events asynchronously
      setImmediate(async () => {
        for (const event of matchingBufferedEvents) {
          try {
            await callback(event);
            subscriber.eventCount++;
            subscriber.lastEventTime = new Date();
          } catch (error) {
            console.warn(chalk.yellow(`⚠️ Subscriber ${clientId} failed to process buffered event: ${error instanceof Error ? error.message : String(error)}`));
          }
        }
      });
    }

    const subscription = {
      id: clientId,
      filters,
      unsubscribe: () => {
        this.subscribers.delete(clientId);
        console.log(chalk.gray(`👋 Unsubscribed client: ${clientId}`));
      },
      updateFilters: (newFilters: EventFilters) => {
        subscriber.filters = newFilters;
        console.log(chalk.gray(`🔄 Updated filters for client: ${clientId}`));
      }
    };

    console.log(chalk.green(`✅ Subscribed client: ${clientId} with filters: ${JSON.stringify(filters)}`));
    return subscription;
  }

  /**
   * Get streaming statistics
   */
  getStatistics(): StreamingStatistics {
    const subscribers = Array.from(this.subscribers.values());
    const connections = Array.from(this.connections.values());

    return {
      isRunning: this.isRunning,
      uptime: this.isRunning ? Date.now() - (this as any).startTime : 0,
      totalSubscribers: subscribers.length,
      activeConnections: connections.filter(c => c.socket.readyState === WebSocket.OPEN).length,
      totalEventsStreamed: this.eventBuffer.length,
      bufferSize: this.eventBuffer.length,
      serverInfo: {
        port: this.config.server.port,
        host: this.config.server.host,
        sslEnabled: this.config.ssl?.enabled || false,
        websocketPath: this.config.websocket.path
      },
      subscribersByType: subscribers.reduce((acc, sub) => {
        const typeKey = `${sub.filters.entityTypes?.join(',') || 'all'}:${sub.filters.eventTypes?.join(',') || 'all'}`;
        acc[typeKey] = (acc[typeKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentActivity: {
        eventsLastMinute: this.eventBuffer.filter(e =>
          Date.now() - new Date(e.timestamp).getTime() < 60000
        ).length,
        newSubscribersLastHour: subscribers.filter(s =>
          Date.now() - s.subscriptionTime.getTime() < 3600000
        ).length
      }
    };
  }

  /**
   * Create HTTP request handler
   */
  private createHTTPHandler() {
    return (req: any, res: any) => {
      const url = new URL(req.url, `http://${req.headers.host}`);

      // Health check endpoint
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          stats: this.getStatistics()
        }));
        return;
      }

      // Server-sent events endpoint
      if (url.pathname === '/events/sse') {
        this.handleServerSentEvents(req, res);
        return;
      }

      // Default handler
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Not Found',
        message: 'REFUSE Protocol Event Streamer',
        endpoints: {
          health: `${url.origin}/health`,
          sse: `${url.origin}/events/sse`,
          websocket: `${url.origin}${this.config.websocket.path}`
        }
      }));
    };
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.wsServer) return;

    this.wsServer.on('connection', (socket, req) => {
      const connectionId = uuidv4();
      const connection: StreamConnection = {
        id: connectionId,
        socket,
        connectedAt: new Date(),
        subscriptions: new Set(),
        messageCount: 0,
        lastActivity: new Date()
      };

      this.connections.set(connectionId, connection);

      console.log(chalk.green(`🔌 WebSocket connected: ${connectionId}`));

      // Handle messages
      socket.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(connectionId, message);
          connection.messageCount++;
          connection.lastActivity = new Date();
        } catch (error) {
          console.warn(chalk.yellow(`⚠️ Invalid WebSocket message from ${connectionId}: ${error instanceof Error ? error.message : String(error)}`));
          socket.send(JSON.stringify({
            error: 'Invalid message format',
            message: 'Messages must be valid JSON'
          }));
        }
      });

      // Handle connection close
      socket.on('close', () => {
        console.log(chalk.gray(`🔌 WebSocket disconnected: ${connectionId}`));
        this.connections.delete(connectionId);

        // Remove subscriptions
        for (const [subscriberId, subscriber] of this.subscribers) {
          if (subscriber.connectionId === connectionId) {
            this.subscribers.delete(subscriberId);
          }
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(chalk.red(`❌ WebSocket error for ${connectionId}: ${error.message}`));
      });

      // Send welcome message
      socket.send(JSON.stringify({
        type: 'welcome',
        connectionId,
        timestamp: new Date().toISOString(),
        message: 'Connected to REFUSE Protocol Event Streamer'
      }));
    });

    this.wsServer.on('error', (error) => {
      console.error(chalk.red(`❌ WebSocket server error: ${error.message}`));
    });
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(connectionId: string, message: any): void {
    switch (message.type) {
      case 'subscribe':
        this.handleWebSocketSubscription(connectionId, message);
        break;
      case 'unsubscribe':
        this.handleWebSocketUnsubscription(connectionId, message);
        break;
      case 'ping':
        this.connections.get(connectionId)?.socket.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
      default:
        console.warn(chalk.yellow(`⚠️ Unknown WebSocket message type: ${message.type}`));
    }
  }

  /**
   * Handle WebSocket subscription
   */
  private handleWebSocketSubscription(connectionId: string, message: any): void {
    const { clientId, filters } = message;

    if (!clientId || !filters) {
      this.connections.get(connectionId)?.socket.send(JSON.stringify({
        error: 'Invalid subscription request',
        message: 'clientId and filters are required'
      }));
      return;
    }

    const subscription = this.subscribe(clientId, filters, async (event) => {
      const socket = this.connections.get(connectionId)?.socket;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'event',
          event,
          timestamp: new Date().toISOString()
        }));
      }
    });

    // Store subscription info
    const subscriber = this.subscribers.get(clientId);
    if (subscriber) {
      subscriber.connectionId = connectionId;
    }

    this.connections.get(connectionId)?.socket.send(JSON.stringify({
      type: 'subscription_confirmed',
      subscriptionId: clientId,
      filters,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Handle WebSocket unsubscription
   */
  private handleWebSocketUnsubscription(connectionId: string, message: any): void {
    const { clientId } = message;

    if (clientId) {
      this.subscribers.delete(clientId);
      this.connections.get(connectionId)?.socket.send(JSON.stringify({
        type: 'unsubscription_confirmed',
        subscriptionId: clientId,
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Handle Server-Sent Events
   */
  private handleServerSentEvents(req: any, res: any): void {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const clientId = url.searchParams.get('clientId') || uuidv4();

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
      message: 'Connected to REFUSE Protocol Event Streamer (SSE)'
    })}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      })}\n\n`);
    }, 30000); // Heartbeat every 30 seconds

    // Subscribe to events
    const filters: EventFilters = {
      entityTypes: url.searchParams.get('entityTypes')?.split(',') || undefined,
      eventTypes: url.searchParams.get('eventTypes')?.split(',') || undefined
    };

    const subscription = this.subscribe(clientId, filters, async (event) => {
      res.write(`data: ${JSON.stringify({
        type: 'event',
        event,
        timestamp: new Date().toISOString()
      })}\n\n`);
    });

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      subscription.unsubscribe();
      console.log(chalk.gray(`🔌 SSE client disconnected: ${clientId}`));
    });

    req.on('error', (error: Error) => {
      clearInterval(heartbeat);
      subscription.unsubscribe();
      console.error(chalk.red(`❌ SSE client error: ${clientId} - ${error.message}`));
    });
  }

  /**
   * Stream event to all matching subscribers
   */
  private streamToSubscribers(event: Event): void {
    const matchingSubscribers = Array.from(this.subscribers.values())
      .filter(subscriber => this.matchesFilters(event, subscriber.filters));

    // Stream to subscribers asynchronously to avoid blocking
    setImmediate(async () => {
      for (const subscriber of matchingSubscribers) {
        try {
          await subscriber.callback(event);
          subscriber.eventCount++;
          subscriber.lastEventTime = new Date();
        } catch (error) {
          console.warn(chalk.yellow(`⚠️ Subscriber ${subscriber.id} failed to process event: ${error instanceof Error ? error.message : String(error)}`));
        }
      }
    });
  }

  /**
   * Check if event matches subscriber filters
   */
  private matchesFilters(event: Event, filters: EventFilters): boolean {
    // Check entity type filter
    if (filters.entityTypes && !filters.entityTypes.includes(event.entityType)) {
      return false;
    }

    // Check event type filter
    if (filters.eventTypes && !filters.eventTypes.includes(event.eventType)) {
      return false;
    }

    return true;
  }

  /**
   * Setup internal event handling
   */
  private setupEventHandling(): void {
    // Handle internal events
    this.on('event', (event: Event) => {
      // Additional processing if needed
    });
  }

  /**
   * Start maintenance tasks
   */
  private startMaintenanceTasks(): void {
    // Cleanup inactive connections every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const timeout = this.config.connectionTimeout * 1000;

      for (const [connectionId, connection] of this.connections) {
        if (now - connection.lastActivity.getTime() > timeout) {
          console.log(chalk.yellow(`⚠️ Closing inactive connection: ${connectionId}`));
          connection.socket.close(1000, 'Connection timeout');
          this.connections.delete(connectionId);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Log statistics every minute
    setInterval(() => {
      const stats = this.getStatistics();
      console.log(chalk.gray(`📊 Streamer stats: ${stats.totalSubscribers} subscribers, ${stats.activeConnections} connections, ${stats.totalEventsStreamed} events`));
    }, 60 * 1000); // 1 minute
  }
}

/**
 * Streamer configuration options
 */
export interface StreamerConfig {
  server: {
    host: string;
    port: number;
  };
  websocket: {
    path: string;
    compression: boolean;
    maxPayloadSize: number;
  };
  ssl?: {
    enabled: boolean;
    options: any;
  };
  buffer: {
    maxSize: number;
    maxAge: number; // in milliseconds
  };
  connectionTimeout: number; // in seconds
  heartbeatInterval: number; // in milliseconds
}

/**
 * Event filters for subscription
 */
export interface EventFilters {
  entityTypes?: string[];
  eventTypes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  customFilters?: Record<string, any>;
}

/**
 * Stream connection interface
 */
export interface StreamConnection {
  id: string;
  socket: WebSocket;
  connectedAt: Date;
  subscriptions: Set<string>;
  messageCount: number;
  lastActivity: Date;
}

/**
 * Subscriber interface
 */
export interface Subscriber {
  id: string;
  connectionId?: string;
  filters: EventFilters;
  callback: (event: Event) => void | Promise<void>;
  subscriptionTime: Date;
  eventCount: number;
  lastEventTime?: Date;
}

/**
 * Subscription interface
 */
export interface Subscription {
  id: string;
  filters: EventFilters;
  unsubscribe: () => void;
  updateFilters: (filters: EventFilters) => void;
}

/**
 * Streaming statistics interface
 */
export interface StreamingStatistics {
  isRunning: boolean;
  uptime: number;
  totalSubscribers: number;
  activeConnections: number;
  totalEventsStreamed: number;
  bufferSize: number;
  serverInfo: {
    port: number;
    host: string;
    sslEnabled: boolean;
    websocketPath: string;
  };
  subscribersByType: Record<string, number>;
  recentActivity: {
    eventsLastMinute: number;
    newSubscribersLastHour: number;
  };
}

/**
 * Default streamer configuration
 */
const defaultStreamerConfig: StreamerConfig = {
  server: {
    host: 'localhost',
    port: 8080
  },
  websocket: {
    path: '/events',
    compression: true,
    maxPayloadSize: 1024 * 1024 // 1MB
  },
  buffer: {
    maxSize: 10000,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  connectionTimeout: 300, // 5 minutes
  heartbeatInterval: 30000 // 30 seconds
};

/**
 * Event Streamer CLI
 */
export class EventStreamerCLI {
  private streamer: EventStreamer;

  constructor(config: Partial<StreamerConfig> = {}) {
    this.streamer = new EventStreamer({
      ...defaultStreamerConfig,
      ...config
    });
  }

  async run(args: string[]): Promise<void> {
    const command = args[0];

    switch (command) {
      case 'start':
        await this.startCommand(args.slice(1));
        break;
      case 'stop':
        await this.stopCommand();
        break;
      case 'stats':
        this.statsCommand();
        break;
      case 'test':
        await this.testCommand(args.slice(1));
        break;
      default:
        this.printUsage();
    }
  }

  private async startCommand(args: string[]): Promise<void> {
    const config: Partial<StreamerConfig> = {};

    // Parse command line options
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--port' && args[i + 1]) {
        config.server = { ...config.server, port: parseInt(args[++i]) };
      } else if (arg === '--host' && args[i + 1]) {
        config.server = { ...config.server, host: args[++i] };
      } else if (arg === '--ssl') {
        config.ssl = { enabled: true, options: {} };
      }
    }

    // Update config
    this.streamer = new EventStreamer({ ...defaultStreamerConfig, ...config });

    try {
      await this.streamer.start();

      // Keep the process running
      console.log(chalk.gray('Press Ctrl+C to stop the server...'));

      process.on('SIGINT', async () => {
        console.log(chalk.blue('\n🛑 Received SIGINT, shutting down...'));
        await this.streamer.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log(chalk.blue('\n🛑 Received SIGTERM, shutting down...'));
        await this.streamer.stop();
        process.exit(0);
      });

    } catch (error) {
      console.error(chalk.red(`❌ Failed to start server: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private async stopCommand(): Promise<void> {
    try {
      await this.streamer.stop();
      console.log(chalk.green('✅ Server stopped'));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to stop server: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private statsCommand(): void {
    const stats = this.streamer.getStatistics();

    console.log(chalk.blue('\n📊 REFUSE Protocol Event Streamer Statistics'));
    console.log(chalk.gray('=' .repeat(55)));

    console.log(chalk.green(`Server Status: ${stats.isRunning ? '✅ Running' : '❌ Stopped'}`));
    console.log(chalk.green(`Uptime: ${Math.round(stats.uptime / 1000)}s`));
    console.log(chalk.green(`Port: ${stats.serverInfo.port} (${stats.serverInfo.sslEnabled ? 'HTTPS' : 'HTTP'})`));

    console.log(chalk.blue('\nConnections:'));
    console.log(chalk.gray(`  Total Subscribers: ${stats.totalSubscribers}`));
    console.log(chalk.gray(`  Active Connections: ${stats.activeConnections}`));

    console.log(chalk.blue('\nEvents:'));
    console.log(chalk.gray(`  Total Streamed: ${stats.totalEventsStreamed}`));
    console.log(chalk.gray(`  Buffer Size: ${stats.bufferSize}`));
    console.log(chalk.gray(`  Last Minute: ${stats.recentActivity.eventsLastMinute}`));

    if (Object.keys(stats.subscribersByType).length > 0) {
      console.log(chalk.blue('\nSubscription Types:'));
      for (const [type, count] of Object.entries(stats.subscribersByType)) {
        console.log(chalk.gray(`  ${type}: ${count}`));
      }
    }
  }

  private async testCommand(args: string[]): Promise<void> {
    const eventType = args[0] || 'customer';
    const entityType = args[1] || 'test';

    // Subscribe to events
    const subscription = this.streamer.subscribe('test-client', {
      entityTypes: [eventType],
      eventTypes: ['created', 'updated']
    }, (event) => {
      console.log(chalk.green(`✅ Received test event: ${event.entityType}.${event.eventType}`));
    });

    console.log(chalk.blue(`🔄 Testing event streaming for ${entityType}.${eventType}...`));

    // Generate test events
    for (let i = 0; i < 5; i++) {
      const testEvent: Event = {
        id: uuidv4(),
        entityType: eventType as any,
        eventType: 'created',
        timestamp: new Date(),
        eventData: {
          id: `test-${entityType}-${i}`,
          name: `Test ${entityType} ${i}`,
          type: 'test'
        },
        version: 1
      };

      this.streamer.streamEvent(testEvent);

      // Wait between events
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Wait a bit for events to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Cleanup
    subscription.unsubscribe();
    console.log(chalk.green('✅ Test complete'));
  }

  private printUsage(): void {
    console.log(chalk.blue('\nREFUSE Protocol Event Streamer'));
    console.log(chalk.gray('Usage: event-streamer <command> [options]\n'));

    console.log(chalk.green('Commands:'));
    console.log('  start [options]       Start the event streaming server');
    console.log('  stop                  Stop the event streaming server');
    console.log('  stats                 Show streaming statistics');
    console.log('  test [entity] [type]  Test event streaming with sample events\n');

    console.log(chalk.green('Options for start command:'));
    console.log('  --port <number>       Server port (default: 8080)');
    console.log('  --host <string>       Server host (default: localhost)');
    console.log('  --ssl                 Enable SSL/TLS\n');

    console.log(chalk.green('Examples:'));
    console.log('  event-streamer start --port 8080 --host 0.0.0.0');
    console.log('  event-streamer start --ssl');
    console.log('  event-streamer stats');
    console.log('  event-streamer test customer created\n');

    console.log(chalk.green('Endpoints:'));
    console.log('  WebSocket: ws://localhost:8080/events');
    console.log('  Server-Sent Events: http://localhost:8080/events/sse');
    console.log('  Health Check: http://localhost:8080/health\n');
  }
}

/**
 * Export factory functions
 */
export function createEventStreamer(config: StreamerConfig): EventStreamer {
  return new EventStreamer(config);
}

export function createEventStreamerCLI(config?: Partial<StreamerConfig>): EventStreamerCLI {
  return new EventStreamerCLI(config);
}

// Export types
export type {
  StreamerConfig,
  EventFilters,
  StreamConnection,
  Subscriber,
  Subscription,
  StreamingStatistics
};
