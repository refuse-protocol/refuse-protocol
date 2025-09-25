/**
 * @fileoverview Base entity implementation for all REFUSE Protocol entities
 * @description Common functionality and patterns shared across all entity models
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid'
import { BaseEntity } from '../specifications/entities'

/**
 * Abstract base class for all REFUSE Protocol entities
 * Provides common functionality for validation, versioning, and lifecycle management
 */
export abstract class BaseEntityModel implements BaseEntity {
  id: string
  externalIds?: string[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  version: number

  protected constructor(data: Partial<BaseEntity> = {}) {
    this.id = data.id || ''
    this.externalIds = data.externalIds
    this.metadata = data.metadata
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
    this.version = data.version || 1
  }

  /**
   * Initialize base entity properties with validation
   */
  protected initializeBaseEntity(data: Partial<BaseEntity>): void {
    // Generate ID if not provided
    this.id = data.id || uuidv4()

    // Set timestamps
    const now = new Date()
    this.createdAt = data.createdAt || now
    this.updatedAt = data.updatedAt || now
    this.version = data.version || 1

    // Initialize metadata with defaults
    this.metadata = {
      ...data.metadata,
      createdBy: data.metadata?.createdBy || 'system',
      source: data.metadata?.source || 'api'
    }

    // Handle external IDs
    if (data.externalIds) {
      this.externalIds = [...data.externalIds]
    }
  }

  /**
   * Update entity with optimistic locking
   */
  update(updates: Partial<Omit<this, keyof BaseEntity>>, expectedVersion: number): this {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`)
    }

    const updatedData = {
      ...updates,
      version: this.version + 1,
      updatedAt: new Date(),
      metadata: {
        ...this.metadata,
        ...updates.metadata,
        lastModifiedBy: updates.metadata?.lastModifiedBy || 'system',
        previousVersion: this.version
      }
    }

    return this.updateFromData(updatedData)
  }

  /**
   * Abstract method to be implemented by subclasses for specific updates
   */
  protected abstract updateFromData(data: any): this

  /**
   * Validate required fields exist and have correct types
   */
  protected validateRequiredFields<T>(data: Partial<T>, requiredFields: (keyof T)[]): void {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`${String(field)} is required`)
      }
    }
  }

  /**
   * Validate enum values
   */
  protected validateEnumValue<T>(
    value: any,
    validValues: T[],
    fieldName: string
  ): void {
    if (!validValues.includes(value)) {
      throw new Error(`${fieldName} must be one of: ${validValues.join(', ')}`)
    }
  }

  /**
   * Validate string length constraints
   */
  protected validateStringLength(
    value: string,
    maxLength: number,
    fieldName: string
  ): void {
    if (value.length > maxLength) {
      throw new Error(`${fieldName} must not exceed ${maxLength} characters`)
    }
  }

  /**
   * Validate email format
   */
  protected validateEmail(email: string, fieldName: string = 'email'): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid ${fieldName} format`)
    }
  }

  /**
   * Validate phone format
   */
  protected validatePhone(phone: string, fieldName: string = 'phone'): void {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    if (!phoneRegex.test(phone)) {
      throw new Error(`Invalid ${fieldName} format`)
    }
  }

  /**
   * Validate address structure
   */
  protected validateAddress(address: any): void {
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      throw new Error('Address must include street, city, state, and zipCode')
    }
  }

  /**
   * Generate audit event for entity changes
   */
  protected generateAuditEvent(
    eventType: string,
    changes: any,
    entityType: string
  ): any {
    return {
      id: uuidv4(),
      entityType,
      entityId: this.id,
      eventType,
      timestamp: new Date(),
      data: changes,
      metadata: {
        previousVersion: this.version - 1,
        newVersion: this.version,
        changedBy: 'system'
      }
    }
  }

  /**
   * Calculate entity hash for integrity checking
   */
  protected calculateEntityHash(): string {
    const entityData = {
      id: this.id,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...this.getEntitySpecificData()
    }

    // Simple hash implementation - in production, use crypto.subtle
    return btoa(JSON.stringify(entityData)).slice(0, 16)
  }

  /**
   * Abstract method to get entity-specific data for hashing
   */
  protected abstract getEntitySpecificData(): any

  /**
   * Deep clone the entity
   */
  clone(): this {
    const clonedData = {
      ...this,
      id: uuidv4(), // New ID for clone
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      metadata: {
        ...this.metadata,
        clonedFrom: this.id,
        cloneTimestamp: new Date()
      }
    }

    return this.updateFromData(clonedData)
  }

  /**
   * Check if entity is in a specific state
   */
  isInState(state: string): boolean {
    return this.getCurrentState() === state
  }

  /**
   * Get current state (override in subclasses if needed)
   */
  protected getCurrentState(): string {
    return 'active'
  }

  /**
   * Archive the entity
   */
  archive(reason?: string): this {
    return this.update({
      metadata: {
        ...this.metadata,
        archived: true,
        archivedAt: new Date(),
        archivedReason: reason || 'Manual archive'
      }
    } as any, this.version)
  }

  /**
   * Check if entity is archived
   */
  isArchived(): boolean {
    return this.metadata?.archived === true
  }

  /**
   * Validate entity integrity
   */
  validateIntegrity(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.id) errors.push('Entity ID is required')
    if (!this.createdAt) errors.push('Created date is required')
    if (!this.updatedAt) errors.push('Updated date is required')
    if (this.version < 1) errors.push('Version must be positive')

    // Check timestamp order
    if (this.updatedAt < this.createdAt) {
      errors.push('Updated date cannot be before created date')
    }

    // Check required fields (implemented by subclasses)
    try {
      this.validateRequiredFieldsInternal()
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Abstract method for subclass-specific required field validation
   */
  protected abstract validateRequiredFieldsInternal(): void

  /**
   * Export entity for API responses
   */
  toJSON(): any {
    return {
      ...this,
      _entityType: this.constructor.name.replace('Model', '').toLowerCase(),
      _integrityHash: this.calculateEntityHash()
    }
  }
}

