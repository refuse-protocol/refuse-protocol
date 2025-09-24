/**
 * @fileoverview Data archaeology engine for legacy data analysis
 * @description Comprehensive data archaeology tools for analyzing and understanding legacy systems
 * @version 1.0.0
 */

import { Event } from '../specifications/entities';
import { DataArchaeologist } from '../tools/data-archaeologist';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Advanced Data Archaeology Engine
 * Provides comprehensive analysis of legacy systems and data structures
 */
export class AdvancedDataArchaeologyEngine {
  private archaeologist: DataArchaeologist;
  private analysisResults: Map<string, LegacySystemAnalysis> = new Map();
  private dataPatterns: Map<string, DataPattern[]> = new Map();
  private migrationStrategies: Map<string, MigrationStrategy> = new Map();

  constructor() {
    this.archaeologist = new DataArchaeologist();
  }

  /**
   * Perform comprehensive legacy system analysis
   */
  async analyzeLegacySystem(sourcePath: string, options: AnalysisOptions = {}): Promise<LegacySystemAnalysis> {
    const analysis = await this.archaeologist.analyzeLegacySystem({
      sourcePath,
      analysisType: 'comprehensive',
      includeMetadata: true,
      detectPatterns: true,
      analyzeDependencies: true,
      ...options
    });

    // Store the analysis result
    this.analysisResults.set(sourcePath, analysis);

    // Extract data patterns
    await this.extractDataPatterns(analysis);

    // Generate migration strategy
    await this.generateMigrationStrategy(analysis);

    return analysis;
  }

  /**
   * Generate data migration strategy
   */
  async generateMigrationStrategy(analysis: LegacySystemAnalysis): Promise<MigrationStrategy> {
    const strategy: MigrationStrategy = {
      id: `migration-${Date.now()}`,
      sourceSystem: analysis.systemInfo.name,
      targetSystem: 'REFUSE Protocol',
      analysisId: analysis.id,
      phases: [],
      totalComplexity: 0,
      riskLevel: 'medium',
      estimatedDuration: 0,
      createdAt: new Date()
    };

    // Analyze each data entity
    for (const entity of analysis.entities) {
      const phase = await this.createMigrationPhase(entity, analysis);
      strategy.phases.push(phase);
      strategy.totalComplexity += phase.complexity;
    }

    // Determine overall risk level
    strategy.riskLevel = this.calculateRiskLevel(strategy.totalComplexity);
    strategy.estimatedDuration = this.calculateEstimatedDuration(strategy.phases);

    // Store the strategy
    this.migrationStrategies.set(analysis.id, strategy);

    return strategy;
  }

  /**
   * Extract data patterns from analysis
   */
  private async extractDataPatterns(analysis: LegacySystemAnalysis): Promise<void> {
    const patterns: DataPattern[] = [];

    // Analyze entity relationships
    for (const entity of analysis.entities) {
      const entityPattern = await this.analyzeEntityPattern(entity, analysis);
      if (entityPattern) {
        patterns.push(entityPattern);
      }
    }

    // Analyze data quality issues
    const qualityPatterns = this.analyzeDataQualityPatterns(analysis);
    patterns.push(...qualityPatterns);

    // Analyze structural patterns
    const structuralPatterns = this.analyzeStructuralPatterns(analysis);
    patterns.push(...structuralPatterns);

    this.dataPatterns.set(analysis.id, patterns);
  }

