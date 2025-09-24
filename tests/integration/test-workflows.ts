/**
 * REFUSE Protocol Integration Tests
 *
 * End-to-end workflow testing suite for REFUSE Protocol entities and processes:
 * - Customer onboarding and service setup workflow
 * - Route planning and optimization workflow
 * - Material collection and processing workflow
 * - Facility capacity management workflow
 * - Environmental compliance tracking workflow
 * - Contract management and billing workflow
 * - Payment processing and reconciliation workflow
 * - Event-driven system integration tests
 * - Data transformation and migration workflow
 * - Legacy system integration workflow
 */

import { CustomerModel } from '../../protocol/implementations/customer'
import { ServiceModel } from '../../protocol/implementations/service'
import { RouteModel } from '../../protocol/implementations/route'
import { FacilityModel } from '../../protocol/implementations/facility'
import { MaterialTicketModel } from '../../protocol/implementations/material-ticket'
import { ContractModel } from '../../protocol/implementations/contract'
import { PaymentModel } from '../../protocol/implementations/payment'
import { AllocationModel } from '../../protocol/implementations/allocation'
import { EnvironmentalComplianceModel } from '../../protocol/implementations/environmental-compliance'
import { EventStreamingSystem } from '../../protocol/implementations/event-system'
import { DataTransformer } from '../../protocol/tools/data-transformer'
import { ComplianceValidator } from '../../protocol/tools/compliance-validator'

