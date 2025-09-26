/**
 * REFUSE Protocol Integration Tests
 *
 * Simplified integration tests focusing on core entity relationships and workflows
 */

import { CustomerModel } from '../../protocol/implementations/customer';
import { ServiceModel } from '../../protocol/implementations/service';
import { RouteModel } from '../../protocol/implementations/route';
import { FacilityModel } from '../../protocol/implementations/facility';
import { MaterialTicketModel } from '../../protocol/implementations/material-ticket';
import { ContractModel } from '../../protocol/implementations/contract';
import { PaymentModel } from '../../protocol/implementations/payment';

describe('REFUSE Protocol Integration Workflow Tests', () => {
  // Customer Onboarding and Service Setup Workflow
  describe('Customer Onboarding Workflow', () => {
    test('should create customer and service entities', () => {
      // Step 1: Create customer
      const customerData = {
        id: 'CUST-WF-001',
        name: 'Integration Test Manufacturing',
        type: 'commercial' as const,
        status: 'active' as const,
        primaryContact: {
          name: 'John Smith',
          email: 'integration@testmfg.com',
          phone: '555-0101',
        },
        serviceAddress: {
          street1: '100 Test Industrial Blvd',
          city: 'Test City',
          state: 'CA',
          zipCode: '94105',
          country: 'USA',
        },
        serviceTypes: ['waste', 'recycling'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1,
      };

      const customer = new CustomerModel(customerData);
      expect(customer.id).toBe('CUST-WF-001');
      expect(customer.status).toBe('active');
      expect(customer.serviceTypes).toContain('waste');

      // Step 2: Create service for customer
      const serviceData = {
        id: 'SERV-WF-001',
        customerId: 'CUST-WF-001',
        siteId: 'SITE-WF-001',
        serviceType: 'waste' as const,
        containerType: 'dumpster' as const,
        containerSize: '4_yard',
        schedule: {
          frequency: 'weekly' as const,
          dayOfWeek: 'monday',
          startDate: '2024-01-15',
          startTime: '08:00',
          endTime: '17:00',
        },
        pricing: {
          baseRate: 150.0,
          rateUnit: 'month' as const,
          fuelSurcharge: 0.25,
        },
        status: 'active' as const,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1,
      };

      const service = new ServiceModel(serviceData);
      expect(service.id).toBe('SERV-WF-001');
      expect(service.customerId).toBe('CUST-WF-001');
      expect(service.serviceType).toBe('waste');
    });

    test('should create route entity', () => {
      const routeData = {
        id: 'ROUTE-001',
        name: 'Monday Route 1',
        schedule: {
          frequency: 'weekly' as const,
          dayOfWeek: 'monday',
          startTime: '08:00',
          endTime: '17:00',
        },
        assignedSites: ['SITE-001', 'SITE-002', 'SITE-003'],
        efficiency: 85,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1,
      };

      const route = new RouteModel(routeData);
      expect(route.id).toBe('ROUTE-001');
      expect(route.name).toBe('Monday Route 1');
      expect(route.efficiency).toBe(85);
    });

    test('should create facility entity', () => {
      const facilityData = {
        id: 'FACILITY-001',
        name: 'Main Processing Facility',
        code: 'MPF-01',
        type: 'mrf' as const,
        status: 'operational' as const,
        address: {
          street1: '100 Processing Blvd',
          city: 'Industrial City',
          state: 'CA',
          zipCode: '94107',
          country: 'USA',
        },
        contactInformation: {
          name: 'John Smith',
          email: 'operations@mainprocessing.com',
          phone: '555-0100',
        },
        acceptedMaterials: ['waste', 'recycling'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        version: 1,
      };

      const facility = new FacilityModel(facilityData);
      expect(facility.id).toBe('FACILITY-001');
      expect(facility.name).toBe('Main Processing Facility');
      expect(facility.acceptedMaterials).toContain('waste');
    });

    test('should create material ticket entity', () => {
      const ticketData = {
        id: 'TICKET-001',
        ticketNumber: 'T-2024-001',
        sourceType: 'route' as const,
        grossWeight: 2500,
        tareWeight: 500,
        netWeight: 2000,
        materials: [
          {
            materialId: 'MAT-001',
            weight: 2000,
            percentage: 100,
          },
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1,
      };

      const ticket = new MaterialTicketModel(ticketData);
      expect(ticket.id).toBe('TICKET-001');
      expect(ticket.netWeight).toBe(2000);
      expect(ticket.materials).toHaveLength(1);
    });

    test('should create contract entity', () => {
      const contractData = {
        id: 'CONTRACT-001',
        contractNumber: 'CONT-2024-001',
        customerId: 'CUST-001',
        serviceTypes: ['waste'],
        guaranteedServices: ['waste'],
        pricing: {
          baseRate: 150.0,
          rateUnit: 'month',
          fuelSurcharge: 0.25,
        },
        term: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        contractStatus: 'active' as const,
        createdAt: new Date('2023-12-15'),
        updatedAt: new Date(),
        version: 1,
      };

      const contract = new ContractModel(contractData);
      expect(contract.id).toBe('CONTRACT-001');
      expect(contract.contractNumber).toBe('CONT-2024-001');
    });

    test('should create payment entity', () => {
      const paymentData = {
        id: 'PAYMENT-001',
        paymentNumber: 'PAY-2024-001',
        customerId: 'CUST-001',
        customerName: 'Integration Test Manufacturing',
        type: 'invoice_payment' as const,
        amount: 150.0,
        currency: 'USD' as const,
        paymentDate: '2024-01-15',
        paymentMethod: 'ach' as const,
        billingAddress: {
          street1: '100 Test Industrial Blvd',
          city: 'Test City',
          state: 'CA',
          zipCode: '94105',
          country: 'USA',
        },
        invoiceIds: ['INV-2024-001'],
        status: 'completed' as const,
        referenceNumber: 'ACH-2024-001',
        bankInformation: {
          bankName: 'Test Bank',
          accountNumber: '****1234',
          routingNumber: '123456789',
        },
        processingDetails: {
          processor: 'PaymentTech Inc.',
          transactionId: 'TXN-2024-001',
          processedAt: '2024-01-15T10:00:00Z',
        },
        fees: [],
        adjustments: [],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1,
      };

      const payment = new PaymentModel(paymentData);
      expect(payment.id).toBe('PAYMENT-001');
      expect(payment.amount).toBe(150.0);
      expect(payment.paymentMethod).toBe('ach');
    });
  });

  // Test entity relationships
  describe('Entity Relationships', () => {
    test('should establish customer-service relationship', () => {
      const customer = new CustomerModel({
        id: 'CUST-REL-001',
        name: 'Relationship Test Company',
        type: 'commercial' as const,
        status: 'active' as const,
        primaryContact: {
          name: 'Jane Doe',
          email: 'jane@relationshiptest.com',
          phone: '555-0200',
        },
        serviceAddress: {
          street1: '200 Relationship Blvd',
          city: 'Test City',
          state: 'CA',
          zipCode: '94105',
          country: 'USA',
        },
        serviceTypes: ['waste', 'recycling', 'organics'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1,
      });

      const service = new ServiceModel({
        id: 'SERV-REL-001',
        customerId: 'CUST-REL-001',
        siteId: 'SITE-REL-001',
        serviceType: 'waste' as const,
        containerType: 'dumpster' as const,
        containerSize: '4_yard',
        schedule: {
          frequency: 'weekly' as const,
          dayOfWeek: 'monday',
          startDate: '2024-01-15',
          startTime: '08:00',
          endTime: '17:00',
        },
        pricing: {
          baseRate: 150.0,
          rateUnit: 'month' as const,
        },
        status: 'active' as const,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1,
      });

      expect(customer.id).toBe('CUST-REL-001');
      expect(service.customerId).toBe('CUST-REL-001');
      expect(customer.serviceTypes).toContain('waste');
    });
  });
});
