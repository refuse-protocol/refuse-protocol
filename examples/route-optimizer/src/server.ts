import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { RouteOptimizationService } from './services/RouteOptimizationService'
import { errorHandler } from './middleware/errorHandler'
import { validateRequest } from './middleware/validation'
import { optimizationRequestSchema } from './models/schemas'

// Simple logger for Node.js environment
const createLogger = () => ({
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg: string, data?: any, err?: Error) => console.error(`[ERROR] ${msg}`, data || '', err || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || '')
})

const logger = createLogger()

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3002

// Middleware
app.use(helmet())
app.use(cors())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'REFUSE Protocol Route Optimizer'
  })
})

// API Routes
const routeOptimizer = new RouteOptimizationService()

app.post('/api/optimize', validateRequest(optimizationRequestSchema), async (req, res) => {
  try {
    const optimizationResult = await routeOptimizer.optimizeRoutes(req.body)
    res.json(optimizationResult)
  } catch (error) {
    logger.error('Route optimization error', { body: req.body }, error instanceof Error ? error : new Error(String(error)))
    res.status(500).json({
      error: 'Route optimization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.get('/api/routes/:routeId', async (req, res) => {
  try {
    const route = await routeOptimizer.getRoute(req.params.routeId)
    if (!route) {
      return res.status(404).json({ error: 'Route not found' })
    }
    res.json(route)
  } catch (error) {
    logger.error('Get route error', { routeId: req.params.routeId }, error instanceof Error ? error : new Error(String(error)))
    res.status(500).json({ error: 'Failed to retrieve route' })
  }
})

app.get('/api/routes', async (req, res) => {
  try {
    const routes = await routeOptimizer.getAllRoutes()
    res.json(routes)
  } catch (error) {
    logger.error('Get routes error', {}, error instanceof Error ? error : new Error(String(error)))
    res.status(500).json({ error: 'Failed to retrieve routes' })
  }
})

// Error handling
app.use(errorHandler)

// Start server
app.listen(port, () => {
  logger.info('REFUSE Protocol Route Optimizer started', {
    port,
    healthCheck: `http://localhost:${port}/health`,
    optimizationAPI: `http://localhost:${port}/api/optimize`
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

export default app
