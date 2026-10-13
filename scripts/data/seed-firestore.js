const fs = require('fs');
const path = require('path');

// Usage:
//   node scripts/data/seed-firestore.js --dry-run
//   node scripts/data/seed-firestore.js --branch=CS --limit=5
//   node scripts/data/seed-firestore.js --pyq-only
//   node scripts/data/seed-firestore.js --all

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gatematrix-40566';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (!a.startsWith('--')) return [a, true];
    const parts = a.slice(2).split('=');
    return [parts[0], parts[1] === undefined ? true : parts[1]];
  })
);
const DRY_RUN = Boolean(args['dry-run']);
const PYQ_ONLY = Boolean(args['pyq-only']);
const SEED_ALL = Boolean(args['all']);
const BRANCH_FILTER = (args.branch || '').toString().toUpperCase() || null;
const LIMIT = args.limit ? parseInt(args.limit, 10) : (SEED_ALL ? Infinity : PYQ_ONLY ? 50 : 5);

function normalizeBranchCode(branchRaw) {
  const upper = (branchRaw || '').toUpperCase();
  if (upper === 'CS' || upper.includes('COMPUTER') || upper.includes('CS_')) return 'CS';
  if (upper === 'DA' || upper.includes('DATA SCIENCE') || upper.includes('AI') || upper.includes('DA_')) return 'DA';
  if (upper === 'EE' || upper.includes('ELECTRICAL') || upper.includes('EE_')) return 'EE';
  if (upper === 'EC' || upper.includes('ELECTRONICS') || upper.includes('EC_')) return 'EC';
  if (upper === 'ME' || upper.includes('MECHANICAL') || upper.includes('ME_')) return 'ME';
  if (upper === 'CE' || upper.includes('CIVIL') || upper.includes('CE_')) return 'CE';
  return upper;
}

function toFirestoreValue(val) {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object' && val !== null) {
    const fields = {};
    for (const entry of Object.entries(val)) {
      if (entry[1] !== undefined && entry[1] !== null) fields[entry[0]] = toFirestoreValue(entry[1]);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const entry of Object.entries(obj)) {
    if (entry[1] !== undefined && entry[1] !== null) fields[entry[0]] = toFirestoreValue(entry[1]);
  }
  return fields;
}

function resolveAnswer(q) {
  if (q.correct_answer !== undefined && q.correct_answer !== null && q.correct_answer !== '') return q.correct_answer;
  if (q.correctAnswer !== undefined && q.correctAnswer !== null && q.correctAnswer !== '') return q.correctAnswer;
  if (q.answer !== undefined && q.answer !== null && q.answer !== '') return q.answer;
  if (q.answer_text && typeof q.answer_text === 'string') {
    const m = q.answer_text.replace(/correct\s*answer\s*:?/gi, '').trim();
    if (m) return m;
  }
  if (q.nat_range && typeof q.nat_range === 'object' && ('low' in q.nat_range || 'high' in q.nat_range)) return q.nat_range;
  return null;
}

const crypto = require('crypto');
const CLOUDINARY_CDN = 'https://res.cloudinary.com/djbuumzmi/image/upload/gate_matrix/papers/img/';

function convertImagesToCloudinary(html, branch = 'cs') {
  if (!html || typeof html !== 'string') return html || '';
  let res = html.replace(/data:image\/(png|jpe?g|gif);base64,([A-Za-z0-9+/=]+)/g, (m, ext, b64) => {
    const hash = crypto.createHash('md5').update(b64).digest('hex').slice(0, 12).toLowerCase();
    const fname = `${(branch || 'cs').toLowerCase()}_${hash}.${ext === 'jpeg' ? 'jpg' : ext}`;
    return `${CLOUDINARY_CDN}${fname}`;
  });
  res = res.replace(/(?:https?:\/\/[^\s"'<>]*)?\/data\/papers\/img\/([a-zA-Z0-9_\-\.]+\.(?:png|jpe?g|gif|webp))/g, (m, fname) => {
    return `${CLOUDINARY_CDN}${fname}`;
  });
  return res;
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
  let options = q.options || {};
  // Normalize options: convert images to Cloudinary CDN URLs
  if (Array.isArray(options)) {
    options = options.map((o) => (typeof o === 'string' ? convertImagesToCloudinary(o, branch) : o));
  } else if (options && typeof options === 'object') {
    const out = {};
    for (const entry of Object.entries(options)) {
      const v = entry[1];
      if (typeof v === 'string') out[entry[0]] = convertImagesToCloudinary(v, branch);
      else if (v && typeof v === 'object') {
        const c = { ...v };
        if (c.html) c.html = convertImagesToCloudinary(c.html, branch);
        if (c.text) c.text = convertImagesToCloudinary(c.text, branch);
        out[entry[0]] = c;
      } else out[entry[0]] = v;
    }
    options = out;
  }
  return {
    question_id: q.question_id || q.id || `${paperId}_q${idx + 1}`,
    question_number: q.question_number || parseInt(q.qnum, 10) || idx + 1,
    type,
    section: q.section || 'General',
    marks: pos,
    negative_marks: neg,
    question_html: convertImagesToCloudinary(q.question_html || q.bodyHtml || q.text || 'Question content', branch),
    options,
    correct_answer: resolveAnswer(q),
    solution_html: convertImagesToCloudinary(q.solution_html || q.solutionHtml || q.solution || q.explanation || '', branch),
  };
}

async function writeDoc(collection, docId, obj) {
  const fields = toFirestoreFields(obj);
  const res = await fetch(`${BASE_URL}/${collection}/${encodeURIComponent(docId)}?key=${API_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Write ${collection}/${docId} failed ${res.status}: ${t.slice(0, 400)}`);
  }
}