describe('REFUSE Protocol Integration Workflow Tests', () => {

  // Customer Onboarding and Service Setup Workflow
  describe('Customer Onboarding Workflow', () => {
    test('should complete full customer onboarding with service setup', async () => {
      // Step 1: Create customer
      const customerData = {
        id: 'CUST-WF-001',
        name: 'Integration Test Manufacturing',
        type: 'commercial' as const,
        status: 'active' as const,
        contactInfo: {
          primaryPhone: '555-0101',
          email: 'integration@testmfg.com',
          address: {
            street: '100 Test Industrial Blvd',
            city: 'Test City',
            state: 'CA',
            zipCode: '94105'
          }
        },
        serviceArea: 'Test Area',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1
      }

      const customer = new CustomerModel(customerData)
      expect(customer.id).toBe('CUST-WF-001')
      expect(customer.status).toBe('active')

      // Step 2: Create service for customer
      const serviceData = {
        id: 'SERV-WF-001',
        customerId: 'CUST-WF-001',
        siteId: 'SITE-WF-001',
        serviceType: 'waste' as const,
        materialTypes: ['mixed_waste'] as const,
        frequency: 'weekly' as const,
        containerType: 'dumpster' as const,
        containerSize: '4_yard',
        schedule: [],
        nextServiceDate: new Date('2024-01-22'),
        pricing: {
          baseRate: 150.00,
          rateUnit: 'month' as const,
          additionalCharges: 25.00
        },
        status: 'active' as const,
        priority: 'normal' as const,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1
      }

      const service = new ServiceModel(serviceData)
      expect(service.id).toBe('SERV-WF-001')
      expect(service.customerId).toBe('CUST-WF-001')

      // Step 3: Verify customer-service relationship
      const compatibleServices = customer.getCompatibleServices(['waste', 'recycling'])
      expect(compatibleServices).toContain('waste')

      // Step 4: Validate complete workflow
      expect(customer.status).toBe('active')
      expect(service.status).toBe('active')
      expect(service.nextServiceDate).toBeInstanceOf(Date)
    })

    test('should handle customer onboarding with multiple services', async () => {
      const customer = new CustomerModel({
        id: 'CUST-WF-002',
        name: 'Multi-Service Test Company',
        type: 'commercial' as const,
        status: 'active' as const,
        contactInfo: {
          primaryPhone: '555-0102',
          email: 'multi@testcompany.com',
          address: {
            street: '200 Test Ave',
            city: 'Test City',
            state: 'CA',
            zipCode: '94105'
          }
        },
        serviceArea: 'Test Area',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1
      })

      // Create multiple services
      const wasteService = new ServiceModel({
        id: 'SERV-WF-002',
        customerId: 'CUST-WF-002',
        siteId: 'SITE-WF-002',
        serviceType: 'waste' as const,
        materialTypes: ['mixed_waste'] as const,
        frequency: 'weekly' as const,
        containerType: 'dumpster' as const,
        containerSize: '4_yard',
        schedule: [],
        nextServiceDate: new Date('2024-01-22'),
        pricing: { baseRate: 150.00, rateUnit: 'month' as const, additionalCharges: 0 },
        status: 'active' as const,
        priority: 'normal' as const,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1
      })

      const recyclingService = new ServiceModel({
        id: 'SERV-WF-003',
        customerId: 'CUST-WF-002',
        siteId: 'SITE-WF-002',
        serviceType: 'recycling' as const,
        materialTypes: ['paper', 'plastic'] as const,
        frequency: 'biweekly' as const,
        containerType: 'dumpster' as const,
        containerSize: '2_yard',
        schedule: [],
        nextServiceDate: new Date('2024-01-25'),
        pricing: { baseRate: 75.00, rateUnit: 'month' as const, additionalCharges: 0 },
        status: 'active' as const,
        priority: 'normal' as const,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1
      })

      expect(customer.id).toBe('CUST-WF-002')
      expect(wasteService.serviceType).toBe('waste')
      expect(recyclingService.serviceType).toBe('recycling')
      expect(wasteService.pricing.totalMonthlyRate).toBe(150.00)
      expect(recyclingService.pricing.totalMonthlyRate).toBe(75.00)
    })
  })

  // Route Planning and Optimization Workflow
  describe('Route Planning Workflow', () => {
    test('should complete route planning with optimization', async () => {
      // Step 1: Create facility
      const facility = new FacilityModel({
        id: 'FACILITY-WF-001',
        name: 'Test Processing Facility',
        code: 'TPF-01',
        type: 'mrf' as const,
        status: 'operational' as const,
        address: {
          street: '300 Facility Drive',
          city: 'Test City',
          state: 'CA',
          zipCode: '94107'
        },
        contactInformation: { phone: '555-0300', email: 'test@facility.com' },
        operatingHours: { open: '06:00', close: '18:00', timezone: 'America/Los_Angeles' },
        capacity: { total: 1000, available: 750, unit: 'tons/day' },
        acceptedMaterials: ['mixed_waste', 'recycling'],
        pricing: { tippingFee: 45.00, minimumCharge: 25.00, surcharges: [] },
        permits: ['EPA-2024-001'],
        environmentalControls: ['dust_control'],
        complianceRecords: [],
        utilization: { currentRate: 75, peakRate: 95, averageRate: 65 },
        processingRates: [
          { material: 'mixed_waste', rate: 500, unit: 'tons/day' },
          { material: 'recycling', rate: 300, unit: 'tons/day' }
        ],
        qualityStandards: [],
        assignedRoutes: [],
        materialTickets: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        version: 1
      })

      // Step 2: Create route
      const route = new RouteModel({
        id: 'ROUTE-WF-001',
        name: 'Test Route 1',
        code: 'TR-01',
        type: 'commercial' as const,
        status: 'planned' as const,
        schedule: {
          startTime: '08:00',
          endTime: '17:00',
          workingDays: ['monday', 'wednesday', 'friday']
        },
        estimatedDuration: 480,
        assignedVehicle: 'VEH-WF-001',
        assignedDriver: 'DRIVER-WF-001',
        assignedSites: ['SITE-WF-001', 'SITE-WF-002', 'SITE-WF-003'],
        assignedServices: ['SERV-WF-001', 'SERV-WF-002', 'SERV-WF-003'],
        serviceSequence: [],
        plannedStops: 3,
        efficiency: 85,
        totalDistance: 45.2,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1
      })

      // Step 3: Optimize route
      const optimizedRoute = route.recalculateEfficiency()
      expect(optimizedRoute.efficiency).toBeGreaterThan(0)

      // Step 4: Validate facility-route relationship
      expect(facility.canAcceptMaterial('mixed_waste')).toBe(true)
      expect(route.assignedSites.length).toBe(3)
    })

    test('should handle route capacity constraints', async () => {
      const facility = new FacilityModel({
        id: 'FACILITY-WF-002',
        name: 'Small Processing Facility',
        code: 'SPF-01',
        type: 'transfer' as const,
        status: 'operational' as const,
        address: {
          street: '400 Small Facility Lane',
          city: 'Test City',
          state: 'CA',
          zipCode: '94107'
        },
        contactInformation: { phone: '555-0400', email: 'small@facility.com' },
        operatingHours: { open: '06:00', close: '18:00', timezone: 'America/Los_Angeles' },
        capacity: { total: 200, available: 180, unit: 'tons/day' }, // Small capacity
        acceptedMaterials: ['mixed_waste'],
        pricing: { tippingFee: 35.00, minimumCharge: 20.00, surcharges: [] },
        permits: ['EPA-2024-002'],
        environmentalControls: ['dust_control'],
        complianceRecords: [],
        utilization: { currentRate: 10, peakRate: 25, averageRate: 15 },
        processingRates: [
          { material: 'mixed_waste', rate: 200, unit: 'tons/day' }
        ],
        qualityStandards: [],
        assignedRoutes: [],
        materialTickets: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        version: 1
      })

      const route = new RouteModel({
        id: 'ROUTE-WF-002',
        name: 'Small Route 1',
        code: 'SR-01',
        type: 'residential' as const,
        status: 'planned' as const,
        schedule: {
          startTime: '08:00',
          endTime: '17:00',
          workingDays: ['tuesday', 'thursday']
        },
        estimatedDuration: 480,
        assignedVehicle: 'VEH-WF-002',
        assignedDriver: 'DRIVER-WF-002',
        assignedSites: Array.from({ length: 25 }, (_, i) => `SITE-SMALL-${i + 1}`), // 25 sites
        assignedServices: Array.from({ length: 25 }, (_, i) => `SERV-SMALL-${i + 1}`),
        serviceSequence: [],
        plannedStops: 25,
        efficiency: 75,
        totalDistance: 120.5,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1
      })

      // Test constraint validation
      const constraints = {
        maxStops: 20, // Less than planned 25
        maxDuration: 480,
        maxDistance: 100
      }

      const validation = route.validateConstraints(constraints)
      expect(validation.hasViolations).toBe(true)
      expect(validation.violations).toContain('Stop count exceeds maximum')
    })
  })

  // Material Collection and Processing Workflow
  describe('Material Collection Workflow', () => {
    test('should complete material collection and processing workflow', async () => {
      // Step 1: Create material ticket
      const ticketData = {
        id: 'TICKET-WF-001',
        sourceType: 'route' as const,
        sourceId: 'ROUTE-WF-001',
        ticketNumber: 'T-WF-2024-001',
        collectionDate: new Date('2024-01-15'),
        collectionLocation: {
          street: '100 Test St',
          city: 'Test City',
          state: 'CA',
          zipCode: '94105'
        },
        haulerId: 'HAULER-WF-001',
        driverId: 'DRIVER-WF-001',
        vehicleId: 'VEH-WF-001',
        scaleId: 'SCALE-WF-001',
        grossWeight: 2500,
        tareWeight: 500,
        netWeight: 2000,
        materials: [{
          id: 'MAT-WF-001',
          name: 'Mixed Waste',
          category: 'waste' as const,
          subcategory: 'mixed_waste',
          weightPerCubicYard: 400,
          volumePerTon: 5.5,
          recyclable: false,
          hazardous: false,
          processingMethod: 'disposal' as const,
          marketValue: 0,
          marketPriceDate: new Date('2024-01-15'),
          leedCategory: 'none' as const,
          recyclingRate: 0,
          contaminationRate: 15
        }],
        pricing: {
          rate: 45.00,
          rateUnit: 'ton' as const,
          totalAmount: 90.00
        },
        settlementStatus: 'pending' as const,
        leedAllocations: [],
        qualityGrade: 'acceptable' as const,
        contaminationNotes: 'Some contamination present',
        photos: [],
        processingStatus: 'received' as const,
        processingFacilityId: 'FACILITY-WF-001',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1
      }

      const ticket = new MaterialTicketModel(ticketData)

      expect(ticket.id).toBe('TICKET-WF-001')
      expect(ticket.netWeight).toBe(2000)
      expect(ticket.settlementStatus).toBe('pending')

      // Step 2: Validate ticket data integrity
      const integrity = ticket.validateDataIntegrity()
      expect(integrity.isValid).toBe(true)

      // Step 3: Calculate quality score
      const qualityScore = ticket.calculateQualityScore()
      expect(qualityScore).toBeGreaterThan(70)
      expect(qualityScore).toBeLessThanOrEqual(100)

      // Step 4: Verify pricing calculation
      expect(ticket.pricing.totalAmount).toBe(90.00)
    })

    test('should handle mixed material collection', async () => {
      const ticket = new MaterialTicketModel({
        id: 'TICKET-WF-002',
        sourceType: 'route' as const,
        sourceId: 'ROUTE-WF-002',
        ticketNumber: 'T-WF-2024-002',
        collectionDate: new Date('2024-01-16'),
        collectionLocation: {
          street: '200 Test Ave',
          city: 'Test City',
          state: 'CA',
          zipCode: '94105'
        },
        haulerId: 'HAULER-WF-002',
        driverId: 'DRIVER-WF-002',
        vehicleId: 'VEH-WF-002',
        scaleId: 'SCALE-WF-002',
        grossWeight: 3000,
        tareWeight: 500,
        netWeight: 2500,
        materials: [
          {
            id: 'MAT-WF-002',
            name: 'Cardboard',
            category: 'paper' as const,
            subcategory: 'cardboard',
            weightPerCubicYard: 100,
            volumePerTon: 22.0,
            recyclable: true,
            hazardous: false,
            processingMethod: 'sorting' as const,
            marketValue: 85.50,
            marketPriceDate: new Date('2024-01-16'),
            leedCategory: 'materials_reuse' as const,
            recyclingRate: 95,
            contaminationRate: 2
          },
          {
            id: 'MAT-WF-003',
            name: 'Plastic Bottles',
            category: 'plastic' as const,
            subcategory: 'bottles',
            weightPerCubicYard: 200,
            volumePerTon: 11.0,
            recyclable: true,
            hazardous: false,
            processingMethod: 'sorting' as const,
            marketValue: 120.00,
            marketPriceDate: new Date('2024-01-16'),
            leedCategory: 'materials_reuse' as const,
            recyclingRate: 88,
            contaminationRate: 5
          }
        ],
        pricing: {
          rate: 95.00, // Weighted average
          rateUnit: 'ton' as const,
          totalAmount: 237.50
        },
        settlementStatus: 'pending' as const,
        leedAllocations: [
          {
            category: 'materials_reuse',
            points: 3,
            certificationYear: 2024,
            certificationBody: 'USGBC'
          }
        ],
        qualityGrade: 'excellent' as const,
        contaminationNotes: null,
        photos: [],
        processingStatus: 'received' as const,
        processingFacilityId: 'FACILITY-WF-002',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date(),
        version: 1
      })

      expect(ticket.materials.length).toBe(2)
      expect(ticket.leedAllocations.length).toBe(1)
      expect(ticket.leedAllocations[0].points).toBe(3)
      expect(ticket.qualityGrade).toBe('excellent')
    })
  })

  // Contract Management and Billing Workflow
  describe('Contract Management Workflow', () => {
    test('should complete contract lifecycle with billing', async () => {
      // Step 1: Create contract
      const contract = new ContractModel({
        id: 'CONTRACT-WF-001',
        customerId: 'CUST-WF-001',
        contractNumber: 'CONT-WF-2024-001',
        type: 'service' as const,
        status: 'active' as const,
        effectiveDate: new Date('2024-01-01'),
        expirationDate: new Date('2024-12-31'),
        signedDate: new Date('2023-12-15'),
        serviceTerms: [{
          serviceType: 'waste',
          frequency: 'weekly',
          containerType: 'dumpster',
          containerSize: '4_yard',
          guaranteedRate: 150.00,
          rateUnit: 'month'
        }],
        pricingTerms: [{
          baseRate: 150.00,
          guaranteedMinimum: 1800.00,
          volumeCommitments: []
        }],
        paymentTerms: {
          paymentTerms: 'Net 30',
          dueDateOffset: 30,
          lateFeeRate: 1.5
        },
        renewalTerms: {
          autoRenew: true,
          noticePeriod: 60,
          rateAdjustment: 0.03
        },
        contractValue: 1800.00,
        internalApprover: 'Test Manager',
        customerApprover: 'Test Customer Rep',
        approvalDate: new Date('2023-12-15'),
        parentContractId: null,
        amendments: [],
        changeHistory: [],
        createdAt: new Date('2023-12-15'),
        updatedAt: new Date(),
        version: 1
      })

      expect(contract.status).toBe('active')
      expect(contract.contractValue).toBe(1800.00)

      // Step 2: Calculate pricing
      const monthlyTotal = contract.calculateMonthlyTotal()
      const annualTotal = contract.calculateAnnualTotal()
      expect(monthlyTotal).toBe(150.00)
      expect(annualTotal).toBe(1800.00)

      // Step 3: Validate contract terms
      const validation = contract.validateContract()
      expect(validation.isValid).toBe(true)
    })

    test('should handle contract amendments and changes', async () => {
      const contract = new ContractModel({
        id: 'CONTRACT-WF-002',
        customerId: 'CUST-WF-002',
        contractNumber: 'CONT-WF-2024-002',
        type: 'service' as const,
        status: 'active' as const,
        effectiveDate: new Date('2024-01-01'),
        expirationDate: new Date('2024-12-31'),
        signedDate: new Date('2023-12-15'),
        serviceTerms: [{
          serviceType: 'waste',
          frequency: 'weekly',
          containerType: 'dumpster',
          containerSize: '4_yard',
          guaranteedRate: 150.00,
          rateUnit: 'month'
        }],
        pricingTerms: [{
          baseRate: 150.00,
          guaranteedMinimum: 1800.00,
          volumeCommitments: []
        }],
        paymentTerms: {
          paymentTerms: 'Net 30',
          dueDateOffset: 30,
          lateFeeRate: 1.5
        },
        renewalTerms: {
          autoRenew: false,
          noticePeriod: 30,
          rateAdjustment: 0.05
        },
        contractValue: 1800.00,
        internalApprover: 'Test Manager',
        customerApprover: 'Test Customer Rep',
        approvalDate: new Date('2023-12-15'),
        parentContractId: null,
        amendments: [{
          id: 'AMEND-001',
          type: 'rate_change' as const,
          description: 'Rate adjustment for 2024',
          effectiveDate: new Date('2024-01-01'),
          amount: 165.00,
          approvedDate: new Date('2023-12-15'),
          approvedBy: 'Test Manager'
        }],
        changeHistory: [],
        createdAt: new Date('2023-12-15'),
        updatedAt: new Date(),
        version: 1
      })

      expect(contract.amendments.length).toBe(1)
      expect(contract.amendments[0].type).toBe('rate_change')
      expect(contract.amendments[0].amount).toBe(165.00)
    })
  })

  // Payment Processing and Reconciliation Workflow
  describe('Payment Processing Workflow', () => {
    test('should complete payment processing with reconciliation', async () => {
      // Step 1: Create payment
      const payment = new PaymentModel({
        id: 'PAYMENT-WF-001',
        customerId: 'CUST-WF-001',
        invoiceId: 'INVOICE-WF-001',
        amount: 150.00,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'ach' as const,
        status: 'processed' as const,
        referenceNumber: 'ACH-WF-2024-001',
        processedBy: 'System',
        processingDate: new Date('2024-01-15'),
        bankReference: 'BANK-WF-REF-001',
        merchantId: 'MERCHANT-WF-001',
        authorizationCode: 'AUTH-WF-001',
        adjustments: [],
        relatedPayments: [],
        reconciled: true,
        reconciledDate: new Date('2024-01-15'),
        reconciliationNotes: 'Auto-reconciled successfully',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1
      })

      expect(payment.amount).toBe(150.00)
      expect(payment.status).toBe('processed')
      expect(payment.reconciled).toBe(true)

      // Step 2: Validate payment
      const validation = payment.validatePayment()
      expect(validation.isValid).toBe(true)

      // Step 3: Test reconciliation status
      expect(payment.reconciliationNotes).toBe('Auto-reconciled successfully')
    })

    test('should handle payment adjustments and refunds', async () => {
      const payment = new PaymentModel({
        id: 'PAYMENT-WF-002',
        customerId: 'CUST-WF-002',
        invoiceId: 'INVOICE-WF-002',
        amount: 300.00,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'credit_card' as const,
        status: 'processed' as const,
        referenceNumber: 'CC-WF-2024-001',
        processedBy: 'System',
        processingDate: new Date('2024-01-15'),
        bankReference: 'BANK-WF-REF-002',
        merchantId: 'MERCHANT-WF-001',
        authorizationCode: 'AUTH-WF-002',
        adjustments: [{
          id: 'ADJ-WF-001',
          type: 'refund' as const,
          amount: 50.00,
          reason: 'Overpayment',
          processedDate: new Date('2024-01-16')
        }],
        relatedPayments: ['REFUND-WF-001'],
        reconciled: false,
        reconciledDate: null,
        reconciliationNotes: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1
      })

      // Step 2: Calculate net amount
      const netAmount = payment.calculateNetAmount()
      expect(netAmount).toBe(250.00) // 300 - 50

      // Step 3: Calculate adjustment total
      const adjustmentTotal = payment.calculateAdjustmentTotal()
      expect(adjustmentTotal).toBe(50.00)

      // Step 4: Test adjustment validation
      expect(payment.adjustments.length).toBe(1)
      expect(payment.adjustments[0].type).toBe('refund')
    })
  })

  // Environmental Compliance Tracking Workflow
  describe('Environmental Compliance Workflow', () => {
    test('should track environmental compliance and LEED allocations', async () => {
      // Step 1: Create environmental compliance record
      const compliance = new EnvironmentalComplianceModel({
        customerId: 'CUST-WF-001',
        siteId: 'SITE-WF-001',
        complianceType: 'leed' as const,
        leedCategory: 'materials_reuse' as const,
        leedPoints: 2,
        certificationYear: 2024,
        certificationBody: 'USGBC',
        carbonCredits: 15.5,
        environmentalBenefit: {
          type: 'carbon_reduction' as const,
          amount: 25.5,
          unit: 'tons CO2' as const,
          description: 'Annual carbon emissions reduced through waste diversion'
        },
        verificationStatus: 'verified' as const,
        verificationDate: new Date('2024-01-15'),
        verifier: 'Third Party Environmental Auditor',
        auditTrail: [],
        supportingDocuments: [],
        allocationValue: 2500.00,
        settlementStatus: 'settled' as const,
        settlementDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        version: 1
      })

      expect(compliance.leedPoints).toBe(2)
      expect(compliance.carbonCredits).toBe(15.5)
      expect(compliance.verificationStatus).toBe('verified')

      // Step 2: Calculate LEED score
      const leedScore = compliance.calculateLeedScore()
      expect(leedScore).toBe(2)

      // Step 3: Calculate environmental impact
      const impact = compliance.calculateEnvironmentalImpact()
      expect(impact.carbonReduction).toBe(15.5)
    })

    test('should validate compliance requirements and documentation', async () => {
      const compliance = new EnvironmentalComplianceModel({
        customerId: 'CUST-WF-002',
        siteId: 'SITE-WF-002',
        complianceType: 'environmental' as const,
        leedCategory: 'materials_reuse' as const,
        leedPoints: 0,
        certificationYear: 2024,
        certificationBody: null,
        carbonCredits: 8.2,
        environmentalBenefit: {
          type: 'waste_diversion' as const,
          amount: 68.3,
          unit: 'percentage' as const,
          description: 'Waste diverted from landfills through recycling program'
        },
        verificationStatus: 'pending' as const,
        verificationDate: null,
        verifier: null,
        auditTrail: [],
        supportingDocuments: [],
        allocationValue: 1200.00,
        settlementStatus: 'pending' as const,
        settlementDate: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        version: 1
      })

      // Step 2: Validate compliance
      const validation = compliance.validateCompliance()
      expect(validation.isCompliant).toBe(true)

      // Step 3: Test environmental impact calculation
      const impact = compliance.calculateEnvironmentalImpact()
      expect(impact.carbonReduction).toBe(8.2)
      expect(impact.wasteDiversion).toBe(68.3)
    })
  })

  // Event-Driven System Integration Tests
  describe('Event System Integration', () => {
    test('should handle event streaming and correlation', async () => {
      const eventSystem = new EventStreamingSystem()

      // Step 1: Subscribe to events
      const customerEvents: any[] = []
      const serviceEvents: any[] = []

      eventSystem.subscribe(
        { entityType: 'customer', eventType: 'created' },
        (event) => customerEvents.push(event)
      )

      eventSystem.subscribe(
        { entityType: 'service', eventType: 'updated' },
        (event) => serviceEvents.push(event)
      )

      // Step 2: Publish events
      await eventSystem.publishEvent({
        id: 'EVT-001',
        entityType: 'customer',
        entityId: 'CUST-EVT-001',
        eventType: 'created',
        timestamp: new Date(),
        data: { name: 'Event Test Customer' },
        metadata: {}
      })

      await eventSystem.publishEvent({
        id: 'EVT-002',
        entityType: 'service',
        entityId: 'SERV-EVT-001',
        eventType: 'updated',
        timestamp: new Date(),
        data: { status: 'active' },
        metadata: {}
      })

      // Step 3: Verify event delivery
      expect(customerEvents.length).toBe(1)
      expect(serviceEvents.length).toBe(1)
      expect(customerEvents[0].entityType).toBe('customer')
      expect(serviceEvents[0].entityType).toBe('service')
    })
  })

  // Data Transformation Integration Tests
  describe('Data Transformation Workflow', () => {
    test('should transform legacy data to REFUSE Protocol format', async () => {
      const transformer = new DataTransformer()

      // Sample legacy data
      const legacyData = {
        customer: {
          legacyId: 'LEG-001',
          name: 'Legacy Customer',
          address: '123 Legacy St',
          phone: '555-0001',
          serviceType: 'waste'
        }
      }

      // Transform to REFUSE Protocol format
      const transformedData = await transformer.transform(legacyData, 'legacy_to_refuse')

      expect(transformedData).toBeDefined()
      expect(transformedData.customer).toBeDefined()
      expect(transformedData.customer.id).toBeDefined()
      expect(transformedData.customer.name).toBe('Legacy Customer')
    })
  })

  // Compliance Validation Integration Tests
  describe('Compliance Validation Workflow', () => {
    test('should validate protocol compliance across entities', async () => {
      const validator = new ComplianceValidator()

      // Create test entities
      const customer = new CustomerModel({
        id: 'CUST-COMP-001',
        name: 'Compliance Test Customer',
        type: 'commercial' as const,
        status: 'active' as const,
        contactInfo: {
          primaryPhone: '555-1001',
          email: 'compliance@test.com',
          address: {
            street: '300 Compliance Blvd',
            city: 'Test City',
            state: 'CA',
            zipCode: '94105'
          }
        },
        serviceArea: 'Test Area',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        version: 1
      })

      const validationOptions = {
        entityType: 'customer',
        entityId: 'CUST-COMP-001',
        complianceRules: ['data_integrity', 'format_validation']
      }

      // Run compliance validation
      const result = await validator.validateEntityCompliance(customer, validationOptions)

      expect(result.isCompliant).toBe(true)
      expect(result.violations).toHaveLength(0)
    })
  })
})
