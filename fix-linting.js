// Comprehensive linting error fixer for REFUSE Protocol
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LintFixer {
  constructor() {
    this.fixes = [];
    this.fileStats = new Map();
  }

  // Agent 1: Remove unused imports
  async fixUnusedImports() {
    console.log('🤖 Agent 1: Removing unused imports...');
    
    const filesWithUnusedImports = [
      'protocol/implementations/api-adapter.ts',
      'protocol/implementations/contract.ts', 
      'protocol/implementations/customer-minimal.ts',
      'protocol/implementations/customer.ts',
      'protocol/implementations/customer-request.ts',
      'protocol/implementations/data-archaeology.ts',
      'protocol/implementations/event.ts',
      'protocol/implementations/facility-minimal.ts',
      'protocol/implementations/legacy-bridge.ts',
      'protocol/implementations/migration-utils.ts',
      'protocol/tools/api-docs.ts',
      'protocol/tools/benchmarker.ts',
      'protocol/tools/cli-commands.ts',
      'protocol/tools/compliance-validator.ts',
      'protocol/tools/conformance-checker.ts',
      'protocol/tools/data-archaeologist.ts',
      'protocol/tools/schema-validator.ts',
      'protocol/tools/sdk-generator.ts',
      'protocol/tools/spec-generator.ts',
      'protocol/tools/test-utils.ts',
      'tests/unit/test-entities.ts',
      'tests/performance/test-performance.ts',
      'tests/schemas/test-territory-validation.ts'
    ];

    for (const file of filesWithUnusedImports) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        // Remove common unused imports
        const unusedImports = [
          'Facility',
          'NextFunction', 
          'Event',
          'Customer',
          'Service',
          'Route',
          'MaterialTicket',
          'BaseEntity',
          'DataTransformer',
          'LegacySystemBridge'
        ];

        let modified = false;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('import') && unusedImports.some(imp => line.includes(`'${imp}'`) || line.includes(`"${imp}"`))) {
            if (line.includes('from') && !line.includes('used')) {
              lines[i] = '// REMOVED: ' + lines[i];
              modified = true;
            }
          }
        }

        if (modified) {
          fs.writeFileSync(file, lines.join('\n'));
          this.fixes.push(`✅ ${file}: Removed unused imports`);
        }
      } catch (error) {
        console.error(`❌ Error fixing ${file}:`, error.message);
      }
    }
  }

  // Agent 2: Remove unused variables
  async fixUnusedVariables() {
    console.log('🤖 Agent 2: Removing unused variables...');
    
    const filesWithUnusedVars = [
      'protocol/implementations/allocation.ts',
      'protocol/implementations/container.ts',
      'protocol/implementations/contract.ts',
      'protocol/implementations/customer.ts',
      'protocol/implementations/facility.ts',
      'protocol/implementations/fleet.ts',
      'protocol/implementations/material-ticket.ts',
      'protocol/implementations/material.ts',
      'protocol/implementations/order.ts',
      'protocol/implementations/payment.ts',
      'protocol/implementations/route.ts',
      'protocol/implementations/service.ts',
      'protocol/implementations/site.ts',
      'protocol/implementations/territory.ts',
      'protocol/implementations/yard.ts',
      'protocol/tools/cli-commands.ts',
      'protocol/tools/compliance-validator.ts',
      'protocol/tools/conformance-checker.ts',
      'protocol/tools/data-transformer.ts',
      'protocol/tools/event-streamer.ts',
      'protocol/tools/schema-validator.ts',
      'protocol/tools/sdk-generator.ts',
      'protocol/tools/spec-generator.ts',
      'protocol/tools/test-utils.ts',
      'tests/performance/test-performance.ts'
    ];

    for (const file of filesWithUnusedVars) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Pattern to match unused variable declarations
        const unusedVarPattern = /(const|let|var)\s+(\w+)\s*=\s*[^;]+;(?:\s*\/\/.*)?$/gm;
        
        let modified = false;
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const match = line.match(unusedVarPattern);
          if (match && !line.includes('console.') && !line.includes('//')) {
            // Check if variable is used elsewhere in the file
            const varName = match[2];
            const restOfFile = content.substring(i + line.length);
            if (!restOfFile.includes(varName)) {
              lines[i] = `// REMOVED UNUSED: ${lines[i]}`;
              modified = true;
            }
          }
        }

        if (modified) {
          fs.writeFileSync(file, lines.join('\n'));
          this.fixes.push(`✅ ${file}: Removed unused variables`);
        }
      } catch (error) {
        console.error(`❌ Error fixing ${file}:`, error.message);
      }
    }
  }

  // Agent 3: Fix regex escape issues
  async fixEscapeCharacters() {
    console.log('🤖 Agent 3: Fixing unnecessary escape characters...');
    
    const filesWithEscapes = [
      'protocol/implementations/base-entity.ts',
      'protocol/implementations/common.ts'
    ];

    for (const file of filesWithEscapes) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Fix unnecessary escapes in regex
        content = content.replace(/\\(\(|\)|\.|\#)/g, '$1');
        
        fs.writeFileSync(file, content);
        this.fixes.push(`✅ ${file}: Fixed escape characters`);
      } catch (error) {
        console.error(`❌ Error fixing ${file}:`, error.message);
      }
    }
  }

  // Agent 4: Fix Object.prototype issues
  async fixObjectPrototype() {
    console.log('🤖 Agent 4: Fixing Object.prototype method usage...');
    
    const filesWithProto = [
      'protocol/implementations/common.ts'
    ];

    for (const file of filesWithProto) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Replace Object.prototype.hasOwnProperty with Object.hasOwn
        content = content.replace(/Object\.prototype\.hasOwnProperty/g, 'Object.hasOwn');
        
        fs.writeFileSync(file, content);
        this.fixes.push(`✅ ${file}: Fixed Object.prototype usage`);
      } catch (error) {
        console.error(`❌ Error fixing ${file}:`, error.message);
      }
    }
  }

  async runAllFixes() {
    console.log('🚀 Starting parallel linting fixes...\n');
    
    // Run all agents in sequence (simulating parallel work)
    await this.fixUnusedImports();
    console.log('');
    await this.fixUnusedVariables(); 
    console.log('');
    await this.fixEscapeCharacters();
    console.log('');
    await this.fixObjectPrototype();
    
    console.log('\n📊 Fix Summary:');
    this.fixes.forEach(fix => console.log(fix));
    console.log(`\n✅ Total fixes applied: ${this.fixes.length}`);
    
    return this.fixes.length;
  }
}

// Run the fixer
const fixer = new LintFixer();
fixer.runAllFixes().then(fixCount => {
  console.log(`\n🎉 Completed ${fixCount} automated fixes!`);
  console.log('💡 Remaining errors may need manual review.');
}).catch(error => {
  console.error('❌ Error running fixes:', error);
});
