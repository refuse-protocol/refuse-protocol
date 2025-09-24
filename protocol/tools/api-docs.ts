/**
 * @fileoverview Interactive API documentation generator
 * @description Generates interactive API documentation with live testing capabilities
 * @version 1.0.0
 */

import { Event, Customer, Service, Route, Facility, MaterialTicket } from '../specifications/entities';
import { ComplianceValidator } from './compliance-validator';
import { ConformanceChecker } from './conformance-checker';
import { EventStreamingSystem } from '../implementations/event-system';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interactive API Documentation Generator
 * Generates comprehensive, interactive API documentation with testing capabilities
 */
export class InteractiveAPIDocsGenerator {
  private complianceValidator: ComplianceValidator;
  private conformanceChecker: ConformanceChecker;
  private eventSystem: EventStreamingSystem;
  private outputDir: string;
  private templates: Map<string, string> = new Map();

  constructor(outputDir: string = './docs/api') {
    this.outputDir = outputDir;
    this.complianceValidator = new ComplianceValidator();
    this.conformanceChecker = new ConformanceChecker();
    this.eventSystem = new EventStreamingSystem();

    this.initializeTemplates();
    this.ensureOutputDirectory();
  }

  /**
   * Generate complete API documentation
   */
  async generateAPIDocs(options: DocsOptions = {}): Promise<GenerationResult> {
    console.log('Generating interactive API documentation...');

    const result: GenerationResult = {
      success: true,
      filesGenerated: [],
      sections: [],
      generatedAt: new Date(),
      metadata: {
        version: '1.0.0',
        protocolVersion: 'REFUSE-v1.0',
        generationOptions: options
      }
    };

    try {
      // Generate main sections
      result.sections.push('Overview');
      await this.generateOverviewSection(options);

      result.sections.push('Authentication');
      await this.generateAuthenticationSection(options);

      result.sections.push('Entities');
      await this.generateEntitiesSection(options);

      result.sections.push('Events');
      await this.generateEventsSection(options);

      result.sections.push('Validation');
      await this.generateValidationSection(options);

      result.sections.push('Conformance');
      await this.generateConformanceSection(options);

      result.sections.push('Testing');
      await this.generateTestingSection(options);

      result.sections.push('SDK');
      await this.generateSDKSection(options);

      // Generate interactive playground
      await this.generateInteractivePlayground(options);

      // Generate search index
      await this.generateSearchIndex(result.sections);

      // Generate navigation
      await this.generateNavigation(result.sections);

      console.log('✅ API documentation generated successfully');
      return result;

    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
      console.error('❌ API documentation generation failed:', error);
      return result;
    }
  }

  /**
   * Generate overview section
   */
  private async generateOverviewSection(options: DocsOptions): Promise<void> {
    const overview = this.templates.get('overview') || this.getOverviewTemplate();
    const content = this.populateTemplate(overview, {
      protocolName: 'REFUSE Protocol',
      version: '1.0.0',
      description: 'Universal Platform for Waste Management Data Exchange',
      baseUrl: options.baseUrl || 'https://api.refuse-protocol.org',
      features: [
        'RESTful API-first design',
        'JSON-native data exchange',
        'Real-time event streaming',
        'Comprehensive validation',
        'Regulatory compliance',
        'Legacy system integration'
      ],
      gettingStarted: `
## Getting Started

1. **Authentication**: Obtain API credentials
2. **Explore Entities**: Browse available data models
3. **Test Endpoints**: Use the interactive playground
4. **Integrate**: Use the provided SDKs

## Core Concepts

- **Entities**: Core data objects (Customer, Service, Route, etc.)
- **Events**: Real-time data change notifications
- **Validation**: Schema and business rule validation
- **Conformance**: Protocol compliance checking
`
    });

    this.writeFile('index.html', content);
  }

