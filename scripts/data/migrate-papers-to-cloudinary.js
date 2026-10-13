const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PAPERS_DIR = path.join(process.cwd(), 'public', 'data', 'papers');
const IMG_DIR = path.join(PAPERS_DIR, 'img');
const CLOUDINARY_PREFIX = 'https://res.cloudinary.com/djbuumzmi/image/upload/gate_matrix/papers/img/';

// Build map of hash -> filename from existing disk images
const diskFiles = fs.readdirSync(IMG_DIR);
const hashToFileMap = new Map();

for (const file of diskFiles) {
  // Filenames are e.g. cs_23d2f00fd510.png, ce_..., etc.
  const m = file.match(/^[a-z]+_([a-f0-9]{12})\.(?:png|jpe?g|gif|webp)$/i);
  if (m) {
    hashToFileMap.set(m[1].toLowerCase(), file);
  }
}

console.log(`Loaded ${hashToFileMap.size} hash mappings from ${diskFiles.length} disk images.`);

function replaceBase64WithCloudinary(text, fallbackPrefix = 'cs') {
  if (typeof text !== 'string') return text;
  return text.replace(/data:image\/(png|jpe?g|gif);base64,([A-Za-z0-9+/=]+)/g, (match, ext, b64) => {
    const hash = crypto.createHash('md5').update(b64).digest('hex').slice(0, 12).toLowerCase();
    const existingFile = hashToFileMap.get(hash);
    const fname = existingFile || `${fallbackPrefix}_${hash}.${ext === 'jpeg' ? 'jpg' : ext}`;
    return `${CLOUDINARY_PREFIX}${fname}`;
  });
}

function replaceLocalUrlsWithCloudinary(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/(?:https?:\/\/[^\s"'<>]*)?\/data\/papers\/img\/([a-zA-Z0-9_\-\.]+\.(?:png|jpe?g|gif|webp))/g, (m, fname) => {
    return `${CLOUDINARY_PREFIX}${fname}`;
  });
}

function processValue(val, prefix) {
  if (typeof val === 'string') {
    return replaceLocalUrlsWithCloudinary(replaceBase64WithCloudinary(val, prefix));
  }
  if (Array.isArray(val)) {
    return val.map((v) => processValue(v, prefix));
  }
  if (val && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = processValue(v, prefix);
    }
    return out;
  }
  return val;
}

function main() {
  const files = fs.readdirSync(PAPERS_DIR).filter((f) => f.endsWith('.json'));
  console.log(`Processing ${files.length} papers in ${PAPERS_DIR}...`);

  let totalBeforeBytes = 0;
  let totalAfterBytes = 0;

  for (const f of files) {
    const filePath = path.join(PAPERS_DIR, f);
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const beforeBytes = Buffer.byteLength(rawContent, 'utf8');
    totalBeforeBytes += beforeBytes;

    const data = JSON.parse(rawContent);
    const branchPrefix = (data.branch || 'cs').toLowerCase();
    const migratedData = processValue(data, branchPrefix);

    const migratedStr = JSON.stringify(migratedData);
    const afterBytes = Buffer.byteLength(migratedStr, 'utf8');
    totalAfterBytes += afterBytes;

    fs.writeFileSync(filePath, migratedStr);
    const reduction = (((beforeBytes - afterBytes) / beforeBytes) * 100).toFixed(1);
    console.log(`[OK] ${f}: ${Math.round(beforeBytes / 1024)}KB -> ${Math.round(afterBytes / 1024)}KB (-${reduction}%)`);
  }

  console.log('========================================================');
  console.log(`Total size before: ${(totalBeforeBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total size after:  ${(totalAfterBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total bandwidth saved: ${(((totalBeforeBytes - totalAfterBytes) / totalBeforeBytes) * 100).toFixed(1)}%`);
  console.log('========================================================');
}

main();
