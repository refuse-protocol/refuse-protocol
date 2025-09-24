/**
 * @fileoverview Payment entity implementation with reconciliation logic
 * @description Complete Payment model for managing financial transactions with reconciliation and audit capabilities
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Payment, BaseEntity } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Payment implementation with comprehensive reconciliation logic and financial audit capabilities
 */
export class PaymentModel implements Payment {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  paymentNumber: string;
  type: 'invoice_payment' | 'advance_payment' | 'refund' | 'adjustment' | 'deposit' | 'final_payment';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'disputed' | 'refunded' | 'partial';

  // Financial Information
  amount: number;
  currency: string;
  paymentMethod: 'check' | 'wire' | 'ach' | 'credit_card' | 'cash' | 'bank_transfer' | 'digital_wallet';
  paymentDate: string;
  dueDate: string;
  processedDate?: string;

  // Customer and Billing Information
  customerId: string;
  customerName: string;
  billingAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // Invoice and Order References
  invoiceIds: string[];
  orderIds: string[];
  contractIds: string[];

  // Transaction Details
  transactionReference?: string;
  authorizationCode?: string;
  confirmationNumber?: string;
  bankReference?: string;

  // Fee and Adjustment Information
  fees: Array<{
    type: string;
    amount: number;
    description: string;
    taxable: boolean;
  }>;

  adjustments: Array<{
    type: 'discount' | 'surcharge' | 'tax_adjustment' | 'fee_waiver' | 'penalty' | 'credit';
    amount: number;
    reason: string;
    appliedDate: string;
    approvedBy?: string;
  }>;

  // Reconciliation Information
  reconciliationStatus: 'unreconciled' | 'matched' | 'partially_matched' | 'disputed' | 'reconciled';
  reconciledAmount?: number;
  reconciliationDate?: string;
  reconciledBy?: string;
  reconciliationNotes?: string;

  // Bank and Processing Information
  bankInformation: {
    bankName: string;
    accountNumber: string; // Masked for security
    routingNumber?: string;
    checkNumber?: string;
    depositReference?: string;
  };

  // Audit and Compliance
  auditTrail: Array<{
    action: string;
    timestamp: string;
    userId?: string;
    previousStatus?: string;
    newStatus: string;
    notes?: string;
    ipAddress?: string;
  }>;

  complianceChecks: Array<{
    checkType: string;
    status: 'passed' | 'failed' | 'pending' | 'waived';
    checkedDate: string;
    checkedBy?: string;
    notes?: string;
    referenceId?: string;
  }>;

  // Payment Processing Details
  processingDetails: {
    processor: string;
    gatewayTransactionId?: string;
    processingFee?: number;
    exchangeRate?: number;
    originalCurrency?: string;
    metadata?: Record<string, any>;
  };

  private static readonly VALID_PAYMENT_TYPES: Payment['type'][] = [
    'invoice_payment', 'advance_payment', 'refund', 'adjustment', 'deposit', 'final_payment'
  ];

  private static readonly VALID_STATUSES: Payment['status'][] = [
    'pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed', 'refunded', 'partial'
  ];

  private static readonly VALID_PAYMENT_METHODS: Payment['paymentMethod'][] = [
    'check', 'wire', 'ach', 'credit_card', 'cash', 'bank_transfer', 'digital_wallet'
  ];

  private static readonly VALID_RECONCILIATION_STATUSES: Payment['reconciliationStatus'][] = [
    'unreconciled', 'matched', 'partially_matched', 'disputed', 'reconciled'
  ];

  constructor(data: Partial<Payment>) {
    this.validateAndAssign(data);
    this.calculateTotalAmount();
  }

