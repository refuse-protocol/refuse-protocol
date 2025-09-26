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

// Fix malformed comments in a file
const fixComments = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace malformed CONSOLE comments
  content = content.replace(/\/\/ CONSOLE:\s*/g, (match) => {
    changed = true;
    return '  ';
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed comments: ${filePath}`);
  }
};

// Process all files
const files = findTSFiles('./protocol').concat(findTSFiles('./tests'));
files.forEach(fixComments);

console.log('Done fixing malformed comments');