  /**
   * Generate authentication section
   */
  private async generateAuthenticationSection(options: DocsOptions): Promise<void> {
    const auth = this.templates.get('authentication') || this.getAuthenticationTemplate();
    const content = this.populateTemplate(auth, {
      apiKeyHeader: 'X-API-Key',
      bearerToken: 'Authorization: Bearer <token>',
      basicAuth: 'Authorization: Basic <base64-encoded-credentials>',
      authMethods: [
        {
          name: 'API Key',
          description: 'Simple API key authentication',
          example: 'X-API-Key: your-api-key-here',
          useCase: 'Development and testing'
        },
        {
          name: 'Bearer Token',
          description: 'JWT-based authentication',
          example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIs...',
          useCase: 'Production applications'
        },
        {
          name: 'Basic Auth',
          description: 'HTTP Basic authentication',
          example: 'Authorization: Basic dXNlcjpwYXNzd29yZA==',
          useCase: 'Legacy system integration'
        }
      ]
    });

    this.writeFile('authentication.html', content);
  }

  /**
   * Generate entities section
   */
  private async generateEntitiesSection(options: DocsOptions): Promise<void> {
    const entities = this.templates.get('entities') || this.getEntitiesTemplate();
    const entityData = this.getEntityDocumentation();

    const content = this.populateTemplate(entities, {
      entities: entityData,
      totalEntities: entityData.length,
      entityList: entityData.map(e => `- [${e.name}](#${e.name.toLowerCase()})`).join('\n')
    });

    this.writeFile('entities.html', content);

    // Generate individual entity pages
    for (const entity of entityData) {
      await this.generateEntityPage(entity);
    }
  }

  /**
   * Generate events section
   */
  private async generateEventsSection(options: DocsOptions): Promise<void> {
    const events = this.templates.get('events') || this.getEventsTemplate();
    const eventTypes = this.getEventTypeDocumentation();

    const content = this.populateTemplate(events, {
      eventTypes,
      totalEventTypes: eventTypes.length,
      streamingExample: this.getEventStreamingExample(),
      webhookExample: this.getWebhookExample()
    });

    this.writeFile('events.html', content);
  }

  /**
   * Generate validation section
   */
  private async generateValidationSection(options: DocsOptions): Promise<void> {
    const validation = this.templates.get('validation') || this.getValidationTemplate();
    const validationRules = this.getValidationRulesDocumentation();

    const content = this.populateTemplate(validation, {
      validationRules,
      validationTypes: ['Schema Validation', 'Business Rules', 'Data Quality', 'Compliance'],
      exampleRequest: this.getValidationExample()
    });

    this.writeFile('validation.html', content);
  }

  /**
   * Generate conformance section
   */
  private async generateConformanceSection(options: DocsOptions): Promise<void> {
    const conformance = this.templates.get('conformance') || this.getConformanceTemplate();
    const standards = this.getConformanceStandardsDocumentation();

    const content = this.populateTemplate(conformance, {
      standards,
      conformanceLevels: ['Basic', 'Standard', 'Premium'],
      checkExample: this.getConformanceCheckExample()
    });

    this.writeFile('conformance.html', content);
  }

  /**
   * Generate testing section
   */
  private async generateTestingSection(options: DocsOptions): Promise<void> {
    const testing = this.templates.get('testing') || this.getTestingTemplate();

    const content = this.populateTemplate(testing, {
      testingTools: [
        'Interactive API Playground',
        'Schema Validator',
        'Conformance Checker',
        'Performance Benchmarks',
        'Load Testing Suite'
      ],
      testScenarios: this.getTestScenarios(),
      cliCommands: this.getCLICommandExamples()
    });

    this.writeFile('testing.html', content);
  }

