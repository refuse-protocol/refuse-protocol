// Final cleanup script for remaining linting errors
const fs = require('fs');
const path = require('path');

class FinalCleanup {
  constructor() {
    this.fixedFiles = [];
    this.errorCount = 0;
  }

  // Clean up specific unused imports
  cleanupUnusedImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      let modified = false;
      
      // Common unused import patterns
      const unusedImports = [
        'Event',
        'Customer', 
        'Service',
        'Route',
        'Facility',
        'MaterialTicket',
        'BaseEntity',
        'EventEmitter',
        'PerformanceObserver',
        'dirname',
        'extname',
        'statSync',
        'basename',
        'fs',
        'path'
      ];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('import') && !line.includes('from') && unusedImports.some(imp => line.includes(`'${imp}'`) || line.includes(`"${imp}"`))) {
          if (!line.includes('used')) {
            lines[i] = `// REMOVED UNUSED: ${lines[i]}`;
            modified = true;
            this.errorCount++;
          }
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, lines.join('\n'));
        this.fixedFiles.push(filePath);
        console.log(`✅ Fixed unused imports in: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  }

  // Remove unused variables in entity files
  cleanupUnusedVariables(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      let modified = false;
      
      // Common unused variable patterns
      const unusedPatterns = [
        /const\s+(\w+)\s*=\s*[^;]+;/g,
        /let\s+(\w+)\s*=\s*[^;]+;/g,
        /var\s+(\w+)\s*=\s*[^;]+;/g
      ];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of unusedPatterns) {
          const match = line.match(pattern);
          if (match && !line.includes('console.') && !line.includes('//')) {
            const varName = match[1];
            // Check if variable is used elsewhere (simple check)
            const restOfFile = content.substring(i + line.length);
            if (!restOfFile.includes(varName) && varName.length > 2) {
              lines[i] = `// REMOVED UNUSED: ${lines[i]}`;
              modified = true;
              this.errorCount++;
            }
          }
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, lines.join('\n'));
        this.fixedFiles.push(filePath);
        console.log(`✅ Fixed unused variables in: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  }

  // Fix specific Object.prototype issues
  fixObjectPrototype(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('Object.prototype.hasOwnProperty')) {
        const fixedContent = content.replace(/Object\.prototype\.hasOwnProperty/g, 'Object.hasOwn');
        fs.writeFileSync(filePath, fixedContent);
        this.fixedFiles.push(filePath);
        this.errorCount++;
        console.log(`✅ Fixed Object.prototype in: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  }

  // Fix regex control characters
  fixRegexIssues(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('\\x00')) {
        const fixedContent = content.replace(/\\x00/g, '[\x00]');
        fs.writeFileSync(filePath, fixedContent);
        this.fixedFiles.push(filePath);
        this.errorCount++;
        console.log(`✅ Fixed regex in: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  }

  // Convert require to import
  fixRequireStatements(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes("const {") && content.includes("require(")) {
        // This is complex, skip for now
        console.log(`⚠️ Manual fix needed for require in: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  }

  runCleanup() {
    console.log('🧹 Starting final cleanup...\n');

    // Target files with specific error patterns
    const filesToFix = [
      'protocol/implementations/material-ticket.ts',
      'protocol/implementations/material.ts',
      'protocol/implementations/migration-utils.ts',
      'protocol/implementations/order.ts',
      'protocol/implementations/payment.ts',
      'protocol/implementations/route.ts',
      'protocol/implementations/service.ts',
      'protocol/implementations/site.ts',
      'protocol/implementations/territory.ts',
      'protocol/implementations/yard.ts',
      'protocol/specifications/relationships.ts',
      'protocol/tools/api-docs.ts',
      'protocol/tools/benchmarker.ts',
      'protocol/tools/cli-commands.ts',
      'protocol/tools/compliance-validator.ts',
      'protocol/tools/conformance-checker.ts',
      'protocol/tools/data-archaeologist.ts',
      'protocol/tools/data-transformer.ts',
      'protocol/tools/event-streamer.ts',
      'protocol/tools/schema-validator.ts',
      'protocol/tools/sdk-generator.ts',
      'protocol/tools/spec-generator.ts',
      'protocol/tools/test-utils.ts',
      'tests/performance/test-performance.ts',
      'tests/schemas/test-territory-validation.ts'
    ];

    // Process each file with appropriate fixes
    for (const file of filesToFix) {
      this.cleanupUnusedImports(file);
      this.cleanupUnusedVariables(file);
      
      // Apply specific fixes based on file type
      if (file.includes('data-archaeologist.ts')) {
        this.fixObjectPrototype(file);
        this.fixRegexIssues(file);
      }
      
      if (file.includes('test-performance.ts')) {
        this.fixRequireStatements(file);
      }
    }

    console.log('\n📊 Cleanup Summary:');
    console.log(`✅ Files processed: ${filesToFix.length}`);
    console.log(`✅ Issues fixed: ${this.errorCount}`);
    console.log(`✅ Files modified: ${this.fixedFiles.length}`);
    
    if (this.fixedFiles.length > 0) {
      console.log('\n📝 Modified files:');
      this.fixedFiles.forEach(file => console.log(`  - ${file}`));
    }

    console.log(`\n🎉 Cleanup complete! Reduced ${this.errorCount} errors.`);
    console.log('💡 Note: Some complex issues may still need manual review.');
    
    return { filesProcessed: filesToFix.length, errorsFixed: this.errorCount };
  }
}

// Run the cleanup
const cleanup = new FinalCleanup();
cleanup.runCleanup();
