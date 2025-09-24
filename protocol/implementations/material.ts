/**
 * @fileoverview Material entity implementation with recycling classification
 * @description Complete Material model for managing waste materials with recycling and environmental classification
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { Material, BaseEntity } from '../specifications/entities';
import { Event } from '../specifications/entities';

/**
 * Material implementation with comprehensive recycling classification and environmental compliance
 */
export class MaterialModel implements Material {
  id: string;
  externalIds?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  name: string;
  code: string;
  category: 'waste' | 'recyclable' | 'organic' | 'hazardous' | 'electronic' | 'bulk' | 'construction';
  subcategory?: string;

  // Physical Properties
  physicalState: 'solid' | 'liquid' | 'gas' | 'sludge' | 'powder';
  density?: number; // kg/m³
  moistureContent?: number; // percentage
  particleSize?: string;
  color?: string;
  odor?: string;

  // Recycling and Processing
  recyclingClassification: {
    recyclable: boolean;
    recyclingMethod: 'mechanical' | 'chemical' | 'biological' | 'thermal' | 'manual' | 'none';
    recyclingEfficiency: number; // percentage 0-100
    contaminants?: string[];
    processingRequirements?: string[];
  };

  environmentalClassification: {
    hazardLevel: 'low' | 'medium' | 'high' | 'extreme';
    toxicity: 'none' | 'low' | 'medium' | 'high';
    leachability: 'none' | 'low' | 'medium' | 'high';
    environmentalImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
    carbonFootprint?: number; // kg CO2 per ton
  };

  // Regulatory Information
  regulatoryCodes: Array<{
    system: string; // EPA, RCRA, EU, etc.
    code: string;
    description: string;
    restrictions?: string[];
  }>;

  handlingRequirements: {
    storage: string[];
    transportation: string[];
    processing: string[];
    disposal: string[];
    safetyPrecautions: string[];
  };

  // Economic Information
  marketValue: {
    basePrice?: number; // per ton
    priceUnit: string;
    marketVolatility: 'low' | 'medium' | 'high';
    priceHistory?: Array<{
      date: string;
      price: number;
      source: string;
    }>;
  };

  // Processing Specifications
  processingSpecifications: {
    acceptedForms: string[];
    preprocessingRequirements?: string[];
    compatibleProcessingMethods: string[];
    outputProducts?: string[];
    qualityStandards: Array<{
      parameter: string;
      minValue?: number;
      maxValue?: number;
      unit: string;
      testMethod: string;
    }>;
  };

  // Compliance and Certification
  certifications: string[];
  complianceDocuments: Array<{
    documentType: string;
    documentNumber: string;
    issuingAuthority: string;
    validFrom: string;
    validTo: string;
    status: 'active' | 'expired' | 'pending' | 'revoked';
  }>;

  private static readonly VALID_CATEGORIES: Material['category'][] = [
    'waste', 'recyclable', 'organic', 'hazardous', 'electronic', 'bulk', 'construction'
  ];

  private static readonly VALID_PHYSICAL_STATES: Material['physicalState'][] = [
    'solid', 'liquid', 'gas', 'sludge', 'powder'
  ];

  private static readonly VALID_RECYCLING_METHODS: Material['recyclingClassification']['recyclingMethod'][] = [
    'mechanical', 'chemical', 'biological', 'thermal', 'manual', 'none'
  ];

  private static readonly VALID_HAZARD_LEVELS: Material['environmentalClassification']['hazardLevel'][] = [
    'low', 'medium', 'high', 'extreme'
  ];

  private static readonly VALID_TOXICITY_LEVELS: Material['environmentalClassification']['toxicity'][] = [
    'none', 'low', 'medium', 'high'
  ];

  private static readonly VALID_ENVIRONMENTAL_IMPACTS: Material['environmentalClassification']['environmentalImpact'][] = [
    'minimal', 'moderate', 'significant', 'severe'
  ];

  private static readonly VALID_MARKET_VOLATILITY: Material['marketValue']['marketVolatility'][] = [
    'low', 'medium', 'high'
  ];

  constructor(data: Partial<Material>) {
    this.validateAndAssign(data);
  }

