import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { RouteOptimizationService } from './services/RouteOptimizationService'
import { errorHandler } from './middleware/errorHandler'
import { validateRequest } from './middleware/validation'
import { optimizationRequestSchema } from './models/schemas'

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
    console.error('Route optimization error:', error)
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
    console.error('Get route error:', error)
    res.status(500).json({ error: 'Failed to retrieve route' })
  }
})

app.get('/api/routes', async (req, res) => {
  try {
    const routes = await routeOptimizer.getAllRoutes()
    res.json(routes)
  } catch (error) {
    console.error('Get routes error:', error)
    res.status(500).json({ error: 'Failed to retrieve routes' })
  }
})

// Error handling
app.use(errorHandler)

// Start server
app.listen(port, () => {
  console.log(`🚛 REFUSE Protocol Route Optimizer running on port ${port}`)
  console.log(`📊 Health check: http://localhost:${port}/health`)
  console.log(`⚡ Optimization API: http://localhost:${port}/api/optimize`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

export default app
