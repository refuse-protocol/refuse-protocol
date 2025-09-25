#!/usr/bin/env node

/**
 * @fileoverview Protocol Documentation Generator for Website
 * @description Extracts documentation from REFUSE Protocol files and generates website content
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProtocolDocsGenerator {
  constructor() {
    this.protocolDir = path.join(__dirname, '../../protocol');
    this.outputDir = path.join(__dirname, '../src/data');
    this.generatedFiles = [];
    this.protocolStats = {};

    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateAllDocumentation() {
    console.log('🔄 Generating protocol documentation for website...');

    try {
      // Generate different types of documentation
      await this.generateProtocolOverview();
      await this.generateEntityDocumentation();
      await this.generateImplementationGuide();
      await this.generateToolReference();
      await this.generateSchemaReference();

      // Generate summary
      this.generateDocumentationSummary();

      console.log('✅ Protocol documentation generation complete!');
      console.log(`📁 Generated ${this.generatedFiles.length} documentation files`);

    } catch (error) {
      console.error('❌ Error generating documentation:', error.message);
      process.exit(1);
    }
  }

  async generateProtocolOverview() {
    console.log('📋 Generating protocol overview...');

    const overview = {
      name: 'REFUSE Protocol',
      version: '1.0.0',
      description: 'REcyclable & Solid waste Unified Standard Exchange',
      tagline: 'Open source standardized data exchange for waste management and recycling operations',
      entities: this.getEntityCount(),
      implementations: this.getImplementationCount(),
      tools: this.getToolCount(),
      lastUpdated: new Date().toISOString(),
      features: [
        'RESTful API-first design with JSON-native data exchange',
        '16+ core entities covering all aspects of waste management',
        'Comprehensive tool ecosystem for validation and compliance',
        'Backward compatibility for legacy system migration',
        'Data archaeology capabilities for inconsistent legacy data'
      ],
      principles: [
        {
          name: 'RESTful API-first',
          description: 'All data exchange operations accessible via REST endpoints'
        },
        {
          name: 'JSON-native',
          description: 'JSON as primary data interchange format with optional XML support'
        },
        {
          name: 'Semantic clarity',
          description: 'Human-readable field names with consistent domain terminology'
        },
        {
          name: 'Extensible design',
          description: 'Support for system-specific extensions while maintaining compatibility'
        },
        {
          name: 'Backward compatibility & Data archaeology',
          description: 'Handles legacy data patterns and migration challenges'
        }
      ]
    };

    const overviewPath = path.join(this.outputDir, 'protocol-overview.json');
    fs.writeFileSync(overviewPath, JSON.stringify(overview, null, 2));
    this.generatedFiles.push(overviewPath);

    return overview;
  }

  async generateEntityDocumentation() {
    console.log('🏗️ Generating entity documentation...');

    const entitiesPath = path.join(this.protocolDir, 'specifications/entities.ts');
    const entitiesContent = fs.readFileSync(entitiesPath, 'utf8');

    // Extract entity information using regex and parsing
    const entities = this.parseEntitiesFromSource(entitiesContent);

    const entityDocsPath = path.join(this.outputDir, 'entities.json');
    fs.writeFileSync(entityDocsPath, JSON.stringify(entities, null, 2));
    this.generatedFiles.push(entityDocsPath);

    return entities;
  }

  async generateImplementationGuide() {
    console.log('🛠️ Generating implementation guide...');

    const implementations = this.getImplementationFiles();
    const tools = this.getToolFiles();

    const guide = {
      implementations: implementations.map(imp => ({
        name: this.extractImplementationName(imp),
        description: this.extractImplementationDescription(imp),
        category: this.categorizeImplementation(imp),
        complexity: this.assessComplexity(imp)
      })),
      tools: tools.map(tool => ({
        name: this.extractToolName(tool),
        description: this.extractToolDescription(tool),
        category: this.categorizeTool(tool),
        usage: this.extractToolUsage(tool)
      })),
      gettingStarted: {
        prerequisites: [
          'Node.js 16+',
          'TypeScript knowledge',
          'Understanding of RESTful APIs',
          'Familiarity with waste management domain (optional)'
        ],
        quickStart: [
          '1. Review the protocol specifications',
          '2. Choose implementation approach',
          '3. Set up development environment',
          '4. Implement core entities',
          '5. Add validation and compliance checks',
          '6. Test with sample data',
          '7. Deploy and integrate'
        ]
      }
    };

    const guidePath = path.join(this.outputDir, 'implementation-guide.json');
    fs.writeFileSync(guidePath, JSON.stringify(guide, null, 2));
    this.generatedFiles.push(guidePath);

    return guide;
  }

  async generateToolReference() {
    console.log('🔧 Generating tool reference...');

    const tools = this.getToolFiles();
    const toolReference = {
      validationTools: tools.filter(t => t.includes('validator') || t.includes('checker')),
      generationTools: tools.filter(t => t.includes('generator')),
      utilityTools: tools.filter(t => t.includes('util') || t.includes('parser')),
      analysisTools: tools.filter(t => t.includes('archaeologist') || t.includes('transformer')),
      categories: {
        'API Documentation': tools.filter(t => t.includes('api-docs')),
        'SDK Generation': tools.filter(t => t.includes('sdk-generator')),
        'Compliance & Validation': tools.filter(t => t.includes('validator') || t.includes('checker')),
        'Data Processing': tools.filter(t => t.includes('transformer') || t.includes('archaeologist')),
        'Development Tools': tools.filter(t => t.includes('util') || t.includes('parser'))
      }
    };

    const toolRefPath = path.join(this.outputDir, 'tool-reference.json');
    fs.writeFileSync(toolRefPath, JSON.stringify(toolReference, null, 2));
    this.generatedFiles.push(toolRefPath);

    return toolReference;
  }

  async generateSchemaReference() {
    console.log('📋 Generating schema reference...');

    const schemasPath = path.join(this.protocolDir, 'schemas');

    // Check if schemas directory exists and has files
    let schemaFiles = [];
    try {
      if (fs.existsSync(schemasPath)) {
        schemaFiles = fs.readdirSync(schemasPath);
      } else {
        console.log('⚠️ Schemas directory not found, generating placeholder schema reference...');
      }
    } catch (error) {
      console.log('⚠️ Error reading schemas directory, generating placeholder schema reference...');
    }

    const schemaReference = {
      availableSchemas: schemaFiles,
      schemaTypes: this.categorizeSchemas(schemaFiles),
      validationRules: {
        requiredFields: ['id', 'createdAt', 'updatedAt', 'version'],
        optionalFields: ['externalIds', 'metadata'],
        namingConvention: 'camelCase for JSON, kebab-case for files'
      },
      note: schemaFiles.length === 0 ? 'Schema files will be added as the protocol specification matures' : undefined
    };

    const schemaRefPath = path.join(this.outputDir, 'schema-reference.json');
    fs.writeFileSync(schemaRefPath, JSON.stringify(schemaReference, null, 2));
    this.generatedFiles.push(schemaRefPath);

    return schemaReference;
  }

  generateDocumentationSummary() {
    const summary = {
      generationTimestamp: new Date().toISOString(),
      totalFilesGenerated: this.generatedFiles.length,
      generatedFiles: this.generatedFiles.map(f => path.relative(process.cwd(), f)),
      protocolStats: this.protocolStats,
      lastCommit: this.getLastCommitInfo()
    };

    const summaryPath = path.join(this.outputDir, 'documentation-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    return summary;
  }

  // Helper methods
  getEntityCount() {
    const entitiesPath = path.join(this.protocolDir, 'specifications/entities.ts');
    const content = fs.readFileSync(entitiesPath, 'utf8');
    const entityMatches = content.match(/export interface \w+/g) || [];
    return entityMatches.length;
  }

  getImplementationCount() {
    const implDir = path.join(this.protocolDir, 'implementations');
    return fs.readdirSync(implDir).filter(f => f.endsWith('.ts')).length;
  }

  getToolCount() {
    const toolsDir = path.join(this.protocolDir, 'tools');
    return fs.readdirSync(toolsDir).filter(f => f.endsWith('.ts')).length;
  }

  getImplementationFiles() {
    const implDir = path.join(this.protocolDir, 'implementations');
    return fs.readdirSync(implDir)
      .filter(f => f.endsWith('.ts'))
      .map(f => path.join(implDir, f));
  }

  getToolFiles() {
    const toolsDir = path.join(this.protocolDir, 'tools');
    return fs.readdirSync(toolsDir)
      .filter(f => f.endsWith('.ts'))
      .map(f => path.join(toolsDir, f));
  }

  parseEntitiesFromSource(content) {
    // Extract entity interfaces and their properties
    const entities = [];
    const interfaceMatches = content.match(/export interface (\w+).*?\{([\s\S]*?)\}/g) || [];

    interfaceMatches.forEach(match => {
      const nameMatch = match.match(/export interface (\w+)/);
      const name = nameMatch ? nameMatch[1] : 'Unknown';

      // Extract properties (simplified)
      const properties = [];
      const propMatches = match.match(/(\w+)(?:\?)?\s*:\s*([^;]+)/g) || [];

      propMatches.forEach(prop => {
        const [key, type] = prop.split(':').map(s => s.trim());
        if (key && type && !key.startsWith('//')) {
          properties.push({ name: key, type: type.replace(';', '') });
        }
      });

      entities.push({
        name,
        properties: properties.slice(0, 10), // Limit for brevity
        description: this.generateEntityDescription(name)
      });
    });

    return entities;
  }

  extractImplementationName(implPath) {
    const filename = path.basename(implPath, '.ts');
    return filename.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  extractImplementationDescription(implPath) {
    const content = fs.readFileSync(implPath, 'utf8');
    const commentMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.*?)\n\s*\*\s*\//s);
    return commentMatch ? commentMatch[1].trim() : 'Implementation module';
  }

  categorizeImplementation(implPath) {
    const filename = path.basename(implPath, '.ts').toLowerCase();
    if (filename.includes('entity') || filename.includes('base')) return 'Core Entity';
    if (filename.includes('event')) return 'Event System';
    if (filename.includes('legacy') || filename.includes('migration')) return 'Migration';
    if (filename.includes('api')) return 'API';
    return 'Implementation';
  }

  assessComplexity(implPath) {
    const content = fs.readFileSync(implPath, 'utf8');
    const lines = content.split('\n').length;
    if (lines > 500) return 'High';
    if (lines > 200) return 'Medium';
    return 'Low';
  }

  extractToolName(toolPath) {
    const filename = path.basename(toolPath, '.ts');
    return filename.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  extractToolDescription(toolPath) {
    const content = fs.readFileSync(toolPath, 'utf8');
    const commentMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.*?)\n\s*\*\s*\//s);
    return commentMatch ? commentMatch[1].trim() : 'Utility tool';
  }

  categorizeTool(toolPath) {
    const filename = path.basename(toolPath, '.ts').toLowerCase();
    if (filename.includes('validator') || filename.includes('checker')) return 'Validation';
    if (filename.includes('generator')) return 'Generation';
    if (filename.includes('parser')) return 'Parsing';
    if (filename.includes('archaeologist') || filename.includes('transformer')) return 'Data Processing';
    return 'Utility';
  }

  extractToolUsage(toolPath) {
    const content = fs.readFileSync(toolPath, 'utf8');
    // Look for usage examples in comments
    const usageMatch = content.match(/@usage\s+(.*?)(?:\n\s*\*|$)/s);
    return usageMatch ? usageMatch[1].trim() : 'Refer to implementation for usage details';
  }

  categorizeSchemas(schemaFiles) {
    const categories = {
      'Entity Schemas': [],
      'API Schemas': [],
      'Validation Schemas': [],
      'Configuration Schemas': []
    };

    schemaFiles.forEach(file => {
      const name = file.toLowerCase();
      if (name.includes('entity') || name.includes('customer') || name.includes('service')) {
        categories['Entity Schemas'].push(file);
      } else if (name.includes('api') || name.includes('endpoint')) {
        categories['API Schemas'].push(file);
      } else if (name.includes('validation') || name.includes('rule')) {
        categories['Validation Schemas'].push(file);
      } else {
        categories['Configuration Schemas'].push(file);
      }
    });

    return categories;
  }

  generateEntityDescription(entityName) {
    const descriptions = {
      'Customer': 'Represents waste management service customers and their account information',
      'Service': 'Defines waste collection and processing services offered',
      'Facility': 'Physical locations for waste processing and recycling operations',
      'Route': 'Collection routes and service schedules for waste management',
      'MaterialTicket': 'Tracking and documentation of material processing',
      'Event': 'System events and state changes in the waste management workflow',
      'EnvironmentalCompliance': 'Regulatory compliance and environmental reporting',
      'LegacyBridge': 'Compatibility layer for legacy system integration'
    };

    return descriptions[entityName] || `${entityName} entity for waste management operations`;
  }

  getLastCommitInfo() {
    try {
      const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
      const commitDate = execSync('git log -1 --pretty=%cd', { encoding: 'utf8' }).trim();

      return {
        hash: commitHash,
        message: commitMessage,
        date: commitDate
      };
    } catch (error) {
      return {
        hash: 'unknown',
        message: 'No commit information available',
        date: new Date().toISOString()
      };
    }
  }
}

// Main execution
async function main() {
  const generator = new ProtocolDocsGenerator();

  try {
    await generator.generateAllDocumentation();
    console.log('\n📊 Summary:');
    console.log(`   Generated ${generator.generatedFiles.length} documentation files`);
    console.log('   Protocol overview: ✅');
    console.log('   Entity documentation: ✅');
    console.log('   Implementation guide: ✅');
    console.log('   Tool reference: ✅');
    console.log('   Schema reference: ✅');

  } catch (error) {
    console.error('❌ Documentation generation failed:', error.message);
    process.exit(1);
  }
}

// Run the generator
main();