/**
 * Base factory class for creating entities
 */
export abstract class BaseEntityFactory<T extends BaseEntityModel> {
  protected constructor(private entityClass: new (data: any) => T) {}

  /**
   * Create entity with validation
   */
  create(data: Omit<T, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>): T {
    const entityData = {
      ...data,
      id: data.id || uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'factory',
        source: 'api'
      }
    }

    return new this.entityClass(entityData)
  }

  /**
   * Create entity from external system data
   */
  createFromExternal(data: any, systemName: string): T {
    const entityData = {
      ...data,
      externalIds: [...(data.externalIds || []), data.id || systemName],
      metadata: {
        ...data.metadata,
        importedFrom: systemName,
        importTimestamp: new Date()
      }
    }

    return this.create(entityData as any)
  }

  /**
   * Bulk create entities
   */
  createBulk(dataArray: any[], systemName?: string): T[] {
    return dataArray.map(data => {
      if (systemName) {
        return this.createFromExternal(data, systemName)
      }
      return this.create(data)
    })
  }
}

/**
 * Base validator class for entity validation
 */
export abstract class BaseEntityValidator<T extends BaseEntityModel> {
  protected constructor(private entityClass: new (data: any) => T) {}

  /**
   * Validate entity creation data
   */
  validateCreation(data: Partial<T>): { isValid: boolean; errors: string[] } {
    return this.validate(data, 'create')
  }

  /**
   * Validate entity update data
   */
  validateUpdate(data: Partial<T>): { isValid: boolean; errors: string[] } {
    return this.validate(data, 'update')
  }

  /**
   * Comprehensive validation
   */
  private validate(data: Partial<T>, operation: 'create' | 'update'): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      // Base validation
      if (operation === 'create') {
        this.validateRequiredFieldsForCreate(data)
      } else {
        this.validateRequiredFieldsForUpdate(data)
      }

      // Type-specific validation
      this.validateEntitySpecific(data, errors)

      // Business rules validation
      this.validateBusinessRules(data, errors)

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  protected abstract validateRequiredFieldsForCreate(data: Partial<T>): void
  protected abstract validateRequiredFieldsForUpdate(data: Partial<T>): void
  protected abstract validateEntitySpecific(data: Partial<T>, errors: string[]): void
  protected abstract validateBusinessRules(data: Partial<T>, errors: string[]): void
}

/**
 * Base manager class for entity operations
 */
export abstract class BaseEntityManager<T extends BaseEntityModel> {
  protected entities: Map<string, T> = new Map()

  protected constructor(
    private factory: BaseEntityFactory<T>,
    private validator: BaseEntityValidator<T>
  ) {}

  /**
   * Create and store new entity
   */
  async create(data: any): Promise<T> {
    // Validate
    const validation = this.validator.validateCreation(data)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Create
    const entity = this.factory.create(data)

    // Store
    this.entities.set(entity.id, entity)

    return entity
  }

  /**
   * Get entity by ID
   */
  get(id: string): T | undefined {
    return this.entities.get(id)
  }

  /**
   * Update entity
   */
  async update(id: string, updates: any, expectedVersion: number): Promise<T> {
    const entity = this.entities.get(id)
    if (!entity) {
      throw new Error(`Entity not found: ${id}`)
    }

    // Validate update
    const validation = this.validator.validateUpdate(updates)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Update
    const updatedEntity = entity.update(updates, expectedVersion)
    this.entities.set(id, updatedEntity)

    return updatedEntity
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<void> {
    this.entities.delete(id)
  }

  /**
   * List all entities
   */
  list(): T[] {
    return Array.from(this.entities.values())
  }

  /**
   * Find entities by criteria
   */
  find(criteria: Partial<T>): T[] {
    return this.list().filter(entity => {
      return Object.entries(criteria).every(([key, value]) => {
        const entityValue = (entity as any)[key]
        return entityValue === value
      })
    })
  }

  /**
   * Get entity count
   */
  count(): number {
    return this.entities.size
  }

  /**
   * Clear all entities (for testing)
   */
  clear(): void {
    this.entities.clear()
  }
}