  /**
   * Create a new payment with validation
   */
  static create(data: Omit<Payment, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>): PaymentModel {
    const now = new Date();
    const paymentData: Partial<Payment> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'payment_system'
      }
    };

    return new PaymentModel(paymentData);
  }

  /**
   * Update payment with optimistic locking
   */
  update(updates: Partial<Omit<Payment, keyof BaseEntity>>, expectedVersion: number): PaymentModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Payment> = {
      ...updates,
      id: this.id,
      version: this.version + 1,
      updatedAt: new Date(),
      metadata: {
        ...this.metadata,
        ...updates.metadata,
        lastModifiedBy: 'system',
        previousVersion: this.version
      }
    };

    return new PaymentModel(updatedData);
  }

  /**
   * Validate and assign payment data
   */
  private validateAndAssign(data: Partial<Payment>): void {
    // Required fields validation
    if (!data.paymentNumber || typeof data.paymentNumber !== 'string') {
      throw new Error('Payment number is required and must be a string');
    }

    if (!data.type || !PaymentModel.VALID_PAYMENT_TYPES.includes(data.type)) {
      throw new Error(`Payment type must be one of: ${PaymentModel.VALID_PAYMENT_TYPES.join(', ')}`);
    }

    if (!data.status || !PaymentModel.VALID_STATUSES.includes(data.status)) {
      throw new Error(`Status must be one of: ${PaymentModel.VALID_STATUSES.join(', ')}`);
    }

    if (!data.customerId || typeof data.customerId !== 'string') {
      throw new Error('Customer ID is required and must be a string');
    }

    if (!data.customerName || typeof data.customerName !== 'string') {
      throw new Error('Customer name is required and must be a string');
    }

    if (typeof data.amount !== 'number' || data.amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    if (!data.currency || typeof data.currency !== 'string') {
      throw new Error('Currency is required and must be a string');
    }

    if (!PaymentModel.VALID_PAYMENT_METHODS.includes(data.paymentMethod)) {
      throw new Error(`Payment method must be one of: ${PaymentModel.VALID_PAYMENT_METHODS.join(', ')}`);
    }

    if (!this.isValidDate(data.paymentDate)) {
      throw new Error('Payment date must be a valid date');
    }

    if (!this.isValidDate(data.dueDate)) {
      throw new Error('Due date must be a valid date');
    }

    if (new Date(data.paymentDate) > new Date(data.dueDate)) {
      throw new Error('Payment date cannot be after due date');
    }

    if (!data.billingAddress) {
      throw new Error('Billing address is required');
    }

    if (!Array.isArray(data.invoiceIds) || data.invoiceIds.length === 0) {
      throw new Error('At least one invoice ID must be provided');
    }

    // Validate fees if provided
    if (data.fees) {
      data.fees.forEach((fee, index) => {
        if (!fee.type || typeof fee.type !== 'string') {
          throw new Error(`Fee ${index}: type is required`);
        }

        if (typeof fee.amount !== 'number' || fee.amount < 0) {
          throw new Error(`Fee ${index}: amount must be non-negative`);
        }

        if (!fee.description || typeof fee.description !== 'string') {
          throw new Error(`Fee ${index}: description is required`);
        }

        if (typeof fee.taxable !== 'boolean') {
          throw new Error(`Fee ${index}: taxable must be a boolean`);
        }
      });
    }

    // Validate adjustments if provided
    if (data.adjustments) {
      data.adjustments.forEach((adjustment, index) => {
        if (!['discount', 'surcharge', 'tax_adjustment', 'fee_waiver', 'penalty', 'credit'].includes(adjustment.type)) {
          throw new Error(`Adjustment ${index}: type must be valid`);
        }

        if (typeof adjustment.amount !== 'number') {
          throw new Error(`Adjustment ${index}: amount must be a number`);
        }

        if (!adjustment.reason || typeof adjustment.reason !== 'string') {
          throw new Error(`Adjustment ${index}: reason is required`);
        }

        if (!this.isValidDate(adjustment.appliedDate)) {
          throw new Error(`Adjustment ${index}: applied date must be valid`);
        }
      });
    }

    // Validate reconciliation status if provided
    if (data.reconciliationStatus && !PaymentModel.VALID_RECONCILIATION_STATUSES.includes(data.reconciliationStatus)) {
      throw new Error(`Reconciliation status must be one of: ${PaymentModel.VALID_RECONCILIATION_STATUSES.join(', ')}`);
    }

    // Validate bank information
    if (!data.bankInformation) {
      throw new Error('Bank information is required');
    }

    if (!data.bankInformation.bankName || typeof data.bankInformation.bankName !== 'string') {
      throw new Error('Bank name is required');
    }

    if (!data.bankInformation.accountNumber || typeof data.bankInformation.accountNumber !== 'string') {
      throw new Error('Account number is required');
    }

    // Validate processing details
    if (!data.processingDetails) {
      throw new Error('Processing details are required');
    }

    if (!data.processingDetails.processor || typeof data.processingDetails.processor !== 'string') {
      throw new Error('Processor is required');
    }

    // Assign validated data
    Object.assign(this, data);
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDate(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Calculate total amount including fees and adjustments
   */
  private calculateTotalAmount(): void {
    let totalAmount = this.amount;

    // Add fees
    this.fees.forEach(fee => {
      totalAmount += fee.amount;
    });

    // Apply adjustments
    this.adjustments.forEach(adjustment => {
      if (adjustment.type === 'discount' || adjustment.type === 'fee_waiver' || adjustment.type === 'credit') {
        totalAmount -= adjustment.amount;
      } else {
        totalAmount += adjustment.amount;
      }
    });

    // Ensure total amount is not negative
    this.metadata = {
      ...this.metadata,
      calculatedTotalAmount: Math.max(0, totalAmount)
    };
  }

  /**
   * Process payment
   */
  processPayment(): PaymentModel {
    if (this.status !== 'pending') {
      throw new Error('Can only process pending payments');
    }

    return this.update({ status: 'processing' }, this.version);
  }

  /**
   * Complete payment
   */
  completePayment(transactionReference?: string): PaymentModel {
    if (this.status !== 'processing') {
      throw new Error('Can only complete processing payments');
    }

    const now = new Date().toISOString();
    const updateData: Partial<Payment> = {
      status: 'completed',
      processedDate: now
    };

    if (transactionReference) {
      updateData.transactionReference = transactionReference;
    }

    return this.update(updateData, this.version);
  }

  /**
   * Fail payment
   */
  failPayment(reason: string): PaymentModel {
    if (this.status === 'completed' || this.status === 'cancelled') {
      throw new Error('Cannot fail completed or cancelled payments');
    }

    const updateData: Partial<Payment> = {
      status: 'failed'
    };

    return this.update(updateData, this.version);
  }

  /**
   * Cancel payment
   */
  cancelPayment(reason: string): PaymentModel {
    if (this.status === 'completed') {
      throw new Error('Cannot cancel completed payments');
    }

    const updateData: Partial<Payment> = {
      status: 'cancelled'
    };

    return this.update(updateData, this.version);
  }

  /**
   * Dispute payment
   */
  disputePayment(reason: string): PaymentModel {
    const updateData: Partial<Payment> = {
      status: 'disputed'
    };

    return this.update(updateData, this.version);
  }

  /**
   * Add fee
   */
  addFee(fee: Omit<Payment['fees'][0], 'type' | 'amount'> & { type: string; amount: number }): PaymentModel {
    const newFee = {
      type: fee.type,
      amount: fee.amount,
      description: fee.description,
      taxable: fee.taxable
    };

    const newFees = [...this.fees, newFee];
    return this.update({ fees: newFees }, this.version);
  }

  /**
   * Remove fee
   */
  removeFee(feeIndex: number): PaymentModel {
    if (feeIndex < 0 || feeIndex >= this.fees.length) {
      throw new Error('Invalid fee index');
    }

    const newFees = this.fees.filter((_, index) => index !== feeIndex);
    return this.update({ fees: newFees }, this.version);
  }

  /**
   * Add adjustment
   */
  addAdjustment(adjustment: Omit<Payment['adjustments'][0], 'appliedDate'> & { appliedDate: string }): PaymentModel {
    const newAdjustment = {
      ...adjustment,
      appliedDate: adjustment.appliedDate
    };

    const newAdjustments = [...this.adjustments, newAdjustment];
    return this.update({ adjustments: newAdjustments }, this.version);
  }

  /**
   * Remove adjustment
   */
  removeAdjustment(adjustmentIndex: number): PaymentModel {
    if (adjustmentIndex < 0 || adjustmentIndex >= this.adjustments.length) {
      throw new Error('Invalid adjustment index');
    }

    const newAdjustments = this.adjustments.filter((_, index) => index !== adjustmentIndex);
    return this.update({ adjustments: newAdjustments }, this.version);
  }

  /**
   * Reconcile payment
   */
  reconcilePayment(reconciledAmount?: number, notes?: string): PaymentModel {
    const now = new Date().toISOString();

    let reconciliationStatus: Payment['reconciliationStatus'] = 'reconciled';
    let reconciledAmountValue = reconciledAmount || this.amount;

    // Determine reconciliation status based on amounts
    if (Math.abs(reconciledAmountValue - this.amount) > 0.01) { // Allow for small rounding differences
      reconciliationStatus = 'partially_matched';
    }

    const updateData: Partial<Payment> = {
      reconciliationStatus,
      reconciledAmount: reconciledAmountValue,
      reconciliationDate: now,
      reconciliationNotes: notes
    };

    return this.update(updateData, this.version);
  }

  /**
   * Mark as disputed reconciliation
   */
  markReconciliationDisputed(reason: string): PaymentModel {
    const updateData: Partial<Payment> = {
      reconciliationStatus: 'disputed'
    };

    return this.update(updateData, this.version);
  }

  /**
   * Add audit trail entry
   */
  addAuditTrailEntry(action: string, newStatus: string, notes?: string): PaymentModel {
    const auditEntry = {
      action,
      timestamp: new Date().toISOString(),
      previousStatus: this.status,
      newStatus,
      notes
    };

    const newAuditTrail = [...this.auditTrail, auditEntry];
    return this.update({ auditTrail: newAuditTrail }, this.version);
  }

  /**
   * Add compliance check
   */
  addComplianceCheck(checkType: string, status: 'passed' | 'failed' | 'pending' | 'waived', notes?: string): PaymentModel {
    const complianceCheck = {
      checkType,
      status,
      checkedDate: new Date().toISOString(),
      notes
    };

    const newComplianceChecks = [...this.complianceChecks, complianceCheck];
    return this.update({ complianceChecks: newComplianceChecks }, this.version);
  }

  /**
   * Check if payment is overdue
   */
  isOverdue(): boolean {
    if (this.status === 'completed' || this.status === 'cancelled') {
      return false;
    }

    const dueDate = new Date(this.dueDate);
    const now = new Date();
    return dueDate < now;
  }

  /**
   * Check if payment is within processing window
   */
  isWithinProcessingWindow(): boolean {
    if (this.status !== 'pending') {
      return true;
    }

    const paymentDate = new Date(this.paymentDate);
    const now = new Date();
    const processingWindow = 30; // days

    const windowEnd = new Date(paymentDate);
    windowEnd.setDate(windowEnd.getDate() + processingWindow);

    return now <= windowEnd;
  }

  /**
   * Get payment age in days
   */
  getAgeInDays(): number {
    const paymentDate = new Date(this.paymentDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - paymentDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get total amount including fees and adjustments
   */
  getTotalAmount(): number {
    return this.metadata?.calculatedTotalAmount || this.amount;
  }

  /**
   * Get payment efficiency score
   */
  getEfficiencyScore(): number {
    let score = 100;

    // Reduce score for overdue payments
    if (this.isOverdue()) score -= 30;

    // Reduce score for disputed payments
    if (this.status === 'disputed') score -= 25;

    // Reduce score for failed payments
    if (this.status === 'failed') score -= 40;

    // Reduce score based on age
    const ageInDays = this.getAgeInDays();
    if (ageInDays > 30) {
      score -= Math.min(20, (ageInDays - 30) * 0.5);
    }

    // Reduce score if outside processing window
    if (!this.isWithinProcessingWindow()) score -= 15;

    // Reduce score if not reconciled
    if (this.reconciliationStatus === 'unreconciled' && this.status === 'completed') score -= 10;

    return Math.max(0, Math.round(score));
  }

  /**
   * Get payment summary for reporting
   */
  getSummary(): Record<string, any> {
    const isOverdue = this.isOverdue();
    const ageInDays = this.getAgeInDays();
    const totalAmount = this.getTotalAmount();

    return {
      id: this.id,
      paymentNumber: this.paymentNumber,
      type: this.type,
      status: this.status,
      customerId: this.customerId,
      customerName: this.customerName,
      amount: this.amount,
      totalAmount: totalAmount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      paymentDate: this.paymentDate,
      dueDate: this.dueDate,
      processedDate: this.processedDate,
      isOverdue,
      ageInDays,
      isWithinProcessingWindow: this.isWithinProcessingWindow(),
      efficiencyScore: this.getEfficiencyScore(),
      reconciliationStatus: this.reconciliationStatus,
      invoiceCount: this.invoiceIds.length,
      orderCount: this.orderIds.length,
      feesCount: this.fees.length,
      adjustmentsCount: this.adjustments.length,
      auditTrailCount: this.auditTrail.length,
      complianceChecksCount: this.complianceChecks.length
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Payment {
    return {
      id: this.id,
      externalIds: this.externalIds,
      paymentNumber: this.paymentNumber,
      type: this.type,
      status: this.status,
      amount: this.amount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      paymentDate: this.paymentDate,
      dueDate: this.dueDate,
      processedDate: this.processedDate,
      customerId: this.customerId,
      customerName: this.customerName,
      billingAddress: this.billingAddress,
      invoiceIds: this.invoiceIds,
      orderIds: this.orderIds,
      contractIds: this.contractIds,
      transactionReference: this.transactionReference,
      authorizationCode: this.authorizationCode,
      confirmationNumber: this.confirmationNumber,
      bankReference: this.bankReference,
      fees: this.fees,
      adjustments: this.adjustments,
      reconciliationStatus: this.reconciliationStatus,
      reconciledAmount: this.reconciledAmount,
      reconciliationDate: this.reconciliationDate,
      reconciledBy: this.reconciledBy,
      reconciliationNotes: this.reconciliationNotes,
      bankInformation: this.bankInformation,
      auditTrail: this.auditTrail,
      complianceChecks: this.complianceChecks,
      processingDetails: this.processingDetails,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Payment> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for payment changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'payment',
      eventType,
      timestamp: new Date(),
      eventData: this.toEventData(),
      version: 1
    };
  }

  /**
   * Validate business rules
   */
  validateBusinessRules(): string[] {
    const errors: string[] = [];

    // Business rule: Overdue payments should be flagged
    if (this.isOverdue()) {
      errors.push('Payment is overdue and requires immediate attention');
    }

    // Business rule: High-value payments should have compliance checks
    if (this.amount > 10000 && this.complianceChecks.length === 0) {
      errors.push('High-value payments should have compliance checks');
    }

    // Business rule: Completed payments should be reconciled
    if (this.status === 'completed' && this.reconciliationStatus === 'unreconciled' && this.getAgeInDays() > 7) {
      errors.push('Completed payments should be reconciled within 7 days');
    }

    // Business rule: Disputed payments should have reconciliation notes
    if (this.reconciliationStatus === 'disputed' && !this.reconciliationNotes) {
      errors.push('Disputed payments should have reconciliation notes');
    }

    // Business rule: Failed payments should be reviewed
    if (this.status === 'failed' && this.getAgeInDays() > 1) {
      errors.push('Failed payments should be reviewed within 24 hours');
    }

    // Business rule: Refunds should have approval
    if (this.type === 'refund' && this.auditTrail.length === 0) {
      errors.push('Refunds should have approval trail');
    }

    // Business rule: Large adjustments should be audited
    const largeAdjustments = this.adjustments.filter(adj => Math.abs(adj.amount) > this.amount * 0.1);
    if (largeAdjustments.length > 0 && !this.auditTrail.some(entry => entry.action.includes('adjustment'))) {
      errors.push('Large adjustments should be audited');
    }

    // Business rule: International payments should have processing details
    if (this.billingAddress.country !== 'US' && !this.processingDetails.exchangeRate) {
      errors.push('International payments should have exchange rate information');
    }

    return errors;
  }
}

/**
 * Payment factory for creating payments from legacy data
 */
export class PaymentFactory {
  /**
   * Create payment from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): PaymentModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Payment> = {
      externalIds: [legacyData.payment_id || legacyData.PAYMENT_ID || legacyData.transaction_id || legacyData.id],
      paymentNumber: legacyData.payment_number || legacyData.PAYMENT_NUMBER || legacyData.reference_number || `PAY-${Date.now()}`,
      type: this.mapLegacyPaymentType(legacyData.payment_type || legacyData.type || 'invoice_payment'),
      status: this.mapLegacyStatus(legacyData.status || legacyData.STATUS || 'pending'),
      amount: legacyData.amount || legacyData.AMOUNT || legacyData.payment_amount || 0,
      currency: legacyData.currency || legacyData.CURRENCY || 'USD',
      paymentMethod: this.mapLegacyPaymentMethod(legacyData.payment_method || legacyData.method || 'check'),
      paymentDate: legacyData.payment_date || legacyData.PAYMENT_DATE || new Date().toISOString().split('T')[0],
      dueDate: legacyData.due_date || legacyData.DUE_DATE || new Date().toISOString().split('T')[0],
      processedDate: legacyData.processed_date || legacyData.PROCESSED_DATE,
      customerId: legacyData.customer_id || legacyData.CUSTOMER_ID,
      customerName: legacyData.customer_name || legacyData.CUSTOMER_NAME || legacyData.customer || 'Unknown',
      billingAddress: this.mapLegacyBillingAddress(legacyData),
      invoiceIds: this.mapLegacyInvoiceIds(legacyData),
      orderIds: this.mapLegacyOrderIds(legacyData),
      contractIds: this.mapLegacyContractIds(legacyData),
      transactionReference: legacyData.transaction_reference || legacyData.TRANSACTION_REFERENCE || legacyData.reference,
      authorizationCode: legacyData.authorization_code || legacyData.AUTHORIZATION_CODE,
      confirmationNumber: legacyData.confirmation_number || legacyData.CONFIRMATION_NUMBER,
      bankReference: legacyData.bank_reference || legacyData.BANK_REFERENCE,
      fees: this.mapLegacyFees(legacyData),
      adjustments: this.mapLegacyAdjustments(legacyData),
      reconciliationStatus: this.mapLegacyReconciliationStatus(legacyData.reconciliation_status || legacyData.RECONCILIATION_STATUS || 'unreconciled'),
      reconciledAmount: legacyData.reconciled_amount || legacyData.RECONCILED_AMOUNT,
      reconciliationDate: legacyData.reconciliation_date || legacyData.RECONCILIATION_DATE,
      reconciledBy: legacyData.reconciled_by || legacyData.RECONCILED_BY,
      reconciliationNotes: legacyData.reconciliation_notes || legacyData.RECONCILIATION_NOTES,
      bankInformation: this.mapLegacyBankInformation(legacyData),
      auditTrail: this.mapLegacyAuditTrail(legacyData),
      complianceChecks: this.mapLegacyComplianceChecks(legacyData),
      processingDetails: this.mapLegacyProcessingDetails(legacyData),
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy payment processing system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
        paymentData: {
          department: legacyData.department || 'accounts_receivable',
          costCenter: legacyData.cost_center,
          projectCode: legacyData.project_code,
          batchId: legacyData.batch_id
        }
      }
    };

    return PaymentModel.create(mappedData as any);
  }

  /**
   * Map legacy payment type
   */
  private static mapLegacyPaymentType(legacyType: string): Payment['type'] {
    const typeMap: Record<string, Payment['type']> = {
      'invoice_payment': 'invoice_payment',
      'advance_payment': 'advance_payment',
      'refund': 'refund',
      'adjustment': 'adjustment',
      'deposit': 'deposit',
      'final_payment': 'final_payment',
      'payment': 'invoice_payment',
      'invoice': 'invoice_payment',
      'advance': 'advance_payment',
      'deposit_payment': 'deposit'
    };

    return typeMap[legacyType.toLowerCase()] || 'invoice_payment';
  }

  /**
   * Map legacy status
   */
  private static mapLegacyStatus(legacyStatus: string): Payment['status'] {
    const statusMap: Record<string, Payment['status']> = {
      'pending': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'disputed': 'disputed',
      'refunded': 'refunded',
      'partial': 'partial',
      'paid': 'completed',
      'declined': 'failed',
      'canceled': 'cancelled'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'pending';
  }

  /**
   * Map legacy payment method
   */
  private static mapLegacyPaymentMethod(legacyMethod: string): Payment['paymentMethod'] {
    const methodMap: Record<string, Payment['paymentMethod']> = {
      'check': 'check',
      'wire': 'wire',
      'ach': 'ach',
      'credit_card': 'credit_card',
      'cash': 'cash',
      'bank_transfer': 'bank_transfer',
      'digital_wallet': 'digital_wallet',
      'cheque': 'check',
      'card': 'credit_card',
      'bank': 'bank_transfer',
      'wallet': 'digital_wallet'
    };

    return methodMap[legacyMethod.toLowerCase()] || 'check';
  }

  /**
   * Map legacy billing address
   */
  private static mapLegacyBillingAddress(legacyData: Record<string, any>): Payment['billingAddress'] {
    return {
      street1: legacyData.billing_street1 || legacyData.BILLING_STREET1 || legacyData.address1 || 'Unknown',
      street2: legacyData.billing_street2 || legacyData.BILLING_STREET2 || legacyData.address2,
      city: legacyData.billing_city || legacyData.BILLING_CITY || legacyData.city || 'Unknown',
      state: legacyData.billing_state || legacyData.BILLING_STATE || legacyData.state || 'Unknown',
      zipCode: legacyData.billing_zip || legacyData.BILLING_ZIP || legacyData.zipcode || '00000',
      country: legacyData.billing_country || legacyData.BILLING_COUNTRY || legacyData.country || 'US'
    };
  }

  /**
   * Map legacy invoice IDs
   */
  private static mapLegacyInvoiceIds(legacyData: Record<string, any>): string[] {
    if (legacyData.invoice_ids && Array.isArray(legacyData.invoice_ids)) {
      return legacyData.invoice_ids;
    }

    if (legacyData.invoice_id && typeof legacyData.invoice_id === 'string') {
      return [legacyData.invoice_id];
    }

    return [];
  }

  /**
   * Map legacy order IDs
   */
  private static mapLegacyOrderIds(legacyData: Record<string, any>): string[] {
    if (legacyData.order_ids && Array.isArray(legacyData.order_ids)) {
      return legacyData.order_ids;
    }

    if (legacyData.order_id && typeof legacyData.order_id === 'string') {
      return [legacyData.order_id];
    }

    return [];
  }

  /**
   * Map legacy contract IDs
   */
  private static mapLegacyContractIds(legacyData: Record<string, any>): string[] {
    if (legacyData.contract_ids && Array.isArray(legacyData.contract_ids)) {
      return legacyData.contract_ids;
    }

    if (legacyData.contract_id && typeof legacyData.contract_id === 'string') {
      return [legacyData.contract_id];
    }

    return [];
  }

  /**
   * Map legacy fees
   */
  private static mapLegacyFees(legacyData: Record<string, any>): Payment['fees'] {
    if (!legacyData.fees && !legacyData.charges) {
      return [];
    }

    const feesData = legacyData.fees || legacyData.charges || [];

    if (Array.isArray(feesData)) {
      return feesData.map((fee: any) => ({
        type: fee.type || fee.fee_type || 'processing_fee',
        amount: fee.amount || 0,
        description: fee.description || fee.fee_description || 'Fee',
        taxable: fee.taxable !== undefined ? fee.taxable : true
      }));
    }

    return [];
  }

  /**
   * Map legacy adjustments
   */
  private static mapLegacyAdjustments(legacyData: Record<string, any>): Payment['adjustments'] {
    if (!legacyData.adjustments && !legacyData.modifications) {
      return [];
    }

    const adjustmentsData = legacyData.adjustments || legacyData.modifications || [];

    if (Array.isArray(adjustmentsData)) {
      return adjustmentsData.map((adjustment: any) => ({
        type: this.mapLegacyAdjustmentType(adjustment.type || adjustment.adjustment_type || 'discount'),
        amount: adjustment.amount || 0,
        reason: adjustment.reason || adjustment.description || 'Adjustment',
        appliedDate: adjustment.applied_date || adjustment.date || new Date().toISOString().split('T')[0],
        approvedBy: adjustment.approved_by || adjustment.approver
      }));
    }

    return [];
  }

  /**
   * Map legacy adjustment type
   */
  private static mapLegacyAdjustmentType(legacyType: string): Payment['adjustments'][0]['type'] {
    const typeMap: Record<string, Payment['adjustments'][0]['type']> = {
      'discount': 'discount',
      'surcharge': 'surcharge',
      'tax_adjustment': 'tax_adjustment',
      'fee_waiver': 'fee_waiver',
      'penalty': 'penalty',
      'credit': 'credit',
      'tax': 'tax_adjustment',
      'waiver': 'fee_waiver'
    };

    return typeMap[legacyType.toLowerCase()] || 'discount';
  }

  /**
   * Map legacy reconciliation status
   */
  private static mapLegacyReconciliationStatus(legacyStatus: string): Payment['reconciliationStatus'] {
    const statusMap: Record<string, Payment['reconciliationStatus']> = {
      'unreconciled': 'unreconciled',
      'matched': 'matched',
      'partially_matched': 'partially_matched',
      'disputed': 'disputed',
      'reconciled': 'reconciled',
      'pending': 'unreconciled',
      'matched_partially': 'partially_matched'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'unreconciled';
  }

  /**
   * Map legacy bank information
   */
  private static mapLegacyBankInformation(legacyData: Record<string, any>): Payment['bankInformation'] {
    return {
      bankName: legacyData.bank_name || legacyData.BANK_NAME || 'Unknown Bank',
      accountNumber: legacyData.account_number || legacyData.ACCOUNT_NUMBER || '**** **** **** ****',
      routingNumber: legacyData.routing_number || legacyData.ROUTING_NUMBER,
      checkNumber: legacyData.check_number || legacyData.CHECK_NUMBER,
      depositReference: legacyData.deposit_reference || legacyData.DEPOSIT_REFERENCE
    };
  }

  /**
   * Map legacy audit trail
   */
  private static mapLegacyAuditTrail(legacyData: Record<string, any>): Payment['auditTrail'] {
    if (!legacyData.audit_trail && !legacyData.history) {
      return [];
    }

    const auditData = legacyData.audit_trail || legacyData.history || [];

    if (Array.isArray(auditData)) {
      return auditData.map((entry: any) => ({
        action: entry.action || entry.event || 'payment_action',
        timestamp: entry.timestamp || entry.date || new Date().toISOString(),
        userId: entry.user_id || entry.user,
        previousStatus: entry.previous_status || entry.from_status,
        newStatus: entry.new_status || entry.to_status || 'unknown',
        notes: entry.notes || entry.description,
        ipAddress: entry.ip_address || entry.ip
      }));
    }

    return [];
  }

  /**
   * Map legacy compliance checks
   */
  private static mapLegacyComplianceChecks(legacyData: Record<string, any>): Payment['complianceChecks'] {
    if (!legacyData.compliance_checks && !legacyData.checks) {
      return [];
    }

    const checksData = legacyData.compliance_checks || legacyData.checks || [];

    if (Array.isArray(checksData)) {
      return checksData.map((check: any) => ({
        checkType: check.type || check.check_type || 'compliance_check',
        status: this.mapLegacyComplianceStatus(check.status || 'pending'),
        checkedDate: check.checked_date || check.date || new Date().toISOString(),
        checkedBy: check.checked_by || check.user,
        notes: check.notes || check.description,
        referenceId: check.reference_id || check.reference
      }));
    }

    return [];
  }

  /**
   * Map legacy compliance status
   */
  private static mapLegacyComplianceStatus(legacyStatus: string): Payment['complianceChecks'][0]['status'] {
    const statusMap: Record<string, Payment['complianceChecks'][0]['status']> = {
      'passed': 'passed',
      'failed': 'failed',
      'pending': 'pending',
      'waived': 'waived',
      'pass': 'passed',
      'fail': 'failed',
      'pending': 'pending',
      'waive': 'waived'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'pending';
  }

  /**
   * Map legacy processing details
   */
  private static mapLegacyProcessingDetails(legacyData: Record<string, any>): Payment['processingDetails'] {
    return {
      processor: legacyData.processor || legacyData.PROCESSOR || 'Unknown Processor',
      gatewayTransactionId: legacyData.gateway_transaction_id || legacyData.GATEWAY_TRANSACTION_ID,
      processingFee: legacyData.processing_fee || legacyData.PROCESSING_FEE,
      exchangeRate: legacyData.exchange_rate || legacyData.EXCHANGE_RATE,
      originalCurrency: legacyData.original_currency || legacyData.ORIGINAL_CURRENCY,
      metadata: legacyData.processing_metadata || legacyData.PROCESSING_METADATA || {}
    };
  }
}

/**
 * Payment validator for external validation
 */
export class PaymentValidator {
  /**
   * Validate payment data without creating instance
   */
  static validate(data: Partial<Payment>): { isValid: boolean; errors: string[] } {
    try {
      new PaymentModel(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    }
  }

  /**
   * Validate business rules
   */
  static validateBusinessRules(payment: PaymentModel): string[] {
    return payment.validateBusinessRules();
  }
}

/**
 * Payment management utilities
 */
export class PaymentManager {
  /**
   * Optimize payment processing
   */
  static optimizePaymentProcessing(payments: PaymentModel[]): PaymentModel[] {
    const optimizedPayments = [...payments];

    // Sort by priority (overdue first, then by amount)
    optimizedPayments.sort((a, b) => {
      if (a.isOverdue() && !b.isOverdue()) return -1;
      if (!a.isOverdue() && b.isOverdue()) return 1;

      return b.amount - a.amount;
    });

    return optimizedPayments;
  }

  /**
   * Get overdue payments
   */
  static getOverduePayments(payments: PaymentModel[]): PaymentModel[] {
    return payments.filter(payment => payment.isOverdue());
  }

  /**
   * Get payments requiring reconciliation
   */
  static getPaymentsRequiringReconciliation(payments: PaymentModel[]): PaymentModel[] {
    return payments.filter(payment =>
      payment.status === 'completed' &&
      payment.reconciliationStatus === 'unreconciled'
    );
  }

  /**
   * Get disputed payments
   */
  static getDisputedPayments(payments: PaymentModel[]): PaymentModel[] {
    return payments.filter(payment => payment.status === 'disputed');
  }

  /**
   * Get payment performance report
   */
  static getPerformanceReport(payments: PaymentModel[]): Record<string, any> {
    const completedPayments = payments.filter(payment => payment.status === 'completed');
    const overduePayments = this.getOverduePayments(payments);
    const disputedPayments = this.getDisputedPayments(payments);
    const failedPayments = payments.filter(payment => payment.status === 'failed');

    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const completedAmount = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const overdueAmount = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);

    const averageEfficiency = payments.reduce((sum, payment) => sum + payment.getEfficiencyScore(), 0) / payments.length;

    const paymentsByMethod = payments.reduce((acc, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const paymentsByStatus = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPayments: payments.length,
      completedPayments: completedPayments.length,
      overduePayments: overduePayments.length,
      disputedPayments: disputedPayments.length,
      failedPayments: failedPayments.length,
      completionRate: payments.length > 0 ? (completedPayments.length / payments.length) * 100 : 0,
      overdueRate: payments.length > 0 ? (overduePayments.length / payments.length) * 100 : 0,
      averageEfficiency: Math.round(averageEfficiency * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      completedAmount: Math.round(completedAmount * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      averagePaymentAmount: payments.length > 0 ? Math.round((totalAmount / payments.length) * 100) / 100 : 0,
      paymentsByMethod,
      paymentsByStatus,
      averageAgeInDays: payments.reduce((sum, payment) => sum + payment.getAgeInDays(), 0) / payments.length
    };
  }

  /**
   * Check for payment conflicts
   */
  static checkPaymentConflicts(payments: PaymentModel[]): string[] {
    const conflicts: string[] = [];

    payments.forEach(payment => {
      if (payment.isOverdue()) {
        conflicts.push(`Payment ${payment.paymentNumber} is overdue`);
      }

      if (payment.status === 'failed' && payment.getAgeInDays() > 1) {
        conflicts.push(`Failed payment ${payment.paymentNumber} requires review`);
      }

      if (payment.status === 'disputed' && !payment.reconciliationNotes) {
        conflicts.push(`Disputed payment ${payment.paymentNumber} missing reconciliation notes`);
      }

      const businessRuleErrors = payment.validateBusinessRules();
      conflicts.push(...businessRuleErrors.map(error => `${payment.paymentNumber}: ${error}`));
    });

    return conflicts;
  }

  /**
   * Get payments requiring immediate attention
   */
  static getPaymentsRequiringAttention(payments: PaymentModel[]): Array<{ payment: PaymentModel; reason: string; priority: 'low' | 'medium' | 'high' }> {
    const requiringAttention: Array<{ payment: PaymentModel; reason: string; priority: 'low' | 'medium' | 'high' }> = [];

    payments.forEach(payment => {
      if (payment.isOverdue()) {
        requiringAttention.push({
          payment,
          reason: 'Payment is overdue',
          priority: 'high'
        });
      }

      if (payment.status === 'failed') {
        requiringAttention.push({
          payment,
          reason: 'Payment failed and requires investigation',
          priority: 'high'
        });
      }

      if (payment.status === 'disputed') {
        requiringAttention.push({
          payment,
          reason: 'Payment is disputed and requires resolution',
          priority: 'medium'
        });
      }

      if (payment.amount > 10000 && payment.status === 'pending') {
        requiringAttention.push({
          payment,
          reason: 'High-value payment is pending processing',
          priority: 'medium'
        });
      }

      if (payment.reconciliationStatus === 'unreconciled' &&
          payment.status === 'completed' &&
          payment.getAgeInDays() > 7) {
        requiringAttention.push({
          payment,
          reason: 'Completed payment requires reconciliation',
          priority: 'low'
        });
      }
    });

    return requiringAttention.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}
