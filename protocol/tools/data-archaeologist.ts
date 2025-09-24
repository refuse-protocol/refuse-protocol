/**
 * @fileoverview Data archaeology tools for legacy system analysis
 * @description Comprehensive analysis tools for understanding legacy waste management data structures and patterns
 * @version 1.0.0
 */

import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, extname, basename, dirname } from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import { Event } from '../specifications/entities';

/**
 * REFUSE Protocol Data Archaeologist
 * Analyzes legacy waste management systems to understand data structures and migration patterns
 */
export class DataArchaeologist {
  private analysisResults: Map<string, LegacySystemAnalysis> = new Map();
  private patternMatchers: Map<string, DataPatternMatcher> = new Map();
  private migrationStrategies: Map<string, MigrationStrategy> = new Map();

  constructor(options: DataArchaeologistOptions = {}) {
    this.initializePatternMatchers();
    this.loadMigrationStrategies(options.strategiesDir);
  }

  /**
   * Perform comprehensive legacy system analysis
   */
  async analyzeLegacySystem(options: LegacySystemAnalysisOptions): Promise<LegacySystemAnalysis> {
    console.log(chalk.blue('🔍 Starting Legacy System Data Archaeology...'));

    const startTime = Date.now();
    const analysis: LegacySystemAnalysis = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      systemName: options.systemName || 'Unknown Legacy System',
      sourcePath: options.sourcePath || process.cwd(),
      analysis: {
        fileStructure: { files: [], directories: [], totalSize: 0 },
        dataFormats: { formats: [], schemaCount: 0 },
        entityMapping: { entities: [], relationships: [] },
        dataQuality: { issues: [], recommendations: [] },
        migrationComplexity: 'unknown'
      },
      patterns: [],
      recommendations: []
    };

