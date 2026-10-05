const fs = require('fs');
const path = require('path');

const DATASET_DIR = path.join(process.cwd(), 'scraped_dataset');

function runDryRunImport() {
  console.log('========================================================');
  console.log('🧪 GATEPrep Studio — Phase 03 Schema Normalization Dry-Run');
  console.log('========================================================');

  if (!fs.existsSync(DATASET_DIR)) {
    console.error(`❌ Dataset directory not found: ${DATASET_DIR}`);
    process.exit(1);
  }

  const sampleFile = path.join(DATASET_DIR, 'COMPUTER_SCIENCE_ENGINEERING', '001_Advance_Level_Test-1_Full_Syllabus_GATE_2025_CS.json');
  if (!fs.existsSync(sampleFile)) {
    console.error(`❌ Sample paper file not found: ${sampleFile}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(sampleFile, 'utf-8');
  const paper = JSON.parse(rawContent);

  console.log(`📄 Inspecting Paper: "${paper.title}"`);
  console.log(`📌 Branch: ${paper.branch} | Provider: ${paper.provider}`);
  console.log(`📊 Reported Questions: ${paper.total_questions}`);

  let qvCount = 0;
  let keyCount = 0;
  let itemsCount = 0;

  paper.questions.forEach((q, idx) => {
    qvCount++;
    keyCount++;
    itemsCount++;
  });

  console.log('\n========================================================');
  console.log('✅ DRY-RUN RESULT: ZERO WRITES TO PRODUCTION DATABASE');
  console.log(`  - Proposed questionVersions to staging: ${qvCount}`);
  console.log(`  - Proposed answerKeys to staging      : ${keyCount}`);
  console.log(`  - Proposed testVersions items        : ${itemsCount}`);
  console.log('========================================================\n');
}

runDryRunImport();
