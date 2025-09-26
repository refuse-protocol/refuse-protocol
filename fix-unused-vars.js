const fs = require('fs');
const path = require('path');

// Find all TypeScript files
const findTSFiles = (dir) => {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && item !== 'node_modules' && item !== 'dist') {
      files.push(...findTSFiles(fullPath));
    } else if (item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
};

// Fix unused variables in a file
const fixUnusedVars = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace unused variables with underscore prefix
  content = content.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*([^;]+);/g, (match, vars, value) => {
    const varList = vars.split(',').map(v => v.trim());
    const unusedVars = varList.filter(v => !v.startsWith('_') && v.includes(':'));

    if (unusedVars.length > 0) {
      const fixedVars = varList.map(v => {
        if (unusedVars.some(uv => v.includes(uv))) {
          return v.replace(/^(\s*)([^:]+)(\s*:)/, '$1_$2$3');
        }
        return v;
      });

      changed = true;
      return `const { ${fixedVars.join(', ')} } = ${value};`;
    }

    return match;
  });

  // Remove unused imports
  content = content.replace(/import\s*{\s*([^}]+)\s*}\s*from\s*['"][^'"]+['"]/g, (match, imports) => {
    const importList = imports.split(',').map(i => i.trim());
    const usedImports = importList.filter(i => !i.startsWith('_'));
    if (usedImports.length !== importList.length) {
      changed = true;
      return `import { ${usedImports.join(', ')} } from '${match.match(/from\s*['"]([^'"]+)['"]/)[1]}'`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
};

// Process all files
const files = findTSFiles('./protocol').concat(findTSFiles('./tests'));
files.forEach(fixUnusedVars);

console.log('Done fixing unused variables');