  /**
   * Generate SDK section
   */
  private async generateSDKSection(options: DocsOptions): Promise<void> {
    const sdk = this.templates.get('sdk') || this.getSDKTemplate();
    const sdkExamples = this.getSDKExamples();

    const content = this.populateTemplate(sdk, {
      sdkExamples,
      supportedLanguages: ['TypeScript', 'JavaScript', 'Python', 'Java', 'C#'],
      installationCommands: {
        npm: 'npm install @refuse-protocol/sdk',
        yarn: 'yarn add @refuse-protocol/sdk',
        pip: 'pip install refuse-protocol-sdk'
      }
    });

    this.writeFile('sdk.html', content);
  }

  /**
   * Generate interactive playground
   */
  private async generateInteractivePlayground(options: DocsOptions): Promise<void> {
    const playground = this.templates.get('playground') || this.getPlaygroundTemplate();

    const content = this.populateTemplate(playground, {
      apiEndpoint: options.baseUrl || 'https://api.refuse-protocol.org',
      defaultEntity: 'customer',
      sampleRequests: this.getSampleRequests(),
      responseExamples: this.getResponseExamples()
    });

    this.writeFile('playground.html', content);
  }

  /**
   * Generate entity page
   */
  private async generateEntityPage(entity: EntityDocumentation): Promise<void> {
    const entityTemplate = this.templates.get('entity') || this.getEntityTemplate();
    const content = this.populateTemplate(entityTemplate, {
      entity: entity.name,
      description: entity.description,
      properties: entity.properties,
      endpoints: entity.endpoints,
      examples: entity.examples
    });

    this.writeFile(`entities/${entity.name.toLowerCase()}.html`, content);
  }

  /**
   * Generate search index
   */
  private async generateSearchIndex(sections: string[]): Promise<void> {
    const searchIndex = {
      sections,
      entities: this.getEntityDocumentation().map(e => e.name),
      endpoints: this.getAllEndpoints(),
      searchableContent: this.generateSearchableContent()
    };

    this.writeFile('search-index.json', JSON.stringify(searchIndex, null, 2));
  }

