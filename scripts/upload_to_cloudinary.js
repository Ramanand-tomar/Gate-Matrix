const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
if (process.loadEnvFile) {
  process.loadEnvFile('.env.local');
} else {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  } catch {}
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'djbuumzmi';
const apiKey = process.env.CLOUDINARY_API_KEY || '141527826619257';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '806i01tFAynK3f_T2EBURd-VLMs';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

const IMG_DIR = path.join(process.cwd(), 'public', 'data', 'papers', 'img');
const MANIFEST_PATH = path.join(process.cwd(), 'scratch', 'cloudinary_uploaded.json');

// Load existing upload manifest if available
let uploadedManifest = {};
if (fs.existsSync(MANIFEST_PATH)) {
  try {
    uploadedManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {}
}

async function uploadFile(filename) {
  const filePath = path.join(IMG_DIR, filename);
  const publicId = path.parse(filename).name;

  try {
    const res = await cloudinary.uploader.upload(filePath, {
      folder: 'gate_matrix/papers/img',
      public_id: publicId,
      overwrite: false,
      resource_type: 'image',
    });
    uploadedManifest[filename] = res.secure_url;
    return { success: true, filename, url: res.secure_url };
  } catch (err) {
    // If it already exists on Cloudinary or overwrite was false, still record URL
    if (err.http_code === 400 || (err.message && err.message.includes('already exists'))) {
      const fallbackUrl = `https://res.cloudinary.com/${cloudName}/image/upload/gate_matrix/papers/img/${filename}`;
      uploadedManifest[filename] = fallbackUrl;
      return { success: true, filename, url: fallbackUrl, skipped: true };
    }
    return { success: false, filename, error: err.message || String(err) };
  }
}

async function main() {
  console.log('========================================================');
  console.log(`Cloudinary Batch Uploader (Cloud: ${cloudName})`);
  console.log('========================================================');

  if (!fs.existsSync(IMG_DIR)) {
    console.error('Image directory not found:', IMG_DIR);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(IMG_DIR).filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f));
  const pendingFiles = allFiles.filter((f) => !uploadedManifest[f]);

  console.log(`Total images on disk: ${allFiles.length}`);
  console.log(`Already uploaded / cached: ${Object.keys(uploadedManifest).length}`);
  console.log(`Remaining to upload: ${pendingFiles.length}`);

  if (pendingFiles.length === 0) {
    console.log('All images are already uploaded to Cloudinary!');
    return;
  }

  const CONCURRENCY = 15;
  let currentIndex = 0;
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  async function worker(workerId) {
    while (currentIndex < pendingFiles.length) {
      const index = currentIndex++;
      const file = pendingFiles[index];
      const result = await uploadFile(file);

      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`[Worker ${workerId}] Failed: ${file} - ${result.error}`);
      }

      const totalDone = Object.keys(uploadedManifest).length;
      if (totalDone % 100 === 0 || index === pendingFiles.length - 1) {
        // Save progress to manifest
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(uploadedManifest, null, 2));
        const rate = (successCount / ((Date.now() - startTime) / 1000)).toFixed(1);
        console.log(`Progress: ${totalDone}/${allFiles.length} (${rate} uploads/sec) - Failed: ${failCount}`);
      }
    }
  }

  console.log(`Starting upload pool with concurrency ${CONCURRENCY}...`);
  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  // Final manifest save
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(uploadedManifest, null, 2));

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('========================================================');
  console.log(`Upload Complete in ${totalTime}s! Success: ${successCount}, Failed: ${failCount}`);
  console.log(`Total Cloudinary assets registered: ${Object.keys(uploadedManifest).length}`);
  console.log('========================================================');
}

main().catch((err) => {
  console.error('Fatal error in uploader:', err);
  process.exit(1);
});