  /**
   * Analyze entity pattern
   */
  private async analyzeEntityPattern(entity: EntityInfo, analysis: LegacySystemAnalysis): Promise<DataPattern | null> {
    // Detect common patterns like:
    // - Customer-Service relationships
    // - Route-Stop hierarchies
    // - Material-Classification patterns
    // - Time-based data patterns

    if (entity.name.toLowerCase().includes('customer') &&
        analysis.entities.some(e => e.name.toLowerCase().includes('service'))) {
      return {
        id: `pattern-${Date.now()}-${entity.name}`,
        type: 'entity_relationship',
        name: 'Customer-Service Pattern',
        description: 'Standard customer-service relationship detected',
        entities: [entity.name, 'Service'],
        confidence: 0.9,
        complexity: 'medium',
        migrationPriority: 'high',
        examples: [],
        metadata: {
          relationshipType: 'one-to-many',
          typicalRatio: '1:5'
        }
      };
    }

    if (entity.name.toLowerCase().includes('route') &&
        entity.properties.some(p => p.name.toLowerCase().includes('stop'))) {
      return {
        id: `pattern-${Date.now()}-${entity.name}`,
        type: 'hierarchical',
        name: 'Route-Stop Hierarchy',
        description: 'Hierarchical route structure with stops',
        entities: [entity.name],
        confidence: 0.8,
        complexity: 'medium',
        migrationPriority: 'high',
        examples: [],
        metadata: {
          hierarchyLevel: 2,
          estimatedStopsPerRoute: 15
        }
      };
    }

    return null;
  }

  /**
   * Analyze data quality patterns
   */
  private analyzeDataQualityPatterns(analysis: LegacySystemAnalysis): DataPattern[] {
    const patterns: DataPattern[] = [];

    // Check for missing data
    const entitiesWithMissingData = analysis.entities.filter(entity =>
      entity.properties.some(prop => !prop.required && prop.nullable)
    );

    if (entitiesWithMissingData.length > 0) {
      patterns.push({
        id: `quality-missing-${Date.now()}`,
        type: 'data_quality',
        name: 'Missing Data Pattern',
        description: `${entitiesWithMissingData.length} entities have optional nullable fields`,
        entities: entitiesWithMissingData.map(e => e.name),
        confidence: 0.7,
        complexity: 'low',
        migrationPriority: 'medium',
        examples: [],
        metadata: {
          issueType: 'missing_data',
          affectedEntities: entitiesWithMissingData.length
        }
      });
    }

    // Check for inconsistent naming
    const inconsistentNaming = this.detectInconsistentNaming(analysis);
    if (inconsistentNaming.length > 0) {
      patterns.push({
        id: `quality-naming-${Date.now()}`,
        type: 'data_quality',
        name: 'Inconsistent Naming Pattern',
        description: 'Inconsistent field naming conventions detected',
        entities: inconsistentNaming,
        confidence: 0.8,
        complexity: 'low',
        migrationPriority: 'high',
        examples: [],
        metadata: {
          issueType: 'naming_convention',
          patterns: ['camelCase', 'snake_case', 'PascalCase']
        }
      });
    }

    return patterns;
  }

  /**
   * Analyze structural patterns
   */
  private analyzeStructuralPatterns(analysis: LegacySystemAnalysis): DataPattern[] {
    const patterns: DataPattern[] = [];

    // Detect array/JSON fields
    const jsonFields = analysis.entities.flatMap(entity =>
      entity.properties.filter(prop =>
        prop.dataType === 'object' ||
        prop.dataType === 'array' ||
        prop.name.toLowerCase().includes('json')
      )
    );

    if (jsonFields.length > 0) {
      patterns.push({
        id: `structural-json-${Date.now()}`,
        type: 'structural',
        name: 'JSON/Array Fields Pattern',
        description: `${jsonFields.length} entities contain JSON or array fields`,
        entities: [...new Set(jsonFields.map(f => f.entityName))],
        confidence: 0.9,
        complexity: 'high',
        migrationPriority: 'medium',
        examples: [],
        metadata: {
          fieldCount: jsonFields.length,
          fieldTypes: ['object', 'array', 'json']
        }
      });
    }

    return patterns;
  }

  /**
   * Detect inconsistent naming conventions
   */
  private detectInconsistentNaming(analysis: LegacySystemAnalysis): string[] {
    const entities: string[] = [];

    for (const entity of analysis.entities) {
      const namingPatterns = new Set<string>();

      for (const prop of entity.properties) {
        if (prop.name.includes('_')) namingPatterns.add('snake_case');
        if (prop.name.match(/[a-z][A-Z]/)) namingPatterns.add('camelCase');
        if (prop.name.match(/^[A-Z]/)) namingPatterns.add('PascalCase');
      }

      if (namingPatterns.size > 1) {
        entities.push(entity.name);
      }
    }

    return entities;
  }