    try {
      // Analyze file structure
      await this.analyzeFileStructure(options.sourcePath, analysis);

      // Analyze data formats and schemas
      await this.analyzeDataFormats(options.sourcePath, analysis);

      // Identify entities and relationships
      await this.identifyEntitiesAndRelationships(options.sourcePath, analysis);

      // Assess data quality
      await this.assessDataQuality(options.sourcePath, analysis);

      // Analyze migration complexity
      analysis.analysis.migrationComplexity = this.assessMigrationComplexity(analysis);

      // Generate migration patterns
      analysis.patterns = this.generateMigrationPatterns(analysis);

      // Generate recommendations
      analysis.recommendations = this.generateMigrationRecommendations(analysis);

      const totalTime = Date.now() - startTime;

      console.log(chalk.green(`✅ Legacy system analysis complete in ${totalTime}ms`));
      console.log(chalk.gray(`   Files analyzed: ${analysis.analysis.fileStructure.files.length}`));
      console.log(chalk.gray(`   Entities found: ${analysis.analysis.entityMapping.entities.length}`));
      console.log(chalk.gray(`   Migration complexity: ${analysis.analysis.migrationComplexity}`));

      return analysis;
    } catch (error) {
      console.error(chalk.red(`❌ Legacy system analysis failed: ${error instanceof Error ? error.message : String(error)}`));
      throw error;
    }
  }

  /**
   * Analyze file structure of legacy system
   */
  private async analyzeFileStructure(sourcePath: string, analysis: LegacySystemAnalysis): Promise<void> {
    console.log(chalk.gray('📁 Analyzing file structure...'));

    const fullPath = resolve(sourcePath);
    const stats = await this.getDirectoryStats(fullPath);

    analysis.analysis.fileStructure = {
      files: stats.files,
      directories: stats.directories,
      totalSize: stats.totalSize,
      fileTypes: this.categorizeFileTypes(stats.files),
      structureComplexity: this.calculateStructureComplexity(stats)
    };
  }

  /**
   * Analyze data formats and schemas
   */
  private async analyzeDataFormats(sourcePath: string, analysis: LegacySystemAnalysis): Promise<void> {
    console.log(chalk.gray('📊 Analyzing data formats...'));

    const fullPath = resolve(sourcePath);

    // Find potential data files
    const dataFiles = await glob('**/*.{json,csv,xml,sql,db,mdb,accdb,xls,xlsx}', {
      cwd: fullPath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    const formats: DataFormat[] = [];

    for (const file of dataFiles) {
      const filePath = join(fullPath, file);
      const content = readFileSync(filePath, 'utf8');
      const fileExtension = extname(file).toLowerCase();

      const format = await this.analyzeDataFormat(content, file, fileExtension);
      if (format) {
        formats.push(format);
      }
    }

    analysis.analysis.dataFormats = {
      formats,
      schemaCount: formats.filter(f => f.hasSchema).length,
      formatDistribution: this.calculateFormatDistribution(formats)
    };
  }

  /**
   * Identify entities and relationships
   */
  private async identifyEntitiesAndRelationships(sourcePath: string, analysis: LegacySystemAnalysis): Promise<void> {
    console.log(chalk.gray('🔗 Identifying entities and relationships...'));

    const fullPath = resolve(sourcePath);
    const entities: LegacyEntity[] = [];
    const relationships: EntityRelationship[] = [];

    // Analyze JSON schema files
    const schemaFiles = await glob('**/*schema*.json', { cwd: fullPath });
    for (const schemaFile of schemaFiles) {
      const schemaContent = readFileSync(join(fullPath, schemaFile), 'utf8');
      const schema = JSON.parse(schemaContent);

      const entityAnalysis = this.analyzeSchemaForEntities(schema, schemaFile);
      entities.push(...entityAnalysis.entities);
      relationships.push(...entityAnalysis.relationships);
    }

    // Analyze data files for entity patterns
    const dataFiles = await glob('**/*.{json,csv,xml}', { cwd: fullPath });
    for (const dataFile of dataFiles) {
      const dataContent = readFileSync(join(fullPath, dataFile), 'utf8');

      const dataAnalysis = this.analyzeDataForEntities(dataContent, dataFile);
      entities.push(...dataAnalysis.entities);
      relationships.push(...dataAnalysis.relationships);
    }

    analysis.analysis.entityMapping = {
      entities: this.deduplicateEntities(entities),
      relationships: this.deduplicateRelationships(relationships),
      confidence: this.calculateEntityConfidence(entities)
    };
  }

  /**
   * Assess data quality
   */
  private async assessDataQuality(sourcePath: string, analysis: LegacySystemAnalysis): Promise<void> {
    console.log(chalk.gray('✅ Assessing data quality...'));

    const fullPath = resolve(sourcePath);
    const issues: DataQualityIssue[] = [];
    const recommendations: string[] = [];

    // Check for common data quality issues
    const dataFiles = await glob('**/*.{json,csv,xml}', { cwd: fullPath });

    for (const file of dataFiles) {
      const filePath = join(fullPath, file);
      const content = readFileSync(filePath, 'utf8');

      const fileIssues = this.identifyDataQualityIssues(content, file);
      issues.push(...fileIssues);
    }

    // Generate recommendations based on issues found
    if (issues.some(issue => issue.severity === 'high')) {
      recommendations.push('Address high-severity data quality issues before migration');
    }

    if (issues.some(issue => issue.category === 'schema')) {
      recommendations.push('Standardize schema definitions across files');
    }

    if (issues.some(issue => issue.category === 'encoding')) {
      recommendations.push('Ensure consistent data encoding (UTF-8 recommended)');
    }

    analysis.analysis.dataQuality = {
      issues,
      recommendations,
      overallScore: this.calculateDataQualityScore(issues)
    };
  }

  /**
   * Analyze individual data format
   */
  private async analyzeDataFormat(content: string, fileName: string, extension: string): Promise<DataFormat | null> {
    const format: DataFormat = {
      type: this.mapExtensionToFormat(extension),
      fileName,
      size: content.length,
      hasSchema: false,
      encoding: 'unknown',
      structure: { type: 'unknown', fields: [] }
    };

    // Detect encoding
    format.encoding = this.detectEncoding(content);

    // Analyze structure based on format
    switch (format.type) {
      case 'json':
        return this.analyzeJSONFormat(content, format);
      case 'csv':
        return this.analyzeCSVFormat(content, format);
      case 'xml':
        return this.analyzeXMLFormat(content, format);
      default:
        return format;
    }
  }

  /**
   * Analyze JSON format
   */
  private analyzeJSONFormat(content: string, format: DataFormat): DataFormat {
    try {
      const json = JSON.parse(content);

      format.hasSchema = this.hasJSONSchema(json);
      format.structure = this.analyzeJSONStructure(json);

      return format;
    } catch (error) {
      format.structure = { type: 'invalid', error: 'Invalid JSON format' };
      return format;
    }
  }

  /**
   * Analyze CSV format
   */
  private analyzeCSVFormat(content: string, format: DataFormat): DataFormat {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return format;

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const sampleData = lines.slice(1, Math.min(6, lines.length));

    format.hasSchema = headers.length > 0;
    format.structure = {
      type: 'tabular',
      fields: headers.map(header => ({
        name: header,
        type: this.inferFieldType(sampleData, headers.indexOf(header)),
        required: true // Assume headers indicate required fields
      })),
      rowCount: lines.length - 1
    };

    return format;
  }

  /**
   * Analyze XML format
   */
  private analyzeXMLFormat(content: string, format: DataFormat): DataFormat {
    // Simple XML analysis - in production would use proper XML parser
    const hasRootElement = content.includes('<') && content.includes('>');
    const hasNestedElements = content.includes('</') && (content.match(/<[^/>]+>/g)?.length || 0) > 1;

    format.hasSchema = hasRootElement;
    format.structure = {
      type: 'hierarchical',
      fields: [],
      hasNestedStructure: hasNestedElements
    };

    return format;
  }

  /**
   * Analyze schema for entities
   */
  private analyzeSchemaForEntities(schema: any, fileName: string): { entities: LegacyEntity[]; relationships: EntityRelationship[] } {
    const entities: LegacyEntity[] = [];
    const relationships: EntityRelationship[] = [];

    if (schema.type === 'object' && schema.properties) {
      const entity: LegacyEntity = {
        id: uuidv4(),
        name: this.extractEntityName(fileName, schema),
        type: 'object',
        fields: Object.keys(schema.properties).map(fieldName => ({
          name: fieldName,
          type: this.mapJSONTypeToEntityType(schema.properties[fieldName]),
          required: schema.required?.includes(fieldName) || false,
          description: schema.properties[fieldName].description || ''
        })),
        sourceFile: fileName,
        confidence: this.calculateEntityConfidenceFromSchema(schema)
      };

      entities.push(entity);
    }

    return { entities, relationships };
  }

  /**
   * Analyze data for entities
   */
  private analyzeDataForEntities(content: string, fileName: string): { entities: LegacyEntity[]; relationships: EntityRelationship[] } {
    const entities: LegacyEntity[] = [];
    const relationships: EntityRelationship[] = [];

    try {
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        // Analyze array of records
        if (data.length > 0) {
          const firstRecord = data[0];
          if (typeof firstRecord === 'object' && firstRecord !== null) {
            const entity: LegacyEntity = {
              id: uuidv4(),
              name: this.extractEntityName(fileName),
              type: 'record',
              fields: Object.keys(firstRecord).map(fieldName => ({
                name: fieldName,
                type: this.inferFieldTypeFromData(firstRecord[fieldName]),
                required: true,
                description: ''
              })),
              sourceFile: fileName,
              confidence: 0.7
            };

            entities.push(entity);
          }
        }
      } else if (typeof data === 'object' && data !== null) {
        // Analyze single object
        const entity: LegacyEntity = {
          id: uuidv4(),
          name: this.extractEntityName(fileName),
          type: 'object',
          fields: Object.keys(data).map(fieldName => ({
            name: fieldName,
            type: this.inferFieldTypeFromData(data[fieldName]),
            required: true,
            description: ''
          })),
          sourceFile: fileName,
          confidence: 0.6
        };

        entities.push(entity);
      }
    } catch (error) {
      // Not valid JSON, skip
    }

    return { entities, relationships };
  }

  /**
   * Identify data quality issues
   */
  private identifyDataQualityIssues(content: string, fileName: string): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];

    // Check for encoding issues
    if (content.includes('�') || /[^\x20-\x7E\n\r\t]/.test(content)) {
      issues.push({
        id: uuidv4(),
        file: fileName,
        category: 'encoding',
        severity: 'medium',
        description: 'Potential encoding issues detected',
        recommendation: 'Ensure UTF-8 encoding'
      });
    }

    // Check for inconsistent formatting
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim());

    if (nonEmptyLines.length > 0) {
      // Check for trailing commas/spaces
      const trailingCommaCount = lines.filter(line => /,\s*$/.test(line)).length;
      if (trailingCommaCount > nonEmptyLines.length * 0.1) {
        issues.push({
          id: uuidv4(),
          file: fileName,
          category: 'formatting',
          severity: 'low',
          description: 'Inconsistent trailing commas detected',
          recommendation: 'Standardize formatting'
        });
      }
    }

    // Check for missing data patterns
    if (fileName.toLowerCase().includes('customer') || fileName.toLowerCase().includes('client')) {
      if (!content.toLowerCase().includes('name') && !content.toLowerCase().includes('id')) {
        issues.push({
          id: uuidv4(),
          file: fileName,
          category: 'completeness',
          severity: 'high',
          description: 'Customer data appears incomplete',
          recommendation: 'Verify all required customer fields are present'
        });
      }
    }

    return issues;
  }

  /**
   * Get directory statistics
   */
  private async getDirectoryStats(dirPath: string): Promise<DirectoryStats> {
    const files: string[] = [];
    const directories: string[] = [];
    let totalSize = 0;

    const processDirectory = async (currentPath: string, relativePath: string = ''): Promise<void> => {
      const items = readdirSync(currentPath);

      for (const item of items) {
        const fullPath = join(currentPath, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          directories.push(join(relativePath, item));
          await processDirectory(fullPath, join(relativePath, item));
        } else {
          files.push(join(relativePath, item));
          totalSize += stat.size;
        }
      }
    };

    await processDirectory(dirPath);
    return { files, directories, totalSize };
  }

  /**
   * Categorize file types
   */
  private categorizeFileTypes(files: string[]): FileTypeStats[] {
    const typeStats: Map<string, number> = new Map();

    files.forEach(file => {
      const ext = extname(file).toLowerCase() || 'no_extension';
      typeStats.set(ext, (typeStats.get(ext) || 0) + 1);
    });

    return Array.from(typeStats.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: (count / files.length) * 100
    }));
  }

  /**
   * Calculate structure complexity
   */
  private calculateStructureComplexity(stats: DirectoryStats): number {
    const depth = Math.max(...stats.directories.map(dir => dir.split('/').length));
    const fileCount = stats.files.length;
    const dirCount = stats.directories.length;

    // Simple complexity score based on depth and file count
    return Math.min(100, (depth * 10) + (fileCount * 0.1) + (dirCount * 0.5));
  }

  /**
   * Map file extension to data format
   */
  private mapExtensionToFormat(extension: string): DataFormatType {
    const formatMap: Record<string, DataFormatType> = {
      '.json': 'json',
      '.csv': 'csv',
      '.xml': 'xml',
      '.sql': 'sql',
      '.db': 'database',
      '.mdb': 'database',
      '.accdb': 'database',
      '.xls': 'spreadsheet',
      '.xlsx': 'spreadsheet'
    };

    return formatMap[extension] || 'unknown';
  }

  /**
   * Detect encoding
   */
  private detectEncoding(content: string): string {
    // Simple encoding detection
    if (content.includes('�')) return 'mixed';
    if (/[^\x00-\x7F]/.test(content)) return 'utf8';
    return 'ascii';
  }

  /**
   * Check if JSON has schema
   */
  private hasJSONSchema(json: any): boolean {
    return json.hasOwnProperty('$schema') ||
           json.hasOwnProperty('type') && json.type === 'object' && json.properties;
  }

  /**
   * Analyze JSON structure
   */
  private analyzeJSONStructure(json: any): DataStructure {
    if (Array.isArray(json)) {
      return {
        type: 'array',
        elementType: typeof json[0],
        length: json.length
      };
    } else if (typeof json === 'object' && json !== null) {
      return {
        type: 'object',
        fields: Object.keys(json).map(key => ({
          name: key,
          type: typeof json[key]
        }))
      };
    } else {
      return {
        type: 'primitive',
        valueType: typeof json
      };
    }
  }

  /**
   * Infer field type from sample data
   */
  private inferFieldType(sampleData: string[], columnIndex: number): string {
    const samples = sampleData
      .map(row => row.split(',')[columnIndex])
      .filter(val => val !== undefined && val !== '')
      .slice(0, 10);

    if (samples.length === 0) return 'unknown';

    // Check for numeric
    if (samples.every(val => !isNaN(Number(val)))) return 'number';

    // Check for boolean
    if (samples.every(val => ['true', 'false', '1', '0'].includes(val.toLowerCase()))) return 'boolean';

    // Check for date (basic detection)
    if (samples.some(val => /^\d{4}-\d{2}-\d{2}/.test(val))) return 'date';

    return 'string';
  }

  /**
   * Extract entity name from file path
   */
  private extractEntityName(fileName: string, schema?: any): string {
    // Try to get title from schema first
    if (schema?.title) return schema.title;

    // Extract from filename
    const baseName = basename(fileName, extname(fileName));
    return baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Map JSON schema type to entity field type
   */
  private mapJSONTypeToEntityType(property: any): string {
    if (property.type === 'string') {
      if (property.format === 'date-time' || property.format === 'date') return 'date';
      if (property.format === 'email') return 'email';
      return 'string';
    }
    if (property.type === 'number' || property.type === 'integer') return 'number';
    if (property.type === 'boolean') return 'boolean';
    if (property.type === 'array') return 'array';
    if (property.type === 'object') return 'object';
    return 'unknown';
  }

  /**
   * Infer field type from data value
   */
  private inferFieldTypeFromData(value: any): string {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
      if (/@/.test(value)) return 'email';
      return 'string';
    }
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    return 'unknown';
  }

  /**
   * Calculate entity confidence
   */
  private calculateEntityConfidence(entities: LegacyEntity[]): number {
    if (entities.length === 0) return 0;

    const totalConfidence = entities.reduce((sum, entity) => sum + (entity.confidence || 0), 0);
    return totalConfidence / entities.length;
  }

  /**
   * Calculate entity confidence from schema
   */
  private calculateEntityConfidenceFromSchema(schema: any): number {
    let confidence = 0.5; // Base confidence

    if (schema.title) confidence += 0.1;
    if (schema.description) confidence += 0.1;
    if (schema.type === 'object') confidence += 0.1;
    if (schema.properties) confidence += 0.2;
    if (schema.required) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  /**
   * Calculate format distribution
   */
  private calculateFormatDistribution(formats: DataFormat[]): FormatDistribution {
    const distribution: FormatDistribution = {};

    formats.forEach(format => {
      distribution[format.type] = (distribution[format.type] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Calculate data quality score
   */
  private calculateDataQualityScore(issues: DataQualityIssue[]): number {
    if (issues.length === 0) return 100;

    const highSeverityPenalty = issues.filter(i => i.severity === 'high').length * 10;
    const mediumSeverityPenalty = issues.filter(i => i.severity === 'medium').length * 5;
    const lowSeverityPenalty = issues.filter(i => i.severity === 'low').length * 2;

    const totalPenalty = highSeverityPenalty + mediumSeverityPenalty + lowSeverityPenalty;
    return Math.max(0, 100 - totalPenalty);
  }

  /**
   * Assess migration complexity
   */
  private assessMigrationComplexity(analysis: LegacySystemAnalysis): MigrationComplexity {
    const fileCount = analysis.analysis.fileStructure.files.length;
    const entityCount = analysis.analysis.entityMapping.entities.length;
    const formatCount = Object.keys(analysis.analysis.dataFormats.formatDistribution).length;
    const dataQualityScore = analysis.analysis.dataQuality.overallScore;

    if (fileCount < 10 && entityCount < 5 && formatCount === 1 && dataQualityScore > 80) {
      return 'low';
    } else if (fileCount < 50 && entityCount < 15 && formatCount <= 2 && dataQualityScore > 60) {
      return 'medium';
    } else if (fileCount < 100 && entityCount < 25 && dataQualityScore > 40) {
      return 'high';
    } else {
      return 'very_high';
    }
  }

  /**
   * Generate migration patterns
   */
  private generateMigrationPatterns(analysis: LegacySystemAnalysis): MigrationPattern[] {
    const patterns: MigrationPattern[] = [];

    // Generate patterns based on analysis
    analysis.analysis.entityMapping.entities.forEach(entity => {
      const pattern = this.generateEntityMigrationPattern(entity, analysis);
      if (pattern) {
        patterns.push(pattern);
      }
    });

    return patterns;
  }

  /**
   * Generate migration recommendations
   */
  private generateMigrationRecommendations(analysis: LegacySystemAnalysis): MigrationRecommendation[] {
    const recommendations: MigrationRecommendation[] = [];

    // Complexity-based recommendations
    switch (analysis.analysis.migrationComplexity) {
      case 'low':
        recommendations.push({
          id: uuidv4(),
          category: 'Migration Strategy',
          priority: 'high',
          description: 'Simple migration - can use direct mapping approach',
          effort: 'low',
          impact: 'high'
        });
        break;
      case 'medium':
        recommendations.push({
          id: uuidv4(),
          category: 'Migration Strategy',
          priority: 'high',
          description: 'Moderate complexity - implement phased migration approach',
          effort: 'medium',
          impact: 'high'
        });
        break;
      case 'high':
        recommendations.push({
          id: uuidv4(),
          category: 'Migration Strategy',
          priority: 'critical',
          description: 'High complexity - requires careful planning and data transformation',
          effort: 'high',
          impact: 'high'
        });
        break;
      case 'very_high':
        recommendations.push({
          id: uuidv4(),
          category: 'Migration Strategy',
          priority: 'critical',
          description: 'Very high complexity - consider parallel migration or legacy system coexistence',
          effort: 'very_high',
          impact: 'critical'
        });
        break;
    }

    // Data quality recommendations
    if (analysis.analysis.dataQuality.overallScore < 70) {
      recommendations.push({
        id: uuidv4(),
        category: 'Data Quality',
        priority: 'high',
        description: 'Address data quality issues before migration',
        effort: 'medium',
        impact: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Generate entity migration pattern
   */
  private generateEntityMigrationPattern(entity: LegacyEntity, analysis: LegacySystemAnalysis): MigrationPattern | null {
    // Find matching REFUSE entity
    const refuseEntity = this.findMatchingRefuseEntity(entity);

    if (!refuseEntity) return null;

    return {
      id: uuidv4(),
      legacyEntity: entity.name,
      refuseEntity,
      fieldMappings: this.generateFieldMappings(entity, refuseEntity),
      transformationRules: this.generateTransformationRules(entity),
      migrationStrategy: this.determineMigrationStrategy(entity, analysis),
      estimatedComplexity: this.calculatePatternComplexity(entity)
    };
  }

  /**
   * Find matching REFUSE entity
   */
  private findMatchingRefuseEntity(entity: LegacyEntity): string | null {
    const entityName = entity.name.toLowerCase();

    // Simple mapping based on name patterns
    if (entityName.includes('customer') || entityName.includes('client')) return 'Customer';
    if (entityName.includes('service') || entityName.includes('job')) return 'Service';
    if (entityName.includes('route')) return 'Route';
    if (entityName.includes('facility') || entityName.includes('site')) return 'Facility';
    if (entityName.includes('container') || entityName.includes('bin')) return 'Container';
    if (entityName.includes('fleet') || entityName.includes('vehicle')) return 'Fleet';
    if (entityName.includes('contract') || entityName.includes('agreement')) return 'Contract';

    return null;
  }

  /**
   * Generate field mappings
   */
  private generateFieldMappings(legacyEntity: LegacyEntity, refuseEntity: string): FieldMapping[] {
    const mappings: FieldMapping[] = [];

    // Simple field name mapping
    const nameMapping: Record<string, string> = {
      'customer_id': 'id',
      'customer_name': 'name',
      'service_type': 'serviceType',
      'container_type': 'containerType',
      'created_date': 'createdAt',
      'modified_date': 'updatedAt'
    };

    legacyEntity.fields.forEach(field => {
      const mappedName = nameMapping[field.name.toLowerCase()] || field.name;

      mappings.push({
        legacyField: field.name,
        refuseField: mappedName,
        transformation: 'direct',
        required: field.required
      });
    });

    return mappings;
  }

  /**
   * Generate transformation rules
   */
  private generateTransformationRules(entity: LegacyEntity): TransformationRule[] {
    const rules: TransformationRule[] = [];

    // Add default transformation rules based on field types
    entity.fields.forEach(field => {
      if (field.type === 'date') {
        rules.push({
          field: field.name,
          type: 'format_conversion',
          fromFormat: 'unknown',
          toFormat: 'ISO-8601',
          rule: `Convert ${field.name} to ISO-8601 date format`
        });
      }
    });

    return rules;
  }

  /**
   * Determine migration strategy
   */
  private determineMigrationStrategy(entity: LegacyEntity, analysis: LegacySystemAnalysis): MigrationStrategyType {
    if (entity.fields.length <= 5 && analysis.analysis.dataFormats.formatDistribution['json'] > 0) {
      return 'direct_mapping';
    } else if (entity.fields.length <= 15) {
      return 'field_mapping';
    } else {
      return 'custom_transformation';
    }
  }

  /**
   * Calculate pattern complexity
   */
  private calculatePatternComplexity(entity: LegacyEntity): number {
    let complexity = 0;

    complexity += entity.fields.length * 0.1; // More fields = more complex
    complexity += entity.fields.filter(f => f.type === 'object').length * 2; // Object fields are complex
    complexity += entity.fields.filter(f => f.type === 'array').length * 1.5; // Array fields are somewhat complex

    return Math.min(10, complexity);
  }

  /**
   * Deduplicate entities
   */
  private deduplicateEntities(entities: LegacyEntity[]): LegacyEntity[] {
    const uniqueEntities = new Map<string, LegacyEntity>();

    entities.forEach(entity => {
      const key = entity.name.toLowerCase();
      if (!uniqueEntities.has(key)) {
        uniqueEntities.set(key, entity);
      }
    });

    return Array.from(uniqueEntities.values());
  }

  /**
   * Deduplicate relationships
   */
  private deduplicateRelationships(relationships: EntityRelationship[]): EntityRelationship[] {
    const uniqueRelationships = new Map<string, EntityRelationship>();

    relationships.forEach(rel => {
      const key = `${rel.fromEntity}-${rel.toEntity}-${rel.type}`;
      if (!uniqueRelationships.has(key)) {
        uniqueRelationships.set(key, rel);
      }
    });

    return Array.from(uniqueRelationships.values());
  }

  /**
   * Initialize pattern matchers
   */
  private initializePatternMatchers(): void {
    // Customer data patterns
    this.patternMatchers.set('customer', {
      name: 'Customer Data Pattern',
      patterns: [
        /customer[_-]?id/i,
        /customer[_-]?name/i,
        /company[_-]?name/i,
        /contact[_-]?info/i,
        /billing[_-]?address/i,
        /service[_-]?address/i
      ],
      entityType: 'Customer',
      confidence: 0.8
    });

    // Service data patterns
    this.patternMatchers.set('service', {
      name: 'Service Data Pattern',
      patterns: [
        /service[_-]?type/i,
        /container[_-]?type/i,
        /pickup[_-]?schedule/i,
        /service[_-]?frequency/i,
        /rate/i,
        /price/i
      ],
      entityType: 'Service',
      confidence: 0.7
    });

    // Route data patterns
    this.patternMatchers.set('route', {
      name: 'Route Data Pattern',
      patterns: [
        /route[_-]?id/i,
        /route[_-]?name/i,
        /driver[_-]?id/i,
        /vehicle[_-]?id/i,
        /stops/i,
        /sequence/i
      ],
      entityType: 'Route',
      confidence: 0.6
    });
  }

  /**
   * Load migration strategies
   */
  private loadMigrationStrategies(strategiesDir?: string): void {
    if (!strategiesDir) return;

    try {
      const strategiesPath = resolve(strategiesDir);
      if (!existsSync(strategiesPath)) return;

      const strategyFiles = await glob('**/*.json', { cwd: strategiesPath });

      for (const file of strategyFiles) {
        const content = readFileSync(join(strategiesPath, file), 'utf8');
        const strategy = JSON.parse(content) as MigrationStrategy;
        this.migrationStrategies.set(strategy.name, strategy);
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Failed to load migration strategies: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
}

/**
 * Data Archaeologist options
 */
export interface DataArchaeologistOptions {
  strategiesDir?: string;
  includeBinaryAnalysis?: boolean;
  maxFileSize?: number;
}

/**
 * Legacy system analysis options
 */
export interface LegacySystemAnalysisOptions {
  systemName?: string;
  sourcePath?: string;
  includeSubdirectories?: boolean;
  analyzeBinaryFiles?: boolean;
  generateMigrationPlan?: boolean;
}

/**
 * Legacy system analysis
 */
export interface LegacySystemAnalysis {
  id: string;
  timestamp: string;
  systemName: string;
  sourcePath: string;
  analysis: {
    fileStructure: FileStructureAnalysis;
    dataFormats: DataFormatAnalysis;
    entityMapping: EntityMappingAnalysis;
    dataQuality: DataQualityAnalysis;
    migrationComplexity: MigrationComplexity;
  };
  patterns: MigrationPattern[];
  recommendations: MigrationRecommendation[];
}

/**
 * File structure analysis
 */
export interface FileStructureAnalysis {
  files: string[];
  directories: string[];
  totalSize: number;
  fileTypes: FileTypeStats[];
  structureComplexity: number;
}

/**
 * Data format analysis
 */
export interface DataFormatAnalysis {
  formats: DataFormat[];
  schemaCount: number;
  formatDistribution: FormatDistribution;
}

/**
 * Entity mapping analysis
 */
export interface EntityMappingAnalysis {
  entities: LegacyEntity[];
  relationships: EntityRelationship[];
  confidence: number;
}

/**
 * Data quality analysis
 */
export interface DataQualityAnalysis {
  issues: DataQualityIssue[];
  recommendations: string[];
  overallScore: number;
}

/**
 * File type statistics
 */
export interface FileTypeStats {
  type: string;
  count: number;
  percentage: number;
}

/**
 * Data format
 */
export interface DataFormat {
  type: DataFormatType;
  fileName: string;
  size: number;
  hasSchema: boolean;
  encoding: string;
  structure: DataStructure;
}

/**
 * Data format type
 */
export type DataFormatType = 'json' | 'csv' | 'xml' | 'sql' | 'database' | 'spreadsheet' | 'unknown';

/**
 * Data structure
 */
export interface DataStructure {
  type: 'object' | 'array' | 'primitive' | 'tabular' | 'hierarchical' | 'invalid' | 'unknown';
  fields?: Array<{ name: string; type: string }>;
  elementType?: string;
  length?: number;
  rowCount?: number;
  hasNestedStructure?: boolean;
  error?: string;
}

/**
 * Format distribution
 */
export interface FormatDistribution {
  [format: string]: number;
}

/**
 * Legacy entity
 */
export interface LegacyEntity {
  id: string;
  name: string;
  type: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  sourceFile: string;
  confidence: number;
}

/**
 * Entity relationship
 */
export interface EntityRelationship {
  id: string;
  fromEntity: string;
  toEntity: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  field?: string;
  confidence: number;
}

/**
 * Data quality issue
 */
export interface DataQualityIssue {
  id: string;
  file: string;
  category: 'encoding' | 'formatting' | 'schema' | 'completeness' | 'consistency';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

/**
 * Migration complexity
 */
export type MigrationComplexity = 'low' | 'medium' | 'high' | 'very_high';

/**
 * Migration pattern
 */
export interface MigrationPattern {
  id: string;
  legacyEntity: string;
  refuseEntity: string;
  fieldMappings: FieldMapping[];
  transformationRules: TransformationRule[];
  migrationStrategy: MigrationStrategyType;
  estimatedComplexity: number;
}

/**
 * Field mapping
 */
export interface FieldMapping {
  legacyField: string;
  refuseField: string;
  transformation: string;
  required: boolean;
}

/**
 * Transformation rule
 */
export interface TransformationRule {
  field: string;
  type: 'format_conversion' | 'data_type_conversion' | 'value_mapping' | 'custom';
  fromFormat?: string;
  toFormat?: string;
  rule: string;
}

/**
 * Migration strategy type
 */
export type MigrationStrategyType = 'direct_mapping' | 'field_mapping' | 'custom_transformation' | 'manual';

/**
 * Migration recommendation
 */
export interface MigrationRecommendation {
  id: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  effort: 'low' | 'medium' | 'high' | 'very_high';
  impact: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Migration strategy
 */
export interface MigrationStrategy {
  name: string;
  description: string;
  applicablePatterns: string[];
  steps: string[];
  estimatedDuration: string;
  prerequisites: string[];
}

/**
 * Data pattern matcher
 */
export interface DataPatternMatcher {
  name: string;
  patterns: RegExp[];
  entityType: string;
  confidence: number;
}

/**
 * Directory statistics
 */
export interface DirectoryStats {
  files: string[];
  directories: string[];
  totalSize: number;
}

/**
 * Data Archaeologist CLI
 */
export class DataArchaeologistCLI {
  private archaeologist: DataArchaeologist;

  constructor(options?: DataArchaeologistOptions) {
    this.archaeologist = new DataArchaeologist(options);
  }

  async run(args: string[]): Promise<void> {
    const command = args[0];

    switch (command) {
      case 'analyze':
        await this.analyzeCommand(args.slice(1));
        break;
      case 'patterns':
        this.patternsCommand(args.slice(1));
        break;
      case 'report':
        this.reportCommand(args.slice(1));
        break;
      default:
        this.printUsage();
    }
  }

  private async analyzeCommand(args: string[]): Promise<void> {
    const options: LegacySystemAnalysisOptions = {
      sourcePath: process.cwd()
    };

    // Parse options
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--source' && args[i + 1]) {
        options.sourcePath = args[++i];
      } else if (arg === '--name' && args[i + 1]) {
        options.systemName = args[++i];
      } else if (arg === '--subdirs') {
        options.includeSubdirectories = true;
      } else if (arg === '--binary') {
        options.analyzeBinaryFiles = true;
      } else if (arg === '--migration-plan') {
        options.generateMigrationPlan = true;
      }
    }

    try {
      const analysis = await this.archaeologist.analyzeLegacySystem(options);

      // Save analysis to file
      const outputPath = `./legacy-analysis-${Date.now()}.json`;
      writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

      console.log(chalk.green(`✅ Analysis complete! Results saved to: ${outputPath}`));
      console.log(chalk.gray(`   System: ${analysis.systemName}`));
      console.log(chalk.gray(`   Files: ${analysis.analysis.fileStructure.files.length}`));
      console.log(chalk.gray(`   Entities: ${analysis.analysis.entityMapping.entities.length}`));
      console.log(chalk.gray(`   Migration Complexity: ${analysis.analysis.migrationComplexity}`));

    } catch (error) {
      console.error(chalk.red(`❌ Analysis failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private patternsCommand(args: string[]): void {
    console.log(chalk.blue('\n🔍 Data Pattern Matchers'));
    console.log(chalk.gray('=' .repeat(50)));

    console.log(chalk.green('Available Pattern Types:'));
    console.log('  • Customer Data Patterns');
    console.log('  • Service Data Patterns');
    console.log('  • Route Data Patterns');
    console.log('  • Facility Data Patterns');
    console.log('  • Container Data Patterns\n');

    console.log(chalk.green('Usage:'));
    console.log('  data-archaeologist analyze --source ./legacy-data --patterns customer,service\n');
  }

  private reportCommand(args: string[]): void {
    const reportPath = args[0];
    if (!reportPath) {
      console.error('Usage: report <analysis-file>');
      process.exit(1);
    }

    try {
      if (!existsSync(reportPath)) {
        console.error(`Analysis file not found: ${reportPath}`);
        process.exit(1);
      }

      const analysisContent = readFileSync(reportPath, 'utf8');
      const analysis = JSON.parse(analysisContent) as LegacySystemAnalysis;

      this.printAnalysisReport(analysis);
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load analysis: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  }

  private printAnalysisReport(analysis: LegacySystemAnalysis): void {
    console.log(chalk.blue('\n🏛️ Legacy System Analysis Report'));
    console.log(chalk.gray('=' .repeat(50)));
    console.log(chalk.gray(`Analysis ID: ${analysis.id}`));
    console.log(chalk.gray(`Generated: ${analysis.timestamp}`));
    console.log(chalk.gray(`System: ${analysis.systemName}`));
    console.log(chalk.gray(`Source: ${analysis.sourcePath}`));

    console.log(chalk.blue('\n📊 File Structure Analysis:'));
    console.log(chalk.green(`  Total Files: ${analysis.analysis.fileStructure.files.length}`));
    console.log(chalk.green(`  Directories: ${analysis.analysis.fileStructure.directories.length}`));
    console.log(chalk.green(`  Total Size: ${(analysis.analysis.fileStructure.totalSize / 1024).toFixed(2)} KB`));
    console.log(chalk.green(`  Structure Complexity: ${analysis.analysis.fileStructure.structureComplexity.toFixed(1)}/100`));

    console.log(chalk.blue('\n📋 Data Formats:'));
    console.log(chalk.green(`  Schema Files: ${analysis.analysis.dataFormats.schemaCount}`));
    Object.entries(analysis.analysis.dataFormats.formatDistribution).forEach(([format, count]) => {
      console.log(chalk.gray(`  ${format.toUpperCase()}: ${count} files`));
    });

    console.log(chalk.blue('\n🔗 Entity Mapping:'));
    console.log(chalk.green(`  Entities Found: ${analysis.analysis.entityMapping.entities.length}`));
    console.log(chalk.green(`  Confidence: ${(analysis.analysis.entityMapping.confidence * 100).toFixed(1)}%`));

    analysis.analysis.entityMapping.entities.slice(0, 5).forEach(entity => {
      console.log(chalk.gray(`  • ${entity.name} (${entity.fields.length} fields)`));
    });

    console.log(chalk.blue('\n✅ Data Quality:'));
    console.log(chalk.green(`  Quality Score: ${analysis.analysis.dataQuality.overallScore.toFixed(1)}/100`));
    console.log(chalk.green(`  Issues Found: ${analysis.analysis.dataQuality.issues.length}`));

    if (analysis.analysis.dataQuality.issues.length > 0) {
      const highSeverity = analysis.analysis.dataQuality.issues.filter(i => i.severity === 'high').length;
      const mediumSeverity = analysis.analysis.dataQuality.issues.filter(i => i.severity === 'medium').length;
      console.log(chalk.red(`  High Priority: ${highSeverity}`));
      console.log(chalk.yellow(`  Medium Priority: ${mediumSeverity}`));
    }

    console.log(chalk.blue('\n🎯 Migration Complexity:'));
    console.log(chalk.green(`  Overall: ${analysis.analysis.migrationComplexity.replace('_', ' ').toUpperCase()}`));

    if (analysis.patterns.length > 0) {
      console.log(chalk.blue('\n🔄 Migration Patterns:'));
      analysis.patterns.slice(0, 3).forEach(pattern => {
        console.log(chalk.gray(`  ${pattern.legacyEntity} → ${pattern.refuseEntity}`));
        console.log(chalk.gray(`    Complexity: ${pattern.estimatedComplexity.toFixed(1)}/10`));
      });
    }

    if (analysis.recommendations.length > 0) {
      console.log(chalk.blue('\n💡 Recommendations:'));
      analysis.recommendations.slice(0, 5).forEach(rec => {
        const priorityColor = rec.priority === 'critical' ? chalk.red :
                             rec.priority === 'high' ? chalk.yellow : chalk.green;
        console.log(priorityColor(`  [${rec.priority.toUpperCase()}] ${rec.description}`));
      });
    }
  }

  private printUsage(): void {
    console.log(chalk.blue('\nREFUSE Protocol Data Archaeologist'));
    console.log(chalk.gray('Usage: data-archaeologist <command> [options]\n'));

    console.log(chalk.green('Commands:'));
    console.log('  analyze [options]     Analyze legacy system data structure');
    console.log('  patterns              Show available data pattern matchers');
    console.log('  report <file>         Display analysis report\n');

    console.log(chalk.green('Options for analyze command:'));
    console.log('  --source <path>       Source directory to analyze (default: current)');
    console.log('  --name <name>         System name for the analysis');
    console.log('  --subdirs             Include subdirectories in analysis');
    console.log('  --binary              Include binary files in analysis');
    console.log('  --migration-plan      Generate detailed migration plan\n');

    console.log(chalk.green('Examples:'));
    console.log('  data-archaeologist analyze --source ./legacy-data --name "Old Waste System"');
    console.log('  data-archaeologist analyze --subdirs --migration-plan');
    console.log('  data-archaeologist report ./legacy-analysis-1703123456789.json\n');
  }
}

/**
 * Export factory functions
 */
export function createDataArchaeologist(options?: DataArchaeologistOptions): DataArchaeologist {
  return new DataArchaeologist(options);
}

export function createDataArchaeologistCLI(options?: DataArchaeologistOptions): DataArchaeologistCLI {
  return new DataArchaeologistCLI(options);
}

// Export types
export type {
  DataArchaeologistOptions,
  LegacySystemAnalysisOptions,
  LegacySystemAnalysis,
  FileStructureAnalysis,
  DataFormatAnalysis,
  EntityMappingAnalysis,
  DataQualityAnalysis,
  FileTypeStats,
  DataFormat,
  DataFormatType,
  DataStructure,
  FormatDistribution,
  LegacyEntity,
  EntityRelationship,
  DataQualityIssue,
  MigrationComplexity,
  MigrationPattern,
  FieldMapping,
  TransformationRule,
  MigrationStrategyType,
  MigrationRecommendation,
  MigrationStrategy,
  DataPatternMatcher,
  DirectoryStats
};
