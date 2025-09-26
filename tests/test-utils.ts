/**
 * REFUSE Protocol Test Utilities
 *
 * Common utilities and helpers for testing REFUSE Protocol components
 */

import { CustomerModel } from '../protocol/implementations/customer'
import { ServiceModel } from '../protocol/implementations/service'
import { RouteModel } from '../protocol/implementations/route'
import { FacilityModel } from '../protocol/implementations/facility'
import { MaterialTicketModel } from '../protocol/implementations/material-ticket'
import { ContractModel } from '../protocol/implementations/contract'
import { PaymentModel } from '../protocol/implementations/payment'
import { CustomerRequestModel } from '../protocol/implementations/customer-request'

/**
 * Create a test validator function
 */
export function createValidator<T>(entityClass: new (data: any) => T) {
  return {
    validate: (data: any) => {
      try {
        new entityClass(data)
        return { isValid: true, errors: [] }
      } catch (error) {
        return {
          isValid: false,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      }
    }
  }
}

// Export entity models for use in tests
export {
  CustomerModel,
  ServiceModel,
  RouteModel,
  FacilityModel,
  MaterialTicketModel,
  ContractModel,
  PaymentModel,
  CustomerRequestModel
}

/**
 * Generate test data for entities
 */
export const testDataGenerators = {
  customer: () => ({
    id: 'TEST-CUSTOMER',
    name: 'Test Customer',
    type: 'commercial' as const,
    status: 'active' as const,
    primaryContact: {
      name: 'Test Contact',
      email: 'test@example.com',
      phone: '555-0123'
    },
    serviceAddress: {
      street1: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }),

  service: () => ({
    id: 'TEST-SERVICE',
    customerId: 'TEST-CUSTOMER',
    siteId: 'TEST-SITE',
    serviceType: 'waste' as const,
    containerType: 'dumpster' as const,
    containerSize: '4_yard',
    schedule: {
      frequency: 'weekly' as const,
      dayOfWeek: 'monday',
      startDate: '2024-01-15',
      startTime: '08:00',
      endTime: '17:00'
    },
    pricing: {
      baseRate: 150.00,
      rateUnit: 'month' as const,
      fuelSurcharge: 25.00
    },
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }),

  route: () => ({
    id: 'TEST-ROUTE',
    name: 'Test Route',
    schedule: {
      frequency: 'weekly' as const,
      dayOfWeek: 'monday',
      startTime: '08:00',
      endTime: '17:00'
    },
    assignedSites: ['TEST-SITE'],
    efficiency: 85,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }),

  facility: () => ({
    id: 'TEST-FACILITY',
    name: 'Test Facility',
    code: 'TF-01',
    type: 'mrf' as const,
    status: 'operational' as const,
    address: {
      street1: '100 Test Facility Blvd',
      city: 'Test City',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    contactInformation: {
      name: 'Test Manager',
      email: 'manager@testfacility.com',
      phone: '555-0200'
    },
    acceptedMaterials: ['mixed_waste', 'recycling'],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }),

  materialTicket: () => ({
    id: 'TEST-TICKET',
    ticketNumber: 'T-2024-001',
    sourceType: 'route' as const,
    grossWeight: 2500,
    tareWeight: 500,
    netWeight: 2000,
    materials: [{
      materialId: 'MAT-001',
      weight: 2000,
      percentage: 100
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }),

  contract: () => ({
    id: 'TEST-CONTRACT',
    contractNumber: 'CONT-2024-001',
    customerId: 'TEST-CUSTOMER',
    serviceType: 'waste',
    pricing: {
      baseRate: 150.00,
      rateUnit: 'month',
      fuelSurcharge: 25.00
    },
    term: {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }),

  payment: () => ({
    id: 'TEST-PAYMENT',
    paymentNumber: 'PAY-2024-001',
    customerId: 'TEST-CUSTOMER',
    amount: 150.00,
    paymentDate: '2024-01-15',
    paymentMethod: 'ach' as const,
    status: 'processed' as const,
    referenceNumber: 'ACH-2024-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }),

  customerRequest: () => ({
    id: 'TEST-CUSTOMER-REQUEST',
    requestNumber: 'REQ-2024-001',
    type: 'new_service' as const,
    status: 'pending' as const,
    customerId: 'TEST-CUSTOMER',
    serviceType: 'waste',
    requestedDate: new Date(),
    approvalHistory: [{
      step: 'initial_submission',
      timestamp: new Date(),
      userId: 'TEST-USER',
      notes: 'Initial customer request submission'
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  })
}

// Test the utilities
describe('Test Utilities', () => {
  test('should generate valid test data', () => {
    const customerData = testDataGenerators.customer()
    expect(customerData.id).toBe('TEST-CUSTOMER')
    expect(customerData.name).toBe('Test Customer')
    expect(customerData.type).toBe('commercial')
  })
})
