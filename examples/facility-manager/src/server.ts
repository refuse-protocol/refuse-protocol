import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { FacilityCapacityService } from './services/FacilityCapacityService'
import { errorHandler } from './middleware/errorHandler'
import { validateRequest } from './middleware/validation'
import { capacityRequestSchema } from './models/schemas'

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
    console.error('Capacity optimization error:', error)
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
    console.error('Get capacity error:', error)
    res.status(500).json({ error: 'Failed to retrieve facility capacity' })
  }
})

app.get('/api/facilities/:facilityId/schedule', async (req, res) => {
  try {
    const schedule = await facilityManager.getFacilitySchedule(req.params.facilityId)
    res.json(schedule)
  } catch (error) {
    console.error('Get schedule error:', error)
    res.status(500).json({ error: 'Failed to retrieve facility schedule' })
  }
})

app.post('/api/facilities/:facilityId/material-tickets', async (req, res) => {
  try {
    const result = await facilityManager.processMaterialTicket(req.params.facilityId, req.body)
    res.json(result)
  } catch (error) {
    console.error('Process material ticket error:', error)
    res.status(500).json({ error: 'Failed to process material ticket' })
  }
})

app.get('/api/facilities', async (req, res) => {
  try {
    const facilities = await facilityManager.getAllFacilities()
    res.json(facilities)
  } catch (error) {
    console.error('Get facilities error:', error)
    res.status(500).json({ error: 'Failed to retrieve facilities' })
  }
})

// Error handling
app.use(errorHandler)

// Start server
app.listen(port, () => {
  console.log(`🏭 REFUSE Protocol Facility Manager running on port ${port}`)
  console.log(`📊 Health check: http://localhost:${port}/health`)
  console.log(`⚡ Capacity API: http://localhost:${port}/api/capacity/optimize`)
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
