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

// Fix malformed destructuring in a file
const fixDestructuring = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix malformed destructuring patterns
  content = content.replace(/const\s*{\s*_id,\s*_createdAt,\s*_updatedAt,\s*_version,\s*_([^}]+)\s*}\s*=\s*([^;]+);/g, (match, eventData, value) => {
    changed = true;
    return `    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, version: _version, ${eventData} } = ${value};`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed destructuring: ${filePath}`);
  }
};

// Process all implementation files
const files = findTSFiles('./protocol/implementations');
files.forEach(fixDestructuring);

console.log('Done fixing destructuring');