  /**
   * Create migration phase for entity
   */
  private async createMigrationPhase(entity: EntityInfo, analysis: LegacySystemAnalysis): Promise<MigrationPhase> {
    const complexity = this.calculateEntityComplexity(entity);
    const dependencies = this.findEntityDependencies(entity, analysis);

    return {
      id: `phase-${entity.name.toLowerCase()}-${Date.now()}`,
      name: `${entity.name} Migration`,
      description: `Migrate ${entity.name} entity to REFUSE Protocol`,
      entity: entity.name,
      complexity,
      dependencies,
      estimatedDuration: this.calculatePhaseDuration(complexity),
      tasks: [
        `Analyze ${entity.name} structure`,
        'Map fields to REFUSE Protocol schema',
        'Transform data types',
        'Validate data integrity',
        'Create migration scripts'
      ],
      riskFactors: this.identifyRiskFactors(entity),
      status: 'planned'
    };
  }

  /**
   * Calculate entity complexity
   */
  private calculateEntityComplexity(entity: EntityInfo): 'low' | 'medium' | 'high' {
    const factorCount = entity.properties.length;
    const hasComplexFields = entity.properties.some(p =>
      p.dataType === 'object' || p.dataType === 'array' || p.dataType === 'json'
    );
    const hasRelationships = entity.relationships && entity.relationships.length > 0;

    if (factorCount > 20 || hasComplexFields || hasRelationships) {
      return 'high';
    } else if (factorCount > 10 || hasComplexFields) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Find entity dependencies
   */
  private findEntityDependencies(entity: EntityInfo, analysis: LegacySystemAnalysis): string[] {
    const dependencies: string[] = [];

    if (entity.relationships) {
      for (const relationship of entity.relationships) {
        if (relationship.type === 'many-to-one' || relationship.type === 'one-to-one') {
          dependencies.push(relationship.targetEntity);
        }
      }
    }

    return dependencies;
  }

  /**
   * Calculate phase duration
   */
  private calculatePhaseDuration(complexity: 'low' | 'medium' | 'high'): number {
    const baseHours = {
      low: 4,
      medium: 8,
      high: 16
    };

    return baseHours[complexity];
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(entity: EntityInfo): string[] {
    const risks: string[] = [];

    if (entity.properties.length > 20) {
      risks.push('High number of properties');
    }

    const complexFields = entity.properties.filter(p =>
      p.dataType === 'object' || p.dataType === 'array'
    );

    if (complexFields.length > 0) {
      risks.push('Complex field types requiring transformation');
    }

    if (!entity.properties.some(p => p.name.toLowerCase().includes('id'))) {
      risks.push('Missing primary identifier');
    }

    return risks;
  }

  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(totalComplexity: number): 'low' | 'medium' | 'high' {
    if (totalComplexity > 50) return 'high';
    if (totalComplexity > 25) return 'medium';
    return 'low';
  }

  /**
   * Calculate estimated duration
   */
  private calculateEstimatedDuration(phases: MigrationPhase[]): number {
    return phases.reduce((total, phase) => total + phase.estimatedDuration, 0);
  }

  /**
   * Generate data lineage report
   */
  generateDataLineageReport(analysis: LegacySystemAnalysis): DataLineageReport {
    const report: DataLineageReport = {
      id: `lineage-${Date.now()}`,
      systemName: analysis.systemInfo.name,
      analysisId: analysis.id,
      dataFlows: [],
      transformations: [],
      dependencies: [],
      generatedAt: new Date()
    };

    // Analyze data flows
    for (const entity of analysis.entities) {
      if (entity.relationships) {
        for (const relationship of entity.relationships) {
          report.dataFlows.push({
            source: relationship.sourceEntity,
            target: relationship.targetEntity,
            relationship: relationship.type,
            description: `${relationship.sourceEntity} ${relationship.type} ${relationship.targetEntity}`
          });
        }
      }
    }

    // Analyze transformations needed
    for (const entity of analysis.entities) {
      const transformations = this.identifyTransformationsNeeded(entity);
      report.transformations.push(...transformations);
    }

    return report;
  }

  /**
   * Identify transformations needed for entity
   */
  private identifyTransformationsNeeded(entity: EntityInfo): DataTransformation[] {
    const transformations: DataTransformation[] = [];

    for (const property of entity.properties) {
      if (property.dataType === 'string' && property.maxLength && property.maxLength > 255) {
        transformations.push({
          entity: entity.name,
          field: property.name,
          type: 'truncate',
          description: `Truncate ${property.name} to 255 characters`,
          parameters: { maxLength: 255 }
        });
      }

      if (property.dataType === 'object') {
        transformations.push({
          entity: entity.name,
          field: property.name,
          type: 'flatten',
          description: `Flatten ${property.name} object structure`,
          parameters: { flattenNested: true }
        });
      }

      if (property.name.includes('_') && property.name !== property.name.toLowerCase()) {
        transformations.push({
          entity: entity.name,
          field: property.name,
          type: 'rename',
          description: `Standardize field naming for ${property.name}`,
          parameters: {
            from: property.name,
            to: property.name.toLowerCase().replace(/_/g, '')
          }
        });
      }
    }

    return transformations;
  }

  /**
   * Generate archaeology report
   */
  generateArchaeologyReport(analysis: LegacySystemAnalysis): ArchaeologyReport {
    const patterns = this.dataPatterns.get(analysis.id) || [];
    const strategy = this.migrationStrategies.get(analysis.id);
    const lineage = this.generateDataLineageReport(analysis);

    return {
      id: `archaeology-${Date.now()}`,
      systemName: analysis.systemInfo.name,
      analysisId: analysis.id,
      summary: this.generateAnalysisSummary(analysis),
      patterns,
      migrationStrategy: strategy,
      dataLineage: lineage,
      recommendations: this.generateRecommendations(analysis, patterns),
      generatedAt: new Date()
    };
  }

  /**
   * Generate analysis summary
   */
  private generateAnalysisSummary(analysis: LegacySystemAnalysis): AnalysisSummary {
    const totalEntities = analysis.entities.length;
    const totalProperties = analysis.entities.reduce((sum, e) => sum + e.properties.length, 0);
    const totalRelationships = analysis.relationships.length;
    const totalFiles = analysis.fileStructure.totalFiles;

    return {
      systemOverview: `${analysis.systemInfo.name} v${analysis.systemInfo.version}`,
      totalEntities,
      totalProperties,
      totalRelationships,
      totalFiles,
      complexityScore: this.calculateComplexityScore(analysis),
      dataQuality: this.assessDataQuality(analysis),
      migrationFeasibility: this.assessMigrationFeasibility(analysis)
    };
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexityScore(analysis: LegacySystemAnalysis): number {
    const entityComplexity = analysis.entities.length * 2;
    const propertyComplexity = analysis.entities.reduce((sum, e) => sum + e.properties.length, 0);
    const relationshipComplexity = analysis.relationships.length * 3;
    const fileComplexity = analysis.fileStructure.totalFiles;

    return Math.min(100, (entityComplexity + propertyComplexity + relationshipComplexity + fileComplexity) / 10);
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(analysis: LegacySystemAnalysis): 'excellent' | 'good' | 'fair' | 'poor' {
    const missingDataEntities = analysis.entities.filter(e =>
      e.properties.some(p => !p.required && p.nullable)
    ).length;

    const qualityScore = (analysis.entities.length - missingDataEntities) / analysis.entities.length;

    if (qualityScore >= 0.9) return 'excellent';
    if (qualityScore >= 0.7) return 'good';
    if (qualityScore >= 0.5) return 'fair';
    return 'poor';
  }

  /**
   * Assess migration feasibility
   */
  private assessMigrationFeasibility(analysis: LegacySystemAnalysis): 'high' | 'medium' | 'low' {
    const complexityScore = this.calculateComplexityScore(analysis);
    const qualityScore = this.assessDataQuality(analysis);

    if (complexityScore < 30 && qualityScore === 'excellent') return 'high';
    if (complexityScore < 60 && ['excellent', 'good'].includes(qualityScore)) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(analysis: LegacySystemAnalysis, patterns: DataPattern[]): string[] {
    const recommendations: string[] = [];

    const qualityScore = this.assessDataQuality(analysis);
    if (qualityScore === 'poor' || qualityScore === 'fair') {
      recommendations.push('Improve data quality before migration - clean up missing and inconsistent data');
    }

    const complexPatterns = patterns.filter(p => p.complexity === 'high');
    if (complexPatterns.length > 0) {
      recommendations.push('Break down complex entities into smaller, manageable pieces');
    }

    const feasibility = this.assessMigrationFeasibility(analysis);
    if (feasibility === 'low') {
      recommendations.push('Consider phased migration approach starting with simpler entities');
    }

    if (analysis.entities.length > 20) {
      recommendations.push('Large number of entities detected - consider prioritizing core entities first');
    }

    return recommendations;
  }
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  analysisType?: 'basic' | 'comprehensive' | 'detailed';
  includeMetadata?: boolean;
  detectPatterns?: boolean;
  analyzeDependencies?: boolean;
  maxDepth?: number;
  excludePatterns?: string[];
}

/**
 * Data pattern
 */
export interface DataPattern {
  id: string;
  type: 'entity_relationship' | 'hierarchical' | 'structural' | 'data_quality';
  name: string;
  description: string;
  entities: string[];
  confidence: number;
  complexity: 'low' | 'medium' | 'high';
  migrationPriority: 'low' | 'medium' | 'high';
  examples: any[];
  metadata?: Record<string, any>;
}

/**
 * Migration strategy
 */
export interface MigrationStrategy {
  id: string;
  sourceSystem: string;
  targetSystem: string;
  analysisId: string;
  phases: MigrationPhase[];
  totalComplexity: number;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedDuration: number;
  createdAt: Date;
}

/**
 * Migration phase
 */
export interface MigrationPhase {
  id: string;
  name: string;
  description: string;
  entity: string;
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
  estimatedDuration: number;
  tasks: string[];
  riskFactors: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

/**
 * Data lineage report
 */
export interface DataLineageReport {
  id: string;
  systemName: string;
  analysisId: string;
  dataFlows: DataFlow[];
  transformations: DataTransformation[];
  dependencies: string[];
  generatedAt: Date;
}

/**
 * Data flow
 */
export interface DataFlow {
  source: string;
  target: string;
  relationship: string;
  description: string;
}

/**
 * Data transformation
 */
export interface DataTransformation {
  entity: string;
  field: string;
  type: 'truncate' | 'flatten' | 'rename' | 'convert' | 'validate';
  description: string;
  parameters: Record<string, any>;
}

/**
 * Analysis summary
 */
export interface AnalysisSummary {
  systemOverview: string;
  totalEntities: number;
  totalProperties: number;
  totalRelationships: number;
  totalFiles: number;
  complexityScore: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  migrationFeasibility: 'high' | 'medium' | 'low';
}

/**
 * Archaeology report
 */
export interface ArchaeologyReport {
  id: string;
  systemName: string;
  analysisId: string;
  summary: AnalysisSummary;
  patterns: DataPattern[];
  migrationStrategy?: MigrationStrategy;
  dataLineage: DataLineageReport;
  recommendations: string[];
  generatedAt: Date;
}

/**
 * Export factory functions
 */
export function createAdvancedDataArchaeologyEngine(): AdvancedDataArchaeologyEngine {
  return new AdvancedDataArchaeologyEngine();
}

// Export types
export type {
  AnalysisOptions,
  DataPattern,
  MigrationStrategy,
  MigrationPhase,
  DataLineageReport,
  DataFlow,
  DataTransformation,
  AnalysisSummary,
  ArchaeologyReport
};
