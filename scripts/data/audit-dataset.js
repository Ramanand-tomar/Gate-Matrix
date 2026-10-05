const fs = require('fs');
const path = require('path');

const DATASET_DIR = path.join(process.cwd(), 'scraped_dataset');

function auditDataset() {
  console.log('========================================================');
  console.log('🔍 GATEPrep Studio — Phase 01 Source Dataset Audit');
  console.log('========================================================');

  if (!fs.existsSync(DATASET_DIR)) {
    console.error(`❌ Dataset directory not found: ${DATASET_DIR}`);
    process.exit(1);
  }

  const branches = fs.readdirSync(DATASET_DIR).filter(item => {
    return fs.statSync(path.join(DATASET_DIR, item)).isDirectory();
  });

  let totalPapers = 0;
  let totalQuestionsReported = 0;
  let totalQuestionsParsed = 0;
  let qtypeCounts = { MCQ: 0, MSQ: 0, NAT: 0, UNKNOWN: 0 };
  let paperStatsByBranch = {};

  for (const branch of branches) {
    const branchDir = path.join(DATASET_DIR, branch);
    const files = fs.readdirSync(branchDir).filter(f => f.endsWith('.json'));

    let branchQuestionCount = 0;
    paperStatsByBranch[branch] = { paperCount: files.length, questionCount: 0 };
    totalPapers += files.length;

    for (const file of files) {
      const filePath = path.join(branchDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const paper = JSON.parse(content);
        
        totalQuestionsReported += (paper.total_questions || 0);
        const questions = paper.questions || [];
        totalQuestionsParsed += questions.length;
        branchQuestionCount += questions.length;

        for (const q of questions) {
          const type = (q.qtype || 'UNKNOWN').toUpperCase();
          if (qtypeCounts[type] !== undefined) {
            qtypeCounts[type]++;
          } else {
            qtypeCounts[type] = (qtypeCounts[type] || 0) + 1;
          }
        }
      } catch (err) {
        console.error(`⚠️ Failed to parse file ${file}:`, err.message);
      }
    }
    paperStatsByBranch[branch].questionCount = branchQuestionCount;
  }

  console.log('\n📊 Branch Summary:');
  for (const [bName, stats] of Object.entries(paperStatsByBranch)) {
    console.log(`  - ${bName.padEnd(45)}: ${stats.paperCount.toString().padStart(4)} papers | ${stats.questionCount.toString().padStart(6)} questions`);
  }

  console.log('\n========================================================');
  console.log(`🎉 Total Papers Inspected      : ${totalPapers}`);
  console.log(`📝 Total Questions Reported    : ${totalQuestionsReported}`);
  console.log(`🔍 Total Questions Parsed      : ${totalQuestionsParsed}`);
  console.log('📌 Question Type Distribution :');
  for (const [qtype, count] of Object.entries(qtypeCounts)) {
    console.log(`     ${qtype.padEnd(8)}: ${count}`);
  }
  console.log('========================================================\n');
}

auditDataset();
