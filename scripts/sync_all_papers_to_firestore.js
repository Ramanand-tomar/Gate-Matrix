const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cloudinary CDN prefix
const CLOUDINARY_CDN = 'https://res.cloudinary.com/djbuumzmi/image/upload/gate_matrix/papers/img/';

// Initialize Firebase Admin
const keyFileName = ['service', 'AccountKey', '.json'].join('');
const keyPath = path.join(process.cwd(), keyFileName);

if (!fs.existsSync(keyPath)) {
  console.error('Service account key not found at:', keyPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id || 'gatematrix-40566',
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

function normalizeBranchCode(branchRaw) {
  const upper = (branchRaw || '').toUpperCase();
  if (upper === 'CS' || upper.includes('COMPUTER') || upper.includes('CS_')) return 'CS';
  if (upper === 'DA' || upper.includes('DATA SCIENCE') || upper.includes('AI') || upper.includes('DA_')) return 'DA';
  if (upper === 'EE' || upper.includes('ELECTRICAL') || upper.includes('EE_')) return 'EE';
  if (upper === 'EC' || upper.includes('ELECTRONICS') || upper.includes('EC_')) return 'EC';
  if (upper === 'ME' || upper.includes('MECHANICAL') || upper.includes('ME_')) return 'ME';
  if (upper === 'CE' || upper.includes('CIVIL') || upper.includes('CE_')) return 'CE';
  return upper || 'CS';
}

function derivePaperInstitute(paper) {
  if (paper.institute && paper.institute.trim()) return paper.institute.trim();
  const text = `${paper.title || ''} ${paper.provider || ''}`.toLowerCase();
  if (text.includes('pyq') || text.includes('official') || text.includes('iit') || text.includes('previous year')) {
    return 'Official GATE (IIT)';
  }
  if (text.includes('made easy') || text.includes('madeeasy') || text.includes('dvruo easy')) return 'MADE EASY';
  if (text.includes('ace academy') || text.includes('dvruoace') || /(?:^|[_\s\W])ace(?:[_\s\W]|$)/i.test(text)) return 'ACE Academy';
  if (text.includes('go classes') || text.includes('goclasses') || text.includes('dvruo classes')) return 'GO Classes';
  if (text.includes('gate wallah') || text.includes('physics wallah') || text.includes('pw') || text.includes('dvruo zeal') || text.includes('zeal')) return 'GATE Wallah';
  if (text.includes('unacademy')) return 'Unacademy';
  if (paper.provider && paper.provider !== 'GATEPrep' && paper.provider !== 'GATE Matrix') return paper.provider;
  return 'GATE Matrix Core';
}

// Convert heavy inline base64 to Cloudinary CDN URL placeholder
function convertBase64ToCloudinary(html, branch = 'cs') {
  if (!html || typeof html !== 'string') return html || '';
  return html.replace(/data:image\/(png|jpe?g|gif|webp);base64,([A-Za-z0-9+/=]+)/g, (m, ext, b64) => {
    const hash = crypto.createHash('md5').update(b64).digest('hex').slice(0, 12).toLowerCase();
    const fname = `${(branch || 'cs').toLowerCase()}_${hash}.${ext === 'jpeg' ? 'jpg' : ext}`;
    return `${CLOUDINARY_CDN}${fname}`;
  });
}

function cleanOptions(opts, branch = 'cs') {
  if (!opts) return {};
  if (Array.isArray(opts)) {
    return opts.map((o) => (typeof o === 'string' ? convertBase64ToCloudinary(o, branch) : o));
  }
  if (typeof opts === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(opts)) {
      if (typeof v === 'string') {
        out[k] = convertBase64ToCloudinary(v, branch);
      } else if (v && typeof v === 'object') {
        const c = { ...v };
        if (c.html) c.html = convertBase64ToCloudinary(c.html, branch);
        if (c.text) c.text = convertBase64ToCloudinary(c.text, branch);
        out[k] = c;
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  return opts;
}

function normalizeQuestion(q, idx, paperId, branch = 'cs') {
  let pos = 1, neg = 0;
  if (typeof q.marks === 'number') pos = q.marks;
  else if (typeof q.marks === 'string') pos = parseFloat(q.marks) || 1;
  else if (q.marks && typeof q.marks === 'object') {
    pos = parseFloat(q.marks.positive || q.marks.num || '1') || 1;
    if ('negative' in q.marks) neg = parseFloat(q.marks.negative) || 0;
  }
  if (q.negative_marks !== undefined && q.negative_marks !== null) {
    neg = typeof q.negative_marks === 'number' ? q.negative_marks : parseFloat(q.negative_marks) || 0;
  }
  const t = String(q.type || q.qtype || 'MCQ').toUpperCase();
  const type = t.includes('NAT') ? 'NAT' : t.includes('MSQ') ? 'MSQ' : 'MCQ';

  let ans = q.correct_answer;
  if (ans === undefined || ans === null || ans === '') ans = q.correctAnswer;
  if (ans === undefined || ans === null || ans === '') ans = q.answer;
  if (!ans && q.answer_text && typeof q.answer_text === 'string') {
    const m = q.answer_text.replace(/correct\s*answer\s*:?/gi, '').trim();
    if (m) ans = m;
  }
  if (!ans && q.nat_range) ans = q.nat_range;
  if (ans === undefined) ans = null;

  return {
    question_id: q.question_id || q.id || `${paperId}_q${idx + 1}`,
    question_number: q.question_number || parseInt(q.qnum, 10) || idx + 1,
    type,
    section: q.section || 'General',
    marks: pos,
    negative_marks: neg,
    question_html: convertBase64ToCloudinary(q.question_html || q.bodyHtml || q.text || 'Question content', branch),
    options: cleanOptions(q.options, branch),
    correct_answer: ans,
    solution_html: convertBase64ToCloudinary(q.solution_html || q.solutionHtml || q.solution || q.explanation || '', branch),
  };
}

async function main() {
  console.log('========================================================');
  console.log('Firebase Firestore Paper Synchronizer');
  console.log('Project:', serviceAccount.project_id);
  console.log('========================================================');

  const datasetDir = path.join(process.cwd(), 'scraped_dataset');
  const pyqDir = path.join(process.cwd(), 'public', 'data', 'papers');

  const paperTasks = [];

  // 1. Collect all 18 official GATE PYQ papers
  if (fs.existsSync(pyqDir)) {
    const pyqFiles = fs.readdirSync(pyqDir).filter((f) => f.endsWith('.json'));
    for (const file of pyqFiles) {
      paperTasks.push({
        paperId: file.replace('.json', ''),
        filePath: path.join(pyqDir, file),
        isPYQ: true,
      });
    }
  }

  // 2. Collect all scraped coaching institute papers
  if (fs.existsSync(datasetDir)) {
    const branchDirs = fs.readdirSync(datasetDir).filter((d) => fs.statSync(path.join(datasetDir, d)).isDirectory());
    for (const bDir of branchDirs) {
      const bPath = path.join(datasetDir, bDir);
      const files = fs.readdirSync(bPath).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        paperTasks.push({
          paperId: file.replace('.json', ''),
          filePath: path.join(bPath, file),
          isPYQ: false,
        });
      }
    }
  }

  console.log(`Found ${paperTasks.length} total papers to sync to Firestore.`);

  let syncedCount = 0;
  let skippedCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  const BATCH_SIZE = 10;
  for (let i = 0; i < paperTasks.length; i += BATCH_SIZE) {
    const chunk = paperTasks.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map(async (task) => {
        try {
          const raw = fs.readFileSync(task.filePath, 'utf8');
          const data = JSON.parse(raw);
          const rawQs = data.questions || data.cards || [];

          const normBranch = normalizeBranchCode(data.branch || '');
          const institute = derivePaperInstitute(data);
          const provider = data.provider || institute;
          const questions = rawQs.map((q, idx) => normalizeQuestion(q, idx, task.paperId, normBranch));

          const docData = {
            paper_id: task.paperId,
            title: data.title || data.paper_title || task.paperId,
            branch: normBranch,
            provider,
            institute,
            series: data.series || 'Mock Series',
            total_questions: questions.length,
            questions,
            updated_at: new Date().toISOString(),
          };

          const docBytes = Buffer.byteLength(JSON.stringify(docData), 'utf8');
          if (docBytes > 1048576) {
            console.warn(`[WARN] ${task.paperId} exceeds 1MB limit (${Math.round(docBytes / 1024)} KB) - writing metadata only`);
            const metaOnly = { ...docData, questions: [] };
            await db.collection('papers').doc(task.paperId).set(metaOnly, { merge: true });
            skippedCount++;
            return;
          }

          await db.collection('papers').doc(task.paperId).set(docData, { merge: true });
          syncedCount++;
        } catch (err) {
          failCount++;
          console.error(`[FAIL] ${task.paperId}:`, err.message);
        }
      })
    );

    if ((i + BATCH_SIZE) % 50 === 0 || i + BATCH_SIZE >= paperTasks.length) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const percent = Math.min(100, Math.round(((i + chunk.length) / paperTasks.length) * 100));
      console.log(
        `Progress: ${percent}% (${i + chunk.length}/${paperTasks.length}) | Synced: ${syncedCount} | Skipped: ${skippedCount} | Failed: ${failCount} | Elapsed: ${elapsed}s`
      );
    }
  }

  console.log('========================================================');
  console.log(`🎉 Sync Completed in ${Math.round((Date.now() - startTime) / 1000)}s!`);
  console.log(`Total Synced:  ${syncedCount}`);
  console.log(`Skipped (>1MB): ${skippedCount}`);
  console.log(`Failed:        ${failCount}`);
  console.log('========================================================');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  });
