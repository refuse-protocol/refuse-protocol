import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { FacilityCapacityService } from './services/FacilityCapacityService'
import { errorHandler } from './middleware/errorHandler'
import { validateRequest } from './middleware/validation'
import { capacityRequestSchema } from './models/schemas'

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
const port = process.env.PORT || 3003

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
    service: 'REFUSE Protocol Facility Manager'
  })
})

// API Routes
const facilityManager = new FacilityCapacityService()

app.post('/api/capacity/optimize', validateRequest(capacityRequestSchema), async (req, res) => {
  try {
    const optimizationResult = await facilityManager.optimizeCapacity(req.body)
    res.json(optimizationResult)
  } catch (error) {
    logger.error('Capacity optimization error', { facilityId: req.params.facilityId, body: req.body }, error instanceof Error ? error : new Error(String(error)))
    res.status(500).json({
      error: 'Capacity optimization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.get('/api/facilities/:facilityId/capacity', async (req, res) => {
  try {
    const capacity = await facilityManager.getFacilityCapacity(req.params.facilityId)
    if (!capacity) {
      return res.status(404).json({ error: 'Facility not found' })
    }
    res.json(capacity)
  } catch (error) {
    logger.error('Get capacity error', { facilityId: req.params.facilityId }, error instanceof Error ? error : new Error(String(error)))
    res.status(500).json({ error: 'Failed to retrieve facility capacity' })
  }
})

app.get('/api/facilities/:facilityId/schedule', async (req, res) => {
  try {
    const schedule = await facilityManager.getFacilitySchedule(req.params.facilityId)
    res.json(schedule)
  } catch (error) {
    logger.error('Get schedule error', { facilityId: req.params.facilityId }, error instanceof Error ? error : new Error(String(error)))
    res.status(500).json({ error: 'Failed to retrieve facility schedule' })
  }
})

app.post('/api/facilities/:facilityId/material-tickets', async (req, res) => {
  try {
    const result = await facilityManager.processMaterialTicket(req.params.facilityId, req.body)
    res.json(result)
  } catch (error) {
    logger.error('Process material ticket error', { facilityId: req.params.facilityId, body: req.body }, error instanceof Error ? error : new Error(String(error)))
    res.status(500).json({ error: 'Failed to process material ticket' })
  }
})

app.get('/api/facilities', async (req, res) => {
  try {
    const facilities = await facilityManager.getAllFacilities()
    res.json(facilities)
  } catch (error) {
    logger.error('Get facilities error', {}, error instanceof Error ? error : new Error(String(error)))
    res.status(500).json({ error: 'Failed to retrieve facilities' })
  }
})

// Error handling
app.use(errorHandler)

// Start server
app.listen(port, () => {
  logger.info('REFUSE Protocol Facility Manager started', {
    port,
    healthCheck: `http://localhost:${port}/health`,
    capacityAPI: `http://localhost:${port}/api/capacity/optimize`
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
