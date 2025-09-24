import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CustomerRequest, ServiceSchedule, Container, Route } from '@/types/refuse-protocol'

interface ServiceContextType {
  serviceRequests: CustomerRequest[]
  serviceSchedules: ServiceSchedule[]
  containers: Container[]
  routes: Route[]
  loading: boolean
  error: string | null
  createServiceRequest: (request: Omit<CustomerRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<void>
  updateServiceSchedule: (schedule: ServiceSchedule) => Promise<void>
  refreshData: () => Promise<void>
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined)

export const useService = () => {
  const context = useContext(ServiceContext)
  if (context === undefined) {
    throw new Error('useService must be used within a ServiceProvider')
  }
  return context
}

interface ServiceProviderProps {
  children: ReactNode
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  const [serviceRequests, setServiceRequests] = useState<CustomerRequest[]>([])
  const [serviceSchedules, setServiceSchedules] = useState<ServiceSchedule[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock data for demonstration - in real implementation, these would be API calls
      const mockServiceRequests: CustomerRequest[] = [
        {
          id: 'REQ-001',
          customerId: 'CUST-001',
          requestNumber: 'REQ-2024-001',
          type: 'new_service',
          status: 'pending',
          priority: 'normal',
          description: 'Need additional recycling service for new manufacturing line',
          requestedDate: new Date('2024-01-15'),
          estimatedCost: 75.00,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date(),
          version: 1
        }
      ]

      const mockServiceSchedules: ServiceSchedule[] = [
        {
          serviceId: 'SERV-001',
          scheduledDate: new Date('2024-01-22'),
          status: 'scheduled',
          notes: 'Regular weekly collection'
        }
      ]

      const mockContainers: Container[] = [
        {
          id: 'CONT-001',
          customerId: 'CUST-001',
          siteId: 'SITE-001',
          type: 'dumpster',
          size: '4_yard',
          status: 'in_service',
          lastServiced: new Date('2024-01-15'),
          nextService: new Date('2024-01-22')
        }
      ]

      setServiceRequests(mockServiceRequests)
      setServiceSchedules(mockServiceSchedules)
      setContainers(mockContainers)
      // In a real implementation, you would fetch routes too
      setRoutes([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service data')
    } finally {
      setLoading(false)
    }
  }

  const createServiceRequest = async (requestData: Omit<CustomerRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      const newRequest: CustomerRequest = {
        ...requestData,
        id: `REQ-${Date.now()}`,
        requestNumber: `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      }

      setServiceRequests(prev => [...prev, newRequest])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service request')
      throw err
    }
  }

  const updateServiceSchedule = async (schedule: ServiceSchedule) => {
    try {
      setServiceSchedules(prev =>
        prev.map(s => s.serviceId === schedule.serviceId ? schedule : s)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service schedule')
      throw err
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  const value: ServiceContextType = {
    serviceRequests,
    serviceSchedules,
    containers,
    routes,
    loading,
    error,
    createServiceRequest,
    updateServiceSchedule,
    refreshData
  }

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  )
}