  /**
   * Create a new material with validation
   */
  static create(data: Omit<Material, keyof BaseEntity | 'createdAt' | 'updatedAt' | 'version'>): MaterialModel {
    const now = new Date();
    const materialData: Partial<Material> = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        ...data.metadata,
        createdBy: 'system',
        source: 'material_system'
      }
    };

    return new MaterialModel(materialData);
  }

  /**
   * Update material with optimistic locking
   */
  update(updates: Partial<Omit<Material, keyof BaseEntity>>, expectedVersion: number): MaterialModel {
    if (this.version !== expectedVersion) {
      throw new Error(`Version conflict. Expected: ${expectedVersion}, Current: ${this.version}`);
    }

    const updatedData: Partial<Material> = {
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

    return new MaterialModel(updatedData);
  }

  /**
   * Validate and assign material data
   */
  private validateAndAssign(data: Partial<Material>): void {
    // Required fields validation
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Material name is required and must be a string');
    }

    if (!data.code || typeof data.code !== 'string') {
      throw new Error('Material code is required and must be a string');
    }

    if (!data.category || !MaterialModel.VALID_CATEGORIES.includes(data.category)) {
      throw new Error(`Category must be one of: ${MaterialModel.VALID_CATEGORIES.join(', ')}`);
    }

    if (!data.physicalState || !MaterialModel.VALID_PHYSICAL_STATES.includes(data.physicalState)) {
      throw new Error(`Physical state must be one of: ${MaterialModel.VALID_PHYSICAL_STATES.join(', ')}`);
    }

    // Validate recycling classification
    if (!data.recyclingClassification) {
      throw new Error('Recycling classification is required');
    }

    if (typeof data.recyclingClassification.recyclable !== 'boolean') {
      throw new Error('Recyclable must be a boolean');
    }

    if (!MaterialModel.VALID_RECYCLING_METHODS.includes(data.recyclingClassification.recyclingMethod)) {
      throw new Error(`Recycling method must be one of: ${MaterialModel.VALID_RECYCLING_METHODS.join(', ')}`);
    }

    if (data.recyclingClassification.recyclingEfficiency < 0 || data.recyclingClassification.recyclingEfficiency > 100) {
      throw new Error('Recycling efficiency must be between 0 and 100');
    }

    // Validate environmental classification
    if (!data.environmentalClassification) {
      throw new Error('Environmental classification is required');
    }

    if (!MaterialModel.VALID_HAZARD_LEVELS.includes(data.environmentalClassification.hazardLevel)) {
      throw new Error(`Hazard level must be one of: ${MaterialModel.VALID_HAZARD_LEVELS.join(', ')}`);
    }

    if (!MaterialModel.VALID_TOXICITY_LEVELS.includes(data.environmentalClassification.toxicity)) {
      throw new Error(`Toxicity must be one of: ${MaterialModel.VALID_TOXICITY_LEVELS.join(', ')}`);
    }

    if (!MaterialModel.VALID_ENVIRONMENTAL_IMPACTS.includes(data.environmentalClassification.environmentalImpact)) {
      throw new Error(`Environmental impact must be one of: ${MaterialModel.VALID_ENVIRONMENTAL_IMPACTS.join(', ')}`);
    }

    // Validate density if provided
    if (data.density && (typeof data.density !== 'number' || data.density <= 0)) {
      throw new Error('Density must be a positive number');
    }

    // Validate moisture content if provided
    if (data.moistureContent && (typeof data.moistureContent !== 'number' || data.moistureContent < 0 || data.moistureContent > 100)) {
      throw new Error('Moisture content must be between 0 and 100');
    }

    // Validate market value
    if (!data.marketValue) {
      throw new Error('Market value information is required');
    }

    if (data.marketValue.basePrice && (typeof data.marketValue.basePrice !== 'number' || data.marketValue.basePrice < 0)) {
      throw new Error('Base price must be a non-negative number');
    }

    if (!data.marketValue.priceUnit || typeof data.marketValue.priceUnit !== 'string') {
      throw new Error('Price unit is required');
    }

    if (!MaterialModel.VALID_MARKET_VOLATILITY.includes(data.marketValue.marketVolatility)) {
      throw new Error(`Market volatility must be one of: ${MaterialModel.VALID_MARKET_VOLATILITY.join(', ')}`);
    }

    // Validate handling requirements
    if (!data.handlingRequirements) {
      throw new Error('Handling requirements are required');
    }

    if (!Array.isArray(data.handlingRequirements.storage) ||
        !Array.isArray(data.handlingRequirements.transportation) ||
        !Array.isArray(data.handlingRequirements.processing) ||
        !Array.isArray(data.handlingRequirements.disposal) ||
        !Array.isArray(data.handlingRequirements.safetyPrecautions)) {
      throw new Error('All handling requirement arrays must be provided');
    }

    // Validate processing specifications
    if (!data.processingSpecifications) {
      throw new Error('Processing specifications are required');
    }

    if (!Array.isArray(data.processingSpecifications.acceptedForms) || data.processingSpecifications.acceptedForms.length === 0) {
      throw new Error('At least one accepted form must be specified');
    }

    if (!Array.isArray(data.processingSpecifications.compatibleProcessingMethods) ||
        data.processingSpecifications.compatibleProcessingMethods.length === 0) {
      throw new Error('At least one compatible processing method must be specified');
    }

    // Validate quality standards if provided
    if (data.processingSpecifications.qualityStandards) {
      data.processingSpecifications.qualityStandards.forEach((standard, index) => {
        if (!standard.parameter || typeof standard.parameter !== 'string') {
          throw new Error(`Quality standard ${index}: parameter is required`);
        }

        if (standard.minValue !== undefined && standard.maxValue !== undefined && standard.minValue > standard.maxValue) {
          throw new Error(`Quality standard ${index}: min value cannot be greater than max value`);
        }

        if (!standard.unit || typeof standard.unit !== 'string') {
          throw new Error(`Quality standard ${index}: unit is required`);
        }

        if (!standard.testMethod || typeof standard.testMethod !== 'string') {
          throw new Error(`Quality standard ${index}: test method is required`);
        }
      });
    }

    // Validate certifications if provided
    if (data.certifications) {
      data.certifications.forEach((cert, index) => {
        if (typeof cert !== 'string' || cert.trim().length === 0) {
          throw new Error(`Certification ${index} must be a non-empty string`);
        }
      });
    }

    // Validate compliance documents if provided
    if (data.complianceDocuments) {
      data.complianceDocuments.forEach((doc, index) => {
        if (!doc.documentType || typeof doc.documentType !== 'string') {
          throw new Error(`Compliance document ${index}: document type is required`);
        }

        if (!doc.documentNumber || typeof doc.documentNumber !== 'string') {
          throw new Error(`Compliance document ${index}: document number is required`);
        }

        if (!doc.issuingAuthority || typeof doc.issuingAuthority !== 'string') {
          throw new Error(`Compliance document ${index}: issuing authority is required`);
        }

        if (!this.isValidDate(doc.validFrom)) {
          throw new Error(`Compliance document ${index}: valid from date must be valid`);
        }

        if (!this.isValidDate(doc.validTo)) {
          throw new Error(`Compliance document ${index}: valid to date must be valid`);
        }

        if (new Date(doc.validFrom) >= new Date(doc.validTo)) {
          throw new Error(`Compliance document ${index}: valid from date must be before valid to date`);
        }

        if (!['active', 'expired', 'pending', 'revoked'].includes(doc.status)) {
          throw new Error(`Compliance document ${index}: status must be active, expired, pending, or revoked`);
        }
      });
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
   * Update recycling classification
   */
  updateRecyclingClassification(updates: Partial<Material['recyclingClassification']>): MaterialModel {
    const newClassification = { ...this.recyclingClassification, ...updates };

    if (newClassification.recyclingEfficiency < 0 || newClassification.recyclingEfficiency > 100) {
      throw new Error('Recycling efficiency must be between 0 and 100');
    }

    return this.update({ recyclingClassification: newClassification }, this.version);
  }

  /**
   * Update environmental classification
   */
  updateEnvironmentalClassification(updates: Partial<Material['environmentalClassification']>): MaterialModel {
    const newClassification = { ...this.environmentalClassification, ...updates };

    if (newClassification.carbonFootprint && newClassification.carbonFootprint < 0) {
      throw new Error('Carbon footprint must be non-negative');
    }

    return this.update({ environmentalClassification: newClassification }, this.version);
  }

  /**
   * Add regulatory code
   */
  addRegulatoryCode(regulatoryCode: Omit<Material['regulatoryCodes'][0], 'system' | 'code'> & { system: string; code: string }): MaterialModel {
    if (!regulatoryCode.system || typeof regulatoryCode.system !== 'string') {
      throw new Error('Regulatory system is required');
    }

    if (!regulatoryCode.code || typeof regulatoryCode.code !== 'string') {
      throw new Error('Regulatory code is required');
    }

    const newCode = {
      system: regulatoryCode.system,
      code: regulatoryCode.code,
      description: regulatoryCode.description,
      restrictions: regulatoryCode.restrictions
    };

    const newCodes = [...this.regulatoryCodes, newCode];
    return this.update({ regulatoryCodes: newCodes }, this.version);
  }

  /**
   * Remove regulatory code
   */
  removeRegulatoryCode(system: string, code: string): MaterialModel {
    const newCodes = this.regulatoryCodes.filter(rc => !(rc.system === system && rc.code === code));
    return this.update({ regulatoryCodes: newCodes }, this.version);
  }

  /**
   * Update market value
   */
  updateMarketValue(updates: Partial<Material['marketValue']>): MaterialModel {
    const newMarketValue = { ...this.marketValue, ...updates };

    if (newMarketValue.basePrice && newMarketValue.basePrice < 0) {
      throw new Error('Base price must be non-negative');
    }

    if (!MaterialModel.VALID_MARKET_VOLATILITY.includes(newMarketValue.marketVolatility)) {
      throw new Error(`Market volatility must be one of: ${MaterialModel.VALID_MARKET_VOLATILITY.join(', ')}`);
    }

    return this.update({ marketValue: newMarketValue }, this.version);
  }

  /**
   * Add price history entry
   */
  addPriceHistoryEntry(price: number, source: string): MaterialModel {
    const priceEntry = {
      date: new Date().toISOString().split('T')[0],
      price,
      source
    };

    const newPriceHistory = [...(this.marketValue.priceHistory || []), priceEntry];
    const updatedMarketValue = { ...this.marketValue, priceHistory: newPriceHistory };

    return this.update({ marketValue: updatedMarketValue }, this.version);
  }

  /**
   * Add certification
   */
  addCertification(certification: string): MaterialModel {
    if (!certification || typeof certification !== 'string') {
      throw new Error('Certification must be a non-empty string');
    }

    if (this.certifications.includes(certification)) {
      throw new Error('Certification already exists');
    }

    const newCertifications = [...this.certifications, certification];
    return this.update({ certifications: newCertifications }, this.version);
  }

  /**
   * Remove certification
   */
  removeCertification(certification: string): MaterialModel {
    const newCertifications = this.certifications.filter(cert => cert !== certification);
    return this.update({ certifications: newCertifications }, this.version);
  }

  /**
   * Add compliance document
   */
  addComplianceDocument(document: Omit<Material['complianceDocuments'][0], 'validFrom' | 'validTo'> & { validFrom: string; validTo: string }): MaterialModel {
    const newDocument = {
      ...document,
      validFrom: document.validFrom,
      validTo: document.validTo
    };

    const newDocuments = [...this.complianceDocuments, newDocument];
    return this.update({ complianceDocuments: newDocuments }, this.version);
  }

  /**
   * Remove compliance document
   */
  removeComplianceDocument(documentNumber: string): MaterialModel {
    const newDocuments = this.complianceDocuments.filter(doc => doc.documentNumber !== documentNumber);
    return this.update({ complianceDocuments: newDocuments }, this.version);
  }

  /**
   * Check if material is recyclable
   */
  isRecyclable(): boolean {
    return this.recyclingClassification.recyclable &&
           this.recyclingClassification.recyclingMethod !== 'none';
  }

  /**
   * Check if material is hazardous
   */
  isHazardous(): boolean {
    return this.environmentalClassification.hazardLevel === 'high' ||
           this.environmentalClassification.hazardLevel === 'extreme' ||
           this.environmentalClassification.toxicity === 'high';
  }

  /**
   * Get recycling efficiency score
   */
  getRecyclingEfficiencyScore(): number {
    if (!this.isRecyclable()) return 0;

    let score = this.recyclingClassification.recyclingEfficiency;

    // Adjust based on environmental impact
    if (this.environmentalClassification.environmentalImpact === 'significant') {
      score *= 0.8; // 20% reduction
    } else if (this.environmentalClassification.environmentalImpact === 'severe') {
      score *= 0.6; // 40% reduction
    }

    // Adjust based on contaminants
    if (this.recyclingClassification.contaminants &&
        this.recyclingClassification.contaminants.length > 0) {
      score *= 0.9; // 10% reduction per contaminant type
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Get environmental impact score
   */
  getEnvironmentalImpactScore(): number {
    const hazardScore = { 'low': 1, 'medium': 2, 'high': 3, 'extreme': 4 }[this.environmentalClassification.hazardLevel];
    const toxicityScore = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3 }[this.environmentalClassification.toxicity];
    const impactScore = { 'minimal': 1, 'moderate': 2, 'significant': 3, 'severe': 4 }[this.environmentalClassification.environmentalImpact];

    const totalScore = (hazardScore + toxicityScore + impactScore) / 3;

    // Adjust based on carbon footprint if available
    if (this.environmentalClassification.carbonFootprint) {
      if (this.environmentalClassification.carbonFootprint > 1000) {
        return Math.min(10, totalScore + 2); // High carbon footprint increases score
      } else if (this.environmentalClassification.carbonFootprint < 100) {
        return Math.max(1, totalScore - 1); // Low carbon footprint decreases score
      }
    }

    return Math.max(1, Math.round(totalScore));
  }

  /**
   * Get material quality score
   */
  getQualityScore(): number {
    let score = 100;

    // Reduce score based on contaminants
    if (this.recyclingClassification.contaminants &&
        this.recyclingClassification.contaminants.length > 0) {
      score -= this.recyclingClassification.contaminants.length * 10;
    }

    // Reduce score based on environmental impact
    const impactScore = this.getEnvironmentalImpactScore();
    if (impactScore > 3) {
      score -= (impactScore - 3) * 5;
    }

    // Reduce score based on physical state
    if (this.physicalState === 'liquid' || this.physicalState === 'gas') {
      score -= 10; // More difficult to handle
    }

    // Reduce score based on moisture content
    if (this.moistureContent && this.moistureContent > 20) {
      score -= (this.moistureContent - 20) * 0.5;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Check if material meets quality standards
   */
  meetsQualityStandards(testResults: Record<string, number>): { meetsStandards: boolean; issues: string[] } {
    const issues: string[] = [];

    this.processingSpecifications.qualityStandards.forEach(standard => {
      const result = testResults[standard.parameter];

      if (result === undefined) {
        issues.push(`Missing test result for ${standard.parameter}`);
        return;
      }

      if (standard.minValue !== undefined && result < standard.minValue) {
        issues.push(`${standard.parameter} (${result}${standard.unit}) below minimum (${standard.minValue}${standard.unit})`);
      }

      if (standard.maxValue !== undefined && result > standard.maxValue) {
        issues.push(`${standard.parameter} (${result}${standard.unit}) above maximum (${standard.maxValue}${standard.unit})`);
      }
    });

    return {
      meetsStandards: issues.length === 0,
      issues
    };
  }

  /**
   * Get material summary for reporting
   */
  getSummary(): Record<string, any> {
    const activeComplianceDocs = this.complianceDocuments.filter(doc => doc.status === 'active').length;

    return {
      id: this.id,
      name: this.name,
      code: this.code,
      category: this.category,
      subcategory: this.subcategory,
      isRecyclable: this.isRecyclable(),
      isHazardous: this.isHazardous(),
      recyclingEfficiency: this.getRecyclingEfficiencyScore(),
      environmentalImpactScore: this.getEnvironmentalImpactScore(),
      qualityScore: this.getQualityScore(),
      physicalState: this.physicalState,
      density: this.density,
      moistureContent: this.moistureContent,
      marketValue: this.marketValue.basePrice,
      priceUnit: this.marketValue.priceUnit,
      marketVolatility: this.marketValue.marketVolatility,
      recyclingMethod: this.recyclingClassification.recyclingMethod,
      hazardLevel: this.environmentalClassification.hazardLevel,
      toxicity: this.environmentalClassification.toxicity,
      regulatoryCodesCount: this.regulatoryCodes.length,
      certificationsCount: this.certifications.length,
      activeComplianceDocuments: activeComplianceDocs,
      carbonFootprint: this.environmentalClassification.carbonFootprint
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Material {
    return {
      id: this.id,
      externalIds: this.externalIds,
      name: this.name,
      code: this.code,
      category: this.category,
      subcategory: this.subcategory,
      physicalState: this.physicalState,
      density: this.density,
      moistureContent: this.moistureContent,
      particleSize: this.particleSize,
      color: this.color,
      odor: this.odor,
      recyclingClassification: this.recyclingClassification,
      environmentalClassification: this.environmentalClassification,
      regulatoryCodes: this.regulatoryCodes,
      handlingRequirements: this.handlingRequirements,
      marketValue: this.marketValue,
      processingSpecifications: this.processingSpecifications,
      certifications: this.certifications,
      complianceDocuments: this.complianceDocuments,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }

  /**
   * Convert to event data for event streaming
   */
  toEventData(): Partial<Material> {
    const { id, createdAt, updatedAt, version, ...eventData } = this.toJSON();
    return eventData;
  }

  /**
   * Create domain event for material changes
   */
  createEvent(eventType: 'created' | 'updated' | 'completed' | 'cancelled'): Event {
    return {
      id: uuidv4(),
      entityType: 'material',
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

    // Business rule: Recyclable materials should have high efficiency
    if (this.isRecyclable() && this.recyclingClassification.recyclingEfficiency < 50) {
      errors.push('Recyclable materials should have at least 50% recycling efficiency');
    }

    // Business rule: Hazardous materials should have proper regulatory codes
    if (this.isHazardous() && this.regulatoryCodes.length === 0) {
      errors.push('Hazardous materials must have regulatory codes');
    }

    // Business rule: Materials with high environmental impact should have compliance documents
    if (this.getEnvironmentalImpactScore() > 3 && this.complianceDocuments.length === 0) {
      errors.push('High environmental impact materials should have compliance documentation');
    }

    // Business rule: Materials with market value should have price history
    if (this.marketValue.basePrice && this.marketValue.basePrice > 0 &&
        (!this.marketValue.priceHistory || this.marketValue.priceHistory.length === 0)) {
      errors.push('Materials with market value should have price history tracking');
    }

    // Business rule: Materials requiring special handling should have detailed requirements
    if (this.isHazardous() &&
        (this.handlingRequirements.storage.length === 0 ||
         this.handlingRequirements.safetyPrecautions.length === 0)) {
      errors.push('Hazardous materials must have detailed handling and safety requirements');
    }

    // Business rule: Materials with quality standards should have test methods
    if (this.processingSpecifications.qualityStandards.length > 0 &&
        this.processingSpecifications.qualityStandards.some(std => !std.testMethod)) {
      errors.push('All quality standards must specify test methods');
    }

    // Business rule: High carbon footprint materials should be recyclable
    if (this.environmentalClassification.carbonFootprint &&
        this.environmentalClassification.carbonFootprint > 500 &&
        !this.isRecyclable()) {
      errors.push('High carbon footprint materials should be recyclable to reduce environmental impact');
    }

    return errors;
  }
}

/**
 * Material factory for creating materials from legacy data
 */
export class MaterialFactory {
  /**
   * Create material from legacy system data
   */
  static fromLegacyData(legacyData: Record<string, any>): MaterialModel {
    // Data archaeology: Handle various legacy field names and formats
    const mappedData: Partial<Material> = {
      externalIds: [legacyData.material_id || legacyData.MATERIAL_ID || legacyData.code || legacyData.id],
      name: legacyData.material_name || legacyData.MATERIAL_NAME || legacyData.name || 'Unknown',
      code: legacyData.material_code || legacyData.MATERIAL_CODE || legacyData.code,
      category: this.mapLegacyCategory(legacyData.category || legacyData.CATEGORY || 'waste'),
      subcategory: legacyData.subcategory || legacyData.SUBCATEGORY,
      physicalState: this.mapLegacyPhysicalState(legacyData.physical_state || legacyData.state || 'solid'),
      density: legacyData.density || legacyData.DENSITY,
      moistureContent: legacyData.moisture_content || legacyData.MOISTURE_CONTENT || legacyData.moisture,
      particleSize: legacyData.particle_size || legacyData.PARTICLE_SIZE,
      color: legacyData.color || legacyData.COLOR,
      odor: legacyData.odor || legacyData.ODOR,
      recyclingClassification: this.mapLegacyRecyclingClassification(legacyData),
      environmentalClassification: this.mapLegacyEnvironmentalClassification(legacyData),
      regulatoryCodes: this.mapLegacyRegulatoryCodes(legacyData),
      handlingRequirements: this.mapLegacyHandlingRequirements(legacyData),
      marketValue: this.mapLegacyMarketValue(legacyData),
      processingSpecifications: this.mapLegacyProcessingSpecifications(legacyData),
      certifications: this.mapLegacyCertifications(legacyData),
      complianceDocuments: this.mapLegacyComplianceDocuments(legacyData),
      metadata: {
        legacySystemId: legacyData.system_id || 'legacy',
        originalFieldNames: Object.keys(legacyData),
        transformationNotes: 'Migrated from legacy material classification system',
        syncStatus: 'migrated',
        lastSyncDate: new Date().toISOString(),
        materialData: {
          sourceRegion: legacyData.source_region,
          supplierId: legacyData.supplier_id,
          grade: legacyData.grade,
          purity: legacyData.purity
        }
      }
    };

    return MaterialModel.create(mappedData as any);
  }

  /**
   * Map legacy category
   */
  private static mapLegacyCategory(legacyCategory: string): Material['category'] {
    const categoryMap: Record<string, Material['category']> = {
      'waste': 'waste',
      'recyclable': 'recyclable',
      'organic': 'organic',
      'hazardous': 'hazardous',
      'electronic': 'electronic',
      'bulk': 'bulk',
      'construction': 'construction',
      'e_waste': 'electronic',
      'bio_waste': 'organic',
      'mixed_waste': 'waste'
    };

    return categoryMap[legacyCategory.toLowerCase()] || 'waste';
  }

  /**
   * Map legacy physical state
   */
  private static mapLegacyPhysicalState(legacyState: string): Material['physicalState'] {
    const stateMap: Record<string, Material['physicalState']> = {
      'solid': 'solid',
      'liquid': 'liquid',
      'gas': 'gas',
      'sludge': 'sludge',
      'powder': 'powder'
    };

    return stateMap[legacyState.toLowerCase()] || 'solid';
  }

  /**
   * Map legacy recycling classification
   */
  private static mapLegacyRecyclingClassification(legacyData: Record<string, any>): Material['recyclingClassification'] {
    return {
      recyclable: legacyData.recyclable !== undefined ? legacyData.recyclable : true,
      recyclingMethod: this.mapLegacyRecyclingMethod(legacyData.recycling_method || legacyData.method || 'mechanical'),
      recyclingEfficiency: legacyData.recycling_efficiency || legacyData.efficiency || 75,
      contaminants: legacyData.contaminants || [],
      processingRequirements: legacyData.processing_requirements || []
    };
  }

  /**
   * Map legacy recycling method
   */
  private static mapLegacyRecyclingMethod(legacyMethod: string): Material['recyclingClassification']['recyclingMethod'] {
    const methodMap: Record<string, Material['recyclingClassification']['recyclingMethod']> = {
      'mechanical': 'mechanical',
      'chemical': 'chemical',
      'biological': 'biological',
      'thermal': 'thermal',
      'manual': 'manual',
      'none': 'none'
    };

    return methodMap[legacyMethod.toLowerCase()] || 'mechanical';
  }

  /**
   * Map legacy environmental classification
   */
  private static mapLegacyEnvironmentalClassification(legacyData: Record<string, any>): Material['environmentalClassification'] {
    return {
      hazardLevel: this.mapLegacyHazardLevel(legacyData.hazard_level || legacyData.hazard || 'low'),
      toxicity: this.mapLegacyToxicity(legacyData.toxicity || 'none'),
      leachability: this.mapLegacyLeachability(legacyData.leachability || 'none'),
      environmentalImpact: this.mapLegacyEnvironmentalImpact(legacyData.environmental_impact || legacyData.impact || 'moderate'),
      carbonFootprint: legacyData.carbon_footprint || legacyData.CARBON_FOOTPRINT
    };
  }

  /**
   * Map legacy hazard level
   */
  private static mapLegacyHazardLevel(legacyHazard: string): Material['environmentalClassification']['hazardLevel'] {
    const hazardMap: Record<string, Material['environmentalClassification']['hazardLevel']> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'extreme': 'extreme',
      '1': 'low',
      '2': 'medium',
      '3': 'high',
      '4': 'extreme'
    };

    return hazardMap[legacyHazard.toLowerCase()] || 'low';
  }

  /**
   * Map legacy toxicity
   */
  private static mapLegacyToxicity(legacyToxicity: string): Material['environmentalClassification']['toxicity'] {
    const toxicityMap: Record<string, Material['environmentalClassification']['toxicity']> = {
      'none': 'none',
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'non_toxic': 'none'
    };

    return toxicityMap[legacyToxicity.toLowerCase()] || 'none';
  }

  /**
   * Map legacy leachability
   */
  private static mapLegacyLeachability(legacyLeachability: string): Material['environmentalClassification']['leachability'] {
    const leachabilityMap: Record<string, Material['environmentalClassification']['leachability']> = {
      'none': 'none',
      'low': 'low',
      'medium': 'medium',
      'high': 'high'
    };

    return leachabilityMap[legacyLeachability.toLowerCase()] || 'none';
  }

  /**
   * Map legacy environmental impact
   */
  private static mapLegacyEnvironmentalImpact(legacyImpact: string): Material['environmentalClassification']['environmentalImpact'] {
    const impactMap: Record<string, Material['environmentalClassification']['environmentalImpact']> = {
      'minimal': 'minimal',
      'moderate': 'moderate',
      'significant': 'significant',
      'severe': 'severe',
      'low': 'minimal',
      'high': 'significant'
    };

    return impactMap[legacyImpact.toLowerCase()] || 'moderate';
  }

  /**
   * Map legacy regulatory codes
   */
  private static mapLegacyRegulatoryCodes(legacyData: Record<string, any>): Material['regulatoryCodes'] {
    if (!legacyData.regulatory_codes && !legacyData.codes) {
      return [];
    }

    const codesData = legacyData.regulatory_codes || legacyData.codes || [];

    if (Array.isArray(codesData)) {
      return codesData.map((code: any) => ({
        system: code.system || code.regulatory_system || 'EPA',
        code: code.code || code.regulatory_code || 'Unknown',
        description: code.description || 'No description available',
        restrictions: code.restrictions || []
      }));
    }

    return [];
  }

  /**
   * Map legacy handling requirements
   */
  private static mapLegacyHandlingRequirements(legacyData: Record<string, any>): Material['handlingRequirements'] {
    return {
      storage: legacyData.storage_requirements || legacyData.storage || [],
      transportation: legacyData.transportation_requirements || legacyData.transportation || [],
      processing: legacyData.processing_requirements || legacyData.processing || [],
      disposal: legacyData.disposal_requirements || legacyData.disposal || [],
      safetyPrecautions: legacyData.safety_precautions || legacyData.safety || []
    };
  }

  /**
   * Map legacy market value
   */
  private static mapLegacyMarketValue(legacyData: Record<string, any>): Material['marketValue'] {
    return {
      basePrice: legacyData.market_price || legacyData.price || legacyData.base_price,
      priceUnit: legacyData.price_unit || 'per_ton',
      marketVolatility: this.mapLegacyMarketVolatility(legacyData.market_volatility || legacyData.volatility || 'medium'),
      priceHistory: this.mapLegacyPriceHistory(legacyData.price_history || legacyData.history || [])
    };
  }

  /**
   * Map legacy market volatility
   */
  private static mapLegacyMarketVolatility(legacyVolatility: string): Material['marketValue']['marketVolatility'] {
    const volatilityMap: Record<string, Material['marketValue']['marketVolatility']> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'stable': 'low',
      'volatile': 'high'
    };

    return volatilityMap[legacyVolatility.toLowerCase()] || 'medium';
  }

  /**
   * Map legacy price history
   */
  private static mapLegacyPriceHistory(priceHistory: any[]): Material['marketValue']['priceHistory'] {
    if (!Array.isArray(priceHistory)) return [];

    return priceHistory.map((entry: any) => ({
      date: entry.date || new Date().toISOString().split('T')[0],
      price: entry.price || 0,
      source: entry.source || 'Legacy System'
    }));
  }

  /**
   * Map legacy processing specifications
   */
  private static mapLegacyProcessingSpecifications(legacyData: Record<string, any>): Material['processingSpecifications'] {
    return {
      acceptedForms: legacyData.accepted_forms || legacyData.forms || ['raw'],
      preprocessingRequirements: legacyData.preprocessing_requirements || legacyData.preprocessing || [],
      compatibleProcessingMethods: legacyData.compatible_methods || legacyData.methods || ['mechanical'],
      outputProducts: legacyData.output_products || legacyData.outputs || [],
      qualityStandards: this.mapLegacyQualityStandards(legacyData.quality_standards || legacyData.standards || [])
    };
  }

  /**
   * Map legacy quality standards
   */
  private static mapLegacyQualityStandards(standards: any[]): Material['processingSpecifications']['qualityStandards'] {
    if (!Array.isArray(standards)) return [];

    return standards.map((standard: any) => ({
      parameter: standard.parameter || standard.name || 'Unknown',
      minValue: standard.min_value || standard.minimum,
      maxValue: standard.max_value || standard.maximum,
      unit: standard.unit || 'units',
      testMethod: standard.test_method || standard.method || 'Standard Test'
    }));
  }

  /**
   * Map legacy certifications
   */
  private static mapLegacyCertifications(legacyData: Record<string, any>): string[] {
    if (legacyData.certifications && Array.isArray(legacyData.certifications)) {
      return legacyData.certifications;
    }

    if (legacyData.certifications && typeof legacyData.certifications === 'string') {
      return legacyData.certifications.split(',').map((cert: string) => cert.trim());
    }

    return [];
  }

  /**
   * Map legacy compliance documents
   */
  private static mapLegacyComplianceDocuments(legacyData: Record<string, any>): Material['complianceDocuments'] {
    if (!legacyData.compliance_documents && !legacyData.documents) {
      return [];
    }

    const documentsData = legacyData.compliance_documents || legacyData.documents || [];

    if (Array.isArray(documentsData)) {
      return documentsData.map((doc: any) => ({
        documentType: doc.type || doc.document_type || 'Certification',
        documentNumber: doc.number || doc.document_number || 'Unknown',
        issuingAuthority: doc.authority || doc.issuing_authority || 'Unknown',
        validFrom: doc.valid_from || doc.from || new Date().toISOString().split('T')[0],
        validTo: doc.valid_to || doc.to || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: doc.status || 'active'
      }));
    }

    return [];
  }
}

/**
 * Material validator for external validation
 */
export class MaterialValidator {
  /**
   * Validate material data without creating instance
   */
  static validate(data: Partial<Material>): { isValid: boolean; errors: string[] } {
    try {
      new MaterialModel(data);
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
  static validateBusinessRules(material: MaterialModel): string[] {
    return material.validateBusinessRules();
  }
}

/**
 * Material management utilities
 */
export class MaterialManager {
  /**
   * Optimize material processing based on efficiency
   */
  static optimizeMaterialProcessing(materials: MaterialModel[]): MaterialModel[] {
    const optimizedMaterials = [...materials];

    // Sort by recycling efficiency (highest first)
    optimizedMaterials.sort((a, b) => b.getRecyclingEfficiencyScore() - a.getRecyclingEfficiencyScore());

    return optimizedMaterials;
  }

  /**
   * Get materials by environmental impact
   */
  static getMaterialsByEnvironmentalImpact(materials: MaterialModel[], impactLevel: 'low' | 'medium' | 'high' | 'extreme'): MaterialModel[] {
    return materials.filter(material => material.environmentalClassification.hazardLevel === impactLevel);
  }

  /**
   * Get recyclable materials
   */
  static getRecyclableMaterials(materials: MaterialModel[]): MaterialModel[] {
    return materials.filter(material => material.isRecyclable());
  }

  /**
   * Get hazardous materials
   */
  static getHazardousMaterials(materials: MaterialModel[]): MaterialModel[] {
    return materials.filter(material => material.isHazardous());
  }

  /**
   * Get material performance report
   */
  static getPerformanceReport(materials: MaterialModel[]): Record<string, any> {
    const recyclableMaterials = this.getRecyclableMaterials(materials);
    const hazardousMaterials = this.getHazardousMaterials(materials);

    const averageRecyclingEfficiency = materials.reduce((sum, material) =>
      sum + material.getRecyclingEfficiencyScore(), 0) / materials.length;

    const averageEnvironmentalImpact = materials.reduce((sum, material) =>
      sum + material.getEnvironmentalImpactScore(), 0) / materials.length;

    const averageQualityScore = materials.reduce((sum, material) =>
      sum + material.getQualityScore(), 0) / materials.length;

    const materialsByCategory = materials.reduce((acc, material) => {
      acc[material.category] = (acc[material.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const materialsByPhysicalState = materials.reduce((acc, material) => {
      acc[material.physicalState] = (acc[material.physicalState] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalMarketValue = materials.reduce((sum, material) =>
      sum + (material.marketValue.basePrice || 0), 0);

    return {
      totalMaterials: materials.length,
      recyclableMaterials: recyclableMaterials.length,
      hazardousMaterials: hazardousMaterials.length,
      averageRecyclingEfficiency: Math.round(averageRecyclingEfficiency * 100) / 100,
      averageEnvironmentalImpactScore: Math.round(averageEnvironmentalImpact * 100) / 100,
      averageQualityScore: Math.round(averageQualityScore * 100) / 100,
      totalMarketValue: Math.round(totalMarketValue * 100) / 100,
      materialsByCategory,
      materialsByPhysicalState,
      highImpactMaterials: this.getMaterialsByEnvironmentalImpact(materials, 'high').length +
                           this.getMaterialsByEnvironmentalImpact(materials, 'extreme').length
    };
  }

  /**
   * Check for material conflicts
   */
  static checkMaterialConflicts(materials: MaterialModel[]): string[] {
    const conflicts: string[] = [];

    materials.forEach(material => {
      if (material.isRecyclable() && material.getRecyclingEfficiencyScore() < 50) {
        conflicts.push(`Material ${material.name} (${material.code}) has low recycling efficiency`);
      }

      if (material.isHazardous() && material.regulatoryCodes.length === 0) {
        conflicts.push(`Hazardous material ${material.name} (${material.code}) missing regulatory codes`);
      }

      const businessRuleErrors = material.validateBusinessRules();
      conflicts.push(...businessRuleErrors.map(error => `${material.name} (${material.code}): ${error}`));
    });

    return conflicts;
  }

  /**
   * Get materials requiring attention
   */
  static getMaterialsRequiringAttention(materials: MaterialModel[]): Array<{ material: MaterialModel; reason: string; priority: 'low' | 'medium' | 'high' }> {
    const requiringAttention: Array<{ material: MaterialModel; reason: string; priority: 'low' | 'medium' | 'high' }> = [];

    materials.forEach(material => {
      if (material.isHazardous()) {
        requiringAttention.push({
          material,
          reason: 'Hazardous material requires special handling',
          priority: 'high'
        });
      }

      if (material.getQualityScore() < 60) {
        requiringAttention.push({
          material,
          reason: 'Material quality score is below acceptable threshold',
          priority: 'medium'
        });
      }

      if (material.getEnvironmentalImpactScore() > 3) {
        requiringAttention.push({
          material,
          reason: 'Material has high environmental impact',
          priority: 'medium'
        });
      }

      if (material.marketValue.basePrice &&
          material.marketValue.basePrice > 100 &&
          material.marketValue.marketVolatility === 'high') {
        requiringAttention.push({
          material,
          reason: 'High-value volatile material requires monitoring',
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
