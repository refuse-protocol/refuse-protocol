import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Customer, Service, Invoice, Payment } from '@/types/refuse-protocol'

interface CustomerContextType {
  customer: Customer | null
  services: Service[]
  invoices: Invoice[]
  payments: Payment[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export const useCustomer = () => {
  const context = useContext(CustomerContext)
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider')
  }
  return context
}

interface CustomerProviderProps {
  children: ReactNode
}

export const CustomerProvider: React.FC<CustomerProviderProps> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock data for demonstration - in real implementation, these would be API calls
      const mockCustomer: Customer = {
        id: 'CUST-001',
        name: 'Acme Manufacturing Inc.',
        type: 'commercial',
        status: 'active',
        contactInfo: {
          primaryPhone: '555-0123',
          email: 'billing@acme-mfg.com',
          address: {
            street: '123 Industrial Way',
            city: 'Manufacturing City',
            state: 'CA',
            zipCode: '94105'
          }
        },
        serviceArea: 'Bay Area',
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date(),
        version: 1
      }

      const mockServices: Service[] = [
        {
          id: 'SERV-001',
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
          updatedAt: new Date(),
          version: 1
        }
      ]

      setCustomer(mockCustomer)
      setServices(mockServices)
      // In a real implementation, you would fetch invoices and payments too
      setInvoices([])
      setPayments([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  const value: CustomerContextType = {
    customer,
    services,
    invoices,
    payments,
    loading,
    error,
    refreshData
  }

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  )
}