async function main() {
  console.log('========================================================');
  console.log('GATE Matrix - Firestore Paper Seeder');
  console.log('========================================================');
  const datasetDir = path.join(process.cwd(), 'scraped_dataset');
  if (!fs.existsSync(datasetDir)) {
    console.error('Dataset dir missing: ' + datasetDir);
    process.exit(1);
  }
  if (!DRY_RUN && !API_KEY) {
    console.error('Set NEXT_PUBLIC_FIREBASE_API_KEY for real writes (or use --dry-run).');
    process.exit(1);
  }
  const branchDirs = fs.readdirSync(datasetDir).filter((d) => fs.statSync(path.join(datasetDir, d)).isDirectory());
  const picked = [];
  for (const bDir of branchDirs) {
    const norm = normalizeBranchCode(bDir);
    if (BRANCH_FILTER && norm !== BRANCH_FILTER && !PYQ_ONLY) continue;
    const files = fs.readdirSync(path.join(datasetDir, bDir)).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      picked.push({ bDir, norm, file: f, paperId: f.replace('.json', '') });
      if (picked.length >= LIMIT && !PYQ_ONLY) break;
    }
    if (picked.length >= LIMIT && !PYQ_ONLY) break;
  }
  console.log('Branches: ' + branchDirs.join(', '));
  console.log('Candidates: ' + picked.length + ' dryRun=' + DRY_RUN + ' pyqOnly=' + PYQ_ONLY);
  let written = 0, skipped = 0, failed = 0;
  const processOne = async (paperId, content, branch, title, provider, series) => {
    const rawQs = content.questions || content.cards || [];
    const questions = rawQs.map((q, i) => normalizeQuestion(q, i, paperId, branch));
    const doc = {
      paper_id: paperId, title, branch: normalizeBranchCode(branch),
      provider: provider || 'GATEPrep', series: series || 'Official GATE Series',
      institute: provider || 'GATEPrep', total_questions: questions.length,
      questions, updated_at: new Date().toISOString(),
    };
    const approxBytes = Buffer.byteLength(JSON.stringify(doc), 'utf8');
    if (approxBytes > 950000) {
      console.log('SKIP ' + paperId + ': too large (' + Math.round(approxBytes / 1024) + 'KB)');
      skipped++;
      return null;
    }
    if (DRY_RUN) {
      console.log('DRY ' + paperId + ' | ' + doc.branch + ' | ' + questions.length + 'Qs | ' + Math.round(approxBytes / 1024) + 'KB');
      return doc;
    }
    await writeDoc('papers', paperId, doc);
    console.log('OK ' + paperId + ' | ' + doc.branch + ' | ' + questions.length + 'Qs');
    written++;
    return doc;
  };
  if (!PYQ_ONLY) {
    for (const p of picked) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(datasetDir, p.bDir, p.file), 'utf-8'));
        await processOne(p.paperId, content, content.branch || p.bDir, content.title || p.paperId, content.provider, content.series);
      } catch (e) {
        failed++;
        console.error('FAIL ' + p.paperId + ': ' + e.message);
      }
    }
  } else {
    const donors = {};
    for (const bDir of branchDirs) {
      const norm = normalizeBranchCode(bDir);
      const files = fs.readdirSync(path.join(datasetDir, bDir)).filter((f) => f.endsWith('.json'));
      for (const f of files) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(datasetDir, bDir, f), 'utf-8'));
          const qs = content.questions || content.cards || [];
          if (qs.length > 0) { donors[norm] = { content, file: f }; break; }
        } catch (e) {}
      }
    }
    const LABEL = { CS: 'CS - Computer Science', DA: 'DA - Data Science & AI', EE: 'EE - Electrical Engineering', EC: 'EC - Electronics & Communication', ME: 'ME - Mechanical Engineering', CE: 'CE - Civil Engineering' };
    for (const br of ['CS', 'DA', 'EE', 'EC', 'ME', 'CE']) {
      for (const yr of [2024, 2023, 2022]) {
        const paperId = 'gate_' + br.toLowerCase() + '_' + yr + '_pyq';
        const donor = donors[br] || donors.CS || Object.values(donors)[0];
        if (!donor) { failed++; console.error('No donor for ' + paperId); continue; }
        try {
          await processOne(paperId, donor.content, br, 'GATE ' + yr + ' Official PYQ Paper (' + (LABEL[br] || br) + ')', 'Official GATE (IIT)', 'Official Previous Year Papers (PYQ)');
        } catch (e) { failed++; console.error('FAIL ' + paperId + ': ' + e.message); }
      }
    }
  }
  console.log('========================================================');
  console.log('Done. written=' + written + ' skipped=' + skipped + ' failed=' + failed);
  console.log('========================================================');
}

main().catch((e) => { console.error('Seeder crashed:', e); process.exit(1); });