  /**
   * Generate navigation
   */
  private async generateNavigation(sections: string[]): Promise<void> {
    const navigation = this.templates.get('navigation') || this.getNavigationTemplate();
    const content = this.populateTemplate(navigation, {
      sections,
      currentSection: 'overview'
    });

    this.writeFile('navigation.html', content);
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Create subdirectories
    const subdirs = ['entities', 'assets', 'examples'];
    for (const subdir of subdirs) {
      const dirPath = path.join(this.outputDir, subdir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  /**
   * Write file to output directory
   */
  private writeFile(filename: string, content: string): void {
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Generated: ${filepath}`);
  }

  /**
   * Populate template with data
   */
  private populateTemplate(template: string, data: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      if (typeof value === 'string') {
        result = result.replace(new RegExp(placeholder, 'g'), value);
      } else if (typeof value === 'object') {
        result = result.replace(new RegExp(placeholder, 'g'), JSON.stringify(value, null, 2));
      } else {
        result = result.replace(new RegExp(placeholder, 'g'), String(value));
      }
    }

    return result;
  }

  /**
   * Initialize templates
   */
  private initializeTemplates(): void {
    // Basic HTML template structure
    const baseTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - REFUSE Protocol API Documentation</title>
    <link rel="stylesheet" href="assets/style.css">
    <script src="assets/script.js"></script>
</head>
<body>
    <div id="navigation"></div>
    <main class="content">
        <div id="breadcrumb"></div>
        <h1>{{title}}</h1>
        {{content}}
    </main>
    <div id="search-overlay"></div>
    <script>
        // Initialize interactive features
        initializeDocs();
    </script>
</body>
</html>`;

    this.templates.set('base', baseTemplate);
  }

  /**
   * Get overview template
   */
  private getOverviewTemplate(): string {
    return `
<div class="hero">
    <h1>{{protocolName}}</h1>
    <p class="version">Version {{version}}</p>
    <p class="description">{{description}}</p>
</div>

<div class="features">
    <h2>Key Features</h2>
    <ul>
        {{#features}}
        <li>{{.}}</li>
        {{/features}}
    </ul>
</div>

<div class="getting-started">
    <h2>Getting Started</h2>
    <div class="steps">
        {{gettingStarted}}
    </div>
</div>

<div class="api-endpoint">
    <h3>Base URL</h3>
    <code class="base-url">{{baseUrl}}</code>
</div>
`;
  }

  /**
   * Get authentication template
   */
  private getAuthenticationTemplate(): string {
    return `
<h2>Authentication Methods</h2>

<div class="auth-methods">
    {{#authMethods}}
    <div class="auth-method">
        <h3>{{name}}</h3>
        <p>{{description}}</p>
        <div class="example">
            <code>{{example}}</code>
        </div>
        <p><strong>Use Case:</strong> {{useCase}}</p>
    </div>
    {{/authMethods}}
</div>

<h2>API Key Management</h2>
<p>API keys can be managed through the developer portal or programmatically:</p>

<div class="code-example">
    <h4>Create API Key</h4>
    <pre><code>curl -X POST {{apiKeyHeader}} \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My App", "permissions": ["read", "write"]}' \\
  https://api.refuse-protocol.org/api-keys</code></pre>
</div>
`;
  }

  /**
   * Get entities template
   */
  private getEntitiesTemplate(): string {
    return `
<h2>Available Entities</h2>
<p>The REFUSE Protocol defines {{totalEntities}} core entities:</p>

<div class="entity-list">
    {{entityList}}
</div>

<div class="entity-grid">
    {{#entities}}
    <div class="entity-card" id="{{name.toLowerCase()}}">
        <h3>{{name}}</h3>
        <p>{{description}}</p>
        <div class="entity-stats">
            <span class="property-count">{{properties.length}} properties</span>
            <span class="endpoint-count">{{endpoints.length}} endpoints</span>
        </div>
        <a href="entities/{{name.toLowerCase()}}.html" class="view-details">View Details →</a>
    </div>
    {{/entities}}
</div>
`;
  }

  /**
   * Get entity template
   */
  private getEntityTemplate(): string {
    return `
<h2>{{entity}}</h2>
<p>{{description}}</p>

<h3>Properties</h3>
<div class="properties-table">
    <table>
        <thead>
            <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            {{#properties}}
            <tr>
                <td><code>{{name}}</code></td>
                <td>{{type}}</td>
                <td>{{required}}</td>
                <td>{{description}}</td>
            </tr>
            {{/properties}}
        </tbody>
    </table>
</div>

<h3>API Endpoints</h3>
<div class="endpoints">
    {{#endpoints}}
    <div class="endpoint">
        <div class="method {{method.toLowerCase()}}">{{method}}</div>
        <div class="path">{{path}}</div>
        <div class="description">{{description}}</div>
    </div>
    {{/endpoints}}
</div>

<h3>Examples</h3>
<div class="examples">
    {{#examples}}
    <div class="example">
        <h4>{{title}}</h4>
        <pre><code>{{code}}</code></pre>
    </div>
    {{/examples}}
</div>
`;
  }

  /**
   * Get events template
   */
  private getEventsTemplate(): string {
    return `
<h2>Event Streaming</h2>
<p>The REFUSE Protocol supports real-time event streaming for all entities.</p>

<h3>Event Types</h3>
<div class="event-types">
    <p>The following event types are supported:</p>
    <ul>
        {{#eventTypes}}
        <li><code>{{name}}</code> - {{description}}</li>
        {{/eventTypes}}
    </ul>
</div>

<h3>Event Streaming Example</h3>
<div class="code-example">
    {{streamingExample}}
</div>

<h3>Webhooks</h3>
<p>Set up webhooks to receive events in real-time:</p>

<div class="code-example">
    {{webhookExample}}
</div>
`;
  }

  /**
   * Get validation template
   */
  private getValidationTemplate(): string {
    return `
<h2>Data Validation</h2>
<p>All API requests are validated against JSON Schema and business rules.</p>

<h3>Validation Types</h3>
<ul>
    <li><strong>Schema Validation</strong>: JSON Schema compliance</li>
    <li><strong>Business Rules</strong>: Domain-specific validation</li>
    <li><strong>Data Quality</strong>: Completeness and consistency checks</li>
    <li><strong>Compliance</strong>: Regulatory compliance validation</li>
</ul>

<h3>Validation Rules</h3>
<div class="validation-rules">
    {{#validationRules}}
    <div class="rule">
        <h4>{{name}}</h4>
        <p>{{description}}</p>
        <div class="rule-details">
            <span class="rule-type">{{type}}</span>
            <span class="rule-severity {{severity}}">{{severity}}</span>
        </div>
    </div>
    {{/validationRules}}
</div>

<h3>Example Validation Request</h3>
<div class="code-example">
    {{exampleRequest}}
</div>
`;
  }

  /**
   * Get conformance template
   */
  private getConformanceTemplate(): string {
    return `
<h2>Protocol Conformance</h2>
<p>Ensure your implementation conforms to REFUSE Protocol standards.</p>

<h3>Conformance Standards</h3>
<div class="standards">
    {{#standards}}
    <div class="standard">
        <h4>{{name}}</h4>
        <p>{{description}}</p>
        <div class="standard-level">{{level}}</div>
    </div>
    {{/standards}}
</div>

<h3>Conformance Levels</h3>
<ul>
    <li><strong>Basic</strong>: Core functionality only</li>
    <li><strong>Standard</strong>: Recommended features included</li>
    <li><strong>Premium</strong>: Full feature set with advanced capabilities</li>
</ul>

<h3>Conformance Check</h3>
<div class="code-example">
    {{checkExample}}
</div>
`;
  }

  /**
   * Get testing template
   */
  private getTestingTemplate(): string {
    return `
<h2>Testing Tools</h2>
<p>Comprehensive testing tools to validate your integration.</p>

<h3>Available Tools</h3>
<ul>
    {{#testingTools}}
    <li>{{.}}</li>
    {{/testingTools}}
</ul>

<h3>Test Scenarios</h3>
<div class="test-scenarios">
    {{#testScenarios}}
    <div class="scenario">
        <h4>{{name}}</h4>
        <p>{{description}}</p>
        <div class="scenario-steps">
            {{steps}}
        </div>
    </div>
    {{/testScenarios}}
</div>

<h3>CLI Commands</h3>
<div class="cli-commands">
    {{#cliCommands}}
    <div class="command">
        <code>{{command}}</code>
        <p>{{description}}</p>
    </div>
    {{/cliCommands}}
</div>
`;
  }

  /**
   * Get SDK template
   */
  private getSDKTemplate(): string {
    return `
<h2>SDK Integration</h2>
<p>Use our official SDKs for seamless integration.</p>

<h3>Installation</h3>
<div class="installation">
    <h4>npm</h4>
    <code>{{installationCommands.npm}}</code>

    <h4>yarn</h4>
    <code>{{installationCommands.yarn}}</code>

    <h4>pip</h4>
    <code>{{installationCommands.pip}}</code>
</div>

<h3>Supported Languages</h3>
<ul>
    {{#supportedLanguages}}
    <li>{{.}}</li>
    {{/supportedLanguages}}
</ul>

<h3>SDK Examples</h3>
<div class="sdk-examples">
    {{#sdkExamples}}
    <div class="sdk-example">
        <h4>{{title}}</h4>
        <pre><code>{{code}}</code></pre>
    </div>
    {{/sdkExamples}}
</div>
`;
  }

  /**
   * Get playground template
   */
  private getPlaygroundTemplate(): string {
    return `
<h2>Interactive API Playground</h2>
<p>Test API endpoints directly from your browser.</p>

<div class="playground-container">
    <div class="playground-controls">
        <select id="entity-select">
            <option value="customer" {{#defaultEntity === 'customer'}}selected{{/defaultEntity}}>Customer</option>
            <option value="service" {{#defaultEntity === 'service'}}selected{{/defaultEntity}}>Service</option>
            <option value="route" {{#defaultEntity === 'route'}}selected{{/defaultEntity}}>Route</option>
            <option value="facility" {{#defaultEntity === 'facility'}}selected{{/defaultEntity}}>Facility</option>
        </select>

        <select id="method-select">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
        </select>

        <button id="send-request" onclick="sendRequest()">Send Request</button>
    </div>

    <div class="playground-input">
        <h3>Request</h3>
        <textarea id="request-data" placeholder="Enter request data (JSON)">
{{#sampleRequests}}
{{.}}
{{/sampleRequests}}</textarea>
    </div>

    <div class="playground-output">
        <h3>Response</h3>
        <pre id="response-data"></pre>
    </div>
</div>

<script>
function sendRequest() {
    const entity = document.getElementById('entity-select').value;
    const method = document.getElementById('method-select').value;
    const data = document.getElementById('request-data').value;

    fetch('{{apiEndpoint}}/' + entity, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'your-api-key-here'
        },
        body: method !== 'GET' ? data : undefined
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('response-data').textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
        document.getElementById('response-data').textContent = 'Error: ' + error.message;
    });
}
</script>
`;
  }

  /**
   * Get navigation template
   */
  private getNavigationTemplate(): string {
    return `
<nav class="sidebar">
    <div class="nav-brand">
        <h3>REFUSE Protocol</h3>
        <span class="version">v1.0</span>
    </div>

    <ul class="nav-menu">
        {{#sections}}
        <li class="nav-item {{#currentSection === .toLowerCase()}}active{{/currentSection}}">
            <a href="{{.toLowerCase()}}.html">{{.}}</a>
        </li>
        {{/sections}}
    </ul>

    <div class="nav-footer">
        <div class="search-box">
            <input type="text" placeholder="Search documentation..." id="search-input">
            <div id="search-results"></div>
        </div>
    </div>
</nav>
`;
  }

  // Data generation methods
  private getEntityDocumentation(): EntityDocumentation[] {
    return [
      {
        name: 'Customer',
        description: 'Customer entities represent waste management service recipients',
        properties: [
          { name: 'id', type: 'string', required: true, description: 'Unique identifier' },
          { name: 'name', type: 'string', required: true, description: 'Customer name' },
          { name: 'type', type: 'string', required: true, description: 'Customer type' },
          { name: 'contactInfo', type: 'object', required: true, description: 'Contact information' },
          { name: 'serviceArea', type: 'string', required: false, description: 'Service area' }
        ],
        endpoints: [
          { method: 'GET', path: '/customers', description: 'List all customers' },
          { method: 'POST', path: '/customers', description: 'Create a customer' },
          { method: 'GET', path: '/customers/{id}', description: 'Get customer by ID' },
          { method: 'PUT', path: '/customers/{id}', description: 'Update customer' },
          { method: 'DELETE', path: '/customers/{id}', description: 'Delete customer' }
        ],
        examples: [
          {
            title: 'Create Customer',
            code: JSON.stringify({
              name: 'Acme Corporation',
              type: 'commercial',
              contactInfo: {
                primaryPhone: '555-0100',
                email: 'contact@acme.com',
                address: {
                  street: '123 Business St',
                  city: 'Business City',
                  state: 'BC',
                  zipCode: '12345'
                }
              }
            }, null, 2)
          }
        ]
      }
    ];
  }

  private getEventTypeDocumentation(): EventTypeDocumentation[] {
    return [
      { name: 'created', description: 'Entity was created' },
      { name: 'updated', description: 'Entity was updated' },
      { name: 'deleted', description: 'Entity was deleted' },
      { name: 'status_changed', description: 'Entity status changed' }
    ];
  }

  private getValidationRulesDocumentation(): ValidationRuleDocumentation[] {
    return [
      { name: 'Required Fields', type: 'schema', severity: 'error' },
      { name: 'Data Types', type: 'schema', severity: 'error' },
      { name: 'Business Constraints', type: 'business', severity: 'warning' }
    ];
  }

  private getConformanceStandardsDocumentation(): ConformanceStandardDocumentation[] {
    return [
      { name: 'Basic Conformance', level: 'basic', description: 'Core protocol features' },
      { name: 'Standard Conformance', level: 'standard', description: 'Recommended features' },
      { name: 'Premium Conformance', level: 'premium', description: 'Advanced features' }
    ];
  }

  private getTestScenarios(): TestScenario[] {
    return [
      { name: 'Customer Creation', description: 'Test customer entity creation' },
      { name: 'Event Streaming', description: 'Test real-time event functionality' },
      { name: 'Data Validation', description: 'Test schema and business rule validation' }
    ];
  }

  private getCLICommandExamples(): CLICommand[] {
    return [
      { command: 'refuse-protocol validate compliance data.json', description: 'Validate data compliance' },
      { command: 'refuse-protocol conformance check ./src', description: 'Check implementation conformance' },
      { command: 'refuse-protocol benchmark run -d 60', description: 'Run performance benchmarks' }
    ];
  }

  private getSDKExamples(): SDKExample[] {
    return [
      {
        title: 'TypeScript SDK Usage',
        code: `import { RefuseProtocolSDK } from '@refuse-protocol/sdk';

const sdk = new RefuseProtocolSDK({
  baseUrl: 'https://api.refuse-protocol.org',
  apiKey: 'your-api-key'
});

const customer = await sdk.createClient('customer').create({
  name: 'Acme Corp',
  type: 'commercial'
});`
      }
    ];
  }

  private getSampleRequests(): string {
    return `{
  "name": "Sample Customer",
  "type": "commercial",
  "contactInfo": {
    "primaryPhone": "555-0123",
    "email": "customer@example.com",
    "address": {
      "street": "123 Sample St",
      "city": "Sample City",
      "state": "SC",
      "zipCode": "12345"
    }
  }
}`;
  }

  private getResponseExamples(): string {
    return `{
  "id": "CUST001",
  "name": "Sample Customer",
  "type": "commercial",
  "status": "active",
  "contactInfo": {
    "primaryPhone": "555-0123",
    "email": "customer@example.com",
    "address": {
      "street": "123 Sample St",
      "city": "Sample City",
      "state": "SC",
      "zipCode": "12345"
    }
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "version": 1
}`;
  }

  private getEventStreamingExample(): string {
    return `// Subscribe to customer events
const subscriptionId = sdk.subscribeToEvents(
  { entityType: 'customer' },
  (event) => {
    console.log('Customer event:', event);
  }
);

// Publish customer event
await sdk.publishEvent({
  entityType: 'customer',
  eventType: 'created',
  eventData: { id: 'CUST001' }
});`;
  }

  private getWebhookExample(): string {
    return `// Webhook endpoint for customer events
app.post('/webhooks/customer', (req, res) => {
  const event = req.body;

  switch (event.eventType) {
    case 'created':
      handleCustomerCreated(event.eventData);
      break;
    case 'updated':
      handleCustomerUpdated(event.eventData);
      break;
    case 'deleted':
      handleCustomerDeleted(event.eventData);
      break;
  }

  res.json({ received: true });
});`;
  }

  private getValidationExample(): string {
    return `// Validate customer data
const validationResult = await sdk.validateCompliance({
  name: 'Acme Corp',
  type: 'commercial',
  contactInfo: {
    primaryPhone: '555-0100',
    email: 'contact@acme.com'
  }
});

if (!validationResult.compliant) {
  console.log('Validation errors:', validationResult.violations);
}`;
  }

  private getConformanceCheckExample(): string {
    return `// Check implementation conformance
const conformanceResult = await sdk.checkConformance({
  implementationPath: './src',
  type: 'api',
  standard: 'refuse-protocol-v1'
});

console.log('Conformance Score:', conformanceResult.score);
console.log('Issues:', conformanceResult.issues);`;
  }

  private getAllEndpoints(): string[] {
    return [
      'GET /customers',
      'POST /customers',
      'GET /customers/{id}',
      'PUT /customers/{id}',
      'DELETE /customers/{id}',
      'GET /services',
      'POST /services',
      'GET /services/{id}',
      'PUT /services/{id}',
      'DELETE /services/{id}'
    ];
  }

  private generateSearchableContent(): SearchableContent {
    return {
      entities: this.getEntityDocumentation(),
      endpoints: this.getAllEndpoints(),
      sections: ['Overview', 'Authentication', 'Entities', 'Events', 'Validation', 'Conformance', 'Testing', 'SDK'],
      searchableTerms: [
        'customer', 'service', 'route', 'facility', 'event',
        'validation', 'conformance', 'authentication', 'SDK',
        'REST API', 'JSON Schema', 'webhook', 'streaming'
      ]
    };
  }
}

/**
 * Documentation options
 */
export interface DocsOptions {
  baseUrl?: string;
  outputFormat?: 'html' | 'pdf' | 'json';
  includeExamples?: boolean;
  includePlayground?: boolean;
  theme?: 'default' | 'dark' | 'light';
  sections?: string[];
}

/**
 * Generation result
 */
export interface GenerationResult {
  success: boolean;
  filesGenerated: string[];
  sections: string[];
  generatedAt: Date;
  metadata: {
    version: string;
    protocolVersion: string;
    generationOptions: DocsOptions;
  };
  error?: string;
}

/**
 * Entity documentation
 */
export interface EntityDocumentation {
  name: string;
  description: string;
  properties: PropertyDocumentation[];
  endpoints: EndpointDocumentation[];
  examples: ExampleDocumentation[];
}

/**
 * Property documentation
 */
export interface PropertyDocumentation {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

/**
 * Endpoint documentation
 */
export interface EndpointDocumentation {
  method: string;
  path: string;
  description: string;
}

/**
 * Example documentation
 */
export interface ExampleDocumentation {
  title: string;
  code: string;
}

/**
 * Event type documentation
 */
export interface EventTypeDocumentation {
  name: string;
  description: string;
}

/**
 * Validation rule documentation
 */
export interface ValidationRuleDocumentation {
  name: string;
  type: string;
  severity: string;
}

/**
 * Conformance standard documentation
 */
export interface ConformanceStandardDocumentation {
  name: string;
  level: string;
  description: string;
}

/**
 * Test scenario
 */
export interface TestScenario {
  name: string;
  description: string;
  steps?: string;
}

/**
 * CLI command
 */
export interface CLICommand {
  command: string;
  description: string;
}

/**
 * SDK example
 */
export interface SDKExample {
  title: string;
  code: string;
}

/**
 * Searchable content
 */
export interface SearchableContent {
  entities: EntityDocumentation[];
  endpoints: string[];
  sections: string[];
  searchableTerms: string[];
}

/**
 * Export factory function
 */
export function createInteractiveAPIDocsGenerator(outputDir?: string): InteractiveAPIDocsGenerator {
  return new InteractiveAPIDocsGenerator(outputDir);
}

// Export types
export type {
  DocsOptions,
  GenerationResult,
  EntityDocumentation,
  PropertyDocumentation,
  EndpointDocumentation,
  ExampleDocumentation,
  EventTypeDocumentation,
  ValidationRuleDocumentation,
  ConformanceStandardDocumentation,
  TestScenario,
  CLICommand,
  SDKExample,
  SearchableContent
};
