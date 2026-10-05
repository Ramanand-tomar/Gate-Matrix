const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = [
  new RegExp('-----BEGIN ' + 'PRIVATE KEY-----'),
  new RegExp('serviceAccountKey' + '\\.json'),
  new RegExp('"private_key"' + ':\\s*"-----BEGIN'),
  new RegExp('AIzaSy' + '[A-Za-z0-9_-]{33}')
];

const IGNORE_DIRS = ['node_modules', '.next', '.git', 'scraped_dataset', 'docs'];

function scanDir(dir) {
  let hasSecrets = false;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (IGNORE_DIRS.includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (scanDir(fullPath)) hasSecrets = true;
    } else {
      if ((file.endsWith('.json') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) && !file.startsWith('.env')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(content) && !file.includes('.example')) {
            console.error(`❌ Potential secret detected in ${fullPath}`);
            hasSecrets = true;
          }
        }
      }
    }
  }
  return hasSecrets;
}

console.log('🔍 Scanning repository for secret leakage...');
const foundSecrets = scanDir(process.cwd());
if (foundSecrets) {
  console.error('❌ Secret security check failed!');
  process.exit(1);
} else {
  console.log('✅ Secret security check passed: No secret keys found in project codebase.');
}
