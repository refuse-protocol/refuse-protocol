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

// Fix duplicate imports in a file
const fixDuplicates = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Remove duplicate import lines
  const lines = content.split('\n');
  const uniqueLines = [];
  const seen = new Set();

  for (const line of lines) {
    if (line.startsWith('import')) {
      if (!seen.has(line)) {
        seen.add(line);
        uniqueLines.push(line);
      } else {
        changed = true;
      }
    } else {
      uniqueLines.push(line);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, uniqueLines.join('\n'), 'utf8');
    console.log(`Fixed duplicates: ${filePath}`);
  }
};

// Process all files
const files = findTSFiles('./protocol').concat(findTSFiles('./tests'));
files.forEach(fixDuplicates);

console.log('Done fixing duplicates');
