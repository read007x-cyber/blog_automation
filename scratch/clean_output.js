const fs = require('fs');
const path = require('path');

const targetDir = '/Users/jsh/main/output';

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

console.log('Successfully cleaned output directory.');
